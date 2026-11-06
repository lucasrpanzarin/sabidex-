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
    '021': (34, 211, 238),   # Ondorca, Marorca, Tsunorca: turquesa
    '022': (250, 204, 21),   # Sacizinho, Redemoinhaci, Saciclone: dourado
    '024': (250, 204, 21),   # Faiscamula, Mulabrasa, Mulavulcão: dourado
    '028': (34, 211, 238),   # Uivinho, Uivolua, Lobisolar: turquesa
}
# Desenhos com sombra cinza no chão: o recorte também tira o cinza claro (não usar em bicho branco).
TIRAR_SOMBRA = {'004-1', '016-2'}
# Desenhos com um clarão de luz no chão (entre as patas): tira o claro só no quarto de baixo da imagem.
TIRAR_CHAO = {'016-2'}
# Desenhos com brilho branco em volta (água, luz): o claro ligado ao fundo vira transparência suave.
TIRAR_BRILHO = {'002-1'}

def recortar_brilho(im: Image.Image) -> Image.Image:
    """Tira o fundo e o clarão branco: quanto mais branco, mais transparente."""
    a = np.asarray(im).astype(float)
    h, w, _ = a.shape
    mn = a.min(axis=2)
    limite = 170
    claro = mn > limite
    fundo = np.zeros((h, w), bool)
    fila = deque([(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)])
    while fila:
        y, x = fila.popleft()
        if fundo[y, x] or not claro[y, x]:
            continue
        fundo[y, x] = True
        fila.extend(p for p in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)) if 0 <= p[0] < h and 0 <= p[1] < w)
    alpha = np.where(fundo, np.clip((255 - mn) / (255 - limite), 0, 1), 1.0)[..., None]
    rgb = (a - 255 * (1 - alpha)) / np.maximum(alpha, 0.01)
    rgb, al = fechar_frestas(np.clip(rgb, 0, 255), alpha[..., 0] * 255)
    return Image.fromarray(np.dstack([rgb, al]).astype('uint8'), 'RGBA')

def media_vizinhos(x: np.ndarray, r: int = 4) -> np.ndarray:
    p = np.pad(x, r, mode='edge').cumsum(0).cumsum(1)
    p = np.pad(p, ((1, 0), (1, 0)))
    n = 2 * r + 1
    return (p[n:, n:] - p[:-n, n:] - p[n:, :-n] + p[:-n, :-n]) / (n * n)

def fechar_frestas(rgb: np.ndarray, al: np.ndarray):
    """Fecha frestas finas no corpo rosa (ex.: a linha de brilho entre a nadadeira e as costas do boto),
    pintando com a cor de perto. Só onde a cor em volta é rosa, para não mexer na água."""
    A = Image.fromarray(al.astype('uint8'))
    fechado = np.asarray(A.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))).astype(float)
    peso = (al / 255) ** 2
    perto = np.dstack([media_vizinhos(rgb[..., c] * peso) for c in range(3)]) / (media_vizinhos(peso) + 1e-6)[..., None]
    rosa = (perto[..., 0] - perto[..., 1]) > 50
    fechado = np.where(rosa, np.maximum(fechado, al), al)
    novo = ((fechado - al) / 255)[..., None]
    return rgb * (1 - novo) + perto * novo, fechado

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
    if src.stem in TIRAR_BRILHO:
        out = recortar_brilho(im)
        out.crop(out.getbbox()).save(dst, 'WEBP', quality=82)
        return
    a = np.asarray(im).astype(int)
    h, w, _ = a.shape
    limite = 185 if src.stem in TIRAR_SOMBRA else 228
    claro = (a.min(axis=2) > limite) & ((a.max(axis=2) - a.min(axis=2)) < 22)
    if src.stem in TIRAR_CHAO:
        chao = np.zeros_like(claro)
        chao[int(h * 0.75):] = True
        claro |= chao & (a.min(axis=2) > 170)
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

# Ará, a mascote: arte/mascote/originais/ara-<humor>.png → public/mascote/ara-<humor>.webp (mesmo recorte)
MAS_ORIGEM = Path('arte/mascote/originais')
MAS_DESTINO = Path('public/mascote')
MAS_DESTINO.mkdir(parents=True, exist_ok=True)
for src in sorted(MAS_ORIGEM.glob('*.png')):
    dst = MAS_DESTINO / (src.stem + '.webp')
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

# Desenho do pacote (gerado pelo Higgsfield, sem letras): tira o fundo branco e deixa leve.
# O app usa public/pacote/normal.webp e public/pacote/epico.webp.
PAC_ESCOLHIDOS = {'normal': 'pacote-normal-b', 'epico': 'pacote-epico-b'}
PAC_DESTINO = Path('public/pacote')
PAC_DESTINO.mkdir(parents=True, exist_ok=True)
for nome, arquivo in PAC_ESCOLHIDOS.items():
    src = Path('arte/pacote/originais') / f'{arquivo}.png'
    dst = PAC_DESTINO / f'{nome}.webp'
    if not src.exists() or ('--tudo' not in sys.argv and dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime):
        continue
    im = Image.open(src).convert('RGB')
    im = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
    a = np.asarray(im).astype(int)
    h, w, _ = a.shape
    claro = (a.min(axis=2) > 232) & ((a.max(axis=2) - a.min(axis=2)) < 16)
    fundo = np.zeros((h, w), bool)
    fila = deque([(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)])
    while fila:
        y, x = fila.popleft()
        if fundo[y, x] or not claro[y, x]:
            continue
        fundo[y, x] = True
        fila.extend(p for p in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)) if 0 <= p[0] < h and 0 <= p[1] < w)
    alpha = Image.fromarray(np.where(fundo, 0, 255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA')
    out.putalpha(alpha)
    out = out.crop(out.getbbox())
    out.thumbnail((460, 700), Image.LANCZOS)
    out.save(dst, 'WEBP', quality=84)
    print('ok', dst, out.size)
