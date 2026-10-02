"""Build the draft REV 04 static guide and interactive metrics graph."""
from pathlib import Path
from html import escape
import re
from shutil import copyfile

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'apps/metrics/index.html'
PAGES = []
PAGE_TOTAL = 18

# Keep the user-selected brand sheet byte-identical; CSS displays its Main Logo panel.
LOGO_CONTENT = ROOT / 'apps/web/src/content'
for target, source in (
    ('assets/logos/zuri-go-brand-sheet.png', ROOT / 'assets/logos/zuri-go/download.png'),
    ('assets/styles/zuri-go-logo.css', LOGO_CONTENT / 'shared/zuri-go-logo.css'),
):
    destination = OUT.parent / target
    destination.parent.mkdir(parents=True, exist_ok=True)
    copyfile(source, destination)

def logo(compact=False):
    modifier = ' zgo-logo--compact' if compact else ''
    label = 'Zuri-Go' if compact else 'Zuri-Go — Let’s Go to Market. Together.'
    return f'<span class="zgo-logo{modifier}" role="img" aria-label="{label}"><img src="assets/logos/zuri-go-brand-sheet.png" width="1448" height="1086" alt="" aria-hidden="true"></span>'

SITE_NAV = '''<nav class="site-nav" aria-label="เมนูเว็บไซต์">'''+logo(True)+'''<a href="/?view=1&amp;tab=overview">ภาพรวมธุรกิจ</a><a href="/?view=1&amp;tab=meeting-task-manager">Meeting &amp; Task Manager</a><a href="#overview" data-site-section="guide">ความรู้ Metrics</a><a href="#metrics-graph" data-site-section="graph">Graph View</a></nav>'''
SERVICES_NAV = '''<nav class="services-nav" id="services-nav" aria-label="บริการ" hidden><span>บริการ</span><a id="emar-local-launcher" href="http://localhost:8788/" target="_blank" rel="noopener noreferrer" aria-label="Emar (local), opens in a new tab">Emar (local)</a></nav>'''
SERVICES_ORIGIN_GATE = '''<script id="services-origin-gate">(()=>{const services=document.getElementById('services-nav');if(services&&location.origin==='http://127.0.0.1:4319')services.hidden=false;})();</script>'''
SITE_CSS = '''
.site-nav{position:sticky;top:0;z-index:40;display:flex;align-items:center;flex-wrap:wrap;gap:9px;padding:14px max(18px,calc((100% - 1390px)/2));background:var(--paper);border-bottom:1px solid var(--line)}
.nav{position:static}html{scroll-padding-top:calc(var(--site-nav-height,64px) + 16px)}
.site-nav>span{font:600 11px Manrope,sans-serif;letter-spacing:.16em;color:var(--muted);margin-right:12px}
.site-nav>a{display:inline-flex;align-items:center;min-height:34px;padding:6px 12px;border:1px solid var(--line);border-radius:6px;font-size:12px;font-weight:600;color:var(--ink);text-decoration:none}
.site-nav>a:hover,.site-nav>a[aria-current="page"]{border-color:var(--amber);background:var(--tint)}
.site-nav>a:focus-visible{outline:2px solid var(--amber);outline-offset:3px}
.services-nav{display:flex;align-items:center;justify-content:flex-end;gap:9px;padding:8px max(18px,calc((100% - 1390px)/2));background:var(--paper);border-bottom:1px solid var(--line)}
.services-nav[hidden]{display:none}
.services-nav>span{font:600 11px Manrope,sans-serif;letter-spacing:.12em;color:var(--muted);margin-right:4px}
.services-nav>a{display:inline-flex;align-items:center;min-height:34px;padding:6px 12px;border:1px solid var(--line);border-radius:6px;font-size:12px;font-weight:600;color:var(--ink);text-decoration:none}
.services-nav>a:focus-visible{outline:2px solid var(--amber);outline-offset:3px}
@media(max-width:650px){.site-nav>span{width:100%}}
@media(max-width:650px){.services-nav{justify-content:flex-start}}
@media print{.site-nav,.services-nav{display:none!important}}
'''

CSS = r'''
:root{color-scheme:light;--paper:#FFFFFF;--canvas:#F7F8FA;--ink:#1F2937;--muted:#6B7280;--line:#D6ECFA;--amber:#E8820C;--tint:#FFF8F0;--tint-ink:#B86A08;--dot:rgba(31,41,55,.13)}
@media(prefers-color-scheme:dark){:root{color-scheme:dark;--paper:#1F2937;--canvas:#12161C;--ink:#F7F8FA;--muted:#D6ECFA;--line:#6B7280;--tint:#1F2937;--tint-ink:#F09420;--dot:rgba(214,236,250,.10)}}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:88px}body{margin:0;background:var(--canvas);color:var(--ink);font:15px/1.65 'IBM Plex Sans Thai',Tahoma,sans-serif;-webkit-font-smoothing:antialiased}a{color:inherit;text-underline-offset:4px}a:hover{color:var(--tint-ink)}a:focus-visible{outline:3px solid var(--amber);outline-offset:4px}p{margin:0 0 12px}h1,h2,h3{margin:0}h1,h2,.display{font-family:Manrope,'IBM Plex Sans Thai',sans-serif;font-weight:800;letter-spacing:-.045em;line-height:1.1}h1{font-size:clamp(40px,6.4vw,76px);text-transform:uppercase}h2{font-size:clamp(30px,4.4vw,49px);text-transform:uppercase}h3{font-size:17px;line-height:1.45}strong{font-weight:600}.caps{font-family:Manrope,'IBM Plex Sans Thai',sans-serif;font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:11px}.mono,.formula,.value{font-family:'IBM Plex Mono','IBM Plex Sans Thai',monospace;font-variant-numeric:tabular-nums}.muted{color:var(--muted)}.accent{color:var(--amber)}.small{font-size:12px}.nav{position:sticky;top:0;z-index:5;background:var(--paper);border-bottom:1px solid var(--line);padding:13px max(18px,calc((100vw - 1120px)/2));display:flex;justify-content:space-between;gap:20px;align-items:center}.nav-title{white-space:nowrap}.nav-links{display:flex;gap:18px;flex-wrap:wrap;font-size:12px}.nav a{text-decoration:none}.skip{position:absolute;left:16px;top:-80px;background:var(--paper);padding:10px;z-index:10}.skip:focus{top:8px}.page{max-width:1120px;margin:28px auto;background:var(--paper);padding:26px 44px 20px;border:1px solid var(--line);position:relative;scroll-margin-top:12px}.mast{display:flex;justify-content:space-between;align-items:center;gap:20px;border-bottom:1px solid var(--ink);margin-bottom:26px}.logo-pad{background:#FFFFFF;padding:23px;display:inline-flex;margin:0 0 12px}.logo{display:block;width:118px;height:auto}.mast-meta{text-align:right;color:var(--muted)}.mast-meta b{display:block;color:var(--ink);margin-bottom:6px}.page-head{display:grid;grid-template-columns:1fr auto;gap:20px;margin-bottom:25px}.eyebrow{color:var(--tint-ink);margin:0 0 12px}.subtitle{font-size:18px;margin:13px 0 0;font-weight:500}.intro{color:var(--muted);max-width:78ch;margin:12px 0 0}.page-no{font:800 58px/1 Manrope,sans-serif;letter-spacing:-.045em;color:var(--amber)}.page-content{display:grid;gap:18px}.grid{display:grid;gap:14px}.two{grid-template-columns:repeat(2,minmax(0,1fr))}.three{grid-template-columns:repeat(3,minmax(0,1fr))}.four{grid-template-columns:repeat(4,minmax(0,1fr))}.card{border:1px solid var(--line);padding:20px;min-width:0;background:var(--paper)}.metric h3{font:800 26px/1.15 Manrope,sans-serif;letter-spacing:-.035em}.metric .full{display:block;font-size:12px;color:var(--muted);margin:5px 0 13px}.metric p{font-size:14px;margin:0 0 12px}.formula{padding:11px 13px;background:var(--canvas);border-left:2px solid var(--amber);font-size:12px;overflow-wrap:anywhere;white-space:normal;line-height:1.7;margin:12px 0}.unit{font-size:11px;color:var(--muted)}.mini-example{font-size:13px;margin:12px 0 0!important}.reading{font-size:12px!important;color:var(--muted);margin:9px 0 0!important}.reading:before{content:'อ่านผล · ';font-weight:600;color:var(--ink)}.band{background:var(--tint);border-left:3px solid var(--amber);padding:15px 18px;font-size:14px}.band p:last-child{margin:0}.example{border:1px dashed var(--line);padding:17px 20px}.example-title{font-size:11px;letter-spacing:.07em;font-weight:600;color:var(--tint-ink);margin-bottom:7px}.example p:last-child{margin:0}.value{font-size:26px;font-weight:500;line-height:1.3}.stat-label{font-size:12px;color:var(--muted);margin-top:5px}.divider{border-top:1px solid var(--line);padding-top:14px}.toc{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 26px}.toc-group{border-top:2px solid var(--ink);padding-top:13px}.toc-group:last-child{grid-column:1/-1}.toc-group h3{font-size:14px;margin-bottom:8px}.toc-group a{display:flex;justify-content:space-between;gap:16px;font-size:13px;text-decoration:none;padding:5px 0}.toc-group a span:last-child{font-family:'IBM Plex Mono',monospace;color:var(--muted);white-space:nowrap}.funnel{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--line)}.funnel div{padding:19px;border-right:1px solid var(--line);min-width:0}.funnel div:last-child{border:0;border-top:3px solid var(--amber)}.funnel b{display:block;font:800 16px Manrope,sans-serif;letter-spacing:-.02em;margin-bottom:7px}.funnel span{font-size:12px;color:var(--muted)}.guide{display:grid;grid-template-columns:1fr 1fr;gap:22px;border-top:1px solid var(--ink);margin-top:26px;padding-top:20px;break-inside:avoid}.speaker{display:flex;gap:14px;align-items:center;min-width:0}.portrait{width:92px;height:96px;background:#FFFFFF;flex:none;display:flex;align-items:center;justify-content:center;overflow:hidden}.portrait img{width:92px;height:92px;object-fit:contain;display:block}.speaker.wangjai .portrait img{width:65px;height:87px}.speaker .name{font:700 11px/1.5 Manrope,'IBM Plex Sans Thai',sans-serif;letter-spacing:.08em;color:var(--tint-ink);margin-bottom:6px}.speaker p{font-size:12px;margin:0;line-height:1.65}.foot{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;font-size:11px;color:var(--muted);margin-top:18px;padding-top:10px;border-top:1px solid var(--line)}.foot a{margin-right:8px}.foot .folio{white-space:nowrap}.sources-label{font-weight:500}.table-wrap{max-width:100%;overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:13px;line-height:1.6}th{text-align:left;font-weight:600;background:var(--canvas)}td,th{padding:11px 12px;border-bottom:1px solid var(--line);vertical-align:top}td:first-child{font-weight:500}td p{margin:3px 0}.raci{table-layout:fixed;font-size:12px}.raci th:first-child{width:27%}.raci th,.raci td{padding:12px 7px;text-align:center}.raci th:first-child,.raci td:first-child{text-align:left}.raci .accountable{color:var(--tint-ink);font-weight:600;background:var(--tint)}.letter{font:800 30px Manrope,sans-serif;color:var(--amber)}.stages{display:grid;gap:10px}.stage{display:grid;grid-template-columns:155px 1fr;gap:22px;border-bottom:1px solid var(--line);padding:13px 0}.stage h3{font-family:Manrope,sans-serif;font-size:17px}.stage .idx{font-size:11px;color:var(--tint-ink);margin-bottom:5px;display:block}.stage p{font-size:13px;margin:0 0 5px}.stage .formula{margin:8px 0}.role-head{border-top:3px solid var(--amber);padding:20px;background:var(--canvas)}.roles{display:grid;grid-template-columns:repeat(2,1fr);gap:0 24px}.role{border-bottom:1px solid var(--line);padding:13px 0}.role h3{font-family:Manrope,sans-serif;font-size:16px;margin-bottom:5px}.role p{font-size:13px;margin:0 0 5px}.role .output{font-size:12px;color:var(--muted)}.steps{counter-reset:step;display:grid;gap:12px}.step{display:grid;grid-template-columns:40px 1fr;gap:16px;padding:16px;border:1px solid var(--line)}.step:before{counter-increment:step;content:'0' counter(step);font:800 25px Manrope,sans-serif;color:var(--amber)}.step p{font-size:13px;margin:6px 0 0}.skills h3{font-size:14px}.skills p{font-size:12px;margin:8px 0 0}.checklist{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;padding:0;list-style:none;counter-reset:check}.checklist li{counter-increment:check;position:relative;padding-left:29px;font-size:13px}.checklist li:before{content:counter(check,decimal-leading-zero);font:500 12px 'IBM Plex Mono',monospace;color:var(--tint-ink);position:absolute;left:0;top:3px}.source-columns{display:grid;grid-template-columns:1fr 1fr;gap:28px}.source-list{list-style:none;padding:0;margin:10px 0 0}.source-list li{font-size:11px;margin:7px 0;overflow-wrap:anywhere}.source-list a{text-decoration:none}.source-list .sid{font-family:'IBM Plex Mono',monospace;color:var(--tint-ink);margin-right:6px}.cover{background-image:radial-gradient(circle,var(--dot) .8px,transparent 1px);background-size:15px 15px}.cover .toc,.cover .guide,.cover .page-head,.cover .mast,.cover .foot{background:var(--paper)}.cover .page-head{padding:8px 0 16px}.template{font-size:11px;color:var(--tint-ink);border:1px solid var(--line);padding:4px 9px;display:inline-block;margin-top:10px}.callout-title{font-size:14px;margin-bottom:8px}.budget th:last-child,.budget td:last-child{white-space:nowrap}.source-columns h3{font-size:14px}
@media(max-width:760px){body{font-size:14px}.nav{position:static;align-items:flex-start;gap:12px;flex-direction:column;padding:14px 18px}.nav-links{gap:10px 16px}.page{margin:16px 10px;padding:18px}.mast{gap:10px;margin-bottom:22px;flex-wrap:wrap}.logo-pad{padding:10px;margin:0 0 12px}.logo{width:110px}.mast-meta{font-size:11px;letter-spacing:0}.mast-meta b{font-size:11px}.page-head{gap:8px}.page-no{font-size:32px}.subtitle{font-size:16px}.two,.three,.four,.toc,.guide,.roles,.source-columns{grid-template-columns:1fr}.toc-group:last-child{grid-column:auto}.funnel{grid-template-columns:1fr}.funnel div{border-right:0;border-bottom:1px solid var(--line)}.funnel div:last-child{border-top:0;border-left:3px solid var(--amber)}.card{padding:18px}.stage{grid-template-columns:1fr;gap:8px}.guide{gap:15px}.portrait{width:82px;height:86px}.portrait img{width:82px;height:82px}.speaker.wangjai .portrait img{width:60px;height:80px}.checklist{grid-template-columns:1fr}.raci{min-width:620px}.foot{align-items:flex-start}.foot>div:first-child{max-width:75%}.source-columns{gap:18px}.cover .page-head{padding-top:0}.budget{min-width:590px}.table-wrap{border:1px solid var(--line)}html{scroll-padding-top:18px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
@page{size:A4 portrait;margin:10mm}
@media print{html{scroll-behavior:auto}body{background:#FFFFFF;color:#1F2937;font-size:12px;--paper:#FFFFFF;--canvas:#F7F8FA;--ink:#1F2937;--muted:#6B7280;--line:#D6ECFA;--tint:#FFF8F0;--tint-ink:#B86A08;--dot:rgba(31,41,55,.13);-webkit-print-color-adjust:exact;print-color-adjust:exact}.nav,.skip{display:none}.page{margin:0;padding:0 10px 0;border:0;width:100%;max-width:none;break-after:page;break-inside:avoid}.page:last-child{break-after:auto}.mast{margin-bottom:17px}.logo-pad{padding:20px;margin:0 0 8px}.logo{width:110px}.page-head{margin-bottom:18px;gap:12px}h1{font-size:49px}h2{font-size:34px}.page-no{font-size:42px}.subtitle{font-size:16px;margin-top:8px}.intro{font-size:12px;margin-top:8px}.eyebrow{margin-bottom:8px}.page-content{gap:12px}.grid{gap:10px}.card{padding:14px}.metric h3{font-size:23px}.metric .full{margin:4px 0 8px;font-size:11px}.metric p{font-size:12px;margin-bottom:8px}.formula{font-size:11px;padding:8px 10px;margin:9px 0}.mini-example{font-size:11px}.reading{font-size:11px!important}.band,.example{padding:12px 14px;font-size:12px}.value{font-size:22px}.guide{margin-top:18px;padding-top:14px;gap:16px}.portrait{width:76px;height:80px}.portrait img{width:76px;height:76px}.speaker.wangjai .portrait img{width:56px;height:75px}.speaker{gap:10px}.speaker p{font-size:11px}.speaker .name{font-size:11px}.foot{font-size:10px;margin-top:12px;padding-top:8px}.toc{gap:9px 20px}.toc-group{padding-top:10px}.toc-group a{font-size:12px;padding:3px 0}.funnel div{padding:13px}.funnel b{font-size:14px}.stage{grid-template-columns:125px 1fr;gap:16px;padding:10px 0}.stage h3{font-size:15px}.stage p{font-size:12px}.stages{gap:6px}.role{padding:9px 0}.role h3{font-size:14px}.role p{font-size:12px}.role .output{font-size:11px}.role-head{padding:14px}.step{padding:12px;gap:12px}.step p{font-size:12px}.steps{gap:9px}.skills p{font-size:11px}.skills h3{font-size:13px}table{font-size:11px}td,th{padding:9px 8px}.raci{font-size:11px}.raci th,.raci td{padding:9px 5px}.checklist{gap:9px 20px;margin:0}.checklist li{font-size:11px}.source-list li{font-size:10px;margin:5px 0}.source-columns{gap:22px}.source-columns h3{font-size:12px}.source-list{margin-top:7px}.small{font-size:11px}.template{margin-top:7px}.table-wrap{overflow:visible}.cover .page-head{padding:0 0 8px}a{text-decoration:none}}
.scroll-hint{display:none}.table-block{min-width:0}
@media screen and (max-width:760px){.scroll-hint{display:block;font-size:11px;color:var(--muted);margin:0 0 6px}}
/* Keep each approved logical page together on A4 without reducing type size. */
@media print{.mast{margin-bottom:12px}.page-head{margin-bottom:14px}.guide{margin-top:12px;padding-top:12px}.foot{margin-top:6px;padding-top:6px;break-inside:avoid}.stage{padding:7px 0}.stages{gap:4px}.step{padding:10px 12px}.steps{gap:8px}}

/* REV 02.3 visual pass: restore a visible dot field and a single amber signal. */
.page:not(.cover){background-image:radial-gradient(circle,var(--dot) 1px,transparent 1.25px);background-size:15px 15px;background-repeat:repeat}
.cover .toc,.cover .guide,.cover .page-head,.cover .mast,.cover .foot{background:transparent}
.cover .toc-group{background:var(--paper);color:var(--ink);padding:11px 14px}
.eyebrow{display:flex;align-items:center;gap:8px}
.eyebrow:before{content:'';width:8px;height:8px;flex:none;border-radius:50%;background:var(--amber)}
.page-no{align-self:start;padding:8px 10px;background:var(--tint);border-left:3px solid var(--amber)}
.mast{border-bottom:2px solid var(--amber)}
.foot{border-top-color:var(--amber)}
.formula{background:var(--tint);border-left-width:4px}
.toc-group{border-top-color:var(--amber)}
.guide{display:grid;grid-template-columns:minmax(150px,.68fr) minmax(0,1.32fr);align-items:stretch;gap:16px;border:1px solid var(--line);border-top:3px solid var(--amber);margin-top:20px;padding:12px;background:var(--canvas);break-inside:avoid}
.guide-art{height:174px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--paper);border-left:3px solid var(--amber)}
.guide-art img{display:block;width:100%;height:100%;object-fit:contain}
.guide--clipboard{grid-template-columns:minmax(0,1.32fr) minmax(150px,.68fr)}
.guide--clipboard .guide-art{order:2;border-left:0;border-right:3px solid var(--amber)}
.guide--analysis .guide-art{background-image:radial-gradient(circle,var(--dot) 1px,transparent 1.25px);background-size:14px 14px}
.guide-notes{display:grid;grid-template-columns:1fr 1fr;gap:7px 14px;align-content:start}
.role-note{padding:8px 10px;background:var(--paper);border-left:2px solid var(--line)}
.role-note .name{display:block;font:700 11px/1.4 Manrope,'IBM Plex Sans Thai',sans-serif;letter-spacing:.06em;color:var(--tint-ink);margin-bottom:4px}
.role-note p{font-size:12px;line-height:1.55;margin:0}
.scenario{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px 14px;padding:9px 11px;background:var(--tint);border-left:3px solid var(--amber)}
.scenario-label{grid-column:1/-1;color:var(--tint-ink);font:700 10px Manrope,'IBM Plex Sans Thai',sans-serif;letter-spacing:.1em;text-transform:uppercase;margin-bottom:-8px}
.scenario p{font-size:12px;line-height:1.5;margin:0}
.cta{display:inline-flex;justify-content:center;align-items:center;gap:8px;padding:8px 13px;background:var(--amber);color:#1F2937;font-weight:700;font-size:12px;line-height:1.35;text-decoration:none;white-space:nowrap;border:1px solid var(--amber)}
.cta:after{content:'↗';font-family:'IBM Plex Mono',monospace}
.cta:hover{background:#F09420;color:#1F2937}
.cta:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
.cover .funnel div{background:var(--paper);color:var(--ink);border-top:3px solid var(--amber)}
.cover .funnel div:last-child{border-top:3px solid var(--amber)}
@media(max-width:760px){.cover .toc-group{padding:10px 12px}.guide,.guide--clipboard{grid-template-columns:1fr;gap:10px}.guide-art,.guide--clipboard .guide-art{order:0;height:180px;border:0;border-left:3px solid var(--amber)}.guide-notes{grid-template-columns:1fr}.scenario{grid-template-columns:1fr;gap:8px}.scenario-label{margin-bottom:0}.cta{justify-self:start}}
@media print{.guide,.guide--clipboard{grid-template-columns:128px minmax(0,1fr);gap:10px;margin-top:12px;padding:8px}.guide-art,.guide--clipboard .guide-art{height:112px;order:0}.guide-art img{height:112px}.guide-notes{grid-template-columns:1fr 1fr;gap:5px 8px}.role-note{padding:5px 7px}.role-note p,.scenario p{font-size:10px}.scenario{padding:6px 8px;gap:6px 9px}.cta{padding:5px 8px;font-size:10px}.page:not(.cover){background-size:15px 15px;background-position:left top}.cover .toc-group{padding:8px 10px}.cover .guide{margin-top:8px;padding:7px;gap:8px}.cover .guide-art,.cover .guide-art img{height:95px}.cover .role-note{padding:4px 5px}.cover .role-note p,.cover .scenario p{font-size:9px}.cover .scenario{padding:5px 7px;gap:4px 7px}}
'''

