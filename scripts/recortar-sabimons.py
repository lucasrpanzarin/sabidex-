# Recorta o fundo branco dos desenhos dos Sabimons e salva versões leves para o app.
# Uso: python3 scripts/recortar-sabimons.py
# Lê arte/sabimons/originais/<número>-<forma>.png e grava public/sabimons/<número>-<forma>.webp
# Só refaz as imagens novas ou que mudaram. Depois, atualize a lista em src/data/sabimons.ts.
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ORIGEM = Path('arte/sabimons/originais')
DESTINO = Path('public/sabimons')
TAMANHO = 480

def recortar(src: Path, dst: Path):
    im = Image.open(src).convert('RGB').resize((TAMANHO, TAMANHO), Image.LANCZOS)
    a = np.asarray(im).astype(int)
    h, w, _ = a.shape
    claro = (a.min(axis=2) > 228) & ((a.max(axis=2) - a.min(axis=2)) < 22)
    fundo = np.zeros((h, w), bool)
    fila = deque([(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)])
    while fila:
        y, x = fila.popleft()
        if fundo[y, x] or not claro[y, x]:
            continue
        fundo[y, x] = True
        fila.extend(p for p in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)) if 0 <= p[0] < h and 0 <= p[1] < w)
    alpha = Image.fromarray(np.where(fundo, 0, 255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1))
    out = im.convert('RGBA')
    out.putalpha(alpha)
    out.crop(out.getbbox()).save(dst, 'WEBP', quality=82)

DESTINO.mkdir(parents=True, exist_ok=True)
for src in sorted(ORIGEM.glob('*.png')):
    dst = DESTINO / (src.stem + '.webp')
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        continue
    recortar(src, dst)
    print('ok', dst)
