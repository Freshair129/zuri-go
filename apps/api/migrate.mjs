import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import pg from 'pg';
import {config} from './config.mjs';
// Pure target guards (covered by test/operator-guards.test.mjs). Without --cloud the target must be a local host; they never return or print a URL.
const LOCAL=['localhost','127.0.0.1','::1'];
const hostOf=url=>{try{return new URL(url).hostname.replace(/^\[|\]$/g,'').toLowerCase();}catch{return null;}};
// Hosts the local config names count as local only when they are a Docker-style single-label name (no dot) or a built-in local host.
export const localConfigHosts=local=>[local?.adminUrl,local?.databaseUrl].map(hostOf).filter(h=>h&&!h.includes('.'));
export const localTargetProblem=(url,allowed=[])=>{const h=hostOf(url);return !h?'The migration target is not a valid connection URL.':LOCAL.includes(h)||allowed.includes(h)?null:'Refusing to migrate: the target host is not a local host. Production needs --cloud (npm run db:migrate -- --cloud).';};
export const cloudTarget=url=>{const h=hostOf(url);if(!h)throw Error('.local/cloud-config.json adminUrl is not a valid connection URL.');return {domain:h.split('.').slice(-2).join('.'),database:decodeURIComponent(new URL(url).pathname.replace(/^\//,''))};};
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
const cloud=process.argv.slice(2).includes('--cloud');
let adminUrl;
if(cloud){adminUrl=JSON.parse(await readFile(new URL('../../.local/cloud-config.json',import.meta.url),'utf8')).adminUrl;if(!adminUrl)throw Error('Set adminUrl in .local/cloud-config.json before migrating with --cloud.');const t=cloudTarget(adminUrl);console.log('Migrating PRODUCTION: host *.'+t.domain+', database '+t.database);}
else{adminUrl=config().adminUrl;if(!adminUrl)throw Error('Set ZURI_GO_ADMIN_URL or .local/config.json before migrating.');
 let local;try{local=JSON.parse(await readFile(new URL('../../.local/config.json',import.meta.url),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const problem=localTargetProblem(adminUrl,localConfigHosts(local));if(problem){console.error(problem);process.exit(1);}}
const client=new pg.Client({connectionString:adminUrl});await client.connect();
try{
 await client.query('SELECT pg_advisory_lock(973091)');
 await client.query('CREATE TABLE IF NOT EXISTS public.zuri_go_migrations(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
 for(const [version,file] of [[1,'001_core.sql'],[2,'002_compatibility.sql'],[3,'003_team_access.sql'],[4,'004_task_attachments.sql'],[5,'005_member_identity.sql'],[6,'006_visibility.sql'],[7,'007_tasks_projects.sql'],[8,'008_visual_marketing.sql'],[9,'009_visual_public_output_immutability.sql'],[10,'010_visual_approval_boundary.sql'],[11,'011_marketing_report_ledger.sql'],[12,'012_marketing_report_delivery.sql']]){
   if((await client.query('SELECT 1 FROM public.zuri_go_migrations WHERE version=$1',[version])).rowCount)continue;
   await client.query('BEGIN');try{const sql=(await readFile(new URL('migrations/'+file,import.meta.url),'utf8')).replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'');await client.query(sql);await client.query('INSERT INTO public.zuri_go_migrations(version) VALUES($1)',[version]);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}
 }
 // Keep intermediate broad grants invisible; interruption must preserve the prior restrictive ACL.
 await client.query('BEGIN');try{
 await client.query('GRANT USAGE ON SCHEMA zuri_go TO zuri_go_app');
 await client.query('GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA zuri_go TO zuri_go_app');
 await client.query('GRANT DELETE ON zuri_go.campaign_channels,zuri_go.goal_series,zuri_go.task_roles,zuri_go.weekly_plan_tasks,zuri_go.team_members,zuri_go.task_viewers,zuri_go.meeting_participants,zuri_go.project_viewers TO zuri_go_app');
 await client.query('REVOKE INSERT,UPDATE ON zuri_go.metric_definitions FROM zuri_go_app');
 await client.query('REVOKE UPDATE ON zuri_go.change_events,zuri_go.ai_briefs,zuri_go.meeting_task_links FROM zuri_go_app');
 await client.query('REVOKE INSERT,UPDATE,DELETE ON zuri_go.member_credentials FROM zuri_go_app');
 await client.query('REVOKE UPDATE,DELETE ON zuri_go.visual_brand_profiles,zuri_go.visual_briefs,zuri_go.visual_artifacts,zuri_go.visual_provider_runs,zuri_go.visual_reviews,zuri_go.visual_decisions,zuri_go.visual_assets,zuri_go.visual_receipts FROM zuri_go_app');
 await client.query('REVOKE UPDATE ON zuri_go.visual_public_outputs FROM zuri_go_app');
 await client.query('REVOKE UPDATE (business_id,project_id,artifact_id,decision_id,payload,active,created_at) ON zuri_go.visual_public_outputs FROM zuri_go_app');
 await client.query('REVOKE INSERT ON zuri_go.visual_reviews,zuri_go.visual_decisions,zuri_go.visual_public_outputs FROM zuri_go_app');
 await client.query('GRANT UPDATE(active) ON zuri_go.visual_public_outputs TO zuri_go_app');
 await client.query('REVOKE INSERT,UPDATE,DELETE ON zuri_go.marketing_report_associations,zuri_go.marketing_report_preparations,zuri_go.marketing_reports,zuri_go.marketing_report_outbox,zuri_go.marketing_report_deliveries,zuri_go.marketing_report_delivery_attempts,zuri_go.marketing_report_delivery_receipts FROM PUBLIC,zuri_go_app');
 await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}
 console.log('Zuri-Go schema 12 applied; runtime role grants configured.');
}finally{await client.end();}
}
