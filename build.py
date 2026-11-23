"""Build a self-contained offline HTML application and editable data examples."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent
template = (ROOT / 'index.template.html').read_text()
styles = (ROOT / 'style.css').read_text() + '\n' + (ROOT / 'workbench.css').read_text() + '\n' + (ROOT / 'field-ui.css').read_text()
scripts = '\n\n'.join((ROOT / name).read_text() for name in ['vendor/sheetjs.js', 'vendor/geotiff.js', 'vendor/proj4.js', 'vendor/geographiclib-geodesic.js', 'core.js', 'sedimentary.js', 'seismic.js', 'landscape.js', 'intrusion.js', 'field-data.js', 'field-formats.js', 'workspace-core.js', 'project-store.js', 'renderer.js', 'app.js', 'workbench.js', 'field-ui.js'])
scripts = __import__('re').sub(r'</script', lambda m: '<\\/script', scripts, flags=__import__('re').IGNORECASE)
assert '</script' not in scripts.lower()
output = template.replace('/*__STYLES__*/', styles).replace('/*__APP__*/', scripts)
destination = ROOT / 'dist' / 'index.html'
destination.parent.mkdir(exist_ok=True)
destination.write_text(output)
(destination.parent / '.nojekyll').write_text('')
licenses = destination.parent / 'lizenzen'
licenses.mkdir(exist_ok=True)
for source in (ROOT / 'vendor').glob('*.txt'):
    shutil.copy2(source, licenses / source.name)
print(f'Built {destination} ({len(output.encode()):,} bytes)')
