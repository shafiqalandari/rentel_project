import React from 'react';
import {usePage} from './PageContext';
export default function DistributionsPage(){const {page,lang,data,dashboard,settings,user,search,from,to,selected,shopProfileId,canManage,canWrite,admin,t,fmt,readable,actions,table,openForm,setShopProfileId,setSelected,setFrom,setTo,setSettings,setError,setPage,setSearch,refresh,api,exportBackup,importBackup,csvExport}=usePage();
if(page==='distributions')return <>{actions('distributions')}<p className="hint">{t('reportNote')}</p>{table(data.distributions||[],['period','partner','share_snapshot','partner_amount'])}</>;
return null;
}
