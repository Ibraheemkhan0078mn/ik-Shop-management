from pathlib import Path
import os
import re

root = Path('src')
pattern = re.compile(r'([\"\'])(@[^\"\']+)(\1)')


def resolve_target(target_path: str):
    if not target_path.startswith('@'):
        return None
    target_path = target_path[1:]
    if target_path.startswith('/'):
        target_path = target_path[1:]
    parts = target_path.split('/', 1)
    if len(parts) < 2:
        return None
    alias_root = parts[0]
    suffix = parts[1]
    base = root / alias_root / suffix
    for ext in ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']:
        cand = base.with_suffix(ext)
        if cand.exists():
            return cand
    if base.exists():
        return base
    if (base / 'index.js').exists():
        return base / 'index.js'
    if (base / 'index.jsx').exists():
        return base / 'index.jsx'
    if (base / 'index.ts').exists():
        return base / 'index.ts'
    if (base / 'index.tsx').exists():
        return base / 'index.tsx'
    return None

for path in root.rglob('*'):
    if not path.is_file() or path.suffix.lower() not in {'.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'}:
        continue
    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        continue
    if '@' not in text:
        continue

    def replace_match(match):
        quote = match.group(1)
        target = match.group(2)
        resolved = resolve_target(target)
        if not resolved:
            return match.group(0)
        rel = os.path.relpath(resolved, path.parent)
        rel = rel.replace('\\', '/')
        if not rel.startswith('.'):
            rel = './' + rel
        return f'{quote}{rel}{quote}'

    new_text = pattern.sub(replace_match, text)
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')

print('Alias import conversion complete')