GRAPH_CSS = r'''
.metrics-graph{max-width:1520px;margin:24px auto 34px;padding:0 22px;scroll-margin-top:82px}
.mg-intro{display:grid;grid-template-columns:minmax(0,1fr) 245px;gap:24px;align-items:center;padding:20px 4px 16px}
.mg-intro .eyebrow{margin-bottom:9px}.mg-intro h2{font-size:clamp(28px,3.6vw,42px)}.mg-intro-copy{max-width:78ch;color:var(--muted);margin:10px 0 0;font-size:14px}
.mg-mascots{display:flex;align-items:center;gap:12px;min-width:0}.mg-mascots img{width:116px;height:112px;object-fit:contain;background:var(--paper);border:1px solid var(--line);border-top:3px solid var(--amber);padding:3px}.mg-mascot-names{display:grid;gap:7px}.mg-mascot-names span{display:block;background:var(--paper);border-left:3px solid var(--amber);padding:6px 8px;font-size:11px;font-weight:600;white-space:nowrap}
.mg-console{--mg-paper:#FFFFFF;--mg-canvas:#F7F8FA;--mg-ink:#1F2937;--mg-muted:#6B7280;--mg-line:#D6ECFA;--mg-amber:#E8820C;--mg-soft:#FFF8F0;--mg-dot:rgba(31,41,55,.13);--mg-blue:#3D7A9E;--mg-blue-soft:#D6ECFA;--mg-mustard:#C6A052;--mg-mustard-soft:#F5ECD7;color:var(--mg-ink);background:var(--mg-paper);border:1px solid var(--mg-line);border-top:4px solid var(--mg-amber);box-shadow:0 14px 36px rgba(31,41,55,.08);position:relative;isolation:isolate}
.mg-console[data-theme="dark"]{--mg-paper:#1F2937;--mg-canvas:#12161C;--mg-ink:#F7F8FA;--mg-muted:#D6ECFA;--mg-line:#6B7280;--mg-amber:#F09420;--mg-soft:#1F2937;--mg-dot:rgba(214,236,250,.12);--mg-blue:#3D7A9E;--mg-blue-soft:#1F2937;--mg-mustard:#C6A052;--mg-mustard-soft:#1F2937;color-scheme:dark}
.mg-topbar{display:grid;grid-template-columns:auto minmax(180px,1fr) auto;grid-template-areas:"brand search controls" "stat stat stat";gap:12px 18px;align-items:center;padding:14px 18px;background:color-mix(in srgb,var(--mg-paper) 94%,transparent);border-bottom:1px solid var(--mg-line);position:relative;z-index:5}
.mg-brandlock{grid-area:brand;display:flex;gap:13px;align-items:center;min-width:0}.mg-brandcopy{display:grid;line-height:1.3}.mg-brandcopy b{font:800 13px Manrope,'IBM Plex Sans Thai',sans-serif;letter-spacing:-.025em}.mg-brandcopy span{font:500 9px 'IBM Plex Mono',monospace;letter-spacing:.08em;color:var(--mg-muted);text-transform:uppercase}
.mg-search-wrap{grid-area:search;position:relative;min-width:0}.mg-search{width:100%;height:38px;padding:0 13px 0 38px;border:1px solid var(--mg-line);border-radius:3px;background:var(--mg-canvas);color:var(--mg-ink);font:12px 'IBM Plex Sans Thai',sans-serif;outline-offset:2px}.mg-search:focus{border-color:var(--mg-amber);outline:2px solid color-mix(in srgb,var(--mg-amber) 22%,transparent)}.mg-search-mark{position:absolute;left:13px;top:7px;color:var(--mg-muted);font-size:15px;pointer-events:none}.mg-search-results{display:none;position:absolute;left:0;right:0;top:42px;max-height:350px;overflow:auto;background:var(--mg-paper);border:1px solid var(--mg-line);box-shadow:0 12px 28px rgba(31,41,55,.15);z-index:40}.mg-search-results.open{display:block}.mg-search-row{display:flex;align-items:center;gap:9px;width:100%;border:0;border-bottom:1px solid var(--mg-line);background:transparent;color:var(--mg-ink);text-align:left;padding:9px 12px;cursor:pointer}.mg-search-row:hover,.mg-search-row:focus-visible{background:var(--mg-soft);outline-color:var(--mg-amber)}.mg-search-row .mg-node-dot{flex:none}.mg-search-row strong{font-size:12px}.mg-search-row small{margin-left:auto;color:var(--mg-muted);font-size:10px}
.mg-top-controls{grid-area:controls;display:flex;justify-content:flex-end;align-items:center;gap:6px;flex-wrap:wrap}.mg-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:6px 10px;border:1px solid var(--mg-line);border-radius:3px;background:var(--mg-paper);color:var(--mg-ink);font:600 11px 'IBM Plex Sans Thai',sans-serif;white-space:nowrap;cursor:pointer;transition:background .16s,border-color .16s,transform .16s}.mg-btn:hover{background:var(--mg-soft);border-color:var(--mg-amber)}.mg-btn:active{transform:translateY(1px)}.mg-btn:focus-visible,.mg-node:focus-visible{outline:3px solid var(--mg-amber);outline-offset:2px}.mg-btn.is-active{background:var(--mg-soft);border-color:var(--mg-amber);color:var(--mg-ink)}.mg-btn-primary{background:var(--mg-amber);border-color:var(--mg-amber);color:#1F2937}.mg-btn-primary:hover{background:#F09420;color:#1F2937}.mg-stat{grid-area:stat;justify-self:end;color:var(--mg-muted);font:500 10px 'IBM Plex Mono',monospace;letter-spacing:.04em}
.mg-workspace{display:grid;grid-template-columns:minmax(0,1fr) 326px;min-height:660px;background:var(--mg-canvas)}.mg-stage{height:660px;position:relative;overflow:hidden;touch-action:none;cursor:grab;background-color:var(--mg-canvas);background-image:radial-gradient(circle,var(--mg-dot) .85px,transparent 1.05px);background-size:17px 17px;perspective:1100px;user-select:none}.mg-stage.is-dragging{cursor:grabbing}.mg-stage:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 48%,color-mix(in srgb,var(--mg-paper) 76%,transparent),transparent 68%);pointer-events:none}.mg-orbit{position:absolute;left:50%;top:50%;border:1px solid color-mix(in srgb,var(--mg-line) 78%,transparent);border-radius:50%;transform-style:preserve-3d;pointer-events:none}.mg-orbit--a{width:46%;height:27%;transform:translate(-50%,-50%) rotateX(67deg) rotateZ(-22deg)}.mg-orbit--b{width:64%;height:38%;transform:translate(-50%,-50%) rotateX(67deg) rotateZ(42deg)}.mg-orbit--c{width:83%;height:49%;transform:translate(-50%,-50%) rotateX(67deg) rotateZ(-62deg)}.mg-axis{position:absolute;left:50%;top:50%;width:min(55%,380px);height:1px;background:linear-gradient(90deg,transparent,var(--mg-line),transparent);transform-origin:center;pointer-events:none}.mg-axis--x{transform:rotate(-27deg)}.mg-axis--y{transform:rotate(67deg)}.mg-nodes{position:absolute;inset:26px 24px 42px;z-index:2}.mg-node{--node-color:var(--mg-amber);--node-tint:var(--mg-soft);position:absolute;left:50%;top:50%;max-width:190px;padding:5px 8px;border:1px solid color-mix(in srgb,var(--node-color) 58%,var(--mg-line));border-radius:3px;background:var(--mg-paper);color:var(--mg-ink);box-shadow:0 2px 8px rgba(31,41,55,.09);font:600 10px/1.35 'IBM Plex Sans Thai',sans-serif;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;cursor:pointer;transform:translate(-50%,-50%);transition:background .15s,border-color .15s,box-shadow .15s;user-select:none}.mg-node[data-category="acquisition"]{--node-color:var(--mg-amber);--node-tint:var(--mg-soft)}.mg-node[data-category="lead"]{--node-color:var(--mg-blue);--node-tint:var(--mg-blue-soft)}.mg-node[data-category="revenue"]{--node-color:var(--mg-mustard);--node-tint:var(--mg-mustard-soft)}.mg-node:before{content:"";display:inline-block;width:6px;height:6px;margin:0 5px 1px 0;border-radius:50%;background:var(--node-color)}.mg-node:hover,.mg-node[aria-pressed="true"]{background:var(--node-tint);border-color:var(--node-color);box-shadow:0 5px 16px rgba(31,41,55,.2);z-index:99!important}.mg-node[aria-pressed="true"]{font-weight:800}.mg-node.is-dim{opacity:.16!important;filter:grayscale(.7)}.mg-cluster-label{position:absolute;z-index:1;padding:4px 8px;border-bottom:2px solid var(--mg-amber);background:color-mix(in srgb,var(--mg-paper) 86%,transparent);font:700 9px Manrope,'IBM Plex Sans Thai',sans-serif;letter-spacing:.09em;text-transform:uppercase;color:var(--mg-muted);pointer-events:none;white-space:nowrap}.mg-cluster-label[data-category="lead"]{border-color:var(--mg-blue)}.mg-cluster-label[data-category="revenue"]{border-color:var(--mg-mustard)}.mg-stage-hint{position:absolute;left:18px;bottom:13px;z-index:3;color:var(--mg-muted);font-size:10px;line-height:1.45}.mg-zoom-readout{position:absolute;right:15px;bottom:12px;z-index:3;padding:4px 7px;background:var(--mg-paper);border:1px solid var(--mg-line);color:var(--mg-muted);font:10px 'IBM Plex Mono',monospace}
.mg-sidebar{position:absolute;left:0;top:0;bottom:0;width:282px;z-index:4;display:flex;flex-direction:column;background:color-mix(in srgb,var(--mg-paper) 96%,transparent);border-right:1px solid var(--mg-line);box-shadow:12px 0 30px rgba(31,41,55,.1);transform:translateX(-103%);transition:transform .32s cubic-bezier(.16,1,.3,1)}.mg-sidebar[data-open="true"]{transform:translateX(0)}.mg-side-title{padding:17px 18px 11px;color:var(--mg-muted);font:700 10px Manrope,'IBM Plex Sans Thai',sans-serif;letter-spacing:.14em;text-transform:uppercase;border-bottom:1px solid var(--mg-line)}.mg-category-list{display:grid;gap:5px;padding:10px 10px 13px;border-bottom:1px solid var(--mg-line)}.mg-category{display:grid;grid-template-columns:9px minmax(0,1fr) auto;align-items:center;gap:8px;width:100%;padding:8px;border:1px solid transparent;background:transparent;color:var(--mg-ink);text-align:left;cursor:pointer;font:600 11px 'IBM Plex Sans Thai',sans-serif}.mg-category:hover,.mg-category[aria-pressed="true"]{background:var(--mg-soft);border-color:var(--mg-line)}.mg-node-dot{width:7px;height:7px;border-radius:50%;background:var(--cat-color,var(--mg-amber))}.mg-category[data-category="lead"] .mg-node-dot,.mg-search-row[data-category="lead"] .mg-node-dot{background:var(--mg-blue)}.mg-category[data-category="revenue"] .mg-node-dot,.mg-search-row[data-category="revenue"] .mg-node-dot{background:var(--mg-mustard)}.mg-category-count{font:10px 'IBM Plex Mono',monospace;color:var(--mg-muted)}.mg-browse{overflow:auto;padding:4px 0 18px}.mg-browse-group{padding:0 0 8px}.mg-browse-heading{padding:10px 18px 5px;color:var(--mg-muted);font:700 9px Manrope,'IBM Plex Sans Thai',sans-serif;letter-spacing:.12em;text-transform:uppercase}.mg-browse-row{display:flex;align-items:center;gap:8px;width:100%;padding:6px 18px;border:0;background:transparent;color:var(--mg-ink);text-align:left;font:500 11px 'IBM Plex Sans Thai',sans-serif;cursor:pointer}.mg-browse-row:hover,.mg-browse-row[aria-pressed="true"]{background:var(--mg-soft);font-weight:700}.mg-browse-row .mg-browse-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mg-detail{min-width:0;display:flex;flex-direction:column;gap:15px;padding:20px 20px 22px;background:var(--mg-paper);border-left:1px solid var(--mg-line);background-image:radial-gradient(circle,var(--mg-dot) .8px,transparent 1px);background-size:17px 17px}.mg-detail-card{min-height:100%;padding:17px;background:color-mix(in srgb,var(--mg-paper) 94%,transparent);border:1px solid var(--mg-line);border-top:3px solid var(--mg-amber)}.mg-detail-kicker{color:var(--mg-muted);font:700 9px Manrope,'IBM Plex Sans Thai',sans-serif;letter-spacing:.13em;text-transform:uppercase}.mg-detail h3{margin:8px 0 3px;font:800 23px/1.16 Manrope,'IBM Plex Sans Thai',sans-serif;letter-spacing:-.04em;overflow-wrap:anywhere}.mg-detail-full{display:block;margin-bottom:13px;color:var(--mg-muted);font-size:12px}.mg-detail-definition{font-size:13px;line-height:1.65;margin:0 0 14px}.mg-detail-block{margin:13px 0 0;padding-top:12px;border-top:1px solid var(--mg-line)}.mg-detail-block b{display:block;margin-bottom:5px;color:var(--mg-muted);font:700 9px Manrope,'IBM Plex Sans Thai',sans-serif;letter-spacing:.1em;text-transform:uppercase}.mg-detail-block p,.mg-detail-block code{display:block;margin:0;font-size:12px;line-height:1.6;white-space:pre-line;overflow-wrap:anywhere}.mg-detail-block code{padding:8px 9px;background:var(--mg-soft);border-left:3px solid var(--mg-amber);font:11px/1.65 'IBM Plex Mono','IBM Plex Sans Thai',monospace}.mg-detail-link{display:inline-flex;margin-top:16px;padding:9px 12px;background:var(--mg-amber);border:1px solid var(--mg-amber);color:#1F2937;font-size:11px;font-weight:700;text-decoration:none}.mg-detail-link:hover{background:#F09420;color:#1F2937}.mg-detail-empty{display:grid;place-items:center;min-height:430px;text-align:center;color:var(--mg-muted);padding:15px}.mg-detail-empty strong{display:block;margin:0 0 6px;color:var(--mg-ink);font-size:13px}.mg-detail-empty span{font-size:12px}
@media(max-width:1120px){.mg-topbar{grid-template-columns:auto minmax(180px,1fr);grid-template-areas:"brand controls" "search search" "stat stat"}.mg-top-controls{justify-content:flex-start}.mg-workspace{grid-template-columns:minmax(0,1fr) 300px}.mg-stage{height:630px}}
@media(max-width:760px){.metrics-graph{margin:14px auto 24px;padding:0 10px}.mg-intro{grid-template-columns:1fr;gap:12px;padding:12px 7px 14px}.mg-mascots{justify-self:start}.mg-mascots img{width:96px;height:90px}.mg-console{margin:0 -1px}.mg-topbar{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"brand controls" "search search" "stat stat";padding:12px;gap:10px}.mg-brandlock{gap:8px}.mg-brandcopy b{font-size:11px}.mg-brandcopy span{font-size:8px}.mg-top-controls{gap:5px}.mg-btn{min-height:32px;padding:5px 8px;font-size:10px}.mg-btn-label-wide{display:none}.mg-stat{font-size:9px}.mg-workspace{display:flex;flex-direction:column;min-height:0}.mg-stage{height:min(136vw,560px);min-height:410px;border-bottom:1px solid var(--mg-line)}.mg-nodes{inset:18px 5px 38px}.mg-node{max-width:136px;padding:4px 5px;font-size:9px}.mg-orbit--a{width:62%;height:29%}.mg-orbit--b{width:82%;height:39%}.mg-orbit--c{width:98%;height:47%}.mg-cluster-label{font-size:8px;padding:3px 5px}.mg-detail{min-height:360px;border-left:0;border-top:1px solid var(--mg-line);padding:12px}.mg-detail-card{min-height:320px;padding:14px}.mg-detail-empty{min-height:280px}.mg-sidebar{position:absolute;top:0;bottom:0;width:min(84vw,320px)}.mg-stage-hint{max-width:68%;font-size:9px}.mg-zoom-readout{font-size:9px}}
@media(prefers-reduced-motion:reduce){.mg-sidebar,.mg-btn,.mg-node{transition:none}}
@media print{.metrics-graph{display:none!important}}
.mg-browse-row[data-category="lead"] .mg-node-dot{background:var(--mg-blue)}.mg-browse-row[data-category="revenue"] .mg-node-dot{background:var(--mg-mustard)}
.mg-btn-label-narrow{display:none}
@media(max-width:760px){.mg-btn-label-wide{display:none}.mg-btn-label-narrow{display:inline}}
@media(max-width:760px){.mg-topbar{grid-template-columns:minmax(0,1fr);grid-template-areas:"brand" "search" "controls" "stat"}.mg-top-controls{justify-content:flex-start}}
'''

