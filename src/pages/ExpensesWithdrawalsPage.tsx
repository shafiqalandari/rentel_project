import React from 'react';
import {usePage} from './PageContext';
export default function ExpensesWithdrawalsPage(){const {page,lang,data,dashboard,settings,user,search,from,to,selected,shopProfileId,canManage,canWrite,admin,t,fmt,readable,actions,table,openForm,setShopProfileId,setSelected,setFrom,setTo,setSettings,setError,setPage,setSearch,refresh,api,exportBackup,importBackup,csvExport}=usePage();
if(page==='expenses'||page==='withdrawals')return <>{actions(page)}{table(data[page]||[],page==='expenses'?['category','description','amount','account','entry_date','voided_at']:['partner','kind','amount','account','entry_date','voided_at'],{key:page,voidable:true})}</>;
return null;
}
