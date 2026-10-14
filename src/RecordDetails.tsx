import React from 'react';

type Row = Record<string,any>;
type Language = 'fa'|'ps'|'en';
const columns:Record<string,string[]> = {
 shops:['number','floor','block','area','location','rent','status','electricity_meter','water_meter','features','notes'],
 tenants:['name','father_name','phone','email','identity_no','address','emergency_phone','occupation','notes'],
 contracts:['contract_number','shop_id','tenant_id','start_date','end_date','monthly_rent','deposit','payment_day','document_status','status','signed_at','terminated_at','termination_date','termination_reason','cancelled_at','cancellation_date','cancellation_reason','terms','notes'],
 receipts:['receipt_number','tenant_id','shop_id','contract_id','period','amount','receipt_date','account_id','payment_method','reference','notes','voided_at','void_reason'],
 charges:['tenant_id','shop_id','contract_id','period','amount','paid','due','account_id','receipt_date','notes'],
 expenses:['category','description','amount','entry_date','account_id','reference','notes','voided_at','void_reason'],
 partners:['name','father_name','phone','identity_no','address','share','capital','joining_date','notes'],
 withdrawals:['partner_id','kind','amount','entry_date','account_id','period','reference','notes','voided_at','void_reason'],
 accounts:['name','type','opening_balance','account_number','bank_name','notes'],
 transfers:['from_account','to_account','amount','entry_date','reference','notes'],
 distributions:['period','partner_id','share_snapshot','partner_amount','amount','status','approved_at','notes'],
 users:['name','email','role','active','created_at'],
 employees:['name','father_name','phone','job_title','position','salary','monthly_salary','joining_date','start_date','status','address','notes'],
 employee_fines:['employee_id','period','amount','entry_date','reason','notes'],
 employee_payments:['employee_id','period','amount','payment_date','account_id','notes'],
 recycleBin:['entity','record_id','deleted_at','deleted_by','reason']
};
const labels:Record<Language,Record<string,string>> = {
 fa:{category:'نوع مصرف',description:'تشریحات',amount:'مبلغ',entry_date:'تاریخ ثبت',account_id:'حساب پرداخت',reference:'شماره مرجع',voided_at:'تاریخ ابطال',void_reason:'دلیل ابطال',shop_id:'دوکان',tenant_id:'مستأجر',contract_id:'قرارداد',partner_id:'شریک',period:'ماه',paid:'پرداخت‌شده',due:'باقی‌مانده',kind:'نوع برداشت',share:'فیصدی سهم',capital:'سرمایه',share_snapshot:'فیصدی سهم',partner_amount:'سهم مفاد',monthly_salary:'معاش ماهانه',salary:'معاش',job_title:'وظیفه',position:'وظیفه',employee_id:'کارمند',payment_date:'تاریخ پرداخت',reason:'دلیل',document_status:'وضعیت سند',signed_at:'تاریخ امضا',terminated_at:'تاریخ فسخ',termination_date:'تاریخ فسخ',termination_reason:'دلیل فسخ',cancelled_at:'تاریخ لغو',cancellation_date:'تاریخ لغو',cancellation_reason:'دلیل لغو',notes:'یادداشت',account_number:'شماره حساب',bank_name:'نام بانک',opening_balance:'موجودی ابتدایی',status:'وضعیت',receipt_number:'شماره رسید',receipt_date:'تاریخ دریافت',from_account:'از حساب',to_account:'به حساب'},
 ps:{category:'د لګښت ډول',description:'تشریح',amount:'اندازه',entry_date:'د ثبت نېټه',account_id:'د ورکړې حساب',reference:'د حوالې شمېره',voided_at:'د باطلېدو نېټه',void_reason:'د باطلېدو دلیل',shop_id:'دوکان',tenant_id:'کرایه کوونکی',contract_id:'قرارداد',partner_id:'شریک',period:'میاشت',paid:'ورکړل شوې',due:'پاتې',kind:'د ایستلو ډول',share:'د ونډې سلنه',capital:'پانګه',share_snapshot:'د ونډې سلنه',partner_amount:'د ګټې ونډه',monthly_salary:'میاشتنی معاش',salary:'معاش',job_title:'دنده',position:'دنده',employee_id:'کارکوونکی',payment_date:'د ورکړې نېټه',reason:'دلیل',document_status:'د سند حالت',signed_at:'د لاسلیک نېټه',terminated_at:'د فسخ نېټه',termination_date:'د فسخ نېټه',termination_reason:'د فسخ دلیل',cancelled_at:'د لغوه کېدو نېټه',cancellation_date:'د لغوه کېدو نېټه',cancellation_reason:'د لغوه کېدو دلیل',notes:'یادښت',account_number:'د حساب شمېره',bank_name:'د بانک نوم',opening_balance:'لومړنۍ موجودي',status:'حالت',receipt_number:'د رسید شمېره',receipt_date:'د ترلاسه کولو نېټه',from_account:'له حسابه',to_account:'حساب ته'},
 en:{category:'Expense type',description:'Description',amount:'Amount',entry_date:'Entry date',account_id:'Payment account',reference:'Reference',voided_at:'Voided on',void_reason:'Void reason',shop_id:'Shop',tenant_id:'Tenant',contract_id:'Contract',partner_id:'Partner',period:'Month',paid:'Paid',due:'Remaining',kind:'Withdrawal type',share:'Share percentage',capital:'Capital',share_snapshot:'Share percentage',partner_amount:'Profit share',monthly_salary:'Monthly salary',salary:'Salary',job_title:'Job title',position:'Position',employee_id:'Employee',payment_date:'Payment date',reason:'Reason',document_status:'Document status',signed_at:'Signed on',terminated_at:'Terminated on',termination_date:'Termination date',termination_reason:'Termination reason',cancelled_at:'Cancelled on',cancellation_date:'Cancellation date',cancellation_reason:'Cancellation reason',notes:'Notes',account_number:'Account number',bank_name:'Bank name',opening_balance:'Opening balance',status:'Status',receipt_number:'Receipt number',receipt_date:'Receipt date',from_account:'From account',to_account:'To account'}
};
const foreignKeys:Record<string,string>={shop_id:'shops',tenant_id:'tenants',partner_id:'partners',account_id:'accounts',employee_id:'employees',contract_id:'contracts',from_account:'accounts',to_account:'accounts'};
const omitted=new Set(['id','password','password_hash','password_salt','passwordConfirm','token','permissions','session','deleted','internal_id']);
export default function RecordDetails({section,row,data,lang,t,readable}:{section:string;row:Row;data:Record<string,Row[]>;lang:Language;t:(key:string)=>string;readable:(key:string,value:any)=>string}){
 const keys=(columns[section]||Object.keys(row).filter(k=>!omitted.has(k)&&!k.endsWith('_hash'))).filter(k=>Object.prototype.hasOwnProperty.call(row,k)&&row[k]!==null&&row[k]!==undefined&&row[k]!=='');
 const value=(key:string)=>{
  const ref=foreignKeys[key];
  if(ref){const record=(data[ref]||[]).find(r=>String(r.id)===String(row[key]));if(record)return String(record.name||record.number||record.contract_number||row[key]);}
  if(typeof row[key]==='boolean')return row[key]?(lang==='en'?'Yes':lang==='ps'?'هو':'بلی'):(lang==='en'?'No':lang==='ps'?'نه':'نخیر');
  if(typeof row[key]==='object')return '—';
  return readable(key,row[key])||'—';
 };
 return <div className="record-profile-fields">{keys.map(key=><div key={key} className="profile-field"><span>{labels[lang][key]||t(key)}</span><strong>{value(key)}</strong></div>)}{keys.length===0&&<p className="hint">{lang==='en'?'No details available':lang==='ps'?'معلومات نشته':'معلوماتی ثبت نشده است.'}</p>}</div>;
}
