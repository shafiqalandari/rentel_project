import {Router} from 'express';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import rateLimit from 'express-rate-limit';
const sha=x=>createHash('sha256').update(x).digest('hex');
const clean=(x,n=160)=>String(x??'').trim().slice(0,n);
const validKey=x=>/^[a-zA-Z0-9_-]{16,160}$/.test(x);
const validLicense=r=>r&&r.organization_status==='active'&&r.license_status==='active'&&r.plan&&new Date(r.starts_at)<=new Date()&&(r.plan==='lifetime'||r.expires_at&&new Date(r.expires_at)>new Date());
export function clientAccessRouter(pool){
 const router=Router();
 const respond=(fn)=>(req,res,next)=>Promise.resolve().then(()=>fn(req,res)).catch(next);
 const limiter=rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-7',legacyHeaders:false});
 router.post('/activate',limiter,respond(async(req,res)=>{
  const code=clean(req.body?.activation_code,200),fingerprint=clean(req.body?.device_key,160),name=clean(req.body?.device_name,160)||'Device';
  if(!validKey(code)||!validKey(fingerprint))return res.status(400).json({error:'Activation code and device ID required'});
  const client=await pool.connect();let info;
  try{await client.query('BEGIN');
   const r=await client.query(`SELECT o.id organization_id,o.name organization_name,o.status organization_status,l.id license_id,l.status license_status,l.plan,l.starts_at,l.expires_at,l.max_devices
     FROM client_organizations o JOIN central_client_access a ON a.organization_id=o.id JOIN client_licenses l ON l.organization_id=o.id WHERE a.activation_hash=$1 FOR UPDATE OF a`,[sha(code)]);
   info=r.rows[0];if(!info){await client.query('ROLLBACK');return res.status(401).json({error:'Invalid activation code'});}
   if(!validLicense(info)){await client.query('ROLLBACK');return res.status(403).json({error:'License inactive, expired, or not started'});}
   const device=await client.query(`INSERT INTO central_client_devices(organization_id,device_name,device_key_hash) VALUES($1,$2,$3)
     ON CONFLICT(organization_id,device_key_hash) DO UPDATE SET device_name=excluded.device_name,updated_at=now()
     RETURNING id,status`,[info.organization_id,name,sha(fingerprint)]);
   const d=device.rows[0];
   await client.query('COMMIT');res.json({organization_id:info.organization_id,organization:info.organization_name,device_status:d.status,license_status:'valid',device_id:d.id,expires_at:info.expires_at});
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
 }));
 router.post('/check',limiter,respond(async(req,res)=>{
  const code=clean(req.body?.activation_code,200),fingerprint=clean(req.body?.device_key,160);
  if(!validKey(code)||!validKey(fingerprint))return res.status(400).json({error:'Activation code and device ID required'});
  const q=await pool.query(`SELECT o.id organization_id,o.name organization_name,o.status organization_status,l.status license_status,l.plan,l.starts_at,l.expires_at,l.max_devices,d.id device_id,d.status device_status
    FROM central_client_access a JOIN client_organizations o ON o.id=a.organization_id LEFT JOIN client_licenses l ON l.organization_id=o.id
    LEFT JOIN central_client_devices d ON d.organization_id=o.id AND d.device_key_hash=$2 WHERE a.activation_hash=$1`,[sha(code),sha(fingerprint)]);
  const r=q.rows[0];if(!r)return res.status(401).json({error:'Invalid activation code'});
  if(!validLicense(r))return res.status(403).json({error:'License inactive or expired'});
  if(r.device_status!=='approved')return res.status(403).json({error:r.device_status==='blocked'?'Device blocked':'Device pending approval'});
  await pool.query('UPDATE central_client_devices SET last_seen_at=now() WHERE id=$1',[r.device_id]);
  res.json({ok:true,organization_id:r.organization_id,organization:r.organization_name,expires_at:r.expires_at});
 }));
 return router;
}