GRAPH_CSS += r'''
.mg-stage{background-color:#12161C;background-image:radial-gradient(circle,rgba(214,236,250,.2) .9px,transparent 1.35px),linear-gradient(rgba(214,236,250,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(214,236,250,.045) 1px,transparent 1px),radial-gradient(ellipse at 50% 45%,rgba(214,236,250,.055),transparent 66%);background-size:18px 18px,64px 64px,64px 64px,100% 100%}
.mg-stage:before{inset:0;z-index:0;background:radial-gradient(ellipse at center,transparent 48%,rgba(18,22,28,.34) 100%);pointer-events:none}
.mg-orbit{border-color:rgba(214,236,250,.32)}
.mg-cluster-label{background:rgba(31,41,55,.92);color:#F7F8FA}
.mg-stage-hint{color:#D6ECFA;text-shadow:0 1px 2px #12161C}
.mg-zoom-readout{background:#1F2937;border-color:#D6ECFA;color:#F7F8FA}
.mg-node{appearance:none;width:40px;height:40px;max-width:none;padding:0;border:0;border-radius:50%;background:transparent;color:transparent;font-size:0;line-height:0;box-shadow:none;overflow:visible}
.mg-node:before{content:"";position:absolute;display:block;inset:7px;margin:0;border:1px solid color-mix(in srgb,var(--node-color) 62%,#1F2937);border-radius:50%;background:radial-gradient(circle at 30% 24%,#FFFFFF 0 5%,color-mix(in srgb,var(--node-color) 34%,#FFFFFF) 17%,var(--node-color) 58%,color-mix(in srgb,var(--node-color) 68%,#1F2937) 100%);box-shadow:inset -4px -5px 7px rgba(31,41,55,.48),inset 2px 2px 4px rgba(255,255,255,.76),0 4px 9px rgba(0,0,0,.42);transition:transform .16s ease,box-shadow .16s ease}
.mg-node:after{content:"";position:absolute;left:14px;top:10px;width:6px;height:4px;border-radius:50%;background:rgba(255,255,255,.82);transform:rotate(-28deg);pointer-events:none}
.mg-node:hover,.mg-node[aria-pressed="true"]{background:transparent;border-color:transparent;box-shadow:none}
.mg-node:hover:before,.mg-node:focus-visible:before{transform:scale(1.13);box-shadow:0 0 0 3px color-mix(in srgb,var(--node-color) 35%,transparent),inset -4px -5px 7px rgba(31,41,55,.48),inset 2px 2px 4px rgba(255,255,255,.76),0 7px 15px rgba(0,0,0,.52)}
.mg-node[aria-pressed="true"]:before{box-shadow:0 0 0 3px color-mix(in srgb,var(--node-color) 42%,transparent),inset -4px -5px 7px rgba(31,41,55,.48),inset 2px 2px 4px rgba(255,255,255,.76),0 5px 14px rgba(0,0,0,.52)}
.mg-node:focus-visible{outline:2px solid #F7F8FA;outline-offset:1px}
.mg-tooltip{position:absolute;z-index:1000;max-width:min(260px,calc(100% - 20px));padding:7px 11px;border:1px solid var(--mg-amber);background:#1F2937;color:#F7F8FA;box-shadow:0 5px 16px rgba(0,0,0,.38);font:600 12px/1.45 'IBM Plex Sans Thai',sans-serif;white-space:normal;overflow-wrap:anywhere;pointer-events:none}
.mg-tooltip[hidden]{display:none}
'''

GRAPH_CSS += r'''
.mg-console[data-background="dark"]{--mg-stage-bg:#12161C;--mg-stage-dot:rgba(214,236,250,.2);--mg-stage-grid:rgba(214,236,250,.045);--mg-stage-glow:rgba(214,236,250,.055);--mg-stage-vignette:rgba(18,22,28,.34)}
.mg-console[data-background="canvas"]{--mg-stage-bg:#F7F8FA;--mg-stage-dot:rgba(31,41,55,.15);--mg-stage-grid:rgba(31,41,55,.04);--mg-stage-glow:rgba(255,255,255,.48);--mg-stage-vignette:rgba(255,255,255,.45)}
.mg-console[data-background="warm"]{--mg-stage-bg:#FFF8F0;--mg-stage-dot:rgba(31,41,55,.17);--mg-stage-grid:rgba(31,41,55,.045);--mg-stage-glow:rgba(255,255,255,.52);--mg-stage-vignette:rgba(255,248,240,.42)}
.mg-stage{background-color:var(--mg-stage-bg);background-image:radial-gradient(circle,var(--mg-stage-dot) .9px,transparent 1.35px),linear-gradient(var(--mg-stage-grid) 1px,transparent 1px),linear-gradient(90deg,var(--mg-stage-grid) 1px,transparent 1px),radial-gradient(ellipse at 50% 45%,var(--mg-stage-glow),transparent 66%)}
.mg-stage:before{background:radial-gradient(ellipse at center,transparent 48%,var(--mg-stage-vignette) 100%)}
.mg-select{min-height:34px;max-width:150px;padding:6px 24px 6px 9px;border:1px solid var(--mg-line);border-radius:3px;background:var(--mg-paper);color:var(--mg-ink);font:600 11px 'IBM Plex Sans Thai',sans-serif;cursor:pointer}.mg-select:focus-visible{outline:3px solid var(--mg-amber);outline-offset:2px}
.mg-mode-label{padding:0 2px;color:var(--mg-muted);font:700 9px Manrope,'IBM Plex Sans Thai',sans-serif;letter-spacing:.08em;text-transform:uppercase}
.mg-console[data-mode="2d"] .mg-node:before{inset:9px;border:1px solid color-mix(in srgb,var(--node-color) 70%,#1F2937);background:var(--node-color);box-shadow:0 2px 6px rgba(0,0,0,.3)}
.mg-console[data-mode="2d"] .mg-node:after{display:none}
.mg-console[data-mode="2d"] .mg-node:hover:before,.mg-console[data-mode="2d"] .mg-node:focus-visible:before,.mg-console[data-mode="2d"] .mg-node[aria-pressed="true"]:before{box-shadow:0 0 0 3px color-mix(in srgb,var(--node-color) 42%,transparent),0 3px 8px rgba(0,0,0,.3)}
.mg-orbit,.mg-axis{transition:opacity .18s}
.mg-console[data-mode="2d"] .mg-orbit{opacity:.35;transform:translate(-50%,-50%) rotate(0)}
.mg-console[data-mode="2d"] .mg-axis{opacity:.45}
.mg-console[data-mode="2d"] .mg-axis--x{transform:rotate(0)}.mg-console[data-mode="2d"] .mg-axis--y{transform:rotate(90deg)}
@media(max-width:760px){.mg-select{max-width:134px;min-height:32px;padding:5px 19px 5px 7px;font-size:10px}.mg-mode-label{font-size:8px}}
@media print{body.viewer-ready .page[hidden]{display:block!important}#guideViewer{display:contents!important}#guideControls{display:none!important}body.viewer-ready[data-view="graph"] #guideViewer{display:contents!important}body.viewer-ready #metrics-graph{display:none!important}}
'''

VIEWER_CSS = r'''
body.viewer-ready[data-view="guide"] #metrics-graph{display:none}
body.viewer-ready[data-view="graph"] #guideViewer{display:none}
body.viewer-ready .page[hidden]{display:none}
.page-controls{max-width:1120px;margin:22px auto 0;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--paper);border:1px solid var(--line);border-top:3px solid var(--amber)}
.page-control-button{min-height:40px;padding:8px 13px;border:1px solid var(--line);background:var(--paper);color:var(--ink);font:700 12px 'IBM Plex Sans Thai',sans-serif;cursor:pointer}.page-control-button:hover:not(:disabled){border-color:var(--amber);background:var(--tint)}.page-control-button:disabled{opacity:.42;cursor:not-allowed}.page-control-button:focus-visible{outline:3px solid var(--amber);outline-offset:2px}
.page-control-current{display:grid;justify-items:center;gap:1px;text-align:center}.page-control-current .caps{color:var(--tint-ink);font-size:9px}.page-control-current strong{font:800 18px Manrope,'IBM Plex Sans Thai',sans-serif;color:var(--amber)}.page-control-current span:last-child{font-size:11px;color:var(--muted)}
@media(max-width:760px){.page-controls{margin:12px 10px 0;padding:9px;gap:7px}.page-control-button{min-height:38px;padding:7px 9px;font-size:10px}.page-control-current .caps{font-size:8px}.page-control-current strong{font-size:15px}.page-control-current span:last-child{max-width:130px;font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
@media print{.page-controls{display:none!important}body.viewer-ready #guideViewer{display:contents!important}}
@page{size:A4 portrait;margin:5mm}
@media print{body{font-size:11px;line-height:1.48}.page{padding:0 7px;break-inside:avoid;break-after:page}.page:last-child{break-after:auto}.mast{margin-bottom:8px}.page-head{margin-bottom:10px;gap:8px}h1{font-size:43px}h2{font-size:30px}.page-no{font-size:36px;padding:5px 8px}.subtitle{font-size:14px;margin-top:6px}.intro{font-size:10.5px;margin-top:6px}.eyebrow{font-size:9px;margin-bottom:6px}.page-content{gap:7px}.grid{gap:6px}.card{padding:9px}.metric h3{font-size:20px}.metric .full{font-size:10px;margin:3px 0 7px}.metric p{font-size:10.5px;line-height:1.4;margin-bottom:6px}.formula{font-size:9.5px;padding:6px 8px;margin:5px 0}.unit{font-size:9px}.mini-example{font-size:10px}.reading{font-size:10px!important}.band,.example{padding:8px 10px}.guide{margin-top:8px;padding:8px;gap:9px}.guide-art,.guide-art img{height:86px}.guide-notes{gap:4px 6px}.role-note{padding:4px 6px}.role-note p,.scenario p{font-size:9px}.guide .name{font-size:9px}.scenario{padding:5px 7px;gap:4px 6px}.cta{font-size:9px;padding:4px 6px}.foot{font-size:9px;margin-top:7px;padding-top:5px}.toc{gap:5px 12px}.toc-group{padding:6px 8px}.toc-group a{font-size:10px;padding:2px 0}.toc-group h3{font-size:11px}.cover .toc-group{padding:5px 7px}.cover .guide{margin-top:6px;padding:6px;gap:6px}.cover .guide-art,.cover .guide-art img{height:78px}.cover .role-note{padding:3px 5px}.cover .scenario{padding:4px 6px}.cover .page-head{padding:0 0 6px}#lead-performance .page-content{gap:4px}#lead-performance .card{padding:7px}#lead-performance .metric p{margin-bottom:4px}#lead-performance .formula{padding:5px 7px;margin:4px 0}#lead-performance .guide{margin-top:5px;padding:6px;gap:7px}#lead-performance .guide-art,#lead-performance .guide-art img{height:72px}#lead-performance .scenario{padding:4px 6px}#lead-performance .foot{margin-top:4px;padding-top:4px}}
'''

