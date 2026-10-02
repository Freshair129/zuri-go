import {execFileSync} from 'node:child_process';
import {existsSync,cpSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,join,dirname,basename} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const vercel='npx --yes vercel@61.1.0',scope='--scope pornpons-projects --cwd ./build/vercel';
const PROMOTABLE=/^https:\/\/zuri-metrics-[a-z0-9-]+-pornpons-projects\.vercel\.app$/;
// Pure helpers (covered by apps/api/test/operator-guards.test.mjs): deploy always stages, promote needs a project deployment URL.
export const deployCommand=()=>`${vercel} deploy --prod --skip-domain --yes ${scope}`;
export const promoteUrlProblem=url=>!url?'npm run promote needs the staged deployment URL: npm run promote -- https://zuri-metrics-<id>-pornpons-projects.vercel.app':!PROMOTABLE.test(url)?'Refusing to promote: the URL must match https://zuri-metrics-*-pornpons-projects.vercel.app (the unique deployment URL printed by npm run deploy).':null;
export const promoteCommand=url=>{const problem=promoteUrlProblem(url);if(problem)throw Error(problem);return `${vercel} promote ${url} --yes ${scope}`;};
export const deploymentUrl=out=>(String(out).match(/https:\/\/[^\s"']+/g)||[]).pop()||null;
export const hostedEmarSource=source=>{
 const begin='{/* BEGIN LOCAL: emar-launcher */}',end='{/* END LOCAL: emar-launcher */}';
 if(source.split(begin).length!==2||source.split(end).length!==2||source.indexOf(end)<source.indexOf(begin))throw Error('Expected one marked local Emar launcher');
 return source.slice(0,source.indexOf(begin))+source.slice(source.indexOf(end)+end.length);
};
const powershell=cmd=>['powershell',['-NoProfile','-Command',cmd+'; exit $LASTEXITCODE']];
const run=(program,args,stdio='inherit')=>execFileSync(program,args,{cwd:root,stdio,windowsHide:true,env:{...process.env,PYTHONIOENCODING:'utf-8'}});
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
const command=process.argv[2],python=process.env.ZURI_GO_PYTHON||'python';
if(command==='build'){
 const home=process.env.USERPROFILE,plugin=process.env.ZURI_GO_DATA_PLUGIN||join(home,'.codex/plugins/cache/openai-curated-remote/data-analytics/1.0.11');
 const node=process.env.ZURI_GO_BUILD_NODE||join(home,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe');
 if(!existsSync(node)||!existsSync(join(plugin,'scripts/data-app.mjs')))throw Error('Set ZURI_GO_BUILD_NODE and ZURI_GO_DATA_PLUGIN to the installed Codex Node and Data plugin paths.');
 run(python,['scripts/metrics/build_metrics_map.py']);
 run(python,['scripts/metrics/verify_metrics_map_static.py']);
 run(node,[join(plugin,'scripts/data-app.mjs'),'build','--project-dir',resolve(root,'apps/web'),'--separate-data']);
 run(python,['scripts/site/build_unified_site.py']);
 // Build only authored inputs in isolation; never rewrite compiled HTML or integrity manifests.
 const stagingRoot=resolve(root,'build');mkdirSync(stagingRoot,{recursive:true});
 const stage=mkdtempSync(join(stagingRoot,'.emar-hosted-'));
 try{
  for(const path of ['src/content','src/data.json','src/theme.css','src/data-app-public.jsx'])cpSync(resolve(root,'apps/web',path),join(stage,path),{recursive:true});
  // Preserve the existing local presentation/thread marker through the normal builder.
  mkdirSync(join(stage,'dist'));cpSync(resolve(root,'apps/web/dist/index.html'),join(stage,'dist/index.html'));
  const meeting=join(stage,'src/content/meeting/MeetingWorkspace.jsx');
  writeFileSync(meeting,hostedEmarSource(readFileSync(meeting,'utf8')));
  run(node,[join(plugin,'scripts/data-app.mjs'),'build','--project-dir',stage,'--separate-data']);
  run(python,['scripts/site/build_unified_site.py','--hosted-app-dist',join(stage,'dist')]);
 }finally{
  if(dirname(resolve(stage))!==stagingRoot||!basename(stage).startsWith('.emar-hosted-'))throw Error('Invalid hosted staging cleanup path');
  rmSync(stage,{recursive:true,force:true});
 }
 run(python,['scripts/deploy/build_cloud.py']);
}else if(command==='test'){
 run(process.execPath,['--test','apps/api/test/*.test.mjs','tests/campaign/*.test.mjs','apps/web/src/content/meeting/model.test.mjs','apps/web/src/content/meeting/emar-launcher.test.mjs']);
 run(python,['-m','unittest','discover','-s','scripts/site','-p','test_unified_site.py']);
 run(python,['scripts/metrics/verify_metrics_map_static.py']);
 run(python,['scripts/site/verify_extraction.py']);
 // Documentation tooling (PLAN-001 WI-11): its own tests, then the repository's documents.
 run(python,['-m','unittest','discover','-s','scripts/docs/tests']);
 run(python,['scripts/docs/validate_docs.py']);
 run(python,['scripts/docs/generate_views.py','--check']);
}else if(command==='docs'){
 run(python,['scripts/docs/'+({'validate':'validate_docs.py','views':'generate_views.py','next-id':'next_id.py'}[process.argv[3]]||'validate_docs.py'),...(process.argv[3]==='views'?['--check']:[]),...process.argv.slice(4)]);
}else if(command==='deploy'){
 // Always staged (--skip-domain): the public domain does not move until npm run promote.
 const out=run(...powershell(deployCommand()),['inherit','pipe','inherit']).toString();process.stdout.write(out);
 const url=deploymentUrl(out);console.log(url?'\nStaged deployment (public domain not moved): '+url+'\nVerify it, then: npm run promote -- '+url:'\nDeployed with --skip-domain; the public domain did not move. Copy the unique deployment URL from the Vercel output above.');
}else if(command==='promote'){
 // Moves the public domain to a verified staged deployment.
 run(...powershell(promoteCommand(process.argv[3])));
}else throw Error('Expected build, test, docs, deploy or promote');
}

