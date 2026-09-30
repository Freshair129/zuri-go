import pg from 'pg';
import {config} from './config.mjs';
const cfg=config(),admin=new pg.Client({connectionString:cfg.adminUrl});await admin.connect();
try{
 const password=new URL(cfg.databaseUrl).password.replaceAll("'","''");
 if(!(await admin.query("SELECT 1 FROM pg_roles WHERE rolname='zuri_go_app'")).rowCount)await admin.query(`CREATE ROLE zuri_go_app LOGIN PASSWORD '${password}' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE`);
 console.log('Dedicated non-owner runtime role ready.');
}finally{await admin.end();}
