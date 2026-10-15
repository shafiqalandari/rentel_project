import { Router } from 'express';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import rateLimit from 'express-rate-limit';

const digest = value => createHash('sha256').update(value).digest('hex');
const hash = password => { const salt=randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password,salt,64).toString('hex')}`; };
const verify = (password,saved) => { try {const [salt,hex]=saved.split(':');const a=Buffer.from(hex,'hex');const b=scryptSync(password,salt,64);return a.length===b.length && timingSafeEqual(a,b);}catch{return false;} };
const validId = raw => { const value=Number(raw);return Number.isSafeInteger(value) && value>0 ? value:null; };
const clean = (raw,max=160) => String(raw??'').trim().slice(0,max);
const allowedPlan = ['trial','monthly','annual','lifetime'];
const allowedStatus = ['active','suspended'];
const allowedLicenseStatus = ['active','paused','revoked'];

export async function seedCentralAdmin(pool) {
 const email=clean(process.env.CENTRAL_ADMIN_EMAIL,200).toLowerCase();
 const password=process.env.CENTRAL_ADMIN_PASSWORD;
 if(!email && !password) return;
 if(!email.includes('@') || !password || password.length<16) throw Error('CENTRAL_ADMIN_EMAIL and CENTRAL_ADMIN_PASSWORD (16+ characters) required together');
 const {rows}=await pool.query('SELECT id FROM central_admins LIMIT 1');
 if(rows.length===0) {
  await pool.query('INSERT INTO central_admins(email,password_hash,name) VALUES($1,$2,$3)',[email,hash(password),'Super Administrator']);
  console.log('Central admin created. Remove CENTRAL_ADMIN_PASSWORD after first launch.');
 }
}

export function createCentralRouter(pool) {
 const router=Router();
 const run=(sql,params=[])=>pool.query(sql,params);
 const safe=(fn)=>(req,res,next)=>Promise.resolve().then(()=>fn(req,res,next)).catch(next);
 const audit=async(client,admin,action,type,id,detail={})=>client.query('INSERT INTO central_audit_logs(admin_id,action,target_type,target_id,detail) VALUES($1,$2,$3,$4,$5)',[admin,action,type,id,JSON.stringify(detail)]);
 const fail=(status,message)=>{const e=Error(message);e.status=status;throw e;};
 const withTransaction=async fn=>{const client=await pool.connect();try{await client.query('BEGIN');const result=await fn(client);await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}};
 router.post('/login',rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-7',legacyHeaders:false}),safe(async(req,res)=>{
  const email=clean(req.body?.email,200).toLowerCase();const password=String(req.body?.password??'');
  const {rows}=await run('SELECT * FROM central_admins WHERE email=$1 AND active=true',[email]);
  if(!rows[0] || !verify(password,rows[0].password_hash)) return res.status(401).json({error:'Invalid credentials'});
  const token=randomBytes(32).toString('hex');
  await run("INSERT INTO central_sessions(token_hash,admin_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",[digest(token),rows[0].id]);
  res.json({token,admin:{id:rows[0].id,name:rows[0].name,email:rows[0].email}});
 }));
 router.use(safe(async(req,res,next)=>{
  const token=/^Bearer ([a-f0-9]{64})$/.exec(req.get('authorization')||'')?.[1];
  if(!token) return res.status(401).json({error:'Central admin login required'});
  const {rows}=await run('SELECT a.id,a.name,a.email FROM central_sessions s JOIN central_admins a ON a.id=s.admin_id WHERE s.token_hash=$1 AND s.expires_at>now() AND a.active=true',[digest(token)]);
  if(!rows.length)return res.status(401).json({error:'Session expired'});
  req.centralAdmin=rows[0];next();
 }));
 router.post('/logout',safe(async(req,res)=>{const token=(req.get('authorization')||'').replace(/^Bearer /,'');await run('DELETE FROM central_sessions WHERE token_hash=$1',[digest(token)]);res.json({ok:true});}));
 router.get('/me',(req,res)=>res.json(req.centralAdmin));
 router.get('/summary',safe(async(req,res)=>{
  const {rows}=await run(`SELECT (SELECT count(*)::int FROM client_organizations) organizations,
  (SELECT count(*)::int FROM client_organizations WHERE status='active') active_organizations,
  (SELECT count(*)::int FROM client_licenses WHERE status='active' AND (expires_at>now() OR plan='lifetime')) valid_licenses,
  (SELECT count(*)::int FROM client_licenses WHERE plan<>'lifetime' AND expires_at<=now()) expired_licenses`);
  res.json(rows[0]);
 }));
 router.get('/organizations',safe(async(req,res)=>{
  const {rows}=await run(`SELECT o.*,l.id license_id,l.plan,l.status license_status,l.starts_at,l.expires_at,l.max_devices,
  CASE WHEN o.status='suspended' THEN 'suspended' WHEN l.id IS NULL THEN 'unlicensed'
       WHEN l.status<>'active' THEN l.status WHEN l.plan<>'lifetime' AND l.expires_at<=now() THEN 'expired'
       ELSE 'valid' END effective_license_status
  FROM client_organizations o LEFT JOIN client_licenses l ON l.organization_id=o.id ORDER BY o.id DESC`);
  res.json(rows);
 }));
 router.post('/organizations',safe(async(req,res)=>{
  const b=req.body||{};const name=clean(b.name,150);if(!name)fail(400,'Organization name required');
  const record=await withTransaction(async c=>{const {rows}=await c.query('INSERT INTO client_organizations(name,contact_name,email,phone,notes) VALUES($1,$2,$3,$4,$5) RETURNING *',[name,clean(b.contact_name),clean(b.email,200),clean(b.phone,60),clean(b.notes,1000)]);await audit(c,req.centralAdmin.id,'create','organization',rows[0].id);return rows[0];});
  res.status(201).json(record);
 }));
 router.patch('/organizations/:id',safe(async(req,res)=>{
  const id=validId(req.params.id);if(!id)fail(400,'Invalid ID');
  const b=req.body||{};const status=b.status;
  if(!allowedStatus.includes(status))fail(400,'Invalid organization status');
  const record=await withTransaction(async c=>{const {rows}=await c.query('UPDATE client_organizations SET status=$1,updated_at=now() WHERE id=$2 RETURNING *',[status,id]);if(!rows.length)fail(404,'Organization not found');await audit(c,req.centralAdmin.id,'status','organization',id,{status});return rows[0];});res.json(record);
 }));
 router.put('/organizations/:id/license',safe(async(req,res)=>{
  const id=validId(req.params.id);if(!id)fail(400,'Invalid organization ID');
  const b=req.body||{};
  if(!allowedPlan.includes(b.plan)||!allowedLicenseStatus.includes(b.status||'active'))fail(400,'Invalid plan or status');
  const devices=Number(b.max_devices||1);if(!Number.isInteger(devices)||devices<1||devices>10000)fail(400,'Invalid device limit');
  const start=b.starts_at?new Date(b.starts_at):new Date();const end=b.expires_at?new Date(b.expires_at):null;
  if(Number.isNaN(start.getTime())||(b.plan!=='lifetime'&&(!end||Number.isNaN(end.getTime())||end<=start)))fail(400,'Valid expiry after start required');
  const record=await withTransaction(async c=>{
   const {rows}=await c.query(`INSERT INTO client_licenses(organization_id,plan,status,starts_at,expires_at,max_devices)
    VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(organization_id) DO UPDATE SET plan=excluded.plan,status=excluded.status,
    starts_at=excluded.starts_at,expires_at=excluded.expires_at,max_devices=excluded.max_devices,updated_at=now() RETURNING *`,
    [id,b.plan,b.status||'active',start,b.plan==='lifetime'?null:end,devices]);
   await audit(c,req.centralAdmin.id,'upsert','license',rows[0].id,{organization_id:id,plan:b.plan,status:b.status||'active',max_devices:devices});return rows[0];
  });res.json(record);
 }));
 router.post('/organizations/:id/activation',safe(async(req,res)=>{
  const id=validId(req.params.id);if(!id)fail(400,'Invalid organization ID');
  const code=randomBytes(24).toString('base64url');
  await withTransaction(async c=>{
   const org=await c.query('SELECT id FROM client_organizations WHERE id=$1',[id]);if(!org.rowCount)fail(404,'Organization not found');
   await c.query(`INSERT INTO central_client_access(organization_id,activation_hash) VALUES($1,$2)
    ON CONFLICT(organization_id) DO UPDATE SET activation_hash=excluded.activation_hash,rotated_at=now()`,[id,digest(code)]);
   await audit(c,req.centralAdmin.id,'rotate','activation',id);
  });
  res.json({activation_code:code,message:'Copy this code now. It will not be displayed again.'});
 }));
 router.get('/devices',safe(async(req,res)=>{
  const {rows}=await run(`SELECT d.id,d.organization_id,o.name organization_name,d.device_name,d.status,d.last_seen_at,d.created_at
    FROM central_client_devices d JOIN client_organizations o ON o.id=d.organization_id ORDER BY d.id DESC LIMIT 500`);
  res.json(rows);
 }));
 router.post('/organizations/:id/devices',safe(async(req,res)=>{
  const org=validId(req.params.id);if(!org)fail(400,'Invalid organization ID');
  const name=clean(req.body?.device_name,160);const key=clean(req.body?.device_key,255);
  if(!name||key.length<16)fail(400,'Device name and device key (16+ characters) required');
  const record=await withTransaction(async c=>{
    const owner=await c.query('SELECT id FROM client_organizations WHERE id=$1',[org]);if(!owner.rowCount)fail(404,'Organization not found');
    const {rows}=await c.query(`INSERT INTO central_client_devices(organization_id,device_name,device_key_hash)
      VALUES($1,$2,$3) ON CONFLICT(organization_id,device_key_hash) DO UPDATE SET
      device_name=excluded.device_name,updated_at=now() RETURNING id,organization_id,device_name,status,created_at`,[org,name,digest(key)]);
    await audit(c,req.centralAdmin.id,'register','device',rows[0].id,{organization_id:org});return rows[0];
  });res.status(201).json(record);
 }));
 router.patch('/devices/:id',safe(async(req,res)=>{
  const id=validId(req.params.id);const status=req.body?.status;
  if(!id||!['approved','blocked','pending'].includes(status))fail(400,'Invalid device status');
  const record=await withTransaction(async c=>{
    const {rows}=await c.query(`SELECT d.*,o.status organization_status,l.status license_status,l.plan,l.starts_at,l.expires_at,l.max_devices
      FROM central_client_devices d JOIN client_organizations o ON o.id=d.organization_id
      LEFT JOIN client_licenses l ON l.organization_id=d.organization_id WHERE d.id=$1 FOR UPDATE OF d`,[id]);
    if(!rows.length)fail(404,'Device not found');const d=rows[0];
    if(status==='approved'){
      if(d.organization_status!=='active'||d.license_status!=='active'||!d.plan||new Date(d.starts_at)>new Date()||(d.plan!=='lifetime'&&(!d.expires_at||new Date(d.expires_at)<=new Date())))fail(409,'Organization license not valid');
      await c.query('SELECT id FROM client_licenses WHERE organization_id=$1 FOR UPDATE',[d.organization_id]);
      const count=await c.query("SELECT count(*)::int n FROM central_client_devices WHERE organization_id=$1 AND status='approved' AND id<>$2",[d.organization_id,id]);
      if(count.rows[0].n>=d.max_devices)fail(409,'Device limit reached');
    }
    const result=await c.query('UPDATE central_client_devices SET status=$1,updated_at=now() WHERE id=$2 RETURNING id,organization_id,device_name,status,created_at',[status,id]);
    await audit(c,req.centralAdmin.id,'status','device',id,{status,organization_id:d.organization_id});return result.rows[0];
  });res.json(record);
 }));
 
 // Subscription catalog, audited renewals and payment review (central admin only).
 router.get('/plans',safe(async(req,res)=>res.json((await run('SELECT * FROM central_plans ORDER BY id DESC')).rows)));
 router.post('/plans',safe(async(req,res)=>{
  const b=req.body||{},name=clean(b.name,120),code=clean(b.code,40).toLowerCase();
  const price=Number(b.price),days=Number(b.duration_days),limit=Number(b.max_devices);
  if(!name||!/^[a-z0-9_-]{2,40}$/.test(code)||!allowedPlan.includes(b.plan)||!Number.isFinite(price)||price<0||price>100000000||!Number.isInteger(limit)||limit<1||limit>10000||!Number.isInteger(days)||days<0||days>36500||(b.plan!=='lifetime'&&days<1)||(b.plan==='lifetime'&&days!==0))fail(400,'Invalid plan details');
  const r=await withTransaction(async c=>{const row=(await c.query('INSERT INTO central_plans(code,name,plan,price,currency,duration_days,max_devices) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[code,name,b.plan,price,clean(b.currency,6)||'AFN',days,limit])).rows[0];await audit(c,req.centralAdmin.id,'create','plan',row.id);return row;});res.status(201).json(r);
 }));
 router.patch('/plans/:id',safe(async(req,res)=>{
  const id=validId(req.params.id);if(!id||typeof req.body?.active!=='boolean')fail(400,'Invalid plan status');
  const r=await withTransaction(async c=>{const row=(await c.query('UPDATE central_plans SET active=$1 WHERE id=$2 RETURNING *',[req.body.active,id])).rows[0];if(!row)fail(404,'Plan not found');await audit(c,req.centralAdmin.id,'status','plan',id,{active:req.body.active});return row;});res.json(r);
 }));
 router.get('/subscription-history',safe(async(req,res)=>res.json((await run(`SELECT e.*,o.name organization_name,p.name plan_name FROM central_subscription_events e JOIN client_organizations o ON o.id=e.organization_id LEFT JOIN central_plans p ON p.id=e.plan_id ORDER BY e.id DESC LIMIT 500`)).rows)));
 router.post('/organizations/:id/renew',safe(async(req,res)=>{
  const id=validId(req.params.id),planId=validId(req.body?.plan_id);if(!id||!planId)fail(400,'Customer and plan required');
  const result=await withTransaction(async c=>{
   const org=(await c.query('SELECT * FROM client_organizations WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!org)fail(404,'Customer not found');
   const plan=(await c.query('SELECT * FROM central_plans WHERE id=$1 AND active=true',[planId])).rows[0];if(!plan)fail(404,'Active plan not found');
   const old=(await c.query('SELECT * FROM client_licenses WHERE organization_id=$1 FOR UPDATE',[id])).rows[0];
   const now=new Date(),start=(old?.expires_at&&new Date(old.expires_at)>now&&old.status==='active'&&old.plan!=='lifetime')?new Date(old.expires_at):now;
   const end=plan.plan==='lifetime'?null:new Date(start.getTime()+plan.duration_days*86400000);
   const previous=old?.expires_at||null;
   const updated=(await c.query(`INSERT INTO client_licenses(organization_id,plan,status,starts_at,expires_at,max_devices) VALUES($1,$2,'active',$3,$4,$5) ON CONFLICT(organization_id) DO UPDATE SET plan=excluded.plan,status='active',starts_at=CASE WHEN client_licenses.status='active' AND client_licenses.expires_at>now() THEN client_licenses.starts_at ELSE excluded.starts_at END, expires_at=excluded.expires_at,max_devices=excluded.max_devices,updated_at=now() RETURNING *`,[id,plan.plan,now,end,plan.max_devices])).rows[0];
   const event=(await c.query(`INSERT INTO central_subscription_events(organization_id,plan_id,previous_expiry,new_expiry,amount,currency,action,admin_id) VALUES($1,$2,$3,$4,$5,$6,'renew',$7) RETURNING *`,[id,plan.id,previous,end,plan.price,plan.currency,req.centralAdmin.id])).rows[0];
   await audit(c,req.centralAdmin.id,'renew','license',updated.id,{organization_id:id,plan_id:plan.id,subscription_event_id:event.id});return {license:updated,event};
  });res.json(result);
 }));
 router.get('/payments',safe(async(req,res)=>res.json((await run(`SELECT p.*,o.name organization_name,pl.name plan_name FROM central_payments p JOIN client_organizations o ON o.id=p.organization_id JOIN central_plans pl ON pl.id=p.plan_id ORDER BY p.id DESC LIMIT 500`)).rows)));
 router.post('/payments',safe(async(req,res)=>{
  const org=validId(req.body?.organization_id),plan=validId(req.body?.plan_id),reference=clean(req.body?.reference,120),notes=clean(req.body?.notes,1000);
  if(!org||!plan||!reference)fail(400,'Customer, plan and payment reference required');
  const row=await withTransaction(async c=>{
   const planRow=(await c.query('SELECT * FROM central_plans WHERE id=$1 AND active=true',[plan])).rows[0];if(!planRow)fail(404,'Active plan not found');
   const owner=await c.query('SELECT id FROM client_organizations WHERE id=$1',[org]);if(!owner.rowCount)fail(404,'Customer not found');
   const item=(await c.query(`INSERT INTO central_payments(organization_id,plan_id,amount,currency,reference,notes,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[org,plan,planRow.price,planRow.currency,reference,notes,req.centralAdmin.id])).rows[0];
   await audit(c,req.centralAdmin.id,'create','payment',item.id);return item;
  });res.status(201).json(row);
 }));
 router.post('/payments/:id/review',safe(async(req,res)=>{
  const id=validId(req.params.id),status=req.body?.status;
  if(!id||!['approved','rejected'].includes(status))fail(400,'Invalid payment decision');
  const result=await withTransaction(async c=>{
   const pay=(await c.query('SELECT * FROM central_payments WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!pay)fail(404,'Payment not found');if(pay.status!=='pending')fail(409,'Payment already reviewed');
   const plan=(await c.query('SELECT * FROM central_plans WHERE id=$1',[pay.plan_id])).rows[0];if(!plan)fail(404,'Plan not found');
   let event=null;
   if(status==='approved'){
    const owner=(await c.query('SELECT * FROM client_organizations WHERE id=$1 FOR UPDATE',[pay.organization_id])).rows[0];if(!owner)fail(404,'Customer not found');
    const old=(await c.query('SELECT * FROM client_licenses WHERE organization_id=$1 FOR UPDATE',[pay.organization_id])).rows[0];
    const now=new Date(),start=(old?.expires_at&&new Date(old.expires_at)>now&&old.status==='active'&&old.plan!=='lifetime')?new Date(old.expires_at):now;
    const end=plan.plan==='lifetime'?null:new Date(start.getTime()+plan.duration_days*86400000);
    await c.query(`INSERT INTO client_licenses(organization_id,plan,status,starts_at,expires_at,max_devices) VALUES($1,$2,'active',$3,$4,$5) ON CONFLICT(organization_id) DO UPDATE SET plan=excluded.plan,status='active',starts_at=CASE WHEN client_licenses.status='active' AND client_licenses.expires_at>now() THEN client_licenses.starts_at ELSE excluded.starts_at END,expires_at=excluded.expires_at,max_devices=excluded.max_devices,updated_at=now()`,[pay.organization_id,plan.plan,now,end,plan.max_devices]);
    event=(await c.query(`INSERT INTO central_subscription_events(organization_id,plan_id,previous_expiry,new_expiry,amount,currency,action,payment_id,admin_id) VALUES($1,$2,$3,$4,$5,$6,'payment',$7,$8) RETURNING *`,[pay.organization_id,plan.id,old?.expires_at||null,end,pay.amount,pay.currency,pay.id,req.centralAdmin.id])).rows[0];
   }
   const updated=(await c.query('UPDATE central_payments SET status=$1,reviewed_by=$2,reviewed_at=now() WHERE id=$3 RETURNING *',[status,req.centralAdmin.id,id])).rows[0];
   await audit(c,req.centralAdmin.id,'review','payment',id,{status,event_id:event?.id||null});return {payment:updated,event};
  });res.json(result);
 }));

 router.get('/audit',safe(async(req,res)=>res.json((await run('SELECT log.*,a.email admin_email FROM central_audit_logs log LEFT JOIN central_admins a ON a.id=log.admin_id ORDER BY log.id DESC LIMIT 100')).rows)));
 return router;
}
