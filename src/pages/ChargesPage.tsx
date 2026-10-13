import React from 'react';
import {usePage} from './PageContext';
export default function ChargesPage(){const {page,lang,data,dashboard,settings,user,search,from,to,selected,shopProfileId,canManage,canWrite,admin,t,fmt,readable,actions,table,openForm,setShopProfileId,setSelected,setFrom,setTo,setSettings,setError,setPage,setSearch,refresh,api,exportBackup,importBackup,csvExport}=usePage();
if(page==='charges')return <>{actions('receipts','charges')}<div className="panel"><h3>{t('debt')}</h3>{table(data.charges||[],['tenant','shop','period','amount','due'])}</div><div className="panel"><h3>{t('receipt')}</h3>{table(data.receipts||[],['id','tenant','amount','account','receipt_date','reference','voided_at'],{key:'receipts',printable:true,voidable:true})}</div></>;
return null;
}
