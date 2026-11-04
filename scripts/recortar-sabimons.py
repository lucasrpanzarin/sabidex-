# Recorta o fundo branco dos desenhos dos Sabimons e salva versões leves para o app.
# Uso: python3 scripts/recortar-sabimons.py          (só as novas ou que mudaram)
#      python3 scripts/recortar-sabimons.py --tudo   (refaz todas)
# Lê arte/sabimons/originais/<número>-<forma>.png e grava public/sabimons/<número>-<forma>.webp
# Só refaz as imagens novas ou que mudaram. Depois, atualize a lista em src/data/sabimons.ts.
# Também prepara os cenários: arte/cenarios/originais/<tipo>.png → public/cenarios/<tipo>.webp
import sys
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ORIGEM = Path('arte/sabimons/originais')
DESTINO = Path('public/sabimons')
TAMANHO = 480
# Bichos escuros ganham um contorno de luz para não sumirem no fundo azul-noite (docs/ARTE-SABIMONS.md).
CONTORNO = {
    '004': (250, 204, 21),   # Zapinho, Faiscaluz, Trovalume: dourado
    '010': (34, 211, 238),   # Estrelim, Constelão, Galaxiá: turquesa
    '013': (34, 211, 238),   # Tucanuvem, Bicorrente, Tucaventania: turquesa
    '017': (250, 204, 21),   # Antarocha, Pedranta, Montanta: dourado
    '020': (34, 211, 238),   # Oncelestre, Onçastral, Constelonça: turquesa
}
# Desenhos com sombra cinza no chão: o recorte também tira o cinza claro (não usar em bicho branco).
TIRAR_SOMBRA = {'004-1'}

def contorno(img: Image.Image, cor) -> Image.Image:
    """Desenha uma luz da cor dada em volta do bicho, por trás dele."""
    margem = 14
    base = Image.new('RGBA', (img.width + 2 * margem, img.height + 2 * margem), (0, 0, 0, 0))
    base.paste(img, (margem, margem), img)
    a = base.getchannel('A')
    perto = a.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(2.5))
    longe = a.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(9))
    brilho = Image.fromarray(np.clip(np.asarray(perto, float) * 0.95 + np.asarray(longe, float) * 0.6, 0, 255).astype('uint8'))
    luz = Image.new('RGBA', base.size, cor + (0,))
    luz.putalpha(brilho)
    luz.alpha_composite(base)
    return luz

def recortar(src: Path, dst: Path):
    im = Image.open(src).convert('RGB').resize((TAMANHO, TAMANHO), Image.LANCZOS)
    a = np.asarray(im).astype(int)
    h, w, _ = a.shape
    limite = 185 if src.stem in TIRAR_SOMBRA else 228
    claro = (a.min(axis=2) > limite) & ((a.max(axis=2) - a.min(axis=2)) < 22)
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
    out = out.crop(out.getbbox())
    cor = CONTORNO.get(src.stem.split('-')[0])
    if cor:
        out = contorno(out, cor)
    out.save(dst, 'WEBP', quality=82)

DESTINO.mkdir(parents=True, exist_ok=True)
for src in sorted(ORIGEM.glob('*.png')):
    dst = DESTINO / (src.stem + '.webp')
    if '--tudo' not in sys.argv and dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        continue
    recortar(src, dst)
    print('ok', dst)

# Cenários atrás dos bichos: não precisam de recorte, só ficar leves.
CEN_ORIGEM = Path('arte/cenarios/originais')
CEN_DESTINO = Path('public/cenarios')
CEN_DESTINO.mkdir(parents=True, exist_ok=True)
for src in sorted(CEN_ORIGEM.glob('*.png')):
    dst = CEN_DESTINO / (src.stem + '.webp')
    if '--tudo' not in sys.argv and dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        continue
    Image.open(src).convert('RGB').resize((520, 520), Image.LANCZOS).save(dst, 'WEBP', quality=76)
    print('ok', dst)
