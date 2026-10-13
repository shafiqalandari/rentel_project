import React from 'react';
import {usePage} from './PageContext';
export default function TenantsPartnersPage(){const {page,lang,data,dashboard,settings,user,search,from,to,selected,shopProfileId,canManage,canWrite,admin,t,fmt,readable,actions,table,openForm,setShopProfileId,setSelected,setFrom,setTo,setSettings,setError,setPage,setSearch,refresh,api,exportBackup,importBackup,csvExport}=usePage();
if(page==='tenants'||page==='partners'){let fields=page==='tenants'?['name','phone','identity_no','address']:['name','phone','share','capital'];return <>{actions(page)}{table(data[page]||[],fields,{key:page,editable:true})}</>}
return null;
}
