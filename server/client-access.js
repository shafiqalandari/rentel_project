import {Router} from 'express';
import {randomBytes,createHash,scryptSync,timingSafeEqual} from 'node:crypto';
import rateLimit from 'express-rate-limit';
const sha=x=>createHash('sha256').update(x).digest('hex');
const clean=(x,n=160)=>String(x??'').trim().slice(0,n);
const validKey=x=>/^[a-zA-Z0-9_-]{16,160}$/.test(x);
const validLicense=r=>r&&r.organization_status==='active'&&r.license_status==='active'&&r.plan&&new Date(r.starts_at)<=new Date()&&(r.plan==='lifetime'||r.expires_at&&new Date(r.expires_at)>new Date());
const cookieToken=(req,res)=>{const match=String(req.headers.cookie||'').match(/(?:^|;\s*)market_device_guard=([a-f0-9]{64})/i);if(match)return match[1];const value=randomBytes(32).toString('hex');res.setHeader('Set-Cookie',`market_device_guard=${value}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV==='production'?'Secure; ':''}`);return value};
export function clientAccessRouter(pool){
 const router=Router();
 const respond=(fn)=>(req,res,next)=>Promise.resolve().then(()=>fn(req,res)).catch(next);
 const limiter=rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-7',legacyHeaders:false});
 const verify=(password,saved)=>{try{const [salt,hex]=saved.split(':');const expected=Buffer.from(hex,'hex');const actual=scryptSync(password,salt,64);return expected.length===actual.length&&timingSafeEqual(expected,actual);}catch{return false}};
 const rememberVisitor=async(client,req,res,fingerprint,name,organizationId=null)=>{
  const keyHash=sha(fingerprint),cookieHash=sha(cookieToken(req,res)),userAgent=clean(req.get('user-agent'),500);
  await client.query("SELECT pg_advisory_xact_lock(hashtext(least($1,$2)||':'||greatest($1,$2)))",[cookieHash,keyHash]);
  const found=await client.query(`SELECT * FROM central_device_visitors
    WHERE browser_cookie_hash=$1 OR device_key_hash=$2
    ORDER BY CASE WHEN browser_cookie_hash=$1 THEN 0 ELSE 1 END LIMIT 1 FOR UPDATE`,[cookieHash,keyHash]);
  if(!found.rowCount){const {rows}=await client.query(`INSERT INTO central_device_visitors(organization_id,device_key_hash,browser_cookie_hash,device_key_hint,device_name,user_agent)
    VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[organizationId,keyHash,cookieHash,keyHash.slice(0,12),name,userAgent]);return rows[0]}
  const current=found.rows[0];
  const {rows}=await client.query(`UPDATE central_device_visitors SET device_key_hash=$1,browser_cookie_hash=$2,device_key_hint=$3,device_name=$4,user_agent=$5,
    organization_id=COALESCE(organization_id,$6),last_seen_at=now(),updated_at=now() WHERE id=$7 RETURNING *`,[keyHash,cookieHash,keyHash.slice(0,12),name,userAgent,organizationId,current.id]);
  return rows[0];
 };
 const touchVisitor=async(req,res,fingerprint,name,organizationId=null)=>{const client=await pool.connect();try{await client.query('BEGIN');const visitor=await rememberVisitor(client,req,res,fingerprint,name,organizationId);await client.query('COMMIT');return visitor}catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}finally{client.release()}};
 router.post('/device-seen',limiter,respond(async(req,res)=>{
  const fingerprint=clean(req.body?.device_key,160),name=clean(req.body?.device_name,160)||'Browser';
  if(!validKey(fingerprint))return res.status(400).json({error:'Device required'});
  const visitor=await touchVisitor(req,res,fingerprint,name);
  if(visitor.status==='blocked')return res.status(403).json({error:'Device blocked by central administrator'});
  res.json({ok:true,device_id:visitor.id,status:visitor.status,device_fingerprint:visitor.device_key_hint,first_seen_at:visitor.first_seen_at,last_seen_at:visitor.last_seen_at});
 }));
 router.post('/customer-login',limiter,respond(async(req,res)=>{
  const email=clean(req.body?.email,200).toLowerCase(),password=String(req.body?.password||''),fingerprint=clean(req.body?.device_key,160),name=clean(req.body?.device_name,160)||'Browser';
  if(!email||!password||!validKey(fingerprint))return res.status(400).json({error:'Email, password and device required'});
  const client=await pool.connect();
  try{
   await client.query('BEGIN');
   const result=await client.query(`SELECT a.organization_id,a.password_hash,o.name organization_name,o.status organization_status,l.status license_status,l.plan,l.starts_at,l.expires_at,l.max_devices
     FROM central_customer_accounts a JOIN client_organizations o ON o.id=a.organization_id
     LEFT JOIN client_licenses l ON l.organization_id=o.id WHERE a.email=$1 FOR UPDATE OF a`,[email]);
   const u=result.rows[0];
   if(!u||!verify(password,u.password_hash)){await client.query('ROLLBACK');return res.status(401).json({error:'Email or password incorrect'});}
   if(!validLicense(u)){await client.query('ROLLBACK');return res.status(403).json({error:'Customer blocked or subscription expired'});}
   const visitor=await rememberVisitor(client,req,res,fingerprint,name,u.organization_id);
   if(visitor.status==='blocked'){await client.query('ROLLBACK');return res.status(403).json({error:'Device blocked by central administrator'});}
   const keyHash=sha(fingerprint);
   const old=await client.query('SELECT id,status FROM central_client_devices WHERE organization_id=$1 AND device_key_hash=$2',[u.organization_id,keyHash]);
   let status=old.rows[0]?.status;
   if(!old.rowCount){
    const approved=await client.query("SELECT count(*)::int n FROM central_client_devices WHERE organization_id=$1 AND status='approved'",[u.organization_id]);
    status=Number(approved.rows[0].n)<Number(u.max_devices||1)?'approved':'pending';
    await client.query('INSERT INTO central_client_devices(organization_id,device_name,device_key_hash,status) VALUES($1,$2,$3,$4)',[u.organization_id,name,keyHash,status]);
   }
   await client.query('UPDATE central_device_visitors SET organization_id=COALESCE(organization_id,$1),last_seen_at=now(),updated_at=now() WHERE id=$2',[u.organization_id,visitor.id]);
   if(status!=='approved'){await client.query('COMMIT');return res.status(403).json({error:status==='blocked'?'Device blocked':'Device pending administrator approval'});}
   const token=randomBytes(32).toString('hex');
   await client.query("INSERT INTO central_customer_sessions(token_hash,organization_id,device_key_hash,expires_at) VALUES($1,$2,$3,now()+interval '30 days')",[sha(token),u.organization_id,keyHash]);
   await client.query('COMMIT');res.json({token,organization:u.organization_name,organization_id:u.organization_id,expires_at:u.expires_at});
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
 }));
 router.post('/customer-check',limiter,respond(async(req,res)=>{
  const token=clean(req.body?.token,160),fingerprint=clean(req.body?.device_key,160);
  if(!validKey(token)||!validKey(fingerprint))return res.status(401).json({error:'Sign in required'});
  const visitor=await touchVisitor(req,res,fingerprint,clean(req.body?.device_name,160)||'Browser');
  if(visitor.status==='blocked')return res.status(403).json({error:'Device blocked by central administrator'});
  const {rows}=await pool.query(`SELECT s.organization_id,o.name organization_name,o.status organization_status,l.status license_status,l.plan,l.starts_at,l.expires_at,
    d.status device_status,v.status visitor_status FROM central_customer_sessions s JOIN client_organizations o ON o.id=s.organization_id
    LEFT JOIN client_licenses l ON l.organization_id=o.id LEFT JOIN central_client_devices d ON d.organization_id=s.organization_id AND d.device_key_hash=s.device_key_hash
    LEFT JOIN central_device_visitors v ON v.organization_id=s.organization_id AND v.device_key_hash=s.device_key_hash
     WHERE s.token_hash=$1 AND s.device_key_hash=$2 AND s.expires_at>now() AND s.revoked_at IS NULL`,[sha(token),sha(fingerprint)]);
  const u=rows[0];if(!u)return res.status(401).json({error:'Session expired; sign in again'});
  if(!validLicense(u))return res.status(403).json({error:'Customer blocked or subscription expired'});
  if(u.device_status==='blocked'||u.visitor_status==='blocked')return res.status(403).json({error:'Device blocked by central administrator'});
  if(u.device_status!=='approved'||u.visitor_status==='pending')return res.status(403).json({error:'Device not approved'});
  await pool.query('UPDATE central_client_devices SET last_seen_at=now() WHERE organization_id=$1 AND device_key_hash=$2',[u.organization_id,sha(fingerprint)]);
  res.json({ok:true,organization:u.organization_name,organization_id:u.organization_id,expires_at:u.expires_at});
  }));
  router.post('/customer-logout',limiter,respond(async(req,res)=>{
   const token=clean(req.body?.token,160),fingerprint=clean(req.body?.device_key,160);
   if(!validKey(token)||!validKey(fingerprint))return res.status(401).json({error:'Sign in required'});
   await pool.query('DELETE FROM central_customer_sessions WHERE token_hash=$1 AND device_key_hash=$2',[sha(token),sha(fingerprint)]);
   res.json({ok:true});
  }));
  router.post('/activate',limiter,respond(async(req,res)=>{
  const code=clean(req.body?.activation_code,200),fingerprint=clean(req.body?.device_key,160),name=clean(req.body?.device_name,160)||'Device';
  if(!validKey(code)||!validKey(fingerprint))return res.status(400).json({error:'Activation code and device ID required'});
  const client=await pool.connect();let info;
  try{await client.query('BEGIN');
   const r=await client.query(`SELECT o.id organization_id,o.name organization_name,o.status organization_status,l.id license_id,l.status license_status,l.plan,l.starts_at,l.expires_at,l.max_devices
     FROM client_organizations o JOIN central_client_access a ON a.organization_id=o.id JOIN client_licenses l ON l.organization_id=o.id WHERE a.activation_hash=$1 FOR UPDATE OF a`,[sha(code)]);
   info=r.rows[0];if(!info){await client.query('ROLLBACK');return res.status(401).json({error:'Invalid activation code'});}
   if(!validLicense(info)){await client.query('ROLLBACK');return res.status(403).json({error:'License inactive, expired, or not started'});}
   const visitor=await rememberVisitor(client,req,res,fingerprint,name,info.organization_id);
   if(visitor.status==='blocked'){await client.query('ROLLBACK');return res.status(403).json({error:'Device blocked by central administrator'});}
   const device=await client.query(`INSERT INTO central_client_devices(organization_id,device_name,device_key_hash) VALUES($1,$2,$3)
     ON CONFLICT(organization_id,device_key_hash) DO UPDATE SET device_name=excluded.device_name,updated_at=now()
     RETURNING id,status`,[info.organization_id,name,sha(fingerprint)]);
   const d=device.rows[0];
   await client.query('COMMIT');res.json({organization:info.organization_name,device_status:d.status,license_status:'valid',device_id:d.id,expires_at:info.expires_at});
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
 }));
 router.post('/check',limiter,respond(async(req,res)=>{
  const code=clean(req.body?.activation_code,200),fingerprint=clean(req.body?.device_key,160);
  if(!validKey(code)||!validKey(fingerprint))return res.status(400).json({error:'Activation code and device ID required'});
  const visitor=await touchVisitor(req,res,fingerprint,clean(req.body?.device_name,160)||'Browser');
  if(visitor.status==='blocked')return res.status(403).json({error:'Device blocked by central administrator'});
   const q=await pool.query(`SELECT o.id organization_id,o.name organization_name,o.status organization_status,l.status license_status,l.plan,l.starts_at,l.expires_at,l.max_devices,d.id device_id,d.status device_status
    FROM central_client_access a JOIN client_organizations o ON o.id=a.organization_id LEFT JOIN client_licenses l ON l.organization_id=o.id
    LEFT JOIN central_client_devices d ON d.organization_id=o.id AND d.device_key_hash=$2 WHERE a.activation_hash=$1`,[sha(code),sha(fingerprint)]);
  const r=q.rows[0];if(!r)return res.status(401).json({error:'Invalid activation code'});
  if(!validLicense(r))return res.status(403).json({error:'License inactive or expired'});
  if(r.device_status!=='approved')return res.status(403).json({error:r.device_status==='blocked'?'Device blocked':'Device pending approval'});
  await pool.query('UPDATE central_client_devices SET last_seen_at=now() WHERE id=$1',[r.device_id]);
   res.json({ok:true,organization:r.organization_name,organization_id:r.organization_id,expires_at:r.expires_at});
 }));
 return router;
}
