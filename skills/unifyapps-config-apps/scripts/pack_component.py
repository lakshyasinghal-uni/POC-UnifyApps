"""Package a UnifyApps custom component folder for upload.

    python pack_component.py <component-dir> [out-dir]

The folder must contain out.json (the manifest: name, type, main, style, icon, keywords) plus the
files it names. Writes <type>.zip and <type>.attach.js — paste the .js into the browser JavaScript
tool while the "Add Component" dialog is open (Production mode selected): it attaches the ZIP to the
dialog's file input, exactly as if the user had dropped it. Then click Add (twice: once for the file
checks, once to create). Nothing here talks to the network.
"""
import base64
import io
import json
import os
import sys
import zipfile


def main():
    src = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else src
    manifest_path = os.path.join(src, 'out.json')
    if not os.path.exists(manifest_path):
        sys.exit('out.json not found — the manifest must be called out.json (manifest.json fails the file checks)')
    m = json.load(open(manifest_path, encoding='utf-8'))
    for k in ('name', 'type', 'main'):
        if not m.get(k):
            sys.exit(f'out.json is missing "{k}"')
    files = ['out.json', m['main']] + ([m['style']] if m.get('style') else [])
    for f in files:
        if not os.path.exists(os.path.join(src, f)):
            sys.exit(f'{f} named in out.json does not exist')
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(os.path.join(src, f), f)          # files at the ZIP root
    data = buf.getvalue()
    name = m['type']
    open(os.path.join(out, f'{name}.zip'), 'wb').write(data)
    b64 = base64.b64encode(data).decode()
    js = (
        "(async () => {\n"
        f"  const bytes = Uint8Array.from(atob('{b64}'), c => c.charCodeAt(0));\n"
        f"  const file = new File([bytes], '{name}.zip', {{ type: 'application/zip' }});\n"
        "  const input = document.querySelector('[role=dialog] input[type=file]');\n"
        "  if (!input) return 'Open Add Component and choose Production first';\n"
        "  const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files;\n"
        "  input.dispatchEvent(new Event('change', { bubbles: true }));\n"
        "  return 'attached ' + file.size + ' bytes';\n"
        "})()\n"
    )
    open(os.path.join(out, f'{name}.attach.js'), 'w', encoding='utf-8').write(js)
    print(f'{name}.zip ({len(data)} bytes) and {name}.attach.js written to {out}')


if __name__ == '__main__':
    main()
