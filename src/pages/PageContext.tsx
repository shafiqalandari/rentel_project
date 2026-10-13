import React,{createContext,useContext} from 'react';
export type Rec=Record<string,any>;
export type Lang='fa'|'ps'|'en';
export interface PageServices {
 page:string; lang:Lang;theme:string;setTheme:(theme:string)=>void;setLang:(lang:Lang)=>void; data:Record<string,Rec[]>;dashboard:Rec;settings:Rec; user:Rec|null;
 search:string; from:string;to:string;selected:string;shopProfileId:number|null;
 canManage:boolean;canWrite:boolean;admin:boolean;
 t:(s:string)=>string; fmt:(x:any)=>string;readable:(k:string,v:any)=>string;
 actions:(k:string,label?:string)=>React.ReactNode;
 table:(rows:Rec[],cols:string[],opts?:{key?:string;editable?:boolean;printable?:boolean;voidable?:boolean})=>React.ReactNode;
 openForm:(k:string,row?:Rec|null)=>void;
 deleteRecord:(k:string,id:number)=>Promise<void>;
 setShopProfileId:React.Dispatch<React.SetStateAction<number|null>>;
 setSelected:React.Dispatch<React.SetStateAction<string>>;
 setFrom:React.Dispatch<React.SetStateAction<string>>;
 setTo:React.Dispatch<React.SetStateAction<string>>;
 setSettings:React.Dispatch<React.SetStateAction<Rec>>;
 setError:React.Dispatch<React.SetStateAction<string>>;
 setPage:React.Dispatch<React.SetStateAction<string>>;
 setSearch:React.Dispatch<React.SetStateAction<string>>;
 refresh:()=>Promise<void>;
 api:(path:string,opts?:RequestInit)=>Promise<any>;
 exportBackup:()=>Promise<void>;
 importBackup:(f:File)=>Promise<void>;
 csvExport:(rows:Rec[],cols:string[])=>void;
}
const C=createContext<PageServices|null>(null);
export const PageProvider=C.Provider;
export function usePage(){const v=useContext(C);if(!v)throw new Error('Missing PageProvider');return v}
