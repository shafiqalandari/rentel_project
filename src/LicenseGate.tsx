import React,{useEffect,useState} from 'react';
const DEVICE='market_central_device_id_v1';
const SESSION='market_customer_login_token_v1';
const SCOPE='market_active_organization_v1';
const ACTIVATION='market_central_activation_v1';
const base=(import.meta.env.VITE_CENTRAL_API_URL||'/api').replace(/\/$/,'');
const endpoint=(name:string)=>base+'/client-access/'+name;
function deviceId(){let id=localStorage.getItem(DEVICE);if(!id){id=crypto.randomUUID()+'-'+crypto.randomUUID();localStorage.setItem(DEVICE,id)}return id}
async function request(path:string,payload:Record<string,unknown>){const res=await fetch(endpoint(path),{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({device_key:deviceId(),device_name:navigator.platform||'Browser',...payload})});const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(data.error||'Access denied');return data}
function invalidate(){sessionStorage.removeItem(SCOPE);sessionStorage.removeItem('market_token');sessionStorage.removeItem('market_auth_session_v3')}
export default function LicenseGate({children}:{children:React.ReactNode}){
 const [token,setToken]=useState(()=>localStorage.getItem(SESSION)||'');
 const [code,setCode]=useState(()=>localStorage.getItem(ACTIVATION)||'');
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [input,setInput]=useState('');
 const [allowed,setAllowed]=useState(false);const [blocked,setBlocked]=useState(false);const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [scope,setScope]=useState('');
 useEffect(()=>{let active=true;let pending=false;async function verify(){if(pending)return;pending=true;try{
  const visitor=await request('device-seen',{});if(visitor.status==='blocked')throw Error('این دستگاه توسط مدیر مرکزی بلاک شده است.');
  if(active)setBlocked(false);
  if(!token&&!code){if(active){setAllowed(false);setScope('')}return}
  const data=token?await request('customer-check',{token}):await request('check',{activation_code:code});
  const id=String(data.organization_id||'');if(!/^\d+$/.test(id))throw Error('شناسه مشتری معتبر نیست');
  if(active){if(sessionStorage.getItem(SCOPE)!==id){invalidate();sessionStorage.setItem(SCOPE,id)}setScope(id);setAllowed(true);setMessage('')}
 }catch(e:any){if(active){setAllowed(false);setScope('');invalidate();const msg=e?.message||'اتصال به سرور برقرار نیست';setMessage(msg);setBlocked(/blocked|بلاک/i.test(msg))}}finally{pending=false}}
 void verify();const timer=setInterval(()=>void verify(),15000);const onFocus=()=>void verify();window.addEventListener('focus',onFocus);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',onFocus)}},[token,code]);
 useEffect(()=>{const logout=()=>{localStorage.removeItem(SESSION);localStorage.removeItem(ACTIVATION);invalidate();setToken('');setCode('');setAllowed(false);setScope('')};window.addEventListener('market-central-logout',logout);return()=>window.removeEventListener('market-central-logout',logout)},[]);
 async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{const data=await request('customer-login',{email,password});if(!data.token||!data.organization_id)throw Error('پاسخ ورود ناقص است');localStorage.setItem(SESSION,data.token);localStorage.removeItem(ACTIVATION);invalidate();sessionStorage.setItem(SCOPE,String(data.organization_id));setScope(String(data.organization_id));setToken(data.token);setCode('');setAllowed(true);setPassword('')}catch(e:any){setMessage(e.message||'ورود ناموفق بود')}finally{setBusy(false)}}
 async function activate(){setBusy(true);setMessage('');try{const data=await request('activate',{activation_code:input.trim()});localStorage.setItem(ACTIVATION,input.trim());localStorage.removeItem(SESSION);invalidate();setScope('');setToken('');setCode(input.trim());setAllowed(false);setMessage(data.device_status==='approved'?'دستگاه ثبت شد؛ در حال بررسی...':'دستگاه ثبت شد؛ منتظر تأیید مدیر باشید')}catch(e:any){setMessage(e.message||'فعال‌سازی ناموفق بود')}finally{setBusy(false)}}
 if(allowed&&!blocked&&scope)return <React.Fragment key={scope}>{children}</React.Fragment>;
 return <main dir="rtl" style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0c1425',color:'#f0f6ff',fontFamily:'Tahoma,sans-serif',padding:20}}><form onSubmit={login} style={{width:'min(440px,100%)',padding:26,borderRadius:18,background:'#17243b',border:'1px solid #334969',display:'grid',gap:14}}><strong style={{fontSize:20}}>ورود مشتری به سیستم کرایه‌داری</strong><p style={{color:'#bdd1e9',fontSize:13}}>ایمیل و پسوردی را وارد کنید که ادمین مرکزی برایتان ساخته است. وضعیت دستگاه از سرور بررسی می‌شود.</p>{message&&<p role="alert" style={{color:'#ffd29c'}}>{message}</p>}<label>ایمیل<input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box',padding:12,marginTop:7,borderRadius:8}}/></label><label>پسورد<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box',padding:12,marginTop:7,borderRadius:8}}/></label><button disabled={busy||blocked} style={{padding:13,background:'#2563eb',color:'#fff',border:0,borderRadius:9}}>{busy?'لطفاً صبر کنید':'ورود به سیستم'}</button>{(token||code)&&<button type="button" onClick={()=>{localStorage.removeItem(SESSION);localStorage.removeItem(ACTIVATION);invalidate();setToken('');setCode('');setBlocked(false);setMessage('')}}>ورود با حساب دیگر</button>}<details><summary>ورود با کد فعال‌سازی قبلی</summary><input value={input} onChange={e=>setInput(e.target.value)} placeholder="کد فعال‌سازی" style={{padding:10,marginTop:9,width:'90%'}}/><button type="button" disabled={busy||blocked} onClick={()=>void activate()}>ثبت دستگاه</button></details></form></main>
}
