"""Build a self-contained offline HTML application and editable data examples."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
template = (ROOT / 'index.template.html').read_text()
styles = (ROOT / 'style.css').read_text()
scripts = '\n\n'.join((ROOT / name).read_text() for name in ['core.js', 'sedimentary.js', 'seismic.js', 'landscape.js', 'intrusion.js', 'renderer.js', 'app.js'])
assert '</script' not in scripts.lower()
output = template.replace('/*__STYLES__*/', styles).replace('/*__APP__*/', scripts)
destination = ROOT / 'dist' / 'index.html'
destination.parent.mkdir(exist_ok=True)
destination.write_text(output)
(destination.parent / '.nojekyll').write_text('')
print(f'Built {destination} ({len(output.encode()):,} bytes)')
