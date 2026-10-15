import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
if(!process.env.DATABASE_URL) throw Error('DATABASE_URL required');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
try { for (const name of ['001_schema.sql','002_central_admin.sql','003_central_devices.sql','004_central_access.sql','005_central_billing.sql']) await pool.query(await readFile(new URL('../sql/'+name,import.meta.url),'utf8')); console.log('Database schema ready'); } finally {await pool.end()}
