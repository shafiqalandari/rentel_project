import React from 'react';
import {usePage} from './PageContext';
export default function ContractsPage(){const {page,lang,data,dashboard,settings,user,search,from,to,selected,shopProfileId,canManage,canWrite,admin,t,fmt,readable,actions,table,openForm,setShopProfileId,setSelected,setFrom,setTo,setSettings,setError,setPage,setSearch,refresh,api,exportBackup,importBackup,csvExport}=usePage();
if(page==='contracts')return <>{actions('contracts')}<p className="hint">{t('depositNote')}</p>{table(data.contracts||[],['shop_id','tenant_id','start_date','end_date','monthly_rent','deposit','status'])}</>;
return null;
}
