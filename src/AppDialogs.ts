/** Shared accessible application dialogs. No browser alert/confirm/prompt. */
type Kind='confirm'|'prompt'|'notice';
const labels={fa:{title:'تأیید عملیات',warning:'این عملیات نیاز به تأیید شما دارد.',cancel:'انصراف',ok:'تأیید',delete:'حذف',notice:'پیام سیستم',reason:'دلیل را بنویسید'},ps:{title:'د عملیاتو تایید',warning:'مهرباني وکړئ دا عمل تایید کړئ.',cancel:'لغوه',ok:'تایید',delete:'ړنګول',notice:'د سیسټم پیغام',reason:'دلیل ولیکئ'},en:{title:'Confirm action',warning:'Please review this action before proceeding.',cancel:'Cancel',ok:'Confirm',delete:'Delete',notice:'System message',reason:'Enter a reason'}};
const activeLanguage=()=>((document.documentElement.lang in labels?document.documentElement.lang:'fa') as keyof typeof labels);
const show=(kind:Kind,message:string,danger=false):Promise<string|boolean>=>new Promise(resolve=>{
 const lang=activeLanguage(),l=labels[lang],host=document.createElement('div');host.className='market-dialog-backdrop';host.setAttribute('role','presentation');
 const dialog=document.createElement('section');dialog.className='market-dialog-card';dialog.setAttribute('role','alertdialog');dialog.setAttribute('aria-modal','true');dialog.dir=lang==='en'?'ltr':'rtl';
 const mark=document.createElement('div');mark.className='market-dialog-symbol '+(danger?'is-danger':'');mark.textContent=danger?'!':kind==='notice'?'i':'?';
 const title=document.createElement('h2');title.textContent=kind==='notice'?l.notice:l.title;
 const description=document.createElement('p');description.textContent=message;
 const input=kind==='prompt'?document.createElement('textarea'):null;if(input){input.className='market-dialog-input';input.placeholder=l.reason;input.rows=3;input.maxLength=1000;}
 const buttons=document.createElement('div');buttons.className='market-dialog-buttons';const cancel=document.createElement('button');cancel.type='button';cancel.className='market-dialog-cancel';cancel.textContent=l.cancel;const ok=document.createElement('button');ok.type='button';ok.className='market-dialog-confirm '+(danger?'is-danger':'');ok.textContent=danger?l.delete:l.ok;
 const finish=(value:string|boolean)=>{document.removeEventListener('keydown',onKey,true);host.remove();resolve(value)};
 const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();finish(kind==='prompt'?'':false)}else if(e.key==='Tab'){const focusables=[...(kind==='notice'?[]:[cancel]),...(input?[input]:[]),ok];const i=focusables.indexOf(document.activeElement as any);if(e.shiftKey&&i===0){e.preventDefault();focusables[focusables.length-1].focus()}else if(!e.shiftKey&&i===focusables.length-1){e.preventDefault();focusables[0].focus()}}else if(e.key==='Enter'&&!e.shiftKey&&document.activeElement!==input){e.preventDefault();submit()}};
 const submit=()=>{if(input){if(!input.value.trim()){input.focus();return}finish(input.value.trim())}else finish(true)};
 cancel.onclick=()=>finish(kind==='prompt'?'':false);ok.onclick=submit;host.onclick=e=>{if(e.target===host)finish(kind==='prompt'?'':false)};
 dialog.append(mark,title,description);if(input)dialog.append(input);if(kind!=='notice')buttons.append(cancel);buttons.append(ok);dialog.append(buttons);host.append(dialog);document.body.append(host);document.addEventListener('keydown',onKey,true);requestAnimationFrame(()=>{(input||ok).focus()});
});
export async function appConfirm(message:string,options?:{danger?:boolean}){return Boolean(await show('confirm',message,options?.danger??/delete|حذف|پاک|ړنګ|فسخ|لغو|باطل|permanent|forever/i.test(message)))}
export async function appPrompt(message:string){const result=await show('prompt',message);return typeof result==='string'?result:''}
export async function appAlert(message:string){await show('notice',message)}
export function appToast(message:string,kind:'success'|'error'='success'){
 const host=document.createElement('div');host.className='market-inline-toast '+(kind==='error'?'is-danger':'');host.setAttribute('role','status');host.textContent=message;document.body.append(host);setTimeout(()=>host.remove(),4200);
}
