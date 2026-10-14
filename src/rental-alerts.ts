export type Language='fa'|'ps'|'en';
export type Alert={id:string;type:'overdue'|'expired'|'soon'|'unpaid';title:string;detail:string;route:string;days?:number;amount?:number};
const loc=(lang:Language,fa:string,ps:string,en:string)=>lang==='en'?en:lang==='ps'?ps:fa;
const validDate=(v:any)=>{const s=String(v||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return NaN;const ms=new Date(s+'T12:00:00').getTime();return Number.isFinite(ms)?ms:NaN};
const todayMs=()=>validDate(new Date().toISOString().slice(0,10));
export function rentalAlerts(data:Record<string,any[]>,lang:Language,windowDays=30):Alert[]{
 const out:Alert[]=[];const today=todayMs();const days=(date:any)=>Math.ceil((validDate(date)-today)/86400000);
 const shops=new Map((data.shops||[]).map(s=>[String(s.id),s]));const tenants=new Map((data.tenants||[]).map(t=>[String(t.id),t]));
 const contracts=(data.contracts||[]).filter(c=>!c.voided_at&&c.status!=='cancelled'&&c.status!=='closed');
 for(const c of contracts){const left=days(c.end_date);if(!Number.isFinite(left))continue;const number=shops.get(String(c.shop_id))?.number??c.shop_id;const person=tenants.get(String(c.tenant_id))?.name??'';
 const route='shops/'+String(c.shop_id);if(left<0)out.push({id:'expired-'+c.id,type:'expired',days:left,route,title:loc(lang,'قرارداد ختم‌شده','پای ته رسېدلی قرارداد','Expired contract'),detail:loc(lang,`دوکان ${number}، ${person}، ${Math.abs(left)} روز از ختم قرارداد گذشته است.`,`دوکان ${number}، ${person}، د قرارداد له پای ${Math.abs(left)} ورځې تېرې شوې.`,`Shop ${number}, ${person}, expired ${Math.abs(left)} days ago.`)});
 else if(left<=windowDays)out.push({id:'soon-'+c.id,type:'soon',days:left,route,title:loc(lang,'قرارداد نزدیک به ختم','د قرارداد پای ته رسېدل نږدې دي','Contract expiring soon'),detail:loc(lang,`دوکان ${number}، ${person}، ${left===0?'امروز ختم می‌شود':left+' روز تا ختم قرارداد'}.`,`دوکان ${number}، ${person}، ${left} ورځې پاتې دي.`,`Shop ${number}, ${person}, ${left} days remaining.`)});
 }
 // Month-based charges represent a rent installment. An unpaid past month is overdue;
 // current-month unpaid balance is due but not necessarily late without a contractual due day.
 for(const charge of data.charges||[]){const due=Number(charge.due||0);if(!(due>0))continue;const month=String(charge.period||'').slice(0,7);if(!/^\d{4}-\d{2}$/.test(month))continue;const past=month<new Date().toISOString().slice(0,7);const number=charge.shop||shops.get(String(charge.shop_id))?.number||'';const person=charge.tenant||tenants.get(String(charge.tenant_id))?.name||'';
 out.push({id:'charge-'+charge.id,type:past?'overdue':'unpaid',route:'tenants/'+charge.tenant_id,amount:due,title:past?loc(lang,'کرایه عقب‌مانده','ځنډېدلې کرایه','Overdue rent'):loc(lang,'کرایه پرداخت‌نشده','نا ورکړل شوې کرایه','Unpaid rent'),detail:loc(lang,`${person}، دوکان ${number}، ماه ${month}، باقی‌مانده ${due.toLocaleString()} افغانی.`,`${person}، دوکان ${number}، میاشت ${month}، پاتې ${due.toLocaleString()} افغانۍ.`,`${person}, shop ${number}, ${month}, balance ${due.toLocaleString()} AFN.`)});
 }
 const order={expired:0,overdue:1,soon:2,unpaid:3};return out.sort((a,b)=>order[a.type]-order[b.type]||((a.days??999)-(b.days??999)));
}
