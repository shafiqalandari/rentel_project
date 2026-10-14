import React from 'react';

// Local SVG icons prevent missing named exports from older lucide-react versions.
const paths: Record<string, React.ReactNode> = {
 dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
 shops: <><path d="M3 10h18l-2-6H5l-2 6ZM5 10v10h14V10M9 20v-7h6v7"/><path d="M3 10c0 3 4 3 4 0 0 3 4 3 4 0 0 3 4 3 4 0 0 3 4 3 4 0"/></>,
 tenants: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1"/></>,
 contracts: <><path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v6h6M8 12h8M8 16h8"/></>,
 charges: <><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M2 10h20M6 15h5"/></>,
 expenses: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3ZM9 8h6M9 12h6M9 16h3"/></>,
 partners: <><circle cx="8" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><path d="M2 20v-3a6 6 0 0 1 12 0v3M13 14a6 6 0 0 1 9 5v1"/></>,
 withdrawals: <><path d="M12 3v12M7 10l5 5 5-5M4 17v4h16v-4"/></>,
 accounts: <><path d="m2 9 10-6 10 6M4 10h16M6 10v9M11 10v9M16 10v9M3 21h18"/></>,
 distributions: <><circle cx="12" cy="12" r="9"/><path d="M12 3v9h9M12 12l-6 7"/></>,
 reports: <><path d="M4 21V3M4 21h17M8 17v-5M13 17V8M18 17V5"/></>,
 employees: <><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 3h4M19 1v4M17 13h4M17 17h4"/></>,
 recycleBin: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/></>,
 settings: <><circle cx="12" cy="12" r="3"/><path d="M10 2h4l.7 3 2 .9 2.6-1.4 2.5 3-1.8 2.3.2 2.4 2 2-2 3.5-2.8-1-2 1.1-.7 3.2h-4l-.7-3.2-2-1.1-2.8 1-2-3.5 2-2-.2-2.4L3.2 7.5l2.5-3 2.6 1.4 2-.9L10 2Z"/></>
};
export function SidebarIcon({name}:{name:string}) {
 return <svg className="sidebar-nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.contracts}</svg>;
}
