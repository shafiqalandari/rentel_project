import React from 'react';
import {usePage} from './PageContext';
export default function ShopsPage(){const {page,lang,data,dashboard,settings,user,search,from,to,selected,shopProfileId,canManage,canWrite,admin,t,fmt,readable,actions,table,openForm,setShopProfileId,setSelected,setFrom,setTo,setSettings,setError,setPage,setSearch,refresh,api,exportBackup,importBackup,csvExport,deleteRecord}=usePage();
if(page==='shops'){
const shops=data.shops||[];
const shop=shops.find(x=>Number(x.id)===shopProfileId);
if(shop){
const contracts=(data.contracts||[]).filter(x=>String(x.shop_id)===String(shop.id));
const chargeRows=(data.charges||[]).filter(x=>String(x.shop)===String(shop.number)||contracts.some(c=>String(c.id)===String(x.contract_id)));
const due=chargeRows.reduce((n,x)=>n+Number(x.due||0),0);
const total=chargeRows.reduce((n,x)=>n+Number(x.amount||0),0);
const paid=Math.max(0,total-due);
const props=['number','floor','block','location','area','rent','status','electricity_meter','water_meter','features','notes'];
return <div className="shop-profile"><div className="shop-profile-top"><div><button onClick={()=>setShopProfileId(null)}>← {t('backToShops')}</button><p className="shop-eyebrow">{t('shopProfile')}</p><h2>{t('shops')} #{shop.number}</h2></div>{canManage&&<button className="primary" onClick={()=>openForm('shops',shop)}>{t('edit')}</button>}</div><div className="shop-stats"><div><small>{t('rent')}</small><strong>{fmt(shop.rent)} {settings.currency||'AFN'}</strong></div><div><small>{t('collected')}</small><strong>{fmt(paid)}</strong></div><div><small>{t('debtAmount')}</small><strong>{fmt(due)}</strong></div><div><small>{t('shopContracts')}</small><strong>{contracts.length}</strong></div></div><section className="panel"><h3>{t('shopDetails')}</h3><div className="shop-detail-grid">{props.map(key=><div className="shop-detail" key={key}><span>{t(key)}</span><strong>{shop[key]===undefined||shop[key]===''?'—':readable(key,shop[key])}</strong></div>)}</div></section><section className="panel"><h3>{t('shopContracts')}</h3>{contracts.length?table(contracts,['tenant_id','start_date','end_date','monthly_rent','deposit','status']):<p className="hint">{t('shopNoContracts')}</p>}</section><section className="panel"><h3>{t('shopRents')}</h3>{table(chargeRows,['tenant','period','amount','due'])}</section></div>;
}
return <>{actions('shops')}<div className="tablewrap"><table><thead><tr>{['number','floor','block','area','rent','status'].map(k=><th key={k}>{t(k)}</th>)}<th>{t('actions')}</th></tr></thead><tbody>{shops.filter(r=>!search||Object.values(r).join(' ').toLowerCase().includes(search.toLowerCase())).map(s=><tr className="shop-clickable" tabIndex={0} role="button" key={s.id} onClick={()=>setShopProfileId(Number(s.id))} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setShopProfileId(Number(s.id))}}}>{['number','floor','block','area','rent','status'].map(k=><td key={k}>{readable(k,s[k])}</td>)}<td className="nowrap"><button className="mini" onClick={e=>{e.stopPropagation();setShopProfileId(Number(s.id))}}>{t('details')}</button>{canManage&&<button className="mini" onClick={e=>{e.stopPropagation();openForm('shops',s)}}>{t('edit')}</button>}{admin&&<button className="mini danger" onClick={e=>{e.stopPropagation();deleteRecord('shops',Number(s.id))}}>{lang==='en'?'Delete':lang==='ps'?'ړنګول':'حذف'}</button>}</td></tr>)}{shops.length===0&&<tr><td colSpan={7} className="muted center">{t('empty')}</td></tr>}</tbody></table></div></>;
}
return null;
}
