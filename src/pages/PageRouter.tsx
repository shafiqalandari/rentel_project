import React from 'react';
import ModuleStats from './ModuleStats';
import {Guidance} from './Guidance';
import DashboardPage from './DashboardPage';
import ShopsPage from './ShopsPage';
import TenantsPartnersPage from './TenantsPartnersPage';
import ContractsPage from './ContractsPage';
import ChargesPage from './ChargesPage';
import ExpensesWithdrawalsPage from './ExpensesWithdrawalsPage';
import AccountsPage from './AccountsPage';
import DistributionsPage from './DistributionsPage';
import ReportsPage from './ReportsPage';
import SettingsPage from './SettingsPage';
import {usePage} from './PageContext';
function PageContent(){const {page}=usePage();
 switch(page){
 case 'dashboard':return <DashboardPage/>;
 case 'shops':return <ShopsPage/>;
 case 'tenants':case 'partners':return <TenantsPartnersPage/>;
 case 'contracts':return <ContractsPage/>;
 case 'charges':return <ChargesPage/>;
 case 'expenses':case 'withdrawals':return <ExpensesWithdrawalsPage/>;
 case 'accounts':return <AccountsPage/>;
 case 'distributions':return <DistributionsPage/>;
 case 'reports':return <ReportsPage/>;
 case 'settings':return <SettingsPage/>;
 default:return null;
 }
}

export default function PageRouter(){return <><Guidance/><ModuleStats/><PageContent/></>}
