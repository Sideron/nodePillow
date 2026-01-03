import sys
import io
from PIL import Image
import imagehash

def read_exact(n: int) -> bytes:
    data = b""
    while len(data) < n:
        chunk = sys.stdin.buffer.read(n - len(data))
        if not chunk:
            raise ValueError("EOF inesperado leyendo stdin")
        data += chunk
    return data

def read_u32_be() -> int:
    b = read_exact(4)
    return int.from_bytes(b, byteorder="big", signed=False)

try:
    n1 = read_u32_be()
    img1_bytes = read_exact(n1)

    n2 = read_u32_be()
    img2_bytes = read_exact(n2)

    img1 = Image.open(io.BytesIO(img1_bytes)).convert("RGB")
    img2 = Image.open(io.BytesIO(img2_bytes)).convert("RGB")

    h1 = imagehash.phash(img1)
    h2 = imagehash.phash(img2)

    distance = h1 - h2  # 0 = idénticas visualmente (según pHash)
    print(distance)

except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)