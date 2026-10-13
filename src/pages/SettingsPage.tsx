import React,{useState} from 'react';
import {usePage} from './PageContext';
type Tab='general'|'themes'|'language'|'users'|'backup'|'activity';
const content={
 fa:{general:'عمومی',themes:'رنگ و ظاهر',language:'زبان سیستم',users:'کاربران و صلاحیت‌ها',backup:'بکاپ و بازیابی',activity:'تاریخچه فعالیت‌ها',title:'مرکز تنظیمات',description:'معلومات مارکیت، رنگ‌بندی، زبان و بکاپ را از همین بخش مدیریت کنید.',customize:'رنگ‌بندی دلخواه خود را انتخاب کنید. تغییرات فوری ثبت می‌شوند.',company:'معلومات مارکیت',name:'نام مارکیت',currency:'واحد پول',save:'ذخیره معلومات',languageHelp:'زبان سیستم را انتخاب کنید. تمام صفحات با همان زبان نمایش داده می‌شوند.',backupHelp:'معلومات فعلاً در همین مرورگر نگهداری می‌شوند. به‌صورت منظم بکاپ بگیرید.',download:'دانلود بکاپ',restore:'بازیابی بکاپ',newUser:'کاربر جدید',selected:'فعال',system:'تنظیمات سیستم',themeHint:'انتخاب Theme در حافظه همین مرورگر محفوظ می‌ماند.',empty:'برای دیدن معلومات، بخش مربوط را انتخاب کنید.'},
 ps:{general:'عمومي',themes:'رنګ او بڼه',language:'د سیسټم ژبه',users:'کارنان او صلاحیتونه',backup:'بیک اپ او بېرته راوستل',activity:'د فعالیت تاریخچه',title:'د تنظیماتو مرکز',description:'د مارکېټ معلومات، رنګ، ژبه او بیک اپ له دې ځایه اداره کړئ.',customize:'د خپلې خوښې رنګ غوره کړئ. بدلونونه سمدستي ثبتېږي.',company:'د مارکېټ معلومات',name:'د مارکېټ نوم',currency:'د پیسو واحد',save:'معلومات خوندي کړئ',languageHelp:'د سیسټم ژبه وټاکئ.',backupHelp:'معلومات اوس یوازې په همدې براوزر کې خوندي کېږي. وخت په وخت بیک اپ واخلئ.',download:'بیک اپ ډاونلوډ',restore:'بیک اپ راوستل',newUser:'نوی کارن',selected:'فعال',system:'د سیسټم تنظیمات',themeHint:'ټاکل شوې بڼه په براوزر کې ساتل کېږي.',empty:'اړونده برخه وټاکئ.'},
 en:{general:'General',themes:'Themes & colors',language:'Language',users:'Users & roles',backup:'Backup & restore',activity:'Activity log',title:'Settings Center',description:'Manage market details, themes, language and backups in one place.',customize:'Choose your preferred look. Changes are saved immediately.',company:'Market details',name:'Market name',currency:'Currency',save:'Save details',languageHelp:'Choose the interface language for the entire application.',backupHelp:'Data currently lives in this browser. Export backups regularly.',download:'Download backup',restore:'Restore backup',newUser:'New user',selected:'Active',system:'System settings',themeHint:'Your theme selection is saved in this browser.',empty:'Choose a section to view its details.'}
};
const themes=[
 {id:'dark',fa:'تاریک کلاسیک',ps:'تیاره',en:'Classic Dark',color:'#171c27',accent:'#367af4',light:false},
 {id:'light',fa:'روشن مینیمال',ps:'روښانه',en:'Minimal Light',color:'#f1f5f9',accent:'#2563eb',light:true},
 {id:'ocean',fa:'آبی اقیانوسی',ps:'سمندري آبي',en:'Ocean Blue',color:'#10263b',accent:'#06b6d4',light:false},
 {id:'midnight',fa:'نیمه‌شب',ps:'نیمه شپه',en:'Midnight',color:'#101228',accent:'#818cf8',light:false},
 {id:'emerald',fa:'زمردی',ps:'زمردي',en:'Emerald',color:'#0d2522',accent:'#10b981',light:false},
 {id:'rose',fa:'رز تیره',ps:'ګلابي',en:'Rose Noir',color:'#291922',accent:'#fb7185',light:false},
 {id:'amber',fa:'کهربایی',ps:'کهربايي',en:'Amber',color:'#282115',accent:'#f59e0b',light:false},
 {id:'slate',fa:'خاکستری مسلکی',ps:'خړ مسلکي',en:'Slate Pro',color:'#222936',accent:'#94a3b8',light:false},
 {id:'lavender',fa:'بنفش آرام',ps:'ارام ارغواني',en:'Lavender',color:'#211a33',accent:'#a78bfa',light:false},
 {id:'arctic',fa:'سفید یخی',ps:'یخي سپین',en:'Arctic',color:'#eaf5fc',accent:'#0891b2',light:true},
] as const;
const icons:Record<Tab,string>={general:'⚙',themes:'◈',language:'文',users:'♙',backup:'⇩',activity:'◷'};
export default function SettingsPage(){
 const {page,lang,data,settings,user,admin,t,table,openForm,setSettings,setError,api,exportBackup,importBackup,theme,setTheme,setLang}=usePage();
 const [tab,setTab]=useState<Tab>('general');
 if(page!=='settings')return null;
 const w=content[lang];const tabs:Tab[]=['general','themes','language','users','backup','activity'];
 const visible=tabs.filter(x=>admin||!['users','activity','backup'].includes(x));
 return <div className="market-settings-v3">
  <div className="market-settings-hero"><span className="settings-hero-icon">⚙</span><div><h2>{w.title}</h2><p>{w.description}</p></div></div>
  <div className="market-settings-layout"><nav className="market-settings-tabs" aria-label={w.system}>
   {visible.map(x=><button type="button" key={x} className={'settings-tab-btn '+(tab===x?'active':'')} aria-current={tab===x?'page':undefined} onClick={()=>setTab(x)}><span className="settings-tab-icon">{icons[x]}</span><span>{w[x]}</span><span className="settings-tab-chevron">›</span></button>)}
  </nav><div className="market-settings-pane" key={tab}>
   {tab==='general'&&<section className="settings-block"><h3>{w.company}</h3>{admin?<form className="settings-form-grid" onSubmit={async e=>{e.preventDefault();try{setSettings(await api('settings',{method:'PUT',body:JSON.stringify(settings)}));alert(t('settingsSaved'))}catch(e:any){setError(e.message)}}}><label>{w.name}<input required value={settings.name||''} onChange={e=>setSettings({...settings,name:e.target.value})}/></label><label>{w.currency}<input required value={settings.currency||'AFN'} onChange={e=>setSettings({...settings,currency:e.target.value})}/></label><button type="submit" className="primary">{w.save}</button></form>:<p>{t('role')}: {t(user?.role||'viewer')}</p>}</section>}
   {tab==='themes'&&<section className="settings-block"><h3>{w.themes}</h3><p className="settings-help">{w.customize}</p><div className="theme-grid theme-grid-v3">{themes.map(mode=><button key={mode.id} type="button" aria-pressed={theme===mode.id} onClick={()=>setTheme(mode.id)} className={'theme-choice '+(theme===mode.id?'selected':'')}><span className="theme-mock" style={{background:mode.color,color:mode.light?'#475569':'#e2e8f0'}}><span className="theme-mock-aside" style={{background:mode.accent}}/><span className="theme-mock-main"><i/><span><i/><i/><i/></span></span></span><span className="theme-caption"><strong>{mode[lang]}</strong><span>{theme===mode.id?'✓':''}</span></span></button>)}</div><p className="settings-help">{w.themeHint}</p></section>}
   {tab==='language'&&<section className="settings-block"><h3>{w.language}</h3><p className="settings-help">{w.languageHelp}</p><div className="language-buttons">{([{id:'fa',name:'دری',dir:'rtl'},{id:'ps',name:'پښتو',dir:'rtl'},{id:'en',name:'English',dir:'ltr'}] as const).map(x=><button key={x.id} type="button" dir={x.dir} className={'language-tile '+(lang===x.id?'active':'')} onClick={()=>setLang(x.id)}><span>{x.name}</span><span>{lang===x.id?'✓':''}</span></button>)}</div></section>}
   {tab==='users'&&admin&&<section className="settings-block"><div className="settings-section-heading"><h3>{w.users}</h3><button type="button" className="primary" onClick={()=>openForm('users')}>{w.newUser}</button></div>{table(data.users||[],['name','email','role','active'])}</section>}
   {tab==='backup'&&admin&&<section className="settings-block"><h3>{w.backup}</h3><p className="settings-help">{w.backupHelp}</p><div className="backup-actions"><button type="button" className="primary" onClick={exportBackup}>{w.download}</button><label className="backup-file">{w.restore}<input type="file" accept="application/json,.json" onChange={e=>{const f=e.target.files?.[0];if(f)importBackup(f);e.target.value=''}}/></label></div></section>}
   {tab==='activity'&&admin&&<section className="settings-block"><h3>{w.activity}</h3>{table(data.audit||[],['action','entity','entity_id','created_at'])}</section>}
  </div></div></div>
}
