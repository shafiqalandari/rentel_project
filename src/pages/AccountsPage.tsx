import React from 'react';
import {usePage} from './PageContext';
export default function AccountsPage(){const {page,lang,data,dashboard,settings,user,search,from,to,selected,shopProfileId,canManage,canWrite,admin,t,fmt,readable,actions,table,openForm,setShopProfileId,setSelected,setFrom,setTo,setSettings,setError,setPage,setSearch,refresh,api,exportBackup,importBackup,csvExport}=usePage();
if(page==='accounts')return <>{actions('accounts')}<div className="cards">{(data.balances||[]).map(a=><div className="metric" key={a.id}><span>{a.name}</span><strong>{fmt(a.balance)}</strong><small>{t(a.type)}</small></div>)}</div><div className="panel"><div className="heading"><h3>{t('transfer')}</h3>{canWrite&&<button className="primary" onClick={()=>openForm('transfers')}>{t('add')}</button>}</div>{table(data.transfers||[],['from_account','to_account','amount','entry_date'])}</div></>;
return null;
}
