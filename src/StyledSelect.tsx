import React, {useEffect, useId, useRef, useState} from 'react';
import './styled-select.css';

type Props={value?:string|number;onChange?:(event:{target:{value:string}})=>void;children?:React.ReactNode;required?:boolean;disabled?:boolean;'aria-label'?:string;className?:string};
export default function StyledSelect({value,onChange,children,required,disabled,className='',...rest}:Props){
 const [open,setOpen]=useState(false);
 const [active,setActive]=useState(0);
 const host=useRef<HTMLDivElement>(null);
 const uid=useId();
 const options=React.Children.toArray(children).filter(React.isValidElement).map(node=>{
  const el=node as React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>>;
  return {value:String(el.props.value??''), label:el.props.children,disabled:!!el.props.disabled};
 });
 const selected=options.findIndex(x=>x.value===String(value??''));
 const chosen=options[selected];
 useEffect(()=>{if(!open)return;const handler=(e:PointerEvent)=>{if(!host.current?.contains(e.target as Node))setOpen(false)};document.addEventListener('pointerdown',handler);return()=>document.removeEventListener('pointerdown',handler)},[open]);
 const choose=(i:number)=>{const option=options[i];if(!option||option.disabled)return;onChange?.({target:{value:option.value}});setOpen(false)};
 const advance=(direction:number)=>{if(!options.length)return;let i=open?active:Math.max(selected,0);for(let j=0;j<options.length;j++){i=(i+direction+options.length)%options.length;if(!options[i].disabled){setActive(i);break}}setOpen(true)};
 return <div ref={host} className={'styled-select '+className}>
  <button type="button" disabled={disabled} className={'styled-select-trigger'+(open?' is-open':'')} aria-label={rest['aria-label']} aria-haspopup="listbox" aria-expanded={open} aria-controls={uid} onClick={()=>{setActive(Math.max(selected,0));setOpen(!open)}} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();advance(1)}else if(e.key==='ArrowUp'){e.preventDefault();advance(-1)}else if(e.key==='Escape'){setOpen(false)}else if(e.key==='Enter'&&open){e.preventDefault();choose(active)}else if(e.key==='Home'){e.preventDefault();setActive(0);setOpen(true)}else if(e.key==='End'){e.preventDefault();setActive(options.length-1);setOpen(true)}}}>
   <span className="styled-select-current">{chosen?.label??options[0]?.label??''}</span><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
  </button>
  {open&&<div role="listbox" id={uid} className="styled-select-menu" aria-label={rest['aria-label']}>
   {options.map((x,i)=><button type="button" role="option" aria-selected={i===selected} className={'styled-select-option'+(i===selected?' is-selected':'')+(i===active?' is-active':'')} key={i} disabled={x.disabled} onMouseEnter={()=>setActive(i)} onClick={()=>choose(i)}>{x.label}{i===selected&&<span className="styled-select-check">✓</span>}</button>)}
  </div>}
  {required&&<input tabIndex={-1} aria-hidden="true" required value={value==null?'':String(value)} onChange={()=>{}} className="styled-select-validation"/>}
 </div>
}
