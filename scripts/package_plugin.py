"""Create a deterministic, credentials-free submission ZIP from the canonical tree."""
from pathlib import Path
import json
import zipfile

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
output = root / 'dist' / f'orbit-handoff-plugin-{version}.zip'
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted((root / 'plugin').rglob('*')):
        if file.is_symlink():
            raise ValueError(f'Symlinks are not portable: {file.name}')
        if file.is_file():
            info = zipfile.ZipInfo(file.relative_to(root / 'plugin').as_posix(), (2026, 10, 5, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, file.read_bytes())
    for name in ('LICENSE', 'PRIVACY.md', 'SECURITY.md'):
        if (root / 'plugin' / name).exists():
            continue
        info = zipfile.ZipInfo(name, (2026, 10, 5, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, (root / name).read_bytes())
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    assert 'plugin.json' in archive.namelist()
    assert 'skills/handoff/SKILL.md' in archive.namelist()
print(f'Built dist/{output.name} ({output.stat().st_size} bytes)')
