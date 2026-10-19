import React,{useCallback,useEffect,useState} from 'react';
import LoginExperience from './LoginExperience';
import {localApi,setCentralOrganizationScope} from './local-api';

const DEVICE='market_central_device_id_v1';
const SESSION='market_customer_login_token_v1';
const ACTIVATION='market_central_activation_v1';
const SCOPE='market_active_organization_v1';
const CUSTOMER_SCOPE='market_customer_scope_v1';
const base=(import.meta.env.VITE_CENTRAL_API_URL||'/api').replace(/\/$/,'');
const endpoint=(name:string)=>base+'/client-access/'+name;

type Lang='fa'|'ps'|'en';
function deviceId(){let id=localStorage.getItem(DEVICE);if(!id){id=crypto.randomUUID()+'-'+crypto.randomUUID();localStorage.setItem(DEVICE,id)}return id}
async function request(path:string,payload:Record<string,unknown>){
 const res=await fetch(endpoint(path),{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({device_key:deviceId(),device_name:navigator.platform||'Browser',...payload})});
 const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(data.error||'Access denied');return data;
}
function clearLocalSession(){
 sessionStorage.removeItem('market_token');
 sessionStorage.removeItem('market_auth_session_v3');
 sessionStorage.removeItem('market_auth_user_id');
}
async function startMarketSession(organizationId:string){
 const org='org-'+organizationId;
 if(localStorage.getItem(CUSTOMER_SCOPE)!==org || sessionStorage.getItem(SCOPE)!==organizationId){
  clearLocalSession();
 }
 localStorage.setItem(CUSTOMER_SCOPE,org);
 sessionStorage.setItem(SCOPE,organizationId);
 setCentralOrganizationScope(org);
 // The central credentials are verified on the server before a local market session is issued.
 // This avoids a second password screen without bypassing the server license/device check.
 const current=sessionStorage.getItem('market_token')||'';
 if(!current.startsWith('market-v3-')||current!==sessionStorage.getItem('market_auth_session_v3')){
  await localApi('customer-session');
 }else{
  try{await localApi('me')}catch{clearLocalSession();await localApi('customer-session')}
 }
}

export default function LicenseGate({children}:{children:React.ReactNode}){
 const [token,setToken]=useState(()=>localStorage.getItem(SESSION)||'');
 const [code,setCode]=useState(()=>localStorage.getItem(ACTIVATION)||'');
 const [allowed,setAllowed]=useState(false);
 const [scope,setScope]=useState('');
 const [values,setValues]=useState<Record<string,any>>({email:'',password:''});
 const [lang,setLang]=useState<Lang>(()=>(localStorage.getItem('market_lang') as Lang)||'fa');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [blocked,setBlocked]=useState(false);
 const reset=useCallback(()=>{
  localStorage.removeItem(SESSION);localStorage.removeItem(ACTIVATION);
  sessionStorage.removeItem(SCOPE);clearLocalSession();setCentralOrganizationScope(null);
  setToken('');setCode('');setScope('');setAllowed(false);setBlocked(false);
 },[]);
 useEffect(()=>{
  let active=true;let pending=false;
  async function verify(){
   if(pending)return;pending=true;
   try{
    const visitor=await request('device-seen',{});
    if(visitor.status==='blocked')throw Error('این دستگاه توسط مدیر مرکزی بلاک شده است.');
    if(!token&&!code){if(active){setAllowed(false);setScope('');setBlocked(false)}return}
    const data=token?await request('customer-check',{token}):await request('check',{activation_code:code});
    const id=String(data.organization_id||'');
    if(!/^\d+$/.test(id))throw Error('شناسه مشتری معتبر نیست');
    await startMarketSession(id);
    if(active){setScope(id);setAllowed(true);setBlocked(false);setMessage('')}
   }catch(e:any){
    if(active){
     const msg=e?.message||'اتصال به سرور برقرار نیست';
     setAllowed(false);setScope('');setMessage(msg);
     setBlocked(/blocked|بلاک/i.test(msg));
     clearLocalSession();
     // Rejected sessions should not keep causing repeat requests on every refresh.
     if(/expired|sign in required|invalid activation|invalid token/i.test(msg)){
      localStorage.removeItem(SESSION);localStorage.removeItem(ACTIVATION);
     }
    }
   }finally{pending=false}
  }
  void verify();const timer=window.setInterval(()=>void verify(),15000);
  const onFocus=()=>void verify();window.addEventListener('focus',onFocus);
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('focus',onFocus)};
 },[token,code]);
 useEffect(()=>{
  const logout=()=>{reset();setValues({email:'',password:''});setMessage('')};
  window.addEventListener('market-central-logout',logout);
  return()=>window.removeEventListener('market-central-logout',logout);
 },[reset]);
 async function login(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');
  try{
   const data=await request('customer-login',{email:String(values.email||'').trim(),password:String(values.password||'')});
   if(!data.token||!data.organization_id)throw Error('پاسخ ورود ناقص است');
   const id=String(data.organization_id);
   await startMarketSession(id);
   localStorage.setItem(SESSION,data.token);localStorage.removeItem(ACTIVATION);
   setToken(data.token);setCode('');setScope(id);setAllowed(true);setBlocked(false);
   setValues({email:'',password:''});
  }catch(e:any){setMessage(e.message||'ورود ناموفق بود')}finally{setBusy(false)}
 }
 if(allowed&&!blocked&&scope)return <React.Fragment key={scope}>{children}</React.Fragment>;
 return <LoginExperience lang={lang} setLang={setLang} values={values} setValues={setValues} error={message} busy={busy||blocked} onSubmit={login}/>;
}
