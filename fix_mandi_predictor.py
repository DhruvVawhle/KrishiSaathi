import sys
import os

path = 'src/Python/mandi_predictor.py'
if not os.path.exists(path):
    print(f"Path {path} does not exist")
    sys.exit(1)

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = -1
end = -1
marker1 = 'print(f"Historical error reading {fname}: {e}", file=sys.stderr)'
marker2 = 'seen = set()'

for i, line in enumerate(lines):
    if marker1 in line and i > 300:
        start = i + 1
    if marker2 in line and i > 350:
        end = i
        break

if start != -1 and end != -1:
    new_lines = lines[:start] + lines[end:]
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Fixed: removed lines {start+1} to {end}")
else:
    print(f"Failed to find markers: start={start}, end={end}")
