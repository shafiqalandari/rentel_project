import React from 'react';
import {usePage} from './PageContext';

export default function DistributionsPage(){
  const {page,lang,data,actions,table,fmt}=usePage();
  if(page!=='distributions')return null;
  const tr=(fa:string,ps:string,en:string)=>lang==='en'?en:lang==='ps'?ps:fa;
  const distributions=data.distributions||[];
  const withdrawals=(data.withdrawals||[]).filter(w=>!w.voided_at);
  const periods=Array.from(new Set(distributions.map(d=>String(d.period||'')))).sort().reverse();
  return <>
    {actions('distributions')}
    <div className="panel" style={{padding:18,marginBottom:16}}>
      <strong>{tr('وضعیت تقسیم مفاد','د ګټې د وېش حالت','Profit distribution status')}</strong>
      <p className="hint">{tr('سهم هر شریک در این بخش ثبت شده است، اما ثبت سهم به معنی پرداخت نقدی آن نیست. برداشت علی‌الحساب تنها پس از تطبیق و تأیید با سهم شریک تسویه می‌شود.','دلته د هر شریک ونډه ثبت شوې، خو دا د نغدي ورکړې معنا نه لري. مخکېنۍ اخیستنې یوازې د حساب له تطبیق وروسته تصفیه کېږي.','Partner allocations are recorded here, but do not represent cash payouts. Advances require a verified allocation before settlement.')}</p>
      {periods.map(period=>{
        const entries=distributions.filter(d=>String(d.period)===period);
        const amount=entries.reduce((s,d)=>s+Number(d.partner_amount||0),0);
        return <div key={period} style={{marginTop:12,padding:'12px',border:'1px solid var(--border, #334155)',borderRadius:12}}>
          <strong>{tr('دوره','دوره','Period')}: {period} · {tr('مجموع مفاد تخصیص‌یافته','ټوله وېشل شوې ګټه','Allocated profit')}: {fmt(amount)}</strong>
          <div className="tablewrap" style={{marginTop:12}}><table><thead><tr>
            <th>{tr('شریک','شریک','Partner')}</th><th>{tr('فیصدی سهم','د ونډې سلنه','Share (%)')}</th><th>{tr('سهم مفاد','د ګټې ونډه','Profit allocation')}</th><th>{tr('علی‌الحساب ثبت‌شده در این دوره','په دې دوره کې مخکېنۍ اخیستنه','Advances recorded this period')}</th><th>{tr('مانده احتمالی پس از تطبیق','له تطبیق وروسته احتمالي پاتې','Indicative remainder')}</th><th>{tr('وضعیت','حالت','Status')}</th>
          </tr></thead><tbody>{entries.map((d,i)=>{
            const advances=withdrawals.filter(w=>String(w.partner_id)===String(d.partner_id)&&w.kind==='advance'&&String(w.entry_date||'').slice(0,7)===period).reduce((s,w)=>s+Number(w.amount||0),0);
            return <tr key={d.id||i}><td>{d.partner||data.partners?.find(p=>String(p.id)===String(d.partner_id))?.name||''}</td><td>{d.share_snapshot}%</td><td>{fmt(d.partner_amount)}</td><td>{fmt(advances)}</td><td>{fmt(Number(d.partner_amount||0)-advances)}</td><td>{tr('تخصیص ثبت‌شده، پرداخت تأیید نشده','ونډه ثبت شوې، ورکړه نه ده تایید شوې','Allocated, not paid')}</td></tr>
          })}</tbody></table></div>
          <small className="hint">{tr('مانده احتمالی صرفاً جهت بررسی است. برداشت‌ها تا ثبت سند تطبیق، به‌صورت خودکار تسویه نمی‌شوند.','احتمالي پاتې یوازې د کتنې لپاره ده. اخیستنې له سند پرته په اتومات ډول نه تصفیه کېږي.','Remainder is for review only; advances are not automatically settled without a reconciliation record.')}</small>
        </div>
      })}
      {!periods.length&&<p className="hint">{tr('هنوز تقسیم مفاد ثبت نشده است.','تر اوسه د ګټې وېش نه دی ثبت شوی.','No distributions recorded yet.')}</p>}
    </div>
  </>;
}
