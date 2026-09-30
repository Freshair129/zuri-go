import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),command=process.argv[2];
const run=(program,args)=>execFileSync(program,args,{cwd:root,stdio:'inherit',windowsHide:true,env:{...process.env,PYTHONIOENCODING:'utf-8'}});
const python=process.env.ZURI_GO_PYTHON||'python';
if(command==='build'){
 const home=process.env.USERPROFILE,plugin=process.env.ZURI_GO_DATA_PLUGIN||join(home,'.codex/plugins/cache/openai-curated-remote/data-analytics/1.0.11');
 const node=process.env.ZURI_GO_BUILD_NODE||join(home,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe');
 if(!existsSync(node)||!existsSync(join(plugin,'scripts/data-app.mjs')))throw Error('Set ZURI_GO_BUILD_NODE and ZURI_GO_DATA_PLUGIN to the installed Codex Node and Data plugin paths.');
 run(python,['scripts/metrics/build_metrics_map.py']);
 run(python,['scripts/metrics/verify_metrics_map_static.py']);
 run(node,[join(plugin,'scripts/data-app.mjs'),'build','--project-dir',resolve(root,'apps/web'),'--separate-data']);
 run(python,['scripts/site/build_unified_site.py']);
 run(python,['scripts/deploy/build_cloud.py']);
}else if(command==='test'){
 run(process.execPath,['--test','apps/api/test/*.test.mjs','tests/campaign/*.test.mjs','apps/web/src/content/meeting/model.test.mjs']);
 run(python,['-m','unittest','discover','-s','scripts/site','-p','test_unified_site.py']);
 run(python,['scripts/metrics/verify_metrics_map_static.py']);
 run(python,['scripts/site/verify_extraction.py']);
}else if(command==='deploy'){
 // An explicit npm run deploy uses the existing project link in the verified package.
 run('powershell',['-NoProfile','-Command',"npx --yes vercel@61.1.0 deploy --prod --yes --scope pornpons-projects --cwd ./build/vercel; exit $LASTEXITCODE"]);
}else throw Error('Expected build, test or deploy');