GRAPH_HTML = r'''
<section class="metrics-graph" id="metrics-graph" aria-labelledby="mg-title">
  <div class="mg-intro">
    <div><p class="eyebrow caps">Interactive / Marketing Measurement</p><h2 id="mg-title">Marketing <span class="accent">Metrics</span></h2><p class="mg-intro-copy">เลือก node เพื่ออ่านความหมาย สูตร หน่วย ตัวอย่างสมมติ และข้อควรระวัง ลากเพื่อหมุน ใช้ล้อเมาส์เพื่อซูม หรือค้นหาคำศัพท์โดยตรง</p></div>
    <aside class="mg-mascots" aria-label="ผู้ช่วยประจำกราฟ: zuri และน้องวางใจ"><img src="assets/mascot/metrics-pair-chart_gen-04ac9b83.png" width="240" height="210" alt="zuri ชี้กราฟ และน้องวางใจชี้สัญญาณ"><div class="mg-mascot-names"><span>zuri · อธิบาย</span><span>น้องวางใจ · ชี้สัญญาณ</span></div></aside>
  </div>
  <div class="mg-console" id="metricsGraph" data-theme="light" data-mode="3d" data-background="dark">
    <header class="mg-topbar">
      <div class="mg-brandlock">'''+logo(True)+r'''<div class="mg-brandcopy"><b>Marketing Metrics</b><span>2D / 3D vocabulary graph</span></div></div>
      <label class="mg-search-wrap"><span class="mg-search-mark" aria-hidden="true">⌕</span><input class="mg-search" id="mgSearch" type="search" placeholder="ค้นหาคำศัพท์ เช่น CTR, MQL, AOV" autocomplete="off" aria-label="ค้นหาคำศัพท์ metrics"><span class="mg-search-results" id="mgSearchResults" role="listbox" aria-label="ผลการค้นหา"></span></label>
      <div class="mg-top-controls"><button class="mg-btn" id="mgCategories" type="button" aria-expanded="false">☰ <span class="mg-btn-label-wide">Categories</span><span class="mg-btn-label-narrow">หมวด</span></button><span class="mg-mode-label">View</span><button class="mg-btn" id="mgMode2d" type="button" aria-pressed="false">2D</button><button class="mg-btn is-active" id="mgMode3d" type="button" aria-pressed="true">3D</button><label class="mg-mode-label" for="mgBackground">Background</label><select class="mg-select" id="mgBackground" aria-label="เปลี่ยนพื้นหลังกราฟ"><option value="dark">Dark texture</option><option value="canvas">Canvas</option><option value="warm">Warm</option></select><button class="mg-btn is-active" id="mgOrbitToggle" type="button" aria-pressed="true">⟳ <span class="mg-btn-label-wide">Orbit on</span><span class="mg-btn-label-narrow">หมุน</span></button><button class="mg-btn" id="mgExport" type="button" title="ส่งออกคำศัพท์เป็น JSON">⇩ <span class="mg-btn-label-wide">Export JSON</span></button><button class="mg-btn" id="mgRefresh" type="button" title="อ่านรายการใหม่จากคู่มือ">↻</button><button class="mg-btn mg-btn-primary" id="mgFit" type="button">Fit view</button></div>
      <span class="mg-stat" id="mgStat">กำลังโหลดคำศัพท์…</span>
    </header>
    <div class="mg-workspace">
      <div class="mg-stage" id="mgStage" role="group" aria-label="กราฟคำศัพท์แบบ 2D และ 3D ลากเพื่อหมุนและซูมด้วยล้อเมาส์">
        <i class="mg-orbit mg-orbit--a" aria-hidden="true"></i><i class="mg-orbit mg-orbit--b" aria-hidden="true"></i><i class="mg-orbit mg-orbit--c" aria-hidden="true"></i><i class="mg-axis mg-axis--x" aria-hidden="true"></i><i class="mg-axis mg-axis--y" aria-hidden="true"></i>
        <span class="mg-cluster-label" data-category="acquisition">Acquisition</span><span class="mg-cluster-label" data-category="lead">Lead &amp; Conversion</span><span class="mg-cluster-label" data-category="revenue">Revenue &amp; Operations</span>
        <div class="mg-nodes" id="mgNodes"></div><div class="mg-stage-hint">ลากเพื่อหมุน · เลื่อนล้อเมาส์เพื่อซูม · เลือก node เพื่อเปิดคำอธิบาย</div><span class="mg-zoom-readout" id="mgZoomReadout">100%</span>
        <aside class="mg-sidebar" id="mgSidebar" data-open="false" aria-label="หมวดและรายการ metrics"><div class="mg-side-title">Marketing Metrics / Browse</div><div class="mg-category-list" id="mgCategoriesList"></div><div class="mg-browse" id="mgBrowse"></div></aside>
      </div>
      <aside class="mg-detail" id="mgDetail" aria-live="polite" aria-label="รายละเอียดคำศัพท์"><div class="mg-detail-card mg-detail-empty"><div><strong>เลือก metric หนึ่งคำ</strong><span>กด node, ผลค้นหา หรือรายการจากหมวด เพื่ออ่านรายละเอียดที่นี่</span></div></div></aside>
    </div>
  </div>
</section>
'''

GRAPH_SCRIPT = r'''
(() => {
  const root = document.getElementById('metricsGraph');
  const stage = document.getElementById('mgStage');
  if (!root || !stage) return;
  const tooltip = document.createElement('div');
  tooltip.className = 'mg-tooltip';
  tooltip.id = 'mgTooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  stage.appendChild(tooltip);

  const groups = [
    {key:'acquisition', title:'Acquisition', note:'การมองเห็นและความสนใจ', center:[140,0,0], radius:84.6},
    {key:'lead', title:'Lead & Conversion', note:'การคัดกรองและผลลัพธ์', center:[-70,34.91,121.24], radius:141.99},
    {key:'revenue', title:'Revenue & Operations', note:'รายได้ กำไร และการส่งมอบ', center:[-70,4.94,-121.24], radius:84.6}
  ];
  const groupByKey = new Map(groups.map(group => [group.key, group]));
  const extras = [
    {id:'metric-mql', title:'MQL', full:'Marketing-qualified lead', definition:'Lead ไม่ซ้ำที่ marketing ประเมินว่าเข้าเกณฑ์ fit และมี engagement ตามเกณฑ์ที่ตกลงกัน; อาจต้อง nurture ต่อก่อนส่งให้ sales.', formula:'COUNT DISTINCT lead_id ที่เข้า stage MQL ใน cohort', unit:'lead_id', example:'ใน cohort ตัวอย่าง มี 60 MQL และ 24 รายได้รับการยอมรับเป็น SQL', reading:'ตกลง fit, engagement, stage-entry event และกติกา re-entry ร่วมกัน; เทียบ cohort ที่มีช่วงติดตามเดียวกัน', page:'conversion', category:'lead'},
    {id:'metric-sql', title:'SQL', full:'Sales-qualified lead', definition:'Lead ที่ sales ตรวจแล้วว่าเข้าเกณฑ์ธุรกิจ มี need หรือ intent ตามที่ทีมตกลง และรับเข้าสู่ direct sales follow-up.', formula:'COUNT DISTINCT lead_id ที่ sales accept เป็น SQL', unit:'lead_id', example:'จาก 60 MQL ใน cohort เดียวกัน sales รับ 24 รายเป็น SQL', reading:'การส่ง lead ต่ออย่างเดียวไม่นับเป็น SQL; บันทึกการ accept และเกณฑ์รับช่วงให้ตรวจสอบได้', page:'conversion', category:'lead'}
  ];
  const byId = new Map();
  let terms = [];
  let filter = '';
  let selected = '';
  let yaw = 0.28;
  let pitch = -0.18;
  let graphMode = '3d';
  let zoom = 1;
  let autoOrbit = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dragging = false;
  let lastPoint = null;
  let inView = true;
  let searchTimer = 0;
  const nodeLayer = document.getElementById('mgNodes');
  const detail = document.getElementById('mgDetail');
  const search = document.getElementById('mgSearch');
  const searchResults = document.getElementById('mgSearchResults');
  const categoryList = document.getElementById('mgCategoriesList');
  const browse = document.getElementById('mgBrowse');
  const stat = document.getElementById('mgStat');
  const zoomReadout = document.getElementById('mgZoomReadout');
  const nodeElements = new Map();
  const coordinates = new Map();
  const flatCoordinates = new Map();

  function plain(el) { return (el?.textContent || '').replace(/\s+/g, ' ').trim(); }
  function categoryFor(page, title) {
    if (page === 'awareness' || page === 'consideration' || ['Leads','CPL','Media Spend'].includes(title)) return 'acquisition';
    if (page === 'conversion' || page === 'lead-performance') return 'lead';
    return 'revenue';
  }
  function readGuideTerms() {
    const cards = [...document.querySelectorAll('article.metric')].map(card => {
      const page = card.closest('.page')?.id || 'reading';
      const title = plain(card.querySelector('h3'));
      const id = card.id || ('metric-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
      return {
        id, title,
        full: plain(card.querySelector('.full')),
        definition: plain(card.querySelector('p')),
        formula: plain(card.querySelector('.formula')),
        unit: plain(card.querySelector('.unit')).replace(/^หน่วย:\s*/, ''),
        example: plain(card.querySelector('.mini-example')).replace(/^ตัวอย่างสมมติ\s*[·•]\s*/, ''),
        reading: plain(card.querySelector('.reading')),
        page, category: categoryFor(page, title), href: '#' + id
      };
    }).filter(term => term.title);
    return [...cards, ...extras.map(term => ({...term, href:'#'+term.id}))];
  }
  function assignCoordinates() {
    coordinates.clear(); flatCoordinates.clear();
    for (const group of groups) {
      const items = terms.filter(term => term.category === group.key);
      const golden = Math.PI * (3 - Math.sqrt(5));
      const groupAngle = -Math.PI / 2 + groups.indexOf(group) * Math.PI * 2 / groups.length;
      group.flatCenter = [Math.cos(groupAngle) * 178, Math.sin(groupAngle) * 178];
      items.forEach((term, index) => {
        const y = 1 - 2 * (index + .5) / items.length;
        const circle = Math.sqrt(Math.max(0, 1 - y * y));
        const angle = golden * index;
        const spread = group.radius * .82;
        coordinates.set(term.id, [
          group.center[0] + Math.cos(angle) * circle * spread,
          group.center[1] + y * spread,
          group.center[2] + Math.sin(angle) * circle * spread
        ]);
        const flatRadius = 86 * Math.sqrt((index + .5) / items.length);
        flatCoordinates.set(term.id, [group.flatCenter[0] + Math.cos(angle) * flatRadius, 0, group.flatCenter[1] + Math.sin(angle) * flatRadius]);
      });
    }
  }
  function showNodeTooltip(node, term) {
    tooltip.textContent = term.title;
    tooltip.hidden = false;
    tooltip.style.visibility = 'hidden';
    tooltip.style.left = '-10000px';
    tooltip.style.top = '-10000px';
    requestAnimationFrame(() => {
      const stageRect = stage.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const tipRect = tooltip.getBoundingClientRect();
      const left = Math.max(8, Math.min(nodeRect.left - stageRect.left + nodeRect.width / 2 - tipRect.width / 2, stageRect.width - tipRect.width - 8));
      const above = nodeRect.top - stageRect.top - tipRect.height - 10;
      const below = nodeRect.bottom - stageRect.top + 10;
      const top = Math.max(8, Math.min(above >= 8 ? above : below, stageRect.height - tipRect.height - 8));
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      tooltip.style.visibility = 'visible';
    });
  }
  function hideNodeTooltip() {
    tooltip.hidden = true;
    tooltip.style.visibility = '';
  }
  function createNode(term) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mg-node';
    button.dataset.id = term.id;
    button.dataset.category = term.category;
    button.dataset.label = term.title;
    button.setAttribute('aria-describedby', 'mgTooltip');
    button.setAttribute('aria-label', `${term.title}. เปิดคำอธิบาย metric`);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('pointerenter', () => showNodeTooltip(button, term));
    button.addEventListener('pointerleave', hideNodeTooltip);
    button.addEventListener('focus', () => showNodeTooltip(button, term));
    button.addEventListener('blur', hideNodeTooltip);
    button.addEventListener('click', () => selectTerm(term.id));
    nodeLayer.appendChild(button);
    nodeElements.set(term.id, button);
  }
  function detailBlock(label, value, code = false) {
    if (!value) return null;
    const block = document.createElement('div'); block.className = 'mg-detail-block';
    const heading = document.createElement('b'); heading.textContent = label;
    const body = document.createElement(code ? 'code' : 'p'); body.textContent = value;
    block.append(heading, body); return block;
  }
  function selectTerm(id) {
    const term = byId.get(id); if (!term) return;
    selected = id;
    for (const [termId, node] of nodeElements) node.setAttribute('aria-pressed', String(termId === id));
    const group = groupByKey.get(term.category);
    const card = document.createElement('div'); card.className = 'mg-detail-card';
    const kicker = document.createElement('div'); kicker.className = 'mg-detail-kicker'; kicker.textContent = `${group.title} · Metric detail`;
    const title = document.createElement('h3'); title.textContent = term.title;
    const full = document.createElement('span'); full.className = 'mg-detail-full'; full.textContent = term.full || group.note;
    const definition = document.createElement('p'); definition.className = 'mg-detail-definition'; definition.textContent = term.definition || 'ดูนิยามในคู่มือฉบับเต็ม';
    card.append(kicker, title, full, definition);
    for (const part of [detailBlock('Formula', term.formula, true), detailBlock('Unit', term.unit), detailBlock('Example · hypothetical', term.example), detailBlock('How to read', term.reading)]) if (part) card.appendChild(part);
    const link = document.createElement('a'); link.className = 'mg-detail-link'; link.href = term.href; link.textContent = 'เปิดคำอธิบายในคู่มือ ↗';
    card.appendChild(link); detail.replaceChildren(card);
    document.querySelectorAll('.mg-browse-row').forEach(row => row.setAttribute('aria-pressed', String(row.dataset.id === id)));
    document.querySelectorAll('.mg-search-row').forEach(row => row.setAttribute('aria-selected', String(row.dataset.id === id)));
    searchResults.classList.remove('open');
    if (window.innerWidth < 760) {
      const sidebar = document.getElementById('mgSidebar'); sidebar.dataset.open = 'false';
      document.getElementById('mgCategories').setAttribute('aria-expanded', 'false');
    }
    applyFilter();
  }
  function buildSidebar() {
    categoryList.replaceChildren(); browse.replaceChildren();
    for (const group of groups) {
      const items = terms.filter(term => term.category === group.key);
      const category = document.createElement('button'); category.type = 'button'; category.className = 'mg-category'; category.dataset.category = group.key;
      category.setAttribute('aria-pressed', String(filter === group.key));
      const dot = document.createElement('span'); dot.className = 'mg-node-dot';
      const name = document.createElement('span'); name.textContent = group.title;
      const count = document.createElement('span'); count.className = 'mg-category-count'; count.textContent = items.length;
      category.append(dot, name, count);
      category.addEventListener('click', () => { filter = filter === group.key ? '' : group.key; buildSidebar(); applyFilter(); });
      categoryList.appendChild(category);
      const section = document.createElement('div'); section.className = 'mg-browse-group';
      const heading = document.createElement('div'); heading.className = 'mg-browse-heading'; heading.textContent = `${group.title} (${items.length})`;
      section.appendChild(heading);
      for (const term of items) {
        const row = document.createElement('button'); row.type = 'button'; row.className = 'mg-browse-row'; row.dataset.id = term.id; row.setAttribute('aria-pressed', String(selected === term.id));
        const rowDot = document.createElement('span'); rowDot.className = 'mg-node-dot'; rowDot.dataset.category = group.key;
        const label = document.createElement('span'); label.className = 'mg-browse-name'; label.textContent = term.title;
        row.dataset.category = group.key; row.append(rowDot, label); row.addEventListener('click', () => selectTerm(term.id)); section.appendChild(row);
      }
      browse.appendChild(section);
    }
    document.querySelectorAll('.mg-category').forEach(button => button.setAttribute('aria-pressed', String(filter === button.dataset.category)));
    stat.textContent = `${terms.length} terms · ${groups.length} clusters · ${graphMode.toUpperCase()} view`;
  }
  function applyFilter() {
    for (const term of terms) {
      const node = nodeElements.get(term.id);
      node.classList.toggle('is-dim', Boolean(filter && term.category !== filter));
    }
    document.querySelectorAll('.mg-category').forEach(button => button.setAttribute('aria-pressed', String(filter === button.dataset.category)));
  }
  function renderSearchResults(query) {
    searchResults.replaceChildren();
    const q = query.trim().toLowerCase();
    if (!q) { searchResults.classList.remove('open'); return; }
    const matches = terms.filter(term => `${term.title} ${term.full} ${term.definition}`.toLowerCase().includes(q)).slice(0, 20);
    for (const term of matches) {
      const row = document.createElement('button'); row.type = 'button'; row.className = 'mg-search-row'; row.dataset.id = term.id; row.dataset.category = term.category; row.setAttribute('role', 'option');
      const dot = document.createElement('span'); dot.className = 'mg-node-dot';
      const label = document.createElement('strong'); label.textContent = term.title;
      const cat = document.createElement('small'); cat.textContent = groupByKey.get(term.category).title;
      row.append(dot, label, cat); row.addEventListener('click', () => { search.value = ''; selectTerm(term.id); }); searchResults.appendChild(row);
    }
    searchResults.classList.toggle('open', matches.length > 0);
  }
  function rotatePoint(point) {
    const [x, y, z] = point;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    if (graphMode === '2d') return [x * cy - z * sy, 0, x * sy + z * cy];
    const cx = Math.cos(pitch), sx = Math.sin(pitch);
    const rx = x * cy - z * sy;
    const rz = x * sy + z * cy;
    return [rx, y * cx - rz * sx, y * sx + rz * cx];
  }
  function projectPoint(point, width, height) {
    const [x, y, z] = rotatePoint(point);
    const camera = 920;
    const depth = graphMode === '2d' ? 0 : z;
    const perspective = graphMode === '2d' ? 1 : camera / (camera + z);
    const base = Math.min((width - 56) / 650, (height - 82) / 650) * zoom;
    return {x:width / 2 + x * base * perspective, y:height / 2 - (graphMode === '2d' ? z : y) * base * perspective, depth, perspective};
  }
  function positionNodes() {
    const box = stage.getBoundingClientRect();
    const width = box.width, height = box.height;
    if (!width || !height) return;
    for (const term of terms) {
      const node = nodeElements.get(term.id);
      const point = graphMode === '2d' ? flatCoordinates.get(term.id) : coordinates.get(term.id);
      const pos = projectPoint(point, width, height);
      node.style.left = `${pos.x}px`; node.style.top = `${pos.y}px`;
      node.style.zIndex = String(Math.max(1, Math.round(500 + pos.depth)));
      node.style.opacity = String(Math.max(.58, Math.min(1, .8 + pos.perspective * .2)));
      node.style.transform = `translate(-50%,-50%) scale(${Math.max(.78, Math.min(1.08, pos.perspective))})`;
    }
    for (const group of groups) {
      const pos = projectPoint(graphMode === '2d' ? [group.flatCenter[0], 0, group.flatCenter[1]] : group.center, width, height);
      const label = stage.querySelector(`.mg-cluster-label[data-category="${group.key}"]`);
      label.style.left = `${pos.x + 12}px`; label.style.top = `${pos.y - 22}px`;
    }
    zoomReadout.textContent = `${Math.round(zoom * 100)}%`;
    root.dataset.rotationDegrees = String(Math.round((yaw * 180 / Math.PI + 360) % 360));
    root.dataset.rotationRadians = yaw.toFixed(4);
  }
  function setOrbit(value) {
    autoOrbit = value;
    const button = document.getElementById('mgOrbitToggle');
    button.classList.toggle('is-active', autoOrbit); button.setAttribute('aria-pressed', String(autoOrbit));
    button.querySelector('.mg-btn-label-wide').textContent = autoOrbit ? 'Orbit on' : 'Orbit off';
    button.querySelector('.mg-btn-label-narrow').textContent = autoOrbit ? 'หมุนอัตโนมัติ' : 'หยุดหมุน';
  }
  function setMode(mode) {
    graphMode = mode;
    root.dataset.mode = mode;
    pitch = mode === '2d' ? 0 : -0.18;
    for (const [id, active] of [['mgMode2d', mode === '2d'], ['mgMode3d', mode === '3d']]) {
      const button = document.getElementById(id);
      button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active));
    }
    stage.setAttribute('aria-label', `กราฟคำศัพท์แบบ ${mode.toUpperCase()} ลากเพื่อหมุนและซูมด้วยล้อเมาส์`);
    stat.textContent = `${terms.length} terms · ${groups.length} clusters · ${mode.toUpperCase()} view`;
    positionNodes();
  }
  function refresh() {
    terms = readGuideTerms(); byId.clear(); nodeElements.clear(); nodeLayer.replaceChildren();
    for (const term of terms) { term.category = term.category || categoryFor(term.page, term.title); byId.set(term.id, term); createNode(term); }
    assignCoordinates(); buildSidebar(); applyFilter(); positionNodes();
  }
  refresh();
  setOrbit(autoOrbit);

  document.getElementById('mgCategories').addEventListener('click', event => {
    const sidebar = document.getElementById('mgSidebar'); const open = sidebar.dataset.open !== 'true';
    sidebar.dataset.open = String(open); event.currentTarget.setAttribute('aria-expanded', String(open)); event.currentTarget.classList.toggle('is-active', open);
  });
  document.getElementById('mgOrbitToggle').addEventListener('click', () => setOrbit(!autoOrbit));
  document.getElementById('mgFit').addEventListener('click', () => { yaw = .28; pitch = graphMode === '2d' ? 0 : -.18; zoom = 1; filter = ''; buildSidebar(); applyFilter(); positionNodes(); });
  document.getElementById('mgMode2d').addEventListener('click', () => setMode('2d'));
  document.getElementById('mgMode3d').addEventListener('click', () => setMode('3d'));
  document.getElementById('mgBackground').addEventListener('change', event => { root.dataset.background = event.currentTarget.value; });
  document.getElementById('mgRefresh').addEventListener('click', refresh);
  document.getElementById('mgExport').addEventListener('click', () => {
    const data = {source:'zuri Marketing Metrics Map', generatedAt:new Date().toISOString(), nodes:terms.map(term => ({...term, category:groupByKey.get(term.category).title})), sections:groups.map(group => ({title:group.title, index:groups.indexOf(group), centroid:group.center, radius:group.radius}))};
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}));
    const link = document.createElement('a'); link.href = url; link.download = 'zuri-marketing-metrics.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  search.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => renderSearchResults(search.value), 40); });
  search.addEventListener('keydown', event => { if (event.key === 'Escape') searchResults.classList.remove('open'); if (event.key === 'Enter') { const first = searchResults.querySelector('.mg-search-row'); if (first) first.click(); } });
  document.addEventListener('pointerdown', event => { if (!event.target.closest('.mg-search-wrap')) searchResults.classList.remove('open'); });
  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('.mg-node') || event.target.closest('.mg-sidebar')) return;
    dragging = true; lastPoint = {x:event.clientX,y:event.clientY}; stage.classList.add('is-dragging'); stage.setPointerCapture(event.pointerId); setOrbit(false);
  });
  stage.addEventListener('pointermove', event => {
    if (!dragging || !lastPoint) return;
    yaw = ((yaw + (event.clientX - lastPoint.x) * .008) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    if (graphMode === '3d') pitch = Math.max(-1.05, Math.min(1.05, pitch + (event.clientY - lastPoint.y) * .006));
    lastPoint = {x:event.clientX,y:event.clientY}; positionNodes();
  });
  const endDrag = () => { dragging = false; lastPoint = null; stage.classList.remove('is-dragging'); };
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag); stage.addEventListener('lostpointercapture', endDrag);
  stage.addEventListener('wheel', event => { event.preventDefault(); zoom = Math.max(.7, Math.min(1.65, zoom * (event.deltaY > 0 ? .92 : 1.09))); positionNodes(); }, {passive:false});
  window.addEventListener('resize', positionNodes, {passive:true});
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { inView = entries.some(entry => entry.isIntersecting); }).observe(root);
  let frame = 0;
  function animate() {
    if (inView && autoOrbit && !document.hidden && !dragging) { yaw = (yaw + .0018) % (Math.PI * 2); positionNodes(); }
    frame = requestAnimationFrame(animate);
  }
  frame = requestAnimationFrame(animate);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), {once:true});
})();
'''

