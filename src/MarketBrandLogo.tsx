import React,{useEffect,useState} from 'react';
import {loadPrintPrefs,printPreferencesEvent} from './print-service';
export default function MarketBrandLogo(){
 const [logo,setLogo]=useState(()=>loadPrintPrefs().logo||'');
 useEffect(()=>{const update=()=>setLogo(loadPrintPrefs().logo||'');window.addEventListener(printPreferencesEvent,update);window.addEventListener('storage',update);return()=>{window.removeEventListener(printPreferencesEvent,update);window.removeEventListener('storage',update)}},[]);
 return logo?<img className="market-sidebar-logo" src={logo} alt="Market logo"/>:<span className="market-sidebar-logo-placeholder" aria-hidden="true">▦</span>;
}
