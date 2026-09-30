"""Allowlisted Vercel package: public UI, server code and shared models only."""
from pathlib import Path
import json
from shutil import copy2

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'build/vercel'
OUT.mkdir(parents=True, exist_ok=True)
link = json.loads((ROOT / 'scripts/deploy/project.json').read_text())
binding = OUT / '.vercel/project.json'
if binding.exists() and json.loads(binding.read_text()) != link:
    raise ValueError('Refusing to replace a different Vercel project binding')
binding.parent.mkdir(parents=True, exist_ok=True)
binding.write_text(json.dumps(link, indent=2) + '\n')
files = []
def copy(source, relative):
    target = OUT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    copy2(ROOT / source, target)
    files.append(relative)

site = ROOT / 'build/site'
for path in json.loads((site / 'site-build.json').read_text())['files']:
    copy('build/site/' + path, 'public/' + path)
for path in ['api.mjs','cloud.mjs','config.mjs','db.mjs','http.mjs','service.mjs','workspace.mjs','team-auth.mjs','attachments.mjs','member-auth.mjs','viewer.mjs','audience.mjs','teams.mjs','tasks.mjs','projects.mjs','campaign-tasks.mjs','meeting-commit.mjs']:
    copy('apps/api/' + path, 'apps/api/' + path)
for path in ['shared/model.mjs','shared/visibility.mjs','shared/task-rules.mjs','meeting/model.mjs','business/model.mjs']:
    relative = 'apps/web/src/content/' + path
    copy(relative, relative)
(OUT / 'api').mkdir(exist_ok=True)
(OUT / 'api/index.mjs').write_text("export {default} from '../apps/api/cloud.mjs';\n")
package = json.loads((ROOT / 'apps/api/package.json').read_text())
package.update(name='zuri-go-cloud', scripts={}, version='0.5.0', engines={'node':'24.x'})
(OUT / 'package.json').write_text(json.dumps(package, indent=2)+'\n')
copy('apps/api/package-lock.json', 'package-lock.json')
configuration = {'version':2,'outputDirectory':'public','buildCommand':'','regions':['sin1'],
 'functions':{'api/index.mjs':{'maxDuration':30}},
 'rewrites':[{'source':'/api/zuri-go/v1/:path*','destination':'/api/index?route=:path*'}],
 'headers':[{'source':'/api/(.*)','headers':[{'key':'Cache-Control','value':'no-store'},{'key':'X-Content-Type-Options','value':'nosniff'}]}]}
(OUT / 'vercel.json').write_text(json.dumps(configuration,indent=2)+'\n')
(OUT / '.vercelignore').write_text('.env*\n.vercel\n.gitignore\nnode_modules\n**/.local/**\n**/test/**\n')
expected=set(files)|{'api/index.mjs','package.json','vercel.json','.vercelignore'}
for path in OUT.rglob('*'):
    if not path.is_file(): continue
    relative=path.relative_to(OUT).as_posix()
    if relative.startswith(('.vercel/','node_modules/','.env')) or relative=='.gitignore': continue
    if relative not in expected: raise ValueError('Unexpected file in deploy package: '+relative)
print(json.dumps({'packagedFiles':len(expected),'directory':str(OUT),'privateBackupsIncluded':False}))
