import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {config} from './config.mjs';
const cfg=config();if(!cfg.adminUrl)throw Error('Set ZURI_GO_ADMIN_URL or .local/config.json before migrating.');
const client=new pg.Client({connectionString:cfg.adminUrl});await client.connect();
try{
 await client.query('SELECT pg_advisory_lock(973091)');
 await client.query('CREATE TABLE IF NOT EXISTS public.zuri_go_migrations(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
 for(const [version,file] of [[1,'001_core.sql'],[2,'002_compatibility.sql'],[3,'003_team_access.sql'],[4,'004_task_attachments.sql'],[5,'005_member_identity.sql']]){
   if((await client.query('SELECT 1 FROM public.zuri_go_migrations WHERE version=$1',[version])).rowCount)continue;
   await client.query('BEGIN');try{const sql=(await readFile(new URL('migrations/'+file,import.meta.url),'utf8')).replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'');await client.query(sql);await client.query('INSERT INTO public.zuri_go_migrations(version) VALUES($1)',[version]);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}
 }
 await client.query('GRANT USAGE ON SCHEMA zuri_go TO zuri_go_app');
 await client.query('GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA zuri_go TO zuri_go_app');
 await client.query('GRANT DELETE ON zuri_go.campaign_channels,zuri_go.goal_series,zuri_go.task_roles,zuri_go.weekly_plan_tasks TO zuri_go_app');
 await client.query('REVOKE INSERT,UPDATE ON zuri_go.metric_definitions FROM zuri_go_app');
 await client.query('REVOKE UPDATE ON zuri_go.change_events,zuri_go.ai_briefs,zuri_go.meeting_task_links FROM zuri_go_app');
 await client.query('REVOKE INSERT,UPDATE,DELETE ON zuri_go.member_credentials FROM zuri_go_app');
 console.log('Zuri-Go schema 5 applied; runtime role grants configured.');
}finally{await client.end();}