VIEWER_SCRIPT = r'''
(() => {
  const body = document.body;
  const pages = [...document.querySelectorAll('#guideViewer .page')];
  const previous = document.getElementById('previousPage');
  const next = document.getElementById('nextPage');
  const current = document.getElementById('pageCurrent');
  const title = document.getElementById('pageTitle');
  if (!pages.length || !previous || !next) return;
  let activeIndex = 0;
  body.classList.add('viewer-ready');
  const siteNav = document.querySelector('.site-nav');
  if (siteNav) {
    const syncNavHeight = () => document.documentElement.style.setProperty('--site-nav-height', `${siteNav.offsetHeight}px`);
    syncNavHeight();
    new ResizeObserver(syncNavHeight).observe(siteNav);
  }

  function showHash(scrollToTarget = false) {
    const id = decodeURIComponent(location.hash.slice(1));
    document.querySelectorAll('.site-nav [data-site-section]').forEach(link => {
      const active = link.dataset.siteSection === (id === 'metrics-graph' ? 'graph' : 'guide');
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (id === 'metrics-graph') {
      body.dataset.view = 'graph';
      if (scrollToTarget) requestAnimationFrame(() => document.getElementById('metrics-graph').scrollIntoView({block:'start'}));
      return;
    }
    const target = id ? document.getElementById(id) : null;
    const activePage = target?.closest('.page') || pages.find(page => page.id === id) || pages[0];
    activeIndex = pages.indexOf(activePage);
    body.dataset.view = 'guide';
    pages.forEach((page, index) => {
      const active = index === activeIndex;
      page.hidden = !active;
      page.setAttribute('aria-hidden', String(!active));
      page.inert = !active;
    });
    current.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
    title.textContent = activePage.querySelector('h1,h2')?.textContent.replace(/\s+/g, ' ').trim() || '';
    previous.disabled = activeIndex === 0;
    next.disabled = activeIndex === pages.length - 1;
    if (scrollToTarget) requestAnimationFrame(() => (target || activePage).scrollIntoView({block:'start'}));
  }

  previous.addEventListener('click', () => { if (activeIndex > 0) location.hash = pages[activeIndex - 1].id; });
  next.addEventListener('click', () => { if (activeIndex < pages.length - 1) location.hash = pages[activeIndex + 1].id; });
  window.addEventListener('hashchange', () => showHash(true));
  if (!location.hash) history.replaceState(null, '', '#overview');
  showHash(Boolean(location.hash));
})();
'''

