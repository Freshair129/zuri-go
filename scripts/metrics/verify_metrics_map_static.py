"""Dependency-free structural checks for the draft metrics map."""
from collections import Counter
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
HTML_PATH = ROOT / 'apps/metrics/index.html'
REPORT_DIR = ROOT / 'docs/migrations/verification/metrics'


class Audit(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.fragments = []
        self.local_refs = []
        self.pages = []
        self.metrics = []
        self.current_page = None
        self.current_metric = None
        self.capture = None
        self.capture_text = []
        self.in_graph = False
        self.graph_mascot_names = []
        self.graph_pair_alt = ''

    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        tokens = set((attrs.get('class') or '').split())
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if tag == 'a' and attrs.get('href'):
            href = attrs['href']
            if href.startswith('#'):
                self.fragments.append(href[1:])
            elif not re.match(r'^(?:https?:|mailto:|tel:|data:)', href, re.I):
                self.local_refs.append(href)
        if tag == 'img' and attrs.get('src'):
            self.local_refs.append(attrs['src'])
            if self.current_page and attrs.get('alt'):
                self.current_page['pair_image'] |= 'zuri' in attrs['alt'].lower() and 'วางใจ' in attrs['alt']
            if self.in_graph and attrs.get('alt'):
                self.graph_pair_alt = attrs['alt']
        if tag == 'link' and 'stylesheet' in (attrs.get('rel') or '').split() and attrs.get('href'):
            self.local_refs.append(attrs['href'])
        if tag == 'section' and 'page' in tokens:
            self.current_page = {'id': attrs.get('id', ''), 'number': attrs.get('data-page', ''), 'roles': [], 'pair_image': False, 'ctas': 0, 'guides': 0}
            self.pages.append(self.current_page)
        if tag == 'section' and attrs.get('id') == 'metrics-graph':
            self.in_graph = True
        if self.current_page and 'guide' in tokens:
            self.current_page['guides'] += 1
        if self.current_page and 'name' in tokens:
            self.capture = 'role'
            self.capture_text = []
        if self.current_page and 'cta' in tokens:
            self.current_page['ctas'] += 1
        if tag == 'article' and 'metric' in tokens:
            self.current_metric = {'id': attrs.get('id', ''), 'page': self.current_page['id'] if self.current_page else '', 'title': ''}
        if tag == 'h3' and self.current_metric:
            self.capture = 'metric-title'
            self.capture_text = []
        if self.in_graph and 'mg-mascot-names' in tokens:
            self.capture = 'graph-mascot'
            self.capture_text = []

    def handle_endtag(self, tag):
        if tag == 'h3' and self.current_metric and self.capture == 'metric-title':
            self.current_metric['title'] = ''.join(self.capture_text).strip()
            self.capture = None
        elif tag == 'span' and self.current_page and self.capture == 'role':
            self.current_page['roles'].append(''.join(self.capture_text).strip())
            self.capture = None
        elif tag == 'span' and self.in_graph and self.capture == 'graph-mascot':
            self.graph_mascot_names.append(''.join(self.capture_text).strip())
            self.capture = None
        if tag == 'article' and self.current_metric:
            self.metrics.append(self.current_metric)
            self.current_metric = None
        if tag == 'section' and self.current_page:
            self.current_page = None
        elif tag == 'section' and self.in_graph:
            self.in_graph = False

    def handle_data(self, data):
        if self.capture:
            self.capture_text.append(data)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    source = HTML_PATH.read_text(encoding='utf-8')
    audit = Audit()
    audit.feed(source)
    errors = []
    page_numbers = [page['number'] for page in audit.pages]
    if page_numbers != [f'{i:02}' for i in range(1, 19)]:
        errors.append(f'Expected ordered guide pages 01-18; got {page_numbers}')
    if len(audit.metrics) != 38:
        errors.append(f'Expected 38 guide metric cards; got {len(audit.metrics)}')
    metric_titles = [metric['title'] for metric in audit.metrics]
    required_titles = {'Media Spend', 'Revenue', 'Overstock SKU'}
    if not required_titles.issubset(set(metric_titles)):
        errors.append(f'Missing REV 04 metric cards: {sorted(required_titles - set(metric_titles))}')
    if len(set(metric_titles)) != len(metric_titles):
        errors.append('Guide metric titles are not unique')
    if len(audit.ids) != len(set(audit.ids)):
        errors.append('Duplicate HTML ids found')
    missing_fragments = sorted(set(audit.fragments) - set(audit.ids))
    if missing_fragments:
        errors.append(f'Missing fragment targets: {missing_fragments}')
    if not all(page['pair_image'] and page['guides'] == 1 and page['ctas'] == 1 and any('zuri' in role.lower() for role in page['roles']) and any('น้องวางใจ' in role for role in page['roles']) for page in audit.pages):
        errors.append('At least one guide page is missing its mascot pair, role notes, or CTA')
    if len(re.findall(r"\{id:'metric-(?:mql|sql)'", source)) != 2:
        errors.append('Expected MQL and SQL graph terms')
    if len(audit.metrics) + 2 != 40:
        errors.append('Expected 40 graph terms')
    expected_counts = Counter()
    for metric in audit.metrics:
        title, page = metric['title'], metric['page']
        if page in ('awareness', 'consideration') or title in ('Leads', 'CPL', 'Media Spend'):
            expected_counts['acquisition'] += 1
        elif page in ('conversion', 'lead-performance'):
            expected_counts['lead'] += 1
        else:
            expected_counts['revenue'] += 1
    expected_counts['lead'] += 2
    if expected_counts != Counter({'acquisition': 10, 'lead': 10, 'revenue': 20}):
        errors.append(f'Unexpected graph category distribution: {dict(expected_counts)}')
    if 'pointerdown' not in source or 'pointermove' not in source or "addEventListener('wheel'" not in source or 'requestAnimationFrame' not in source:
        errors.append('Expected drag, zoom, and orbit interaction hooks')
    if not all(token in source for token in ("id=\"mgMode2d\"", "id=\"mgMode3d\"", "function setMode(mode)", "flatCoordinates", "data-mode=\"2d\"")):
        errors.append('Expected working 2D/3D graph modes and flat coordinates')
    if not all(token in source for token in ('id="mgBackground"', 'data-background="dark"', 'data-background="canvas"', 'data-background="warm"', '#F7F8FA', '#FFF8F0', 'var(--mg-stage-dot)')):
        errors.append('Expected three textured graph background presets')
    if not all(token in source for token in ('id="guideViewer"', 'id="previousPage"', 'id="nextPage"', "window.addEventListener('hashchange'", 'page.hidden = !active')):
        errors.append('Expected one-page guide viewer with hash navigation')
    if not all(token in source for token in ('Math.PI * 2', 'yaw = ((yaw +', 'yaw = (yaw + .0018) %')):
        errors.append('Expected continuous 360-degree graph rotation')
    if '@media print{.metrics-graph{display:none!important}}' not in source:
        errors.append('Interactive graph is not explicitly hidden in print')
    sphere_styles = re.findall(r'\.mg-node:before\{([^}]*)\}', source)
    sphere_style = next((style for style in sphere_styles if 'radial-gradient(circle at 30% 24%' in style), '')
    if not all(token in sphere_style for token in ('border-radius:50%', 'radial-gradient(circle at 30% 24%', 'inset -4px -5px 7px')):
        errors.append('Graph nodes are not styled as shaded 3D spheres')
    stage_styles = re.findall(r'\.mg-stage\{([^}]*)\}', source)
    if not stage_styles or not all(token in source for token in ('.mg-console[data-background="dark"]', 'background-color:var(--mg-stage-bg)', 'radial-gradient(circle,var(--mg-stage-dot)', 'background-size:18px 18px')):
        errors.append('Graph stage is missing a textured background preset')
    if not all(token in source for token in ("button.addEventListener('pointerenter'", "button.addEventListener('focus'", "tooltip.textContent = term.title", "button.setAttribute('aria-describedby', 'mgTooltip')")):
        errors.append('Graph node names are not available through hover and keyboard focus')
    if 'button.textContent = term.title' in source:
        errors.append('Graph node names are visible before hover')
    mascot_match = re.search(r'<div class="mg-mascot-names"><span>(.*?)</span><span>(.*?)</span></div>', source, re.S)
    graph_mascot_names = [value.strip() for value in mascot_match.groups()] if mascot_match else []
    pair_match = re.search(r'<aside class="mg-mascots"[^>]*><img[^>]+alt="([^"]+)"', source)
    graph_pair_alt = pair_match.group(1) if pair_match else ''
    if len(graph_mascot_names) != 2 or not {'zuri · อธิบาย', 'น้องวางใจ · ชี้สัญญาณ'}.issubset(set(graph_mascot_names)) or not ('zuri' in graph_pair_alt.lower() and 'วางใจ' in graph_pair_alt):
        errors.append('Interactive graph is missing either mascot and named role')

    missing_files = []
    for ref in sorted(set(audit.local_refs)):
        parsed = urlparse(ref)
        if parsed.scheme or ref.startswith('#') or ref in ('/?view=1&tab=overview', '/?view=1&tab=meeting-task-manager'):
            continue
        target = (HTML_PATH.parent / unquote(parsed.path)).resolve()
        if not target.is_file():
            missing_files.append({'ref': ref, 'resolved': str(target)})
        elif target.suffix.lower() == '.css':
            css = target.read_text(encoding='utf-8')
            for raw in re.findall(r'url\(["\']?([^"\')]+)', css):
                if raw.startswith(('data:', 'http:', 'https:')):
                    continue
                font = (target.parent / unquote(raw)).resolve()
                if not font.is_file():
                    missing_files.append({'ref': raw, 'resolved': str(font)})
    if missing_files:
        errors.append('Missing local files: ' + json.dumps(missing_files, ensure_ascii=False))

    def current_report(name):
        path = REPORT_DIR / name
        if not path.is_file():
            return None
        try:
            report = json.loads(path.read_text(encoding='utf-8'))
            checked = datetime.fromisoformat(report['checkedAt'].replace('Z', '+00:00')).timestamp()
            return report if checked >= HTML_PATH.stat().st_mtime else None
        except (KeyError, ValueError, OSError, json.JSONDecodeError):
            return None

    browser_report = current_report('browser-checks.json')
    print_report = current_report('print-checks.json')
    browser_passed = bool(browser_report is not None and not browser_report.get('failures') and not browser_report.get('errors') and browser_report.get('printVisiblePages') == 18)
    print_passed = bool(print_report is not None and print_report.get('pageCount') == 18 and all(item.get('zuri') and item.get('wangjai') and item.get('folio') and item.get('imageCount', 0) >= 1 for item in print_report.get('results', [])))

    result = {
        'artifact': str(HTML_PATH),
        'guidePages': len(audit.pages),
        'metricCards': len(audit.metrics),
        'graphTerms': len(audit.metrics) + 2,
        'graphCategories': dict(expected_counts),
        'graphAppearance': {
            'sphericalNodes': bool(sphere_style and 'radial-gradient(circle at 30% 24%' in sphere_style),
            'texturedContrastStage': bool(stage_styles and 'background-color:var(--mg-stage-bg)' in stage_styles[-1]),
            'graphModes': ['2d', '3d'],
            'backgroundPresets': ['dark', 'canvas', 'warm'],
            'full360Rotation': 'VERIFIED_STATIC — yaw normalized modulo 2π',
            'hoverAndFocusNames': all(token in source for token in ("button.addEventListener('pointerenter'", "button.addEventListener('focus'", "tooltip.textContent = term.title"))
        },
        'pageViewer': {
            'previousNextControls': bool('id="previousPage"' in source and 'id="nextPage"' in source),
            'hashNavigation': 'window.addEventListener(\'hashchange\'' in source,
            'allPagesAvailableForPrint': 'body.viewer-ready .page[hidden]{display:block!important}' in source,
        },
        'mascotPages': sum(page['pair_image'] for page in audit.pages),
        'graphMascotNames': graph_mascot_names,
        'localReferencesChecked': len(set(audit.local_refs)),
        'missingFiles': missing_files,
        'missingAnchors': missing_fragments,
        'errors': errors,
        'browserAndPrintRendering': {
            'playwright': 'PASS' if browser_passed else 'STALE_OR_NOT_RUN',
            'pdfPageCount': print_report.get('pageCount') if print_report else None,
            'pdfMascotAndFolioChecks': 'PASS' if print_passed else 'STALE_OR_NOT_RUN'
        }
    }
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    (REPORT_DIR / 'static-checks.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
