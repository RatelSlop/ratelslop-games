"""Test and package the standalone calculator edition using only Python stdlib."""
import ast
import hashlib
from pathlib import Path
import shutil
import subprocess
import sys
import zipfile

HERE = Path(__file__).resolve().parent
TARGET = HERE.parents[1] / 'dist' / 'numworks'
subprocess.run([sys.executable, str(HERE / 'test_port.py')], check=True)
source = (HERE / 'ratelslop.py').read_text(encoding='utf-8')
# Reduce calculator storage use without changing Python syntax or program AST.
lines = []
for line in source.splitlines():
    if not line.strip() or line.lstrip().startswith('#'):
        continue
    indent = len(line) - len(line.lstrip(' '))
    lines.append(' ' * (indent // 4) + line.lstrip(' '))
compact = '\n'.join(lines) + '\n'
assert ast.dump(ast.parse(source)) == ast.dump(ast.parse(compact))
ast.parse(compact, feature_version=(3, 4))
assert len(compact.encode('ascii')) < 24 * 1024
TARGET.mkdir(parents=True, exist_ok=True)
(TARGET / 'ratelslop.py').write_text(compact, encoding='ascii', newline='\n')
shutil.copyfile(HERE / 'START-HERE.txt', TARGET / 'START-HERE.txt')
shutil.copyfile(HERE / 'download.html', TARGET / 'index.html')
with zipfile.ZipFile(TARGET / 'ratelslop-numworks.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.write(TARGET / 'ratelslop.py', 'ratelslop.py')
    archive.write(TARGET / 'START-HERE.txt', 'START-HERE.txt')
digest = hashlib.sha256((TARGET / 'ratelslop.py').read_bytes()).hexdigest()
(TARGET / 'SHA256.txt').write_text(digest + '  ratelslop.py\n', encoding='ascii')
print('Built NumWorks edition: %d bytes, one script, six games.' % len(compact))