def metric_id(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def card(name, full, definition, formula, unit, example, reading):
    return f'<article class="card metric" id="metric-{escape(metric_id(name), quote=True)}"><h3>{name}</h3><span class="full">{full}</span><p>{definition}</p><div class="formula">{formula}</div><span class="unit">{unit}</span><p class="mini-example"><b>ตัวอย่างสมมติ</b> · {example}</p><p class="reading">{reading}</p></article>'

def grid(items, columns='two'):
    return f'<div class="grid {columns}">'+''.join(items)+'</div>'

def band(text):
    return f'<div class="band">{text}</div>'

def example(text, name='ตัวอย่าง A · ข้อมูลสมมติ ไม่ใช่ผลจริงของ zuri'):
    return f'<aside class="example"><div class="example-title">{name}</div>{text}</aside>'

def table(headers, rows, cls=''):
    head=''.join(f'<th scope="col">{x}</th>' for x in headers)
    body=''.join('<tr>'+''.join(f'<td class="accountable">{x}</td>' if cls=='raci' and x in ('A','A/R') else f'<td>{x}</td>' for x in row)+'</tr>' for row in rows)
    return f'<div class="table-block"><p class="scroll-hint">เลื่อนตารางด้านข้างเพื่อดูทุกคอลัมน์ →</p><div class="table-wrap" tabindex="0" role="region" aria-label="ตาราง {cls.upper()} เลื่อนด้านข้างได้"><table class="{cls}"><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div></div>'

SCENARIOS = {
    'overview': ('อยากเริ่มวัดผลแคมเปญ → เลือกหมวดจากคำถามที่ต้องตอบก่อน', 'awareness', 'เริ่มที่ Awareness'),
    'awareness': ('อยากรู้ว่าโฆษณาไปถึงคนพอไหม → ดู Reach แล้วเทียบกับ Frequency', 'consideration', 'ต่อไปดู CTR'),
    'consideration': ('อยากรู้ว่าคอนเทนต์ดึงความสนใจไหม → ดู CTR; เทียบใน audience, placement, objective และช่วงเวลาเดียวกัน', 'conversion', 'ดู Conversion'),
    'conversion': ('มีคนคลิกแต่ยังไม่สมัคร → ตรวจ landing page, form และ conversion event ก่อนเพิ่มงบ', 'lead-performance', 'ตรวจ Lead ต่อ'),
    'revenue': ('ยอดขายโตแต่กำไรไม่โต → ดู contribution หลังหักต้นทุนที่นิยามไว้', 'contribution', 'ดู Contribution'),
    'customer': ('อยากรู้ว่าลูกค้าใหม่คุ้มไหม → เทียบ CAC กับ LTV บน cohort และช่วงที่เก็บครบ', 'aarrr', 'ดู AARRR'),
    'aarrr': ('คนสมัครแล้วไม่กลับมา → นิยาม activation และ return event ให้ชัด', 'customer', 'ดู Customer Value'),
    'team': ('งานสะดุดตอนส่งต่อ → ระบุ owner, สิ่งส่งมอบ และผู้รับช่วง', 'workflow', 'ดู Workflow'),
    'workflow': ('ผลยังอ่านไม่ได้ → เพิ่ม checkpoint เรื่อง tracking ก่อนเปิดแคมเปญ', 'budget', 'ตั้ง KPI & Budget'),
    'budget': ('อยากรู้ว่างบพอไหม → ใช้เป้า lead × CPL เป็นสมมติฐาน แล้วทบทวนจากผลจริง', 'raci', 'ดู RACI'),
    'raci': ('มีหลายคนทำงานเดียวกัน → กำหนด Accountable หลักหนึ่งคน', 'roadmap', 'ดู Roadmap'),
    'roadmap': ('ก่อนเร่งงบ → เริ่มจาก baseline และแก้ tracking ที่ยังขาด', 'outlook', 'ดู 12 เดือน'),
    'outlook': ('ความต้องการเปลี่ยน → ทบทวนสมมติฐานตามรอบและหลักฐานใหม่', 'lead-performance', 'ดู Lead Efficiency'),
    'lead-performance': ('อยากรู้ว่า lead ปิดการขายไหม → ดู lead-to-sale rate ควบคู่ response time', 'order-economics', 'ดู Order economics'),
    'order-economics': ('มีหลาย offer → ดู Offer Mix, units/order และ AOV แยกกัน', 'contribution', 'ดู Contribution'),
    'contribution': ('offer ยอดสูงแต่คืนเยอะ → อ่าน net revenue และ contribution หลังยกเลิก/คืน', 'inventory', 'เช็ก Stock'),
    'inventory': ('ก่อนเพิ่มสื่อ → เช็ก Days of inventory และ bundle capacity', 'reading', 'อ่านวิธีตัดสินใจ'),
    'reading': ('CTR ลดลง → เช็ก objective, audience, placement, creative, tracking และช่วงเวลาเดิมก่อนสรุป', 'overview', 'กลับสารบัญ'),
}

POSES = (
    ('chart', 'metrics-pair-chart_gen-04ac9b83.png', 'zuri ชี้กราฟ และน้องวางใจชี้สัญญาณ'),
    ('clipboard', 'metrics-pair-clipboard_gen-80d72fb8.png', 'zuri อธิบายคลิปบอร์ด และน้องวางใจยกมือ'),
    ('analysis', 'metrics-pair-analysis_gen-d190a201.png', 'zuri วิเคราะห์แล็ปท็อป และน้องวางใจช่วยสังเกต'),
)

def page(slug, category, title, subtitle, intro, body, zuri, wangjai, refs, template=False):
    n=len(PAGES)+1
    ref_links=''.join(f'<a href="#source-{r}">{r}</a>' for r in refs.split())
    note='<span class="template">แม่แบบเพื่อการเรียนรู้ · ปรับตามธุรกิจจริง</span>' if template else ''
    pose, mascot_file, mascot_alt = POSES[(n-1)%len(POSES)]
    scenario, target, action = SCENARIOS[slug]
    guide=f'''<aside class="guide guide--{pose}" aria-label="คำแนะนำจาก zuri และน้องวางใจ"><div class="guide-art"><img src="assets/mascot/{mascot_file}" width="240" height="210" alt="{mascot_alt}"></div><div class="guide-notes"><div class="role-note"><span class="name">zuri · อธิบาย</span><p>{zuri}</p></div><div class="role-note"><span class="name">น้องวางใจ · จุดตรวจ</span><p>{wangjai}</p></div><div class="scenario"><span class="scenario-label">ลองดูสถานการณ์</span><p>{scenario}</p><a class="cta" href="#{target}">{action}</a></div></div></aside>'''
    guide_before=guide if n in (1,4,7,10,13,16) else ''
    guide_after='' if guide_before else guide
    PAGES.append(f'''<section class="page {'cover' if n==1 else ''}" id="{slug}" aria-labelledby="heading-{slug}" data-page="{n:02}">
<header class="mast"><a class="logo-pad" href="#overview" aria-label="Zuri-Go — กลับสารบัญ">{logo()}</a><div class="mast-meta caps"><b>Metric Reference / REV 04</b>ฉบับร่าง · 29 SEP 2026</div></header>
<div class="page-head"><div><p class="eyebrow caps">{category}</p><h{'1' if n==1 else '2'} id="heading-{slug}">{title}</h{'1' if n==1 else '2'}><p class="subtitle">{subtitle}</p><p class="intro">{intro}</p>{note}</div><span class="page-no" aria-label="หน้า {n}">{n:02}</span></div>
{guide_before}<div class="page-content">{body}</div>{guide_after}
<footer class="foot"><div><span class="sources-label">อ้างอิง </span>{ref_links}<br><span class="caps">Business, in clear motion.</span></div><div class="folio mono"><a href="#overview">สารบัญ</a> {n:02} / {PAGE_TOTAL}</div></footer></section>''')

toc_groups=[('A / Metrics — ตัวเลขการตลาด',[('awareness','Awareness','02'),('consideration','Consideration','03'),('conversion','Conversion','04'),('revenue','Revenue & Profit','05'),('customer','Customer Value','06')]),('B / Growth — วงจรลูกค้า',[('aarrr','AARRR: จากการรู้จักสู่รายได้','07')]),('C / Team & Workflow — คนและงาน',[('team','โครงสร้างทีมการตลาด','08'),('workflow','Workflow และทักษะ','09')]),('D / Planning — เป้าหมายและแผน',[('budget','KPI & Budget','10'),('raci','RACI: ใครทำ ใครตัดสินใจ','11'),('roadmap','Roadmap 90 วัน','12'),('outlook','Outlook 12 เดือน','13')]),('E / Commerce & Operations — Lead, Order, Stock', [('lead-performance','Lead & Sales Efficiency','14'),('order-economics','Order & Offer Economics','15'),('contribution','Contribution & Returns','16'),('inventory','Inventory & Fulfillment','17')]),('F / Reading & Sources — อ่านผลอย่างมีหลักฐาน',[('reading','ข้อควรตรวจและแหล่งอ้างอิง','18')])]
toc='<nav class="toc" aria-label="สารบัญทุกหน้า">'+''.join('<div class="toc-group"><h3>'+label+'</h3>'+''.join(f'<a href="#{slug}"><span>{text}</span><span>{n} ↗</span></a>' for slug,text,n in links)+'</div>' for label,links in toc_groups)+'</nav>'
page('overview','Marketing / Measurement / Planning','Marketing metrics,<br><span class="accent">mapped.</span>','อ่านตัวเลขให้เข้าใจ แล้วเชื่อมไปถึงคนและแผน','คู่มือสำหรับเจ้าของธุรกิจและทีมการตลาด ตั้งแต่คนเห็นโฆษณาไปจนถึงคุณค่าระยะยาวของลูกค้า พร้อมสูตร ตัวอย่าง และแนวทางทำงานร่วมกัน',
'<div class="funnel"><div><b>01 / Awareness</b><span>เห็นแบรนด์มากแค่ไหน</span></div><div><b>02 / Consideration</b><span>ความสนใจไปต่อหรือไม่</span></div><div><b>03 / Conversion</b><span>เกิดผลลัพธ์ที่ต้องการหรือยัง</span></div></div>'+toc,
'เลือกหมวดจากคำถามที่กำลังเจอได้เลยค่ะ แต่ละหน้ามีทั้งความหมาย วิธีวัด และวิธีอ่านผล','ตัวเลขต้องมีช่วงเวลา แหล่งข้อมูล และเจ้าของการตัดสินใจเสมอ','G01 G06 G07 G08')

page('awareness','A / Metrics · 01 Awareness','Awareness','คนเห็นมากแค่ไหน','แยก “จำนวนครั้งที่แสดงผล” ออกจาก “จำนวนคนที่เข้าถึง” ก่อนประเมินประสิทธิภาพของงบ',grid([
card('Impressions','จำนวนการแสดงผล','จำนวนครั้งที่โฆษณาแสดงผล คนเดิมเห็นหลายครั้งได้','อ่านจำนวนการแสดงผลจากแพลตฟอร์ม','หน่วย: ครั้ง','100,000 ครั้ง','ยังไม่ยืนยันว่าคนจำแบรนด์หรือสนใจซื้อ'),
card('Reach','การเข้าถึงที่ไม่ซ้ำ · เพิ่มเติม','จำนวนคนหรือบัญชีไม่ซ้ำที่แพลตฟอร์มประมาณว่าเข้าถึง','อ่าน Reach ของขอบเขตและช่วงที่เลือก','หน่วย: คน/บัญชี ตามแพลตฟอร์ม','40,000 คน','Reach ต่างช่องทางอาจมีคนซ้ำ ห้ามบวกเป็นยอดคนไม่ซ้ำทันที'),
card('Frequency','ความถี่เฉลี่ย · เพิ่มเติม','โฆษณาถูกแสดงต่อคนเดิมบ่อยแค่ไหนในช่วงที่เลือก','Impressions ÷ Reach','หน่วย: ครั้งต่อคนโดยเฉลี่ย','100,000 ÷ 40,000 = 2.5','ใช้กลุ่มและเวลาเดียวกัน ดูร่วมกับ CTR และผลลัพธ์ ไม่มีเพดานเดียวทุกธุรกิจ'),
card('CPM','Cost per mille','ค่าโฆษณาต่อการแสดงผลหนึ่งพันครั้ง','(ค่าโฆษณา ÷ Impressions) × 1,000','หน่วย: บาทต่อ 1,000 ครั้ง','(10,000 ÷ 100,000) × 1,000 = 100 บาท','CPM ต่ำไม่ได้ยืนยันว่าคนที่เห็นเป็นลูกค้าที่เหมาะสม')
])+example('<p>ค่าโฆษณา <b>10,000 บาท</b> · Impressions <b>100,000 ครั้ง</b> · Reach <b>40,000 คน</b><br>ข้อมูลสมมติในแคมเปญและช่วงเวลาเดียวกัน ใช้ต่อกับตัวอย่างหน้า 03–05</p>'),
'เริ่มจากแยกจำนวนครั้งที่แสดงผลออกจากจำนวนคนที่เข้าถึงค่ะ','Reach ไม่ใช่ค่าที่บวกข้ามช่องทางแล้วเป็นคนไม่ซ้ำโดยอัตโนมัติ','G02 G06 S10')

page('consideration','A / Metrics · 02 Consideration','Consideration','ความสนใจไปต่อหรือไม่','คลิกเป็นจุดเริ่มต้นของความสนใจ ต้องดูประเภทคลิกและคุณภาพของคนที่เข้ามาต่อด้วย',grid([
card('Clicks','จำนวนคลิก','จำนวนครั้งที่เกิดคลิกตามประเภทที่เลือก เช่น link clicks คนเดิมคลิกซ้ำได้','นับคลิกตามชนิดที่เลือก','หน่วย: ครั้ง','2,000 tracked link clicks','All clicks, link clicks และ sessions เป็นคนละฐาน อย่าใช้สลับกัน'),
card('CTR','Click-through rate','สัดส่วนการคลิกต่อจำนวนครั้งที่โฆษณาแสดงผล','(Clicks ÷ Impressions) × 100','หน่วย: %','(2,000 ÷ 100,000) × 100 = 2%','เทียบวัตถุประสงค์ รูปแบบ ตำแหน่ง และชนิดคลิกที่ใกล้เคียงกัน'),
card('CPC','Cost per click','ต้นทุนเฉลี่ยที่จ่ายเพื่อให้เกิดคลิกหนึ่งครั้ง','ค่าโฆษณา ÷ Clicks','หน่วย: บาทต่อคลิก','10,000 ÷ 2,000 = 5 บาท','คลิกราคาต่ำต้องดู CVR และคุณภาพ lead/order ต่อ'),
'<article class="card"><p class="caps accent">Read the signal</p><h3>CTR ลดลง<br>ยังไม่ใช่คำตอบเรื่องสาเหตุ</h3><p class="reading">ตรวจ creative, audience, placement และ frequency ร่วมกัน แล้วดูว่าคลิกเหล่านั้นไปถึงผลลัพธ์ที่ต้องการหรือไม่</p><div class="formula">ชนิดคลิกเดียวกัน → CTR / CPC → CVR</div></article>'
])+example('<p>ใช้ค่าโฆษณา 10,000 บาท / 100,000 Impressions / 2,000 tracked link clicks<br>ได้ <b>CTR 2%</b> และ <b>CPC 5 บาท</b> ตัวเลขเหล่านี้ยังไม่บอกกำไร</p>'),
'เลือกชนิดคลิกให้ตรงกันทั้งรายงาน แล้วค่อยเทียบประสิทธิภาพค่ะ','อย่าสรุปว่า creative เป็นสาเหตุเดียวจาก CTR ที่ลดลง','G03 G06 S01')

page('conversion','A / Metrics · 03 Conversion','Conversion','เกิดผลลัพธ์อะไร','กำหนด event ให้ชัดก่อนอ่านผล การสมัคร การเป็น lead และคำสั่งซื้อที่ชำระแล้วมีคุณค่าต่างกัน',grid([
card('Conversions','ผลลัพธ์ตาม event ที่กำหนด','จำนวน event ที่ถือว่ามีคุณค่า เช่น lead ที่ผ่านเกณฑ์ หรือ paid order','นับ event พร้อมกติกาตัดรายการซ้ำ','หน่วย: ครั้ง/รายการ ตาม event','100 paid orders','ไม่ใช่ทุก conversion เป็นยอดขาย; ระบุวิธีนับยกเลิกและคืนสินค้า'),
card('CVR','Conversion rate','สัดส่วนผลลัพธ์ต่อฐานที่ระบุ ตัวอย่างนี้ใช้ click-based CVR','(Paid orders ÷ Tracked link clicks) × 100','หน่วย: % · ฐานตัวอย่างคือคลิก','(100 ÷ 2,000) × 100 = 5%','Website rate อาจใช้ sessions; Google Ads ใช้ eligible interactions ตามรายงาน'),
card('CPA','Cost per action · เพิ่มเติม','ต้นทุนต่อ conversion ของ event ที่เลือก','ค่าโฆษณา ÷ Conversions ของ event','หน่วย: บาทต่อ action','10,000 ÷ 100 paid orders = 100 บาท','ระบุชื่อ event เสมอ; CPA ของ lead ไม่ใช่ต้นทุนต่อ order'),
card('CPO','Cost per order','ค่าโฆษณาเฉลี่ยต่อคำสั่งซื้อที่ attributed ให้แคมเปญนั้น','ค่าโฆษณา ÷ Attributed paid orders','หน่วย: บาทต่อ order','10,000 ÷ 100 = 100 บาท','จับคู่ cost กับ order scope และ attribution window เดียวกัน')
])+band('<b>Lead qualification · MQL → SQL</b><br><b id="metric-mql">Marketing-qualified lead (MQL):</b> lead ไม่ซ้ำที่ marketing ประเมินว่า fit และมี engagement ตามเกณฑ์ที่ตกลงกัน; มักยังต้อง nurture.<br><b id="metric-sql">Sales-qualified lead (SQL):</b> lead ที่ sales ตรวจแล้วว่า fit มี need/intent และรับเข้าสู่ direct sales follow-up.<br><span class="small">นับ lead_id ไม่ซ้ำ ณ วันที่เข้า stage; marketing/sales ต้องตกลงเกณฑ์ร่วมกัน. อัตรา MQL → SQL = SQL จาก cohort ÷ MQL cohort × 100. ตัวอย่างสมมติใน cohort เดียวกัน: 24 ÷ 60 = 40%.</span><hr><b>CPA = CPO</b> เฉพาะเมื่อ event คือ paid order และใช้ cost/order scope เดียวกัน ถ้าตัวหารเป็น 0 หรือไม่มีข้อมูล ให้ระบุ “คำนวณไม่ได้ / ข้อมูลยังไม่พอ”'),
'บอกก่อนว่าผลลัพธ์คืออะไร และหารด้วยอะไร แล้วทีมจะอ่าน CVR ตรงกันค่ะ','จำนวน conversion เพิ่มขึ้นยังไม่ยืนยันว่าธุรกิจมีกำไร','G04 G05 G06 S02 S03 S11')

page('revenue','A / Metrics · 04 Revenue & Profit','Revenue & Profit','ขายได้กับกำไรต่างกัน','อ่านรายได้คู่กับต้นทุนที่อยู่ในขอบเขตเดียวกัน และบอกให้ชัดว่าค่าใดหักอะไรแล้ว',grid([
card('Revenue','Net sales revenue','รายได้สุทธิจากคำสั่งซื้อที่ชำระ/เสร็จสมบูรณ์ในช่วงที่เลือก หลังส่วนลดและคืนเงิน; ตัดรายการยกเลิก/void ตามนโยบายบัญชี','SUM(eligible paid/completed order value after discounts) − refunds; exclude canceled/void orders','หน่วย: บาท/ช่วงเวลา','100,000 − 5,000 = 95,000 บาท','แยกรายได้ธุรกิจจาก attributed revenue ที่ใช้ ROAS; ระบุ order status, gross/net basis, ช่วงเวลา และภาษี/ค่าส่งให้ชัด'),
card('ROAS','Return on ad spend','รายได้ที่ attributed ให้โฆษณาเทียบกับค่าโฆษณา','Attributed revenue ÷ Ad spend','หน่วย: เท่า · 5× = 500%','50,000 ÷ 10,000 = 5×','ยังไม่หักค่าสินค้า ขนส่ง ค่าธรรมเนียม คน และต้นทุนอื่น'),
card('ROI','Return on investment','ผลตอบแทนหลังหักต้นทุนทั้งหมดที่นิยามไว้ในขอบเขต','((รายได้ − ต้นทุนรวม) ÷ ต้นทุนรวม) × 100','หน่วย: %','(50,000 − 45,000) ÷ 45,000 × 100 = 11.11%','ระบุรายการต้นทุน ช่วงเวลา และฐานรายได้ให้ตรงกัน'),
card('AOV','Average order value · เพิ่มเติม','มูลค่ารายได้เฉลี่ยต่อคำสั่งซื้อ','รายได้ในขอบเขต ÷ Orders ในขอบเขต','หน่วย: บาทต่อ order','50,000 ÷ 100 = 500 บาท','ใช้ยอดหลังส่วนลดและการคืนสินค้าอย่างสม่ำเสมอ'),
'<article class="card"><h3>Contribution ก่อนค่าแอด</h3><p class="reading">รายได้สุทธิต่อ order − ต้นทุนผันแปรอื่นต่อ order แล้วจึงเทียบกับ CPO</p><div class="formula">500 − 250 − 50 = 200 บาท/order<br>200 − CPO 100 = 100 บาท/order</div><p class="small">ส่วนที่เหลือยังต้องรองรับต้นทุนคงที่ จึงยังไม่ใช่กำไรสุทธิ</p></article>'
])+example('<p>รายได้ 50,000 − COGS 25,000 − ผันแปรอื่น 5,000 − ค่าแอด 10,000 − ต้นทุนคงที่จัดสรร 5,000 = <b>กำไรในขอบเขต 5,000 บาท</b></p><p class="small muted">100 paid orders ทั้งหมด attributed ให้แคมเปญเดียว; สมมติ tracking ครบ ไม่มีภาษี ค่าส่งที่เรียกเก็บ หรือคืนสินค้าในตัวอย่างนี้</p>'),
'ROAS 5× ในตัวอย่างนี้ให้ ROI 11.11% เพราะตัวหารและต้นทุนที่นับต่างกันค่ะ','CPO สูงกว่ากำไรต่อ order แรก ยังใช้สรุป lifetime profitability ไม่ได้','G04 G06 S04 S07 S12')

page('customer','A / Metrics · 05 Customer Value','Customer Value','ลูกค้าใหม่คุ้มแค่ไหน','เทียบต้นทุนหาลูกค้ากับคุณค่าที่ลูกค้าสร้าง โดยแยกข้อมูลที่เกิดขึ้นจริงออกจากค่าคาดการณ์',grid([
 card('CAC','Customer acquisition cost','ต้นทุนการตลาดและการขายเพื่อให้ได้ลูกค้าใหม่','ต้นทุน acquisition ÷ ลูกค้าใหม่','หน่วย: บาทต่อลูกค้าใหม่','18,000 ÷ 60 = 300 บาท','ระบุ cost/cohort และแยกตาม offer หรือช่องทางเมื่อ mix ต่างกัน; ไม่ใช่แค่ค่าแอด'),
card('Revenue LTV','Lifetime value · ฐานรายได้','ประมาณรายได้ตลอดช่วงที่ลูกค้าอยู่กับธุรกิจ','AOV × ความถี่ซื้อ/ปี × อายุลูกค้าเป็นปี','หน่วย: บาทต่อลูกค้า','500 × 4 × 2 = 4,000 บาท','เป็นแบบจำลองรายได้ ไม่ใช่กำไรที่เกิดขึ้นแล้ว')
])+grid([
'<article class="card"><p class="caps accent">Margin matters</p><h3>Gross-profit LTV</h3><div class="formula">Revenue LTV × Gross margin rate<br>4,000 × 40% = 1,600 บาท</div><p class="small">แบบประมาณภายใต้ margin คงที่ ยังไม่หักบริการและต้นทุนดำเนินงานทั้งหมด</p></article>',
'<article class="card"><p class="caps accent">Context matters</p><h3>LTV ÷ CAC ≥ 3</h3><p class="small">เป็น heuristic ในบางบริบท ไม่ใช่เกณฑ์ผ่านอัตโนมัติ ระบุว่า LTV เป็นรายได้หรือกำไร พร้อมดูระยะคืนทุนและเงินสด</p><p class="small muted">เทียบ cohort ที่มีอายุสังเกตเท่ากัน และบอกสมมติฐานการคาดการณ์</p></article>'
])+example('<p>ตัวอย่าง B แยกจาก A: acquisition 18,000 บาท / ลูกค้าใหม่ 60 คน; AOV 500 บาท ซื้อ 4 ครั้ง/ปี นาน 2 ปี และ gross margin 40%</p><p class="small">ถ้าประวัติยังไม่พอ ให้ระบุ “ข้อมูลยังไม่พอประมาณ LTV”</p>','ตัวอย่าง B · ข้อมูลสมมติ ไม่ใช่ผลจริงของ zuri'),
'ระบุฐาน LTV ทุกครั้งค่ะ รายได้ 4,000 บาทกับ gross profit 1,600 บาทตอบคนละคำถาม','ลูกค้าใหม่กับ order ไม่ใช่หน่วยเดียวกัน และ gross-profit LTV ยังไม่ใช่กำไรสุทธิ','G05 G06 S05 S06')

aarrr=[('01 / ACQ','Acquisition','ลูกค้าที่เหมาะสมมาจากไหน','ดู new visitors / qualified leads; ดู CAC เมื่อเปลี่ยนเป็นลูกค้าใหม่แล้ว','Ads · Content · Affiliate · Influencer · Live',''),('02 / ACT','Activation','ลูกค้าได้รับคุณค่าครั้งแรกหรือยัง','กำหนด event ที่สื่อถึงคุณค่าจริง เช่น ทำขั้นตอนใช้งานครั้งแรกสำเร็จ','Website / Platform · CRM','ผู้เข้าร่วมใหม่ที่ทำ activation event ทันเวลา ÷ ผู้เข้าร่วมใหม่ที่มีโอกาสครบช่วงเวลา × 100'),('03 / RET','Retention','ลูกค้ากลับมาหรือไม่','กำหนด cohort เริ่มต้น, return event และช่วงติดตามให้ชัด','CRM · MDT · Customer Service','ลูกค้า cohort เดิมที่กลับมาทำ return event ÷ ลูกค้า cohort เดิมที่ติดตามครบช่วง × 100'),('04 / REF','Referral','การบอกต่อพาคนที่เหมาะสมมาไหม','ติดตามคำเชิญด้วยรหัสหรือลิงก์ และหักผู้รับซ้ำ','Referral / CRM','ผู้รับคำเชิญที่ได้ผลลัพธ์ที่เลือก ÷ ผู้รับคำเชิญไม่ซ้ำที่ติดตามได้ × 100'),('05 / REV','Revenue','รายได้เกิดอย่างคุ้มค่าหรือไม่','ดู AOV, ROAS, ROI, CAC และ LTV ตามขอบเขตที่นิยาม','Data & Strategy · ทีมขาย / การเงิน','')]
body='<div class="stages">'+''.join(f'<article class="stage"><div><span class="idx mono">{i}</span><h3>{t}</h3></div><div><h3>{q}</h3><p>{d}</p>'+ (f'<div class="formula">{f}</div>' if f else '') +f'<p class="small muted">งานที่เกี่ยวข้อง: {o}</p></div></article>' for i,t,q,d,o,f in aarrr)+'</div>'
page('aarrr','B / Growth · Customer lifecycle','AARRR','มองต่อจากการซื้อครั้งแรก','กรอบวงจรลูกค้าที่ช่วยมองการเติบโตต่อจาก funnel ไม่ได้จับคู่กับ funnel 3 ขั้นแบบหนึ่งต่อหนึ่ง',body,
'เลือก event ที่สะท้อนคุณค่าจริง แล้วดูว่าลูกค้ากลับมาหรือบอกต่อไหมค่ะ','สูตรตัวอย่างต้องมี event, cohort และเวลา แพลตฟอร์มอื่นอาจใช้นิยามต่างกัน','G07 S08',True)

roles=[('Live','เตรียมรายการ สคริปต์ ข้อเสนอ และผู้ดำเนินรายการ','แผน Live และยอดคำสั่งซื้อที่ตรวจสอบแล้ว'),('Affiliate','ประสานพาร์ตเนอร์ ข้อตกลง ลิงก์ และที่มาของยอด','Partner brief / ยอดและค่าตอบแทนตามขอบเขต'),('Influencer','เลือกผู้ร่วมงาน จัด brief ตรวจผลงานและติดตามผล','Brief / ชิ้นงาน / tracking / ผลตามเป้าหมาย'),('Platform','ดูแลหน้าร้าน แคมเปญ และกิจกรรมบนแพลตฟอร์มขาย','แผนกิจกรรม / conversion ของแพลตฟอร์ม'),('Website','ดูแล content/SEO และประสบการณ์บนเว็บไซต์','หน้าที่เผยแพร่ / event tracking / CVR'),('MDT','Order/Stock, Customer Service, CRM/Automation','สถานะ order/stock และปัญหาบริการที่ตรวจสอบได้'),('Content','Creative · Footage · Editor · Art Director · Graphic Designer','แนวคิด/สคริปต์ ภาพต้นฉบับ งานตัดต่อ และ artwork'),('Ads','วางแผน ตั้งค่า ทดสอบ และอ่านผลโฆษณา','Campaign setup / แผนทดสอบ / CPA และ ROAS')]
body='<div class="role-head"><p class="caps accent">Direction / Data & Strategy</p><h3>เชื่อมข้อมูล เป้าหมาย งบ และการตัดสินใจ</h3><p class="small">วิเคราะห์ภาพรวม ตั้งสมมติฐาน จัดลำดับงาน แล้วติดตามผลเพื่อปรับแผนร่วมกับผู้ตัดสินใจ</p></div><div class="roles">'+''.join(f'<article class="role"><h3>{t}</h3><p>{d}</p><p class="output">ส่งมอบ: {o}</p></article>' for t,d,o in roles)+'</div>'+band('แยกหน้าที่ให้ชัดก่อนจัดคน ทีมเล็กให้คนเดียวรับหลายหน้าที่ได้ โดยทุกหน่วยเชื่อมกลับเป้าหมายเดียวกัน')
page('team','C / Team & Workflow · Roles','Marketing Team','ใครรับช่วงไหน','โครงสร้างหน้าที่จากภาพต้นทาง เรียบเรียงให้เห็นทั้งงานที่ทำและหลักฐานที่ส่งต่อ',body,
'ไม่จำเป็นต้องจ้างหนึ่งคนต่อหนึ่งกล่องค่ะ เริ่มจากระบุหน้าที่และผู้รับผิดชอบให้ครบ','MDT คงชื่อย่อตามต้นทางซึ่งไม่ได้ยืนยันคำเต็ม ตารางนี้ไม่ใช่ทีมจริงของ zuri','G08',True)

steps=[('Data & Insight','รายงาน / ข้อมูลลูกค้า → ตรวจคุณภาพและหาโอกาส → insight ที่มีหลักฐาน','ส่งต่อแหล่งข้อมูล ช่วงเวลา ปัญหา และสิ่งที่ยังไม่รู้'),('Strategy','Insight → เลือกกลุ่ม ข้อเสนอ ช่องทาง และ KPI → brief / แผน','ส่งต่อ owner, budget cap, target และเงื่อนไขประเมินผล'),('Execution','Brief → ผลิตชิ้นงาน ตรวจ tracking และเปิดกิจกรรม → งานพร้อมวัดผล','ส่งต่องานที่อนุมัติ tracking ที่ตรวจแล้ว และ log การเปลี่ยน'),('Optimize','ผลจริง → วิเคราะห์สมมติฐานและข้อจำกัด → หยุด / ปรับ / ขยาย','ส่งต่อ decision log, เหตุผล, เจ้าของงาน และวันตรวจรอบถัดไป')]
body='<div class="steps">'+''.join(f'<article class="step"><div><h3>{t}</h3><p>{d}</p><p class="muted">{o}</p></div></article>' for t,d,o in steps)+'</div>'+grid([
'<article class="card skills"><h3>Head / Manager</h3><p>เชื่อม Data, Strategy, คนและต้นทุน มองผลกระทบข้ามทีม</p></article>',
'<article class="card skills"><h3>Function Leader</h3><p>แปลงเป้าหมายเป็นงาน คุมคุณภาพ และประสานทีม</p></article>',
'<article class="card skills"><h3>Specialist</h3><p>ลงมือเชิงลึกและสร้างหลักฐานของงานที่รับผิดชอบ</p></article>'
],'three')+band('<b>I / T / Y / X skills</b> ในต้นทางชวนมองความลึก ความกว้าง และการเชื่อมงาน ใช้ระบุทักษะหลัก ทักษะข้างเคียง และสิ่งที่ต้องเรียนเพิ่ม ไม่ผูกตำแหน่งกับนิยามที่ภาพไม่ได้อธิบาย')
page('workflow','C / Team & Workflow · Working loop','From Data to Action','จากข้อมูลไปสู่งานที่วัดผลได้','จัดวงจรจากภาพต้นทางเป็น 4 ขั้นต่อเนื่อง ทุกครั้งที่ส่งต่องานต้องมีหลักฐานและผู้รับช่วง',body,
'งานจะเดินต่อได้เมื่อ brief ชัด และคนรับช่วงรู้ว่าใช้หลักฐานอะไรประเมินผลค่ะ','บันทึกเหตุผลที่หยุด ปรับ หรือขยาย เพื่อให้รอบถัดไปเรียนรู้ต่อได้','G08',True)

body=grid([
'<article class="card"><p class="caps accent">KPI card / Definition</p><h3>หนึ่งใบต่อหนึ่งเป้าหมาย</h3><p class="small">เป้าหมายธุรกิจ · stage · metric · สูตร/หน่วย · baseline พร้อมช่วงเวลา · target · owner · source · รอบทบทวน · เงื่อนไขหยุดหรือปรับ</p></article>',
'<article class="card"><p class="caps accent">KPI card / Example</p><h3>เพิ่มสัดส่วน paid order</h3><p class="small">CVR(click-based) · baseline: <b>รอข้อมูล</b> · target: <b>รอกำหนด</b><br>Owner: Ads + Website · Source: ads + paid-order log · ทบทวนรายสัปดาห์เมื่อข้อมูลครบ</p></article>',
card('Media Spend','Actual paid-media cost','ค่าใช้จ่าย media จริงของแคมเปญ ช่องทาง และช่วงเวลาที่เลือก','SUM(platform-reported media spend for the same campaign/channel/date range)','หน่วย: บาท/แคมเปญ/ช่วงเวลา','10,000 บาทใน 7 วัน','แยก Actual จาก Planned; ระบุสกุลเงิน วันที่ และภาษี/agency fee ที่รวม; ห้ามรวมยอดซ้ำ'),
],'three')+table(['หมวดงบ / สิ่งที่นับ','Planned','Actual','Remaining','Owner'],[
['Media / ค่าโฆษณา','รอกำหนด','รอข้อมูล','รอข้อมูล','รอกำหนด'],['Production / Creative, ถ่ายทำ, ตัดต่อ, artwork','รอกำหนด','รอข้อมูล','รอข้อมูล','รอกำหนด'],['Partners / Affiliate, Influencer','รอกำหนด','รอข้อมูล','รอข้อมูล','รอกำหนด'],['People & Tools / คนและเครื่องมือที่จัดสรร','รอกำหนด','รอข้อมูล','รอข้อมูล','รอกำหนด'],['Reserve / งบสำรองที่อนุมัติ','รอกำหนด','รอข้อมูล','รอข้อมูล','ผู้อนุมัติ']
 ],'budget')+band('<b>Planned budget = ผลรวมงบที่อนุมัติทุกหมวด</b><br>Remaining = Planned − Actual; ห้ามนับต้นทุนซ้ำ และระบุเงื่อนไขใช้งบสำรองกับผู้อนุมัติ<br><b>วางแผนจาก funnel:</b> Leads ที่ต้องหา = ปัดขึ้น(Target paid orders ÷ อัตรา lead ที่ได้ paid order); Media Budget ≈ Leads ที่ต้องหา × CPL. จับคู่ rate/CPL กับ offer และช่วงเดียวกัน; ถ้ายังไม่มี baseline ให้ระบุว่าเป็น estimate.')+'<p class="small muted">ROAS, CPO และ CAC มี cost basis ต่างกัน รายงานต้องบอกว่ารวมรายการใดไว้ในตัวหาร ห้ามใส่ target สมมติให้ดูเป็น benchmark จริง</p>'
page('budget','D / Planning · KPI & Budget','KPI & Budget','เป้าหมายมีฐาน งบมีเจ้าของ','ก่อนเปิดแคมเปญ ให้ทีมตกลงนิยาม KPI ขอบเขตงบ แหล่งข้อมูล และผู้รับผิดชอบร่วมกัน',body,
'เทียบยอด Media Spend จริงกับงบที่อนุมัติในช่วงเวลาเดียวกันค่ะ','ช่องที่ยังไม่มีข้อมูลต้องเขียน “รอข้อมูล” อย่าใส่ศูนย์ให้ดูเหมือนวัดแล้ว','G07 G08 S12',True)

raci_rows=[['กำหนดเป้าหมายและวงเงิน','A','R','C','C','C','I'],['นิยาม KPI และตรวจ tracking','A','R','I','C','C','C'],['ผลิตและตรวจชิ้นงาน','I','C','A/R','C','C','I'],['เปิดและดูแลโฆษณาตามวงเงิน','A','C','C','R','I','I'],['ตรวจ order / stock / service','I','C','I','I','A/R','C'],['ติดตามลูกค้าและ referral','I','C','C','I','C','A/R'],['สรุปผลและตัดสินใจปรับแผน','A','R','C','C','C','C']]
body=grid([f'<article class="card"><span class="letter">{l}</span><h3>{en}</h3><p class="small">{th}</p></article>' for l,en,th in [('R','Responsible','ผู้ลงมือทำ'),('A','Accountable','ผู้รับผิดชอบสุดท้ายและตัดสินใจ'),('C','Consulted','ผู้ให้คำปรึกษาก่อนตัดสินใจ'),('I','Informed','ผู้ที่ต้องรับทราบ')]],'four')+table(['งาน','Head / Owner','Data Lead','Creative Lead','Media Lead','Commerce Lead','CRM Lead'],raci_rows,'raci')+band('<b>แต่ละงานมี A หนึ่งคน และมี R อย่างน้อยหนึ่งคน</b><br>A/R หมายถึงคนเดียวรับสองบทบาท ทีมเล็กสวมหลายบทบาทได้ แต่ต้องรู้ว่าตัดสินใจในบทบาทใด')+'<p class="small muted">RACI กำหนดความรับผิดชอบ ส่วน KPI วัดผลลัพธ์ ตารางนี้เป็นตัวอย่างหน้าที่ ไม่ใช่การมอบหมายบุคคลหรืออนุมัติงบจริง</p>'
page('raci','D / Planning · Responsibility','RACI','ใครทำ ใครตัดสินใจ ใครต้องรู้','ทำให้จุดตัดสินใจและจุดส่งต่องานชัดเจน ก่อนเริ่มกิจกรรมที่มีหลายทีมเกี่ยวข้อง',body,
'ตกลงหน้าที่ก่อนเริ่มงานค่ะ แต่ละคนจะรู้ว่าต้องส่งอะไรและรอคำตัดสินจากใคร','ตรวจทุกแถวให้มี A เพียงหนึ่งคน เพื่อไม่ให้เกิดคำสั่งที่ขัดกัน','G07 G08 S09',True)

roadmap=[('W1–2','Unblock','ตรวจเป้าหมาย tracking, order flow และ blocker; ทำ baseline / gap list','Head + Data + Commerce','รู้ blocker สำคัญ เจ้าของงาน และแหล่งข้อมูลที่ใช้ได้'),('W3–4','Foundation','กำหนด KPI dictionary, RACI, budget cap, brief และขั้นตอน QC','Data + Function Leads','ตกลงนิยาม KPI ขอบเขตงบ และผู้ตัดสินใจแล้ว'),('W5–8','Velocity','ทดลอง creative / audience / offer ที่มีสมมติฐานและบันทึกผล','Creative + Media + Commerce','แยกผลจริงกับสิ่งที่ยังไม่แน่ชัด และยืนยัน tracking'),('W9–12','Compound','ขยายเฉพาะวิธีที่มีหลักฐาน พร้อมงาน retention / referral','Head + Media + CRM','ตรวจ margin, capacity และ cohort ก่อนเพิ่มทรัพยากร'),('DAY 85–90','Review · เพิ่มเติม','สรุปบทเรียน ต้นทุนจริง decision log และแผนรอบหน้า','Head + Data','มีรายงานและงานรอบถัดไปที่จัดลำดับพร้อม owner')]
body='<div class="stages">'+''.join(f'<article class="stage"><div><span class="idx mono">{period}</span><h3>{name}</h3></div><div><p>{work}</p><p class="small muted">Owner: {owner}</p><p class="small"><b>ผ่านเมื่อ:</b> {gate}</p></div></article>' for period,name,work,owner,gate in roadmap)+'</div>'+band('ติดตาม KPI ที่นิยามในหน้า 10 ทุกช่วง พร้อม baseline และความพร้อมของข้อมูล เกณฑ์ผ่านช่วงเป็นหลักฐานส่งมอบ ไม่ใช่ยอดขายที่รับประกัน')+'<p class="small muted">ต้นทาง W1–12 รวม 84 วัน คู่มือนี้เติมวันที่ 85–90 สำหรับ review/ส่งต่อแผน โดยระบุส่วนเพิ่มเติมอย่างชัดเจน</p>'
page('roadmap','D / Planning · 90-day Roadmap','90-day Roadmap','เริ่มจากสิ่งที่ขวางผลลัพธ์','แม่แบบลำดับงาน 90 วัน ปรับตามข้อมูลจริงและกำลังของทีม ไม่ใช่กำหนดเปิดใช้งานหรือคำรับประกันผล',body,
'เริ่มจากแก้ blocker และนิยามข้อมูลก่อนค่ะ การทดลองรอบถัดไปจะอ่านผลได้ชัดขึ้น','ไม่ข้ามเงื่อนไขผ่านช่วงเพียงเพราะถึงสัปดาห์ที่กำหนด','G07',True)

quarters=[('Q1','Build','สร้างระบบข้อมูล ทีม และวิธีทำงานด้วยแผน 90 วัน','KPI definitions, baseline, RACI และรายงานรอบแรก'),('Q2','Test','ทดสอบช่องทาง ข้อเสนอ creative และเส้นทางลูกค้า','ผลทดลองที่อธิบายข้อจำกัดได้ ต้นทุนและคุณภาพลูกค้า'),('Q3','Scale','ขยายวิธีที่ผ่านการประเมินต้นทุนและกำลังรองรับ','Unit economics, workload, service quality และเงินสด'),('Q4','Compound','ใช้การซื้อซ้ำ referral และความรู้จากการทดลองต่อยอด','Cohort / retention, referral outcomes และแผนปีถัดไป')]
body=grid([f'<article class="card"><p class="caps accent">{q} / 12-month outlook</p><h3 class="display" style="font-size:31px">{title}</h3><p style="margin-top:13px">{work}</p><p class="reading"><b>หลักฐานทบทวน:</b> {proof}</p></article>' for q,title,work,proof in quarters])+band('<b>90 วันแรกเชื่อมกับ Q1</b> จากนั้นใช้หลักฐานจริงทบทวนแผนทุกไตรมาส การเรียนรู้และการทดลองเกิดได้ตลอดปี ไม่ต้องรอ Q2')+example('<p>ทบทวน 4 เรื่องร่วมกัน: ผลต่อธุรกิจ / ความพร้อมของข้อมูล / กำลังคนและการบริการ / เงินสดและเพดานงบ</p><p class="small muted">ถ้าหลักฐานเปลี่ยน ให้ปรับลำดับแผนพร้อมเหตุผล ไม่เพิ่มงบอัตโนมัติเพียงเพราะถึง Q3</p>','จุดทบทวนแผน · ไม่มี target หรืองบจริงในแม่แบบนี้')
page('outlook','D / Planning · 12-month Outlook','12-month Outlook','วางทิศทาง พร้อมทบทวน','แผนระยะยาวเป็นกรอบให้ทีมเห็นทิศทางเดียวกัน และเปลี่ยนได้เมื่อมีหลักฐานใหม่',body,
'ใช้ Q1–Q4 เป็นจังหวะทบทวนค่ะ งานที่เรียนรู้ได้ควรเริ่มเมื่อพร้อม ไม่ต้องรอไตรมาส','การขยายงานต้องผ่านทั้งต้นทุน เงินสด และกำลังรองรับลูกค้า','G07',True)

page('lead-performance','E / Commerce & Operations · Lead & Sales','Lead & Sales Efficiency','วัดคุณภาพ lead ไปจนถึงการปิดการขาย','แยกต้นทุนต่อ lead ออกจากต้นทุนต่อลูกค้า และอ่านผลเมื่อ lead cohort มีเวลาพอเข้าสู่การขาย',grid([
card('Leads','Unique lead volume','จำนวนผู้มุ่งหวังที่ติดต่อได้ไม่ซ้ำในแหล่งและช่วงเวลาที่เลือก','COUNT DISTINCT lead_id','หน่วย: รายต่อช่วงเวลา','30 leads','ตัดรายการซ้ำ และระบุว่ารวม lead ใหม่หรือ lead ที่กลับมาแล้ว'),
card('CPL','Cost per lead','ค่า media เฉลี่ยต่อ lead ไม่ซ้ำที่ได้มาตาม attribution ที่เลือก','Media spend ÷ attributed unique leads','หน่วย: บาทต่อ lead','1,200 ÷ 30 = 40 บาท','CPL ยังไม่บอกความพร้อมซื้อ และไม่เท่ากับ CAC'),
card('Qualified CPL','Cost per qualified lead','ค่า media ต่อ lead ที่ผ่านเกณฑ์คุณภาพขั้นที่ระบุ','Media spend ÷ unique leads at named stage','หน่วย: บาทต่อ MQL หรือ SQL','1,200 ÷ 6 MQL = 200 บาท','ระบุ stage และเกณฑ์ให้ชัด; อย่าปน MQL กับ SQL ในตัวหารเดียว'),
card('Lead-to-sale rate','Lead → paid order conversion','สัดส่วน lead ไม่ซ้ำที่มี paid order แรกใน cohort ที่ติดตามครบ','Unique leads with ≥1 paid order in a matured cohort ÷ unique leads in the same cohort × 100','หน่วย: %','2 ÷ 30 × 100 = 6.7%','กำหนด attribution และช่วงติดตาม; นับ lead ที่ซื้อแล้วครั้งเดียว แม้มี order ซ้ำ'),
card('Response SLA','First response within agreed time','ความรวดเร็วที่ทีมตอบ inquiry ด้วยคำตอบที่มีเนื้อหา ไม่ใช่ข้อความรับอัตโนมัติ','Leads meaningfully answered within SLA ÷ new leads requiring response × 100','หน่วย: %; รายงาน median response time เพิ่ม','18 ÷ 20 × 100 = 90%','กำหนดเวลาเริ่ม/หยุดและเวลาทำการ; ตัด lead ที่ยังไม่ครบช่วง SLA ออกจากฐาน'),
card('Lost reason mix','Closed-lost lead share by reason','สัดส่วน lead ที่ปิดเป็น lost ด้วยเหตุผลแต่ละประเภท','Distinct closed-lost leads by reason ÷ closed-lost leads with known reason × 100','หน่วย: % ของ lost leads ที่ทราบเหตุผล','4 ÷ 20 × 100 = 20% จากเหตุผลหนึ่ง','ใช้ reason list คงที่; แยก unknown และยังติดตามอยู่')
])+band('อ่าน CPL คู่กับ Qualified CPL, Lead-to-sale rate และ CAC แยกตาม channel / offer เมื่อคุณภาพหรือ package ต่างกัน; อย่า scale จาก lead volume อย่างเดียว'),
'CPL ต่ำไม่พอค่ะ ดูว่าคนที่เข้ามาตรงกับเกณฑ์และไปต่อถึง paid order หรือไม่','ตรวจ lead ซ้ำ, auto-reply และ cohort ที่ยังติดตามไม่ครบก่อนอ่านผล','S11 S12')

page('order-economics','E / Commerce & Operations · Order Economics','Order & Offer Economics','นับ order และ units แยกกัน','จำนวน order, units ต่อ order และ offer mix ตอบคนละคำถาม; อ่าน AOV เพิ่มเติมได้ในหน้า 05',grid([
card('Orders','Paid order count','จำนวนคำสั่งซื้อที่ชำระแล้วไม่ซ้ำในช่วงที่กำหนด','COUNT DISTINCT paid_order_id','หน่วย: orders','25 paid orders','นับสถานะให้คงที่; รายงาน cancellation/refund แยก ไม่หักเงียบ ๆ'),
card('Units per Order','Average units per order','จำนวน units เฉลี่ยใน paid orders ที่อยู่ในขอบเขตเดียวกัน','Units in completed paid orders ÷ completed paid orders','หน่วย: units/order','54 ÷ 25 = 2.16','ใช้สถานะ order เดียวกันและตัดรายการยกเลิกตามกติกา'),
card('Offer Mix','Order mix and unit mix','สัดส่วนของแต่ละ offer คำนวณแยกตามจำนวน order และจำนวน units','(Offer paid orders ÷ all paid orders) × 100; (offer units ÷ all sold units) × 100','หน่วย: % orders และ % units','Offer A: 6/24 orders = 25%; 12/48 units = 25%','แสดงสองสัดส่วนคู่กัน; order mix ไม่แทน unit mix หรือ AOV'),
card('Packaging cost','Packaging cost per order','ค่า packaging ที่เกิดขึ้นจริงเฉลี่ยต่อ paid order','Actual packaging cost ÷ completed paid orders','หน่วย: บาท/order','500 ÷ 10 = 50 บาท','แยก actual cost ออกจาก budget ceiling; เปรียบเทียบตาม offer')
]),
'แสดง order mix กับ unit mix คู่กันค่ะ AOV อยู่หน้า 05','สัดส่วน offer สองฐานไม่ควรถูกรวมเป็นตัวเลขเดียว','S12')

page('contribution','E / Commerce & Operations · Contribution','Contribution & Returns','รายได้หลังหักต้นทุนตามขอบเขต','คำนวณ contribution ก่อนและหลัง acquisition cost ด้วยฐาน order/cohort เดียวกัน และแยก cancellation ออกจาก return',grid([
card('Contribution before marketing','Contribution before CAC/media','รายได้สุทธิต่อ order ลบ COGS, packaging และต้นทุนผันแปรอื่นที่ระบุ','Net revenue/order − product COGS/order − packaging/order − other scoped variable costs/order','หน่วย: บาท/order; margin = contribution ÷ net revenue × 100','ใน 1 order: 10,000 − 4,000 − 500 − 1,000 = 4,500 บาท','ระบุ shipping subsidy, payment fee และ commission ว่ารวมแล้วหรือยัง'),
card('Contribution after CAC','Contribution after acquisition cost','Contribution ก่อนการตลาดต่อ first order หลังหัก CAC ของ cohort/offer เดียวกัน','First-order contribution before marketing − matched CAC per acquired customer','หน่วย: บาทต่อลูกค้าใหม่ · first order','4,500 − 1,000 = 3,500 บาท','จับคู่ first order, CAC และ cohort; ค่าที่เหลือยังไม่ใช่กำไรสุทธิ'),
card('Media % of revenue','Media cost share','สัดส่วนค่า media ต่อรายได้สุทธิที่ใช้ attribution และช่วงเวลาเดียวกัน','Attributed media spend ÷ comparable net revenue × 100','หน่วย: %','4,000 ÷ 20,000 × 100 = 20%','เป็น cost ratio ไม่ใช่ profit margin; เทียบกับ ROAS ได้เมื่อฐานตรงกัน'),
card('Cancellation / Return rate','Order cancellation and return rates','ติดตามการยกเลิกและการคืนแยกกัน เพราะเกิดคนละช่วง','Cancelled orders ÷ placed orders; returned orders ÷ fulfilled orders × 100','หน่วย: % ของฐานแต่ละชนิด','3/30 cancelled = 10%; 2/24 returned = 8.3%','รอให้ order พ้นช่วงคืนก่อนสรุป cohort และระบุ gross/net revenue basis')
]),
'ดู contribution หลังต้นทุนที่ระบุ ไม่ใช่ ROAS อย่างเดียวค่ะ','ตรวจว่ารายได้และ cost scope ตรงกันก่อนเปรียบเทียบ','S12')

page('inventory','E / Commerce & Operations · Inventory','Inventory & Fulfillment','ตรวจของพร้อมขายและความเร็วการระบาย','ยอดขายต่อ SKU และของพร้อมขายช่วยบอกว่าข้อเสนอที่วางไว้ทำได้จริงแค่ไหน',grid([
card('Sellable stock by SKU','On-hand units less unavailable stock','จำนวนคงเหลือที่ขายได้ของแต่ละ SKU ณ เวลาที่บันทึก','On-hand units − reserved / damaged / unavailable units','หน่วย: units/SKU · ณ เวลา snapshot','SKU A: 27 units available','แสดง timestamp และแยกยอดจอง; stock count ไม่ใช่ demand'),
card('Overstock SKU','Units above target by SKU','จำนวนสินค้าขายได้ที่เกินระดับเป้าหมายของ SKU ในช่วงวางแผน','MAX(0, sellable units − target units for the SKU)','หน่วย: units/SKU','มี 27 units ขายได้; target 20 → เกิน 7 units','กำหนด target และช่วงวางแผนต่อ SKU; ค่าเกินนี้เป็นสัญญาณบริหารสต็อก ไม่ใช่ benchmark สากล'),
card('Units sold by SKU','Completed unit sales','จำนวน units ที่ขาย/ส่งมอบแล้วในแต่ละ SKU และช่วงเวลา','COUNT completed units grouped by SKU and period','หน่วย: units/SKU/period','SKU B: 14 units ใน 7 วัน','คืนสินค้า/ยกเลิกให้เป็นไปตามนโยบายที่ระบุ'),
card('Inventory velocity','Average units sold per day','ความเร็วการขายเฉลี่ยในช่วงที่ใช้วางแผน','Net units sold in period ÷ days in period','หน่วย: units/day','56 ÷ 14 = 4 units/day','ดูหลายช่วงเมื่อ demand แกว่งตามฤดูกาลหรือ promotion'),
card('Days of inventory','Estimated stock cover','จำนวนวันโดยประมาณที่ stock พร้อมขายรองรับได้ที่ความเร็วปัจจุบัน','Sellable units on hand ÷ average daily units sold','หน่วย: วัน','84 ÷ 4 = 21 วัน','ถ้า velocity เป็น 0 คำนวณไม่ได้; ไม่ใช่วันหมดอายุหรือ lead time เติมสินค้า'),
card('Bundle capacity','Maximum complete bundles from current stock','จำนวนชุดที่ประกอบได้โดยไม่เกิน SKU ที่มีน้อยที่สุด','MIN over required SKUs of FLOOR(available units ÷ units of SKU required per bundle)','หน่วย: bundles','SKU A 8, B 11, C 5; ใช้ SKU ละ 1 → 5 bundles','หัก stock ที่จอง/เสียหายก่อนคำนวณ และใช้ BOM ของ bundle จริง')
]),
'เทียบ stock ที่ขายได้กับ target ของแต่ละ SKU ก่อนเร่งสื่อค่ะ','Overstock ต้องมีเกณฑ์เป้าหมายต่อ SKU; ไม่มีค่าเดียวที่ใช้ได้ทุกธุรกิจ','S12')

sources=[('G01','615885615_122133354686992725_8991070302867251796_n.jpg','ปก Marketing Metrics → หน้า 01'),('G02','617563287_122133354782992725_7931094083234134915_n.jpg','Awareness → หน้า 02'),('G03','620112234_122133354788992725_3797505832379488852_n.jpg','Consideration → หน้า 03'),('G04','617912566_122133354776992725_2860196314728364820_n.jpg','Conversion / ROAS / ROI → หน้า 04–05'),('G05','617606245_122133354794992725_4887824788410035437_n.jpg','CPO / CAC / LTV → หน้า 04, 06'),('G06','619250988_122133354710992725_6766144328900826988_n.jpg','Funnel summary → หน้า 01–06'),('G07','IMG_4136.jpeg','AARRR / แผนการตลาด → หน้า 07, 10–13'),('G08','Screenshot 2026-09-02 113422.png','ทีม / Workflow / ทักษะ → หน้า 08–11')]
external=[('S01','https://support.google.com/google-ads/answer/2615875?hl=en','Google Ads · CTR'),('S02','https://support.google.com/google-ads/answer/2684489/conversion-rate-definition?hl=en-GB','Google Ads · Conversion rate'),('S03','https://support.google.com/google-ads/answer/6270625?hl=en','Google Ads · Conversion tracking data'),('S04','https://support.google.com/google-ads/answer/1722066?hl=en','Google Ads · ROI'),('S05','https://www.shopify.com/blog/customer-acquisition-cost','Shopify · CAC และ gross margin'),('S06','https://www.shopify.com/blog/customer-lifetime-value-analysis','Shopify · LTV analysis'),('S07','https://www.shopify.com/blog/ecommerce-customer-acquisition','Shopify · Contribution และ acquisition'),('S08','https://amplitude.com/blog/pirate-metrics-framework','Amplitude · AARRR'),('S09','https://www.atlassian.com/work-management/project-management/raci-chart','Atlassian · RACI'),('S10','https://support.google.com/google-ads/answer/9507337?hl=en-GB','Google Ads · Frequency'),('S11','https://www.salesforce.com/blog/mql-vs-sql/','Salesforce · MQL and SQL stages')]
checks=['เป้าหมาย, event, denominator และหน่วยตรงกัน','เทียบเวลา ช่องทาง กลุ่มคน และ attribution ที่สอดคล้องกัน','ตรวจ tracking, รายการซ้ำ, คืนสินค้า และ conversion delay','แยกคน / ครั้ง / orders และลูกค้าใหม่ / ลูกค้าเดิม','แยก ROAS จาก ROI และระบุรายการต้นทุนให้ครบ','LTV มีฐาน สมมติฐาน และ cohort ที่ติดตามครบช่วง','ข้อมูลน้อยหรือวัดไม่ครบ ยังไม่พอสรุปสาเหตุ','ทุกการตัดสินใจมี owner หลักฐาน และวันตรวจผล']
body='<ol class="checklist">'+''.join(f'<li>{x}</li>' for x in checks)+'</ol>'+band('ตัวหารเป็น 0 หรือข้อมูลขาด → “คำนวณไม่ได้ / ข้อมูลยังไม่พอ”<br>ค่าคาดการณ์และตัวอย่างสมมติ ต้องแยกจากผลจริงเสมอ')+'<div class="source-columns"><div><h3>ภาพต้นทาง · gvm (8 ภาพ)</h3><ul class="source-list">'+''.join(f'<li id="source-{i}"><a href="gvm/{escape(file,quote=True)}" title="{escape(file,quote=True)}"><span class="sid">{i}</span>{label} ↗</a></li>' for i,file,label in sources)+'</ul><p class="small muted">เรียบเรียงสาระใหม่จากภาพอ้างอิง ไม่ใช้โลโก้ บุคคล หรือ CTA ของต้นทางเป็นแบรนด์ zuri</p></div><div><h3>นิยามและข้อมูลเสริม</h3><ul class="source-list">'+''.join(f'<li id="source-{i}"><a href="{escape(url,quote=True)}"><span class="sid">{i}</span>{label} ↗</a></li>' for i,url,label in external)+'</ul><ul class="source-list"><li id="source-S12"><span class="sid">S12</span>เอกสารวางแผน M1 ที่ผู้ใช้ให้ · ใช้แนวคิดจัดหมวดและโครงสร้าง metrics; ไม่ได้นำชื่อ offer ราคา target หรือ scenario มาใช้</li></ul></div></div><p class="small muted">ตรวจแหล่งอ้างอิง 25 กันยายน 2026 · สูตรเสริม ตัวอย่าง บทบาท และ Roadmap ที่เติมเป็นการเรียบเรียงสำหรับคู่มือนี้ ไม่ใช่ข้อมูลการดำเนินงานจริงของ zuri</p>'
page('reading','F / Reading & Sources · Evidence','Read Before Deciding','อ่านผลก่อนตัดสินใจ','ตัวเลขที่ใช้ได้ต้องมีนิยาม แหล่งข้อมูล และขอบเขตที่ตรวจสอบย้อนกลับได้',body,
'เลือกการตัดสินใจจากหลักฐานที่พอค่ะ ถ้ายังไม่รู้ ให้บอกสิ่งที่ขาดและวิธีตรวจต่อ','เกณฑ์เดียวใช้ไม่ได้กับทุกธุรกิจ ตรวจนิยามและสมมติฐานก่อนเทียบตัวเลข','G01 G06 G07 G08')

HTML='''<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="description" content="คู่มือ metrics การตลาด 18 หน้า พร้อมมุมมองกราฟ 2D และ 3D, MQL, SQL, AARRR, KPI และ Budget โดย zuri"><title>Zuri-Go — Marketing Metrics Map · REV 04</title>
<link rel="stylesheet" href="assets/fonts/metrics-map.css">
<style>'''+CSS+GRAPH_CSS+VIEWER_CSS+'''</style><link rel="stylesheet" href="assets/styles/zuri-go-logo.css"></head><body><a class="skip" href="#overview">ข้ามไปเนื้อหา</a><nav class="nav" aria-label="หมวดคู่มือ"><span class="caps nav-title">Metrics Map / REV 04</span><div class="nav-links"><a href="#metrics-graph">Graph view</a><a href="#overview">สารบัญ</a><a href="#awareness">Metrics</a><a href="#aarrr">AARRR</a><a href="#team">ทีมและงาน</a><a href="#budget">แผนการตลาด</a><a href="#lead-performance">Commerce &amp; Operations</a><a href="#reading">อ่านผล</a></div></nav><main>'''+GRAPH_HTML+'''<div id="guideViewer"><div class="page-controls" id="guideControls" aria-label="การนำทางหน้าคู่มือ"><button class="page-control-button" id="previousPage" type="button" aria-label="ไปหน้าก่อนหน้า">← หน้าก่อน</button><div class="page-control-current"><span class="caps">Guide page</span><strong id="pageCurrent" aria-live="polite">01 / 18</strong><span id="pageTitle">Marketing metrics, mapped.</span></div><button class="page-control-button" id="nextPage" type="button" aria-label="ไปหน้าถัดไป">หน้าถัดไป →</button></div>'''+''.join(PAGES)+'''</div></main><script>'''+GRAPH_SCRIPT+VIEWER_SCRIPT+'''</script>'''+SERVICES_ORIGIN_GATE+'''</body></html>'''
HTML = HTML.replace('</style>', SITE_CSS + '</style>', 1).replace('<nav class="nav"', SITE_NAV + SERVICES_NAV + '<nav class="nav"', 1)
assert len(PAGES)==PAGE_TOTAL
OUT.write_text(HTML,encoding='utf-8')
print(f'Built {OUT} ({len(PAGES)} pages, {OUT.stat().st_size:,} bytes)')
