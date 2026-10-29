import React, {useState} from 'react';
import {Building2, Eye, EyeOff, Globe2, LogIn, UserPlus, ShieldCheck, Landmark, FileText, BarChart3} from 'lucide-react';

type Lang='fa'|'ps'|'en';
interface Props {lang:Lang;setLang:(v:Lang)=>void;values:Record<string,any>;setValues:(v:Record<string,any>)=>void;error:string;busy:boolean;onSubmit:(e:React.FormEvent<HTMLFormElement>)=>void;}
const translations={
 fa:{eyebrow:'مدیریت مارکیت و کرایه',headline:'یک سیستم ساده برای مدیریت مارکیت شما',subtitle:'دوکان‌ها، مستأجرین، قراردادها، کرایه‌ها، شرکا و حسابات را از یک جای مدیریت کنید.',welcome:'خوش آمدید',intro:'برای مدیریت مارکیت وارد حساب شوید.',signin:'ورود به حساب',signup:'ایجاد حساب دفتر',office:'نام دفتر یا مارکیت',contact:'شماره تماس',email:'ایمیل',password:'رمز ورود',submit:'ورود به سیستم',request:'ارسال درخواست ایجاد حساب',info:'برای ایجاد حساب جدید، درخواست شما باید توسط مدیر مرکزی بررسی و تأیید شود.',secure:'ورود مصون به حساب مارکیت',features:['مدیریت دوکان‌ها','کرایه و حسابات','گزارش‌های مالی'],show:'نمایش رمز',hide:'پنهان‌کردن رمز',admin:'ورود مدیر مرکزی'},
 ps:{eyebrow:'د مارکېټ او کرایې مدیریت',headline:'ستاسو د مارکېټ مدیریت لپاره ساده سیسټم',subtitle:'دوکانونه، کرایه کوونکي، قراردادونه، کرایې، شریکان او حسابونه په یوه ځای کې اداره کړئ.',welcome:'ښه راغلاست',intro:'د مارکېټ حساب ته ننوځئ.',signin:'حساب ته ننوتل',signup:'د دفتر حساب جوړول',office:'د دفتر یا مارکېټ نوم',contact:'د اړیکې شمېره',email:'برېښنالیک',password:'پټنوم',submit:'سیسټم ته ننوتل',request:'د حساب غوښتنه واستوئ',info:'نوی حساب د مرکزي مدیر له ارزونې او تایید وروسته جوړېږي.',secure:'د مارکېټ حساب خوندي ننوتل',features:['د دوکانونو مدیریت','کرایه او حسابونه','مالي راپورونه'],show:'پټنوم ښکاره کول',hide:'پټنوم پټول',admin:'د مرکزي مدیر ننوتل'},
 en:{eyebrow:'MARKET & RENTAL MANAGEMENT',headline:'A simple workspace for your market',subtitle:'Manage shops, tenants, contracts, rent, partners and accounting in one place.',welcome:'Welcome back',intro:'Sign in to manage your market.',signin:'Sign in',signup:'Create office account',office:'Office or market name',contact:'Contact number',email:'Email address',password:'Password',submit:'Sign in to system',request:'Send account request',info:'New office accounts require review and approval by the central administrator.',secure:'Protected market account access',features:['Shops management','Rent & accounting','Financial reports'],show:'Show password',hide:'Hide password',admin:'Central admin login'}
};
export default function LoginExperience({lang,setLang,values,setValues,error,busy,onSubmit}:Props){
 const [mode,setMode]=useState<'signin'|'signup'>('signin');
 const [show,setShow]=useState(false),[office,setOffice]=useState(''),[phone,setPhone]=useState(''),[email,setEmail]=useState('');
 const t=translations[lang];
 const requestAccount=(e:React.FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  const subject=encodeURIComponent('Market Rental - Office account request');
  const body=encodeURIComponent(`Office / Market: ${office}\nPhone: ${phone}\nEmail: ${email}\n\nPlease review and approve my office account request.`);
  window.location.href=`mailto:rahattec@gmail.com?subject=${subject}&body=${body}`;
 };
 return <main className="estate-login rental-estate-login" dir={lang==='en'?'ltr':'rtl'}>
  <div className="estate-login-glow estate-login-glow-one" aria-hidden="true"/><div className="estate-login-glow estate-login-glow-two" aria-hidden="true"/>
  <div className="estate-login-layout">
   <section className="estate-login-story">
    <div className="estate-login-brand"><span className="estate-login-brand-mark"><Building2 size={25}/></span><span>MARKETPRO</span></div>
    <p className="estate-login-eyebrow">{t.eyebrow}</p><h1>{t.headline}</h1><p className="estate-login-desc">{t.subtitle}</p>
    <div className="estate-login-feature-grid"><span><Landmark size={17}/>{t.features[0]}</span><span><FileText size={17}/>{t.features[1]}</span><span><BarChart3 size={17}/>{t.features[2]}</span></div>
    <div className="estate-login-illustration" aria-hidden="true"><div className="estate-login-illustration-ring"/><Building2 size={96} strokeWidth={1.2}/></div>
    <p className="estate-login-signature">MARKET RENTAL</p>
   </section>
   <section className="estate-login-form-pane"><div className="estate-login-card">
    <div className="estate-login-card-header"><span className="estate-login-badge"><Building2 size={21}/></span><label className="estate-login-language"><Globe2 size={16}/><select aria-label="Language" value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="fa">دری</option><option value="ps">پښتو</option><option value="en">English</option></select></label></div>
    <p className="estate-login-mobile-name">MARKETPRO</p><h2>{t.welcome}</h2><p className="estate-login-hint">{mode==='signin'?t.intro:t.info}</p>
    <div className="estate-login-tabs" role="tablist"><button type="button" role="tab" aria-selected={mode==='signin'} className={mode==='signin'?'active':''} onClick={()=>setMode('signin')}>{t.signin}</button><button type="button" role="tab" aria-selected={mode==='signup'} className={mode==='signup'?'active':''} onClick={()=>setMode('signup')}>{t.signup}</button></div>
    {mode==='signin'?<form onSubmit={onSubmit}>
      {error&&<div className="estate-login-error" role="alert">{error}</div>}
      <div className="estate-login-fields"><label className="estate-login-wide">{t.email}<input required type="email" dir="ltr" autoComplete="username" value={values.email||''} onChange={e=>setValues({...values,email:e.target.value})}/></label>
       <label className="estate-login-wide">{t.password}<span className="estate-login-password"><input required dir="ltr" autoComplete="current-password" type={show?'text':'password'} value={values.password||''} onChange={e=>setValues({...values,password:e.target.value})}/><button type="button" aria-label={show?t.hide:t.show} onClick={()=>setShow(v=>!v)}>{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></span></label></div>
      <button className="estate-login-submit" type="submit" disabled={busy}><LogIn size={18}/>{t.submit}</button>
     </form>:<form onSubmit={requestAccount}>
      <div className="estate-login-fields"><label className="estate-login-wide">{t.office}<input required value={office} onChange={e=>setOffice(e.target.value)} maxLength={120}/></label>
       <label className="estate-login-wide">{t.contact}<input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} maxLength={40}/></label>
       <label className="estate-login-wide">{t.email}<input required dir="ltr" type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label></div>
      <button className="estate-login-submit" type="submit"><UserPlus size={18}/>{t.request}</button>
     </form>}
    <p className="estate-login-trust"><ShieldCheck size={15}/>{t.secure}</p><a className="rental-admin-entry" href="/central-admin/">{t.admin}</a>
   </div></section>
  </div>
 </main>;
}
