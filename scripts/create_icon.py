"""Build the small geometric Orbit Handoff icon without dependencies."""
from pathlib import Path
import math
import struct
import zlib

size = 512
rows = bytearray()
for y in range(size):
    rows.append(0)
    for x in range(size):
        dx, dy = x - 255.5, y - 255.5
        distance = math.hypot(dx, dy)
        ring = abs(distance - 149) < 13
        dot = math.hypot(x - 371, y - 161) < 34
        centre = math.hypot(dx, dy) < 42
        colour = (255, 255, 255) if ring or centre else (165, 243, 252) if dot else (67, 56, 202)
        if dot:
            colour = (165, 243, 252)
        rows.extend(colour)

def chunk(kind, data):
    return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data) & 0xffffffff)

output = Path(__file__).resolve().parents[1] / 'plugin/assets/icon.png'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B', size, size, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b''))
print('Built plugin/assets/icon.png')
