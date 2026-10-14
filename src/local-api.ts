/* Offline single-browser storage adapter. No database or network required. */
type Row=Record<string,any>;
type DB=Record<string,any>;
const STORAGE='market_rental_offline_v1';
const LOGIN_SESSION_KEY='market_auth_session_v3';
const TOKEN_PREFIX='market-v3-';
function hasValidSession(){const token=sessionStorage.getItem(LOGIN_SESSION_KEY)||'';return token.startsWith(TOKEN_PREFIX)&&token.length>24&&sessionStorage.getItem('market_token')===token}
// Local demo-only credentials. Not suitable for protecting sensitive data.
const DEFAULT_ADMIN_EMAIL='admin@gmail.com';
const DEFAULT_ADMIN_PASSWORD='mynameisadmin';
const collections=['shops','tenants','contracts','receipts','expenses','partners','withdrawals','accounts','distributions','transfers','users','audit','employees','employeeTransactions'];
const iso=()=>new Date().toISOString();
const date=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const num=(v:any)=>Number(v||0);
const err=(message:string):never=>{throw Error(message)};
const period=(dateString:string)=>String(dateString||'').slice(0,7);
function initial():DB{return {settings:{name:'My Market',currency:'AFN'},shops:[],tenants:[],contracts:[],receipts:[],expenses:[],partners:[],withdrawals:[],accounts:[{id:1,name:'Cash',type:'cash',opening_balance:0}],distributions:[],transfers:[],employees:[],employeeTransactions:[],users:[{id:1,name:'Local Admin',email:DEFAULT_ADMIN_EMAIL,role:'admin',active:true}],recycleBin:[],audit:[],seq:2}}
function load():DB{try{let value=localStorage.getItem(STORAGE);let db=value?{...initial(),...JSON.parse(value)}:initial();db.recycleBin ||= [];return db}catch{return initial()}}
function persist(db:DB){try{localStorage.setItem(STORAGE,JSON.stringify(db))}catch{err('Local browser storage is full or blocked. Export a backup and free storage.')}}
function ensureId(db:DB){return db.seq++}
function audit(db:DB,action:string,entity:string,id:any){db.audit.unshift({id:ensureId(db),action,entity,entity_id:id,created_at:iso()})}
function name(db:DB,key:string,id:any,field='name'){return db[key].find((x:Row)=>String(x.id)===String(id))?.[field]||''}
function active(db:DB,key:string){return db[key].filter((r:Row)=>!r.voided_at)}
function balance(db:DB,id:any){const a=db.accounts.find((r:Row)=>String(r.id)===String(id));if(!a)return 0;let n=num(a.opening_balance);for(let r of active(db,'receipts'))if(String(r.account_id)===String(id))n+=num(r.amount);for(let r of active(db,'expenses'))if(String(r.account_id)===String(id))n-=num(r.amount);for(let r of active(db,'withdrawals'))if(String(r.account_id)===String(id))n-=num(r.amount);for(let r of active(db,'employeeTransactions'))if(r.kind==='payment'&&String(r.account_id)===String(id))n-=num(r.amount);for(let r of db.transfers){if(String(r.from_account)===String(id))n-=num(r.amount);if(String(r.to_account)===String(id))n+=num(r.amount)}return Number(n.toFixed(2))}
// Monthly accruals are virtual and deterministic: opening this page never duplicates a charge.
// Payments belong to the tenant's overall balance, and are applied oldest-first unless
// an explicit rent month (period) was selected. Any excess remains a prepayment credit.
function rentLedger(db:DB, tenantId?:any){
 const todayMonth=date().slice(0,7);
 const dueRows:Row[]=[];
 for(const c of db.contracts){
  if(c.status==='closed'||c.status==='cancelled')continue;
  if(tenantId!=null&&String(c.tenant_id)!==String(tenantId))continue;
  const start=String(c.start_date||'').slice(0,7), finish=String(c.end_date||'').slice(0,7);
  if(!/^\d{4}-\d{2}$/.test(start)||!/^\d{4}-\d{2}$/.test(finish))continue;
  let [year,month]=start.split('-').map(Number);
  const limit=finish<todayMonth?finish:todayMonth;
  for(let count=0;count<600;count++){
   const monthKey=`${year}-${String(month).padStart(2,'0')}`;
   if(monthKey>limit)break;
   dueRows.push({id:`${c.id}-${monthKey}`,contract_id:c.id,tenant_id:c.tenant_id,
     tenant:name(db,'tenants',c.tenant_id),shop:name(db,'shops',c.shop_id,'number'),
     period:monthKey,amount:num(c.monthly_rent),paid:0,due:num(c.monthly_rent)});
   month++;if(month>12){month=1;year++}
  }
 }
 dueRows.sort((a,b)=>String(a.period).localeCompare(String(b.period))||String(a.id).localeCompare(String(b.id)));
 const credits:Record<string,number>={};const allocations:Row[]=[];
 const payments=active(db,'receipts').filter((r:Row)=>tenantId==null||String(r.tenant_id)===String(tenantId))
  .slice().sort((a:Row,b:Row)=>String(a.receipt_date||'').localeCompare(String(b.receipt_date||''))||num(a.id)-num(b.id));
 for(const payment of payments){
  const tid=String(payment.tenant_id), target=String(payment.period||'').slice(0,7);
  let left=num(payment.amount);
  const candidates=dueRows.filter(r=>String(r.tenant_id)===tid&&(!target||r.period===target));
  for(const r of candidates){if(left<=0)break;const applied=Math.min(left,r.due);
   if(applied<=0)continue;r.paid=Number((r.paid+applied).toFixed(2));r.due=Number((r.due-applied).toFixed(2));left=Number((left-applied).toFixed(2));
   allocations.push({receipt_id:payment.id,tenant_id:payment.tenant_id,charge_id:r.id,period:r.period,amount:applied});
  }
  // If the user specifies a future month, the amount stays in credit until its charge is due.
  if(left>0)credits[tid]=Number(((credits[tid]||0)+left).toFixed(2));
 }
 // Apply unassigned credits against outstanding debt only when there is no target month.
 // Targeted future payments stay reserved for their stated month; avoid silently moving them.
 return {charges:dueRows,credits,allocations};
}
function charges(db:DB){return rentLedger(db).charges}
function tenantStatements(db:DB){const ledger=rentLedger(db);return db.tenants.map((tenant:Row)=>{
 const rs=ledger.charges.filter((r:Row)=>String(r.tenant_id)===String(tenant.id));
 const receiptRows=active(db,'receipts').filter((r:Row)=>String(r.tenant_id)===String(tenant.id));
 const billed=rs.reduce((n:number,r:Row)=>n+num(r.amount),0);
 const received=receiptRows.reduce((n:number,r:Row)=>n+num(r.amount),0);
 return {id:tenant.id,tenant_id:tenant.id,name:tenant.name,phone:tenant.phone,billed,received,
  due:rs.reduce((n:number,r:Row)=>n+num(r.due),0),credit:ledger.credits[String(tenant.id)]||0,
  contracts:db.contracts.filter((c:Row)=>String(c.tenant_id)===String(tenant.id)).length};
})}
/** The status is derived from contracts instead of trusting an old shop.status value. */
function contractState(contract:Row, todayISO=date()):string{
  if(contract.status==='closed'||contract.status==='cancelled')return 'closed';
  if(String(contract.end_date||'')<todayISO)return 'closed';
  if(String(contract.start_date||'')>todayISO)return 'upcoming';
  return 'active';
}
function shopState(db:DB,shop:Row,todayISO=date()):string{
  const related=db.contracts.filter((c:Row)=>String(c.shop_id)===String(shop.id));
  if(related.some((c:Row)=>contractState(c,todayISO)==='active'))return 'occupied';
  if(related.some((c:Row)=>contractState(c,todayISO)==='upcoming'))return 'reserved';
  return ['maintenance','closed'].includes(String(shop.status))?String(shop.status):'vacant';
}
function enriched(db:DB,key:string):Row[]{if(key==='charges')return charges(db);return (db[key]||[]).map((r:Row)=>{let x={...r};if(key==='shops')x.status=shopState(db,r);if(key==='contracts')x.status=contractState(r);if(r.tenant_id)x.tenant=name(db,'tenants',r.tenant_id);if(r.partner_id)x.partner=name(db,'partners',r.partner_id);if(r.account_id)x.account=name(db,'accounts',r.account_id);if(key==='distributions' && !r.partner_id)return x;return x})}
function dashboard(db:DB){const sum=(key:string)=>active(db,key).reduce((v:number,r:Row)=>v+num(r.amount),0);const bals=db.accounts.map((a:Row)=>({...a,balance:balance(db,a.id)}));return {revenue:sum('receipts'),expenses:sum('expenses')+active(db,'employeeTransactions').filter((x:Row)=>x.kind==='payment').reduce((n:number,x:Row)=>n+num(x.amount),0),debt:charges(db).reduce((n,r)=>n+num(r.due),0),withdrawals:sum('withdrawals'),cash:bals.filter((a:Row)=>a.type==='cash').reduce((n:number,a:Row)=>n+a.balance,0),bank:bals.filter((a:Row)=>a.type==='bank').reduce((n:number,a:Row)=>n+a.balance,0)}}
function validate(db:DB,key:string,body:Row,old?:Row){if(['receipts','expenses','withdrawals','transfers'].includes(key)){if(!Number.isFinite(num(body.amount))||num(body.amount)<=0)err('Amount must be greater than zero.');if(!db.accounts.some((a:Row)=>String(a.id)===String(body.account_id||body.from_account)))err('Select a valid account.')}if(key==='shops'&&db.shops.some((r:Row)=>r.number===body.number&&r.id!==old?.id))err('Shop number already exists.');if(key==='contracts'){if(!db.shops.some((a:Row)=>String(a.id)===String(body.shop_id)))err('Select a shop.');if(!db.tenants.some((a:Row)=>String(a.id)===String(body.tenant_id)))err('Select a tenant.');if(!body.start_date||!body.end_date||body.end_date<=body.start_date)err('End date must be after start date.');if(db.contracts.some((r:Row)=>r.id!==old?.id&&r.status!=='closed'&&r.status!=='cancelled'&&String(r.shop_id)===String(body.shop_id)&&r.start_date<=body.end_date&&r.end_date>=body.start_date))err('This shop already has an overlapping contract.')}if(key==='employees'){if(!String(body.name||'').trim())err('Employee name required');if(!Number.isFinite(Number(body.salary))||num(body.salary)<0)err('Invalid monthly salary');if(body.start_date&&body.end_date&&body.end_date<body.start_date)err('End date precedes start date')}if(key==='partners'){const total=db.partners.filter((r:Row)=>r.id!==old?.id).reduce((a:number,r:Row)=>a+num(r.share),0)+num(body.share);if(!Number.isFinite(Number(body.share))||Number(body.share)<=0||total>100.00001)err('Total partner shares must not exceed 100%, and each share must be greater than zero.')}if(key==='withdrawals'||key==='expenses'||key==='transfers'){if(key==='transfers'&&String(body.from_account)===String(body.to_account))err('Transfer requires different accounts.');if(balance(db,body.account_id||body.from_account)<num(body.amount))err('Insufficient account balance.')}if(key==='receipts'){if(body.period&&!/^\d{4}-\d{2}$/.test(String(body.period)))err('Invalid rent month.');let tenant=db.tenants.some((x:Row)=>String(x.id)===String(body.tenant_id));if(!tenant)err('Select a valid tenant.');if(!db.contracts.some((c:Row)=>String(c.tenant_id)===String(body.tenant_id)))err('Tenant must have a rental contract.')}}
const modules=['dashboard','shops','tenants','contracts','charges','receipts','expenses','partners','withdrawals','accounts','transfers','distributions','reports','settings','recycleBin','employees'];
const perms=['read','create','update','delete','print'];
const roleDefaults:Record<string,string[]>={admin:perms,manager:['read','create','update','print'],accountant:['read','create','print'],viewer:['read']};
function allowed(user:Row,mod:string,op:string){if(user.role==='admin')return true;let custom=user.permissions?.[mod];if(custom)return !!custom[op];return (roleDefaults[user.role]||[]).includes(op)}
async function hashPassword(password:string,salt:string){const bytes=new TextEncoder().encode(salt+':'+password);const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('')}
function userSafe(user:Row){let {password,password_hash,password_salt,...safe}=user;return safe}
function requireAdmin(db:DB){const uid=sessionStorage.getItem('market_auth_user_id');const user=db.users.find((u:Row)=>String(u.id)===uid);if(!user||user.role!=='admin')err('Administrator access required.');return user}
export async function localApi(path:string,opts:RequestInit={}){let db=load(),method=(opts.method||'GET').toUpperCase(),body:Row=opts.body?JSON.parse(String(opts.body)):{};if(path==='login'){
 const account=db.users.find((u:Row)=>String(u.email||'').toLowerCase()===String(body.email||'').trim().toLowerCase()&&u.active!==false);
 if(!account)err('Invalid email or password.');
 let valid=false;
 if(account.password_hash&&account.password_salt)valid=(await hashPassword(String(body.password||''),account.password_salt))===account.password_hash;
 else if(account.id===1)valid=body.password===DEFAULT_ADMIN_PASSWORD;
 if(!valid)err('Invalid email or password.');
 const token=TOKEN_PREFIX+crypto.randomUUID();sessionStorage.setItem(LOGIN_SESSION_KEY,token);sessionStorage.setItem('market_token',token);sessionStorage.setItem('market_auth_user_id',String(account.id));return {token,user:userSafe(account)};
 }
 if(path==='logout'){sessionStorage.removeItem('market_token');sessionStorage.removeItem(LOGIN_SESSION_KEY);sessionStorage.removeItem('market_auth_user_id');return {ok:true}}
 if(path==='me'){if(!hasValidSession())err('Please sign in first.');const current=db.users.find((u:Row)=>String(u.id)===sessionStorage.getItem('market_auth_user_id')&&u.active!==false);if(!current)err('Account unavailable.');return userSafe(current)}
 if(!hasValidSession())err('Please sign in first.');
 const currentUser=db.users.find((u:Row)=>String(u.id)===sessionStorage.getItem('market_auth_user_id')&&u.active!==false);
 if(!currentUser)err('Account unavailable.');
 if(path==='recycleBin') {if(!allowed(currentUser,'recycleBin','read'))err('Access denied');return db.recycleBin}
 if(path.startsWith('recycleBin/')){
 if(currentUser.role!=='admin')err('Only administrator can restore or permanently remove records.');
 const [,action,itemId]=path.split('/');const idx=db.recycleBin.findIndex((x:Row)=>String(x.recycle_id)===itemId);if(idx<0)err('Item not found in recycle bin');const item=db.recycleBin[idx];
 if(action==='restore'){
 if(item.voided){let original=db[item.collection].find((r:Row)=>String(r.id)===String(item.record.id));if(!original)err('Financial record not found');if(!original.voided_at)err('Transaction already active');if(['expenses','withdrawals'].includes(item.collection)&&balance(db,original.account_id)+0.000001<num(original.amount))err('Cannot restore: account balance would become negative.');delete original.voided_at;delete original.void_reason;db.recycleBin.splice(idx,1);audit(db,'reverse_void',item.collection,original.id);persist(db);return {ok:true}}
 if(db[item.collection].some((r:Row)=>String(r.id)===String(item.record.id)))err('A record with this ID already exists.');
 // Deletion is blocked for linked master records, so restoring the same ID is safe.
 db[item.collection].push(item.record);db.recycleBin.splice(idx,1);audit(db,'restore',item.collection,item.record.id);persist(db);return {ok:true};}
 if(action==='purge'){if(item.voided)err('Financial audit entries must be preserved; cancelled transactions cannot be erased permanently.');db.recycleBin.splice(idx,1);audit(db,'purge',item.collection,item.record.id);persist(db);return {ok:true}}
 err('Unknown recycle bin action')}
if(path==='backup/clear'){requireAdmin(db);if(method!=='POST'||body.confirm!=='DELETE ALL')err('Confirmation required');const clean=initial();const actor=db.users.find((u:Row)=>String(u.id)===sessionStorage.getItem('market_auth_user_id'));if(actor&&actor.role==='admin'&&actor.id!==1){clean.users=[{...actor}];clean.seq=Math.max(clean.seq,num(actor.id)+1)}audit(clean,'clear_all_data','system',0);persist(clean);return {ok:true}};if(path==='backup/export'){requireAdmin(db);return {version:1,exported_at:iso(),data:db}};if(path==='backup/import'){requireAdmin(db);if(!body?.data||!Array.isArray(body.data.shops)||!Array.isArray(body.data.accounts)||!Array.isArray(body.data.users))err('Invalid backup file');persist(body.data);return {ok:true}}if(path==='employeeTransactions' && method==='POST'){
 if(!allowed(currentUser,'employees','create'))err('Access denied');
 const employee=db.employees.find((r:Row)=>String(r.id)===String(body.employee_id));if(!employee)err('Employee not found');
 if(!['fine','payment'].includes(body.kind))err('Invalid transaction type');
 if(!Number.isFinite(Number(body.amount))||num(body.amount)<=0)err('Amount must be positive');
 if(!/^\d{4}-\d{2}$/.test(String(body.period||'')))err('Select valid salary month');
 if(body.kind==='payment'){
  if(!db.accounts.some((a:Row)=>String(a.id)===String(body.account_id)))err('Account not found');
  if(balance(db,body.account_id)<num(body.amount))err('Insufficient account balance');
  const monthFine=active(db,'employeeTransactions').filter((x:Row)=>String(x.employee_id)===String(employee.id)&&x.period===body.period&&x.kind==='fine').reduce((n:number,x:Row)=>n+num(x.amount),0);
  const monthPaid=active(db,'employeeTransactions').filter((x:Row)=>String(x.employee_id)===String(employee.id)&&x.period===body.period&&x.kind==='payment').reduce((n:number,x:Row)=>n+num(x.amount),0);
  if(num(body.amount)>Math.max(0,num(employee.salary)-monthFine-monthPaid)+0.001)err('Payment exceeds outstanding salary for the month');
 }
 if(body.kind==='fine'){
  const existing=active(db,'employeeTransactions').filter((x:Row)=>String(x.employee_id)===String(employee.id)&&x.period===body.period);
  const alreadyFined=existing.filter((x:Row)=>x.kind==='fine').reduce((n:number,x:Row)=>n+num(x.amount),0);
  const alreadyPaid=existing.filter((x:Row)=>x.kind==='payment').reduce((n:number,x:Row)=>n+num(x.amount),0);
  if(num(body.amount)>Math.max(0,num(employee.salary)-alreadyFined-alreadyPaid)+0.001)err('Fine exceeds remaining salary for this month');
 }
 if(body.entry_date && !/^\d{4}-\d{2}-\d{2}$/.test(String(body.entry_date)))err('Invalid transaction date');
 const row={id:ensureId(db),employee_id:employee.id,kind:body.kind,amount:num(body.amount),period:body.period,entry_date:body.entry_date||date(),account_id:body.kind==='payment'?body.account_id:null,notes:String(body.notes||''),created_at:iso()};
 db.employeeTransactions.push(row);audit(db,'create','employeeTransactions',row.id);persist(db);return row;
}
if(path.startsWith('employeeTransactions/')&&method==='POST'){
 if(!allowed(currentUser,'employees','delete'))err('Access denied');
 const id=path.split('/')[1];const row=db.employeeTransactions.find((x:Row)=>String(x.id)===id);if(!row||row.voided_at)err('Transaction unavailable');
 if(!String(body.reason||'').trim())err('Correction reason required');
 row.voided_at=iso();row.void_reason=String(body.reason);audit(db,'void','employeeTransactions',row.id);persist(db);return row;
}
if(path==='dashboard')return dashboard(db);if(path==='balances')return db.accounts.map((a:Row)=>({...a,balance:balance(db,a.id)}));if(path==='charges')return charges(db);if(path==='tenantStatements')return tenantStatements(db);if(path==='rentAllocations')return rentLedger(db).allocations;if(path==='settings'){if(method==='PUT'){requireAdmin(db);db.settings={...db.settings,...body};audit(db,'update','settings',1);persist(db)}return db.settings}
if(path.startsWith('void/')){const [,key,id]=path.split('/');if(!allowed(currentUser,key,'delete'))err('Access denied');if(!['receipts','expenses','withdrawals'].includes(key))err('Not allowed');let row=db[key].find((r:Row)=>String(r.id)===id);if(!row)err('Not found');if(row.voided_at)err('Already voided');if(!body.reason?.trim())err('Correction reason is required');db.recycleBin.unshift({recycle_id:ensureId(db),collection:key,record:{...row},voided:true,deleted_at:iso(),deleted_by:currentUser.name||currentUser.email});row.voided_at=iso();row.void_reason=body.reason;audit(db,'void',key,id);persist(db);return row}
let [key,id]=path.split('/');if(!collections.includes(key))err('Unknown operation: '+path);if(method==='GET'){if(key==='users'&&currentUser.role!=='admin')err('Access denied');if(key==='audit'&&currentUser.role!=='admin')err('Access denied');if(!allowed(currentUser,key,'read'))err('Access denied');return key==='users'?db.users.map(userSafe):enriched(db,key)}if(method==='DELETE'){if(!allowed(currentUser,key,'delete'))err('Access denied');if(key==='users'&&(id==='1'||String(currentUser.id)===id))err('Cannot delete the administrator or your own account.');if(!['shops','tenants','partners','contracts','accounts','users','employees'].includes(key))err('Only master records can be deleted. Void financial transactions.');const original=db[key].find((r:Row)=>String(r.id)===id);if(!original)err('Record not found');const relation:Record<string,[string,string][]>={shops:[['contracts','shop_id']],tenants:[['contracts','tenant_id'],['receipts','tenant_id']],partners:[['withdrawals','partner_id'],['distributions','partner_id']],contracts:[['receipts','tenant_id']],employees:[['employeeTransactions','employee_id']],accounts:[['receipts','account_id'],['expenses','account_id'],['employeeTransactions','account_id'],['withdrawals','account_id'],['transfers','from_account'],['transfers','to_account']]};for(const [coll,field] of relation[key]||[]){const linked=(key==='contracts'&&coll==='receipts')?(db.receipts||[]).some((r:Row)=>String(r.tenant_id)===String(original.tenant_id)):(db[coll]||[]).some((r:Row)=>String(r[field])===id);if(linked)err('Record is linked to other data. Remove the related records first.')}db.recycleBin.unshift({recycle_id:ensureId(db),collection:key,record:{...original},deleted_at:iso(),deleted_by:currentUser.name||currentUser.email});db[key]=db[key].filter((r:Row)=>String(r.id)!==id);audit(db,'trash',key,id);persist(db);return {ok:true}}if(!['POST','PUT'].includes(method))err('Operation not supported');if(!allowed(currentUser,key,method==='POST'?'create':'update'))err('Access denied');if(key==='users'&&currentUser.role!=='admin')err('Access denied');if(key==='distributions'){if(method!=='POST')err('Cannot change approved distribution');let share=db.partners.reduce((n:number,p:Row)=>n+num(p.share),0);if(Math.abs(share-100)>0.0001)err('Partner share total must equal 100%.');if(db.distributions.some((r:Row)=>r.period===body.period))err('Profit already distributed for this period');if(num(body.amount)<=0)err('Profit must be positive');for(let partner of db.partners){let rec={id:ensureId(db),period:body.period,partner_id:partner.id,partner:name(db,'partners',partner.id),share_snapshot:partner.share,partner_amount:Number((num(body.amount)*num(partner.share)/100).toFixed(2)),amount:body.amount,notes:body.notes||'',created_at:iso()};db.distributions.push(rec)}audit(db,'approve','distributions',body.period);persist(db);return {ok:true}}
let row=method==='PUT'?db[key].find((r:Row)=>String(r.id)===id):undefined;if(method==='PUT'&&!row)err('Record not found');if(['receipts','expenses','withdrawals','transfers'].includes(key)&&method==='PUT')err('Financial records cannot be edited. Void and recreate instead.');validate(db,key,body,row);if(key==='shops'&&body.status==='occupied')body.status='vacant';if(key==='contracts'&&(!body.status||body.status==='vacant'))delete body.status;if(key==='users'){
 const email=String(body.email||'').trim().toLowerCase();if(!email||!body.name)err('Name and email are required.');
 if(db.users.some((u:Row)=>u.email===email&&u.id!==row?.id))err('Email already registered.');
 if(!row&&!body.password)err('Password is required for new user.');
 if(body.password){if(String(body.password).length<8)err('Password must be at least 8 characters.');body.password_salt=crypto.randomUUID();body.password_hash=await hashPassword(String(body.password),body.password_salt)}
 delete body.password;body.email=email;if(!row)body.active=true;
 if(row?.id===1&&(body.role!=='admin'||body.active===false))err('Cannot disable the primary administrator.');
 }
if(row){Object.assign(row,body);audit(db,'update',key,row.id)}else{row={...body,id:ensureId(db),created_at:iso()};db[key].push(row);audit(db,'create',key,row.id)}persist(db);return row}
