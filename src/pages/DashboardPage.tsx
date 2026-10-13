import React from 'react';
import {usePage} from './PageContext';
import Dashboard from '../Dashboard';
export default function DashboardPage(){const {page,lang,data,dashboard,settings,user,search,from,to,selected,shopProfileId,canManage,canWrite,admin,t,fmt,readable,actions,table,openForm,setShopProfileId,setSelected,setFrom,setTo,setSettings,setError,setPage,setSearch,refresh,api,exportBackup,importBackup,csvExport}=usePage();
if(page==='dashboard')return <Dashboard lang={lang} data={data} summary={dashboard} currency={settings.currency||'AFN'} refresh={refresh} onNavigate={(next)=>{setPage(next);setSearch('')}}/>;
return null;
}
