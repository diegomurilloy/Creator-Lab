"""Matte: recorta a la persona de un video y la saca como WebM VP9 con transparencia (yuva420p).

Es lo que habilita los efectos de «profundidad» en Remotion: fondo → texto o gráficos → persona recortada encima.

Uso:
    python scripts/matte.py toma.mp4                          → toma-matte.webm junto al video
    python scripts/matte.py toma.mp4 -o public/demo/matte.webm --mascara
    python scripts/matte.py a.mp4 b.mp4 --carpeta out/mattes   → varios videos en lote
    python scripts/matte.py toma.mp4 --fondo-fijo              → cámara en tripié: limpia sillas/muebles pegados
    python scripts/matte.py toma.mp4 --paso 2 --escala 0.5     → más rápido (máscara cada 2 cuadros, mitad de tamaño)

Opciones principales:
    --modelo        u2net_human_seg (por defecto: segmentación de personas, ~0.6 s/cuadro en CPU) o cualquier
                    modelo de rembg. Probados en un cuadro de D01 (1080×1920, CPU): u2net_human_seg 0.6 s y se lleva parte
                    de la silla; isnet-general-use 2.1 s y se lleva la silla entera; birefnet-portrait ~30-56 s, recorte
                    casi perfecto (pelo incluido) pero imposible cuadro por cuadro → se usa solo en --fondo-fijo.
    --fondo-fijo    Para tomas con cámara fija. Corre un modelo fino (birefnet-portrait, 30-60 s por cuadro) en unos
                    pocos cuadros de referencia, detecta lo que el modelo rápido confunde con la persona (la silla, un
                    librero, el halo del pelo) y lo borra en todo el clip salvo donde la persona de verdad pasa por encima.

Tiempos medidos (10 s de toma 1080×1920 a 30 fps, CPU de 16 hilos): ~20 s de proceso por segundo de video sin
--fondo-fijo; con --fondo-fijo, ~3 min fijos de referencias + ~33 s por segundo de video. Con --paso 2 baja a la mitad.
Para Remotion: el WebM sale con GOP de 15 cuadros (Remotion busca cuadros sueltos) y se monta con <Video> de
@remotion/media (ver kit-diego/src/libreria/edicion-matte.tsx).
    --suavizado N   Media móvil centrada de la máscara entre N cuadros (por defecto 3) para que el borde no tiemble.
    --feather PX    Desvanecido del borde en px (por defecto 1.5).
    --paso N        Calcula la máscara cada N cuadros e interpola en medio (el video sale con todos los cuadros).
    --fps / --escala  Cambian los fps o el tamaño del WebM de salida.
    --mascara       Además saca la máscara en escala de grises (<salida>-mascara.mp4).
    --inicio / --duracion  Procesa solo un tramo (segundos).
    --hilos N       Cuadros que se infieren en paralelo (por defecto 3).

Sin rutas fijas: todo por argumentos. Si existe `personal/config.md` con `matte_modelo: …`, se usa como modelo por defecto.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from collections import deque
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from config import leer as leer_config
except Exception:  # noqa: BLE001
    def leer_config():
        return {}

try:
    from tqdm import tqdm
except ImportError:  # barra mínima si no hay tqdm
    tqdm = None


# ── Utilidades de video ─────────────────────────────────────────────────────
def info_video(ruta: str) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,nb_frames,duration", "-of", "json", ruta],
        capture_output=True, text=True, check=True,
    ).stdout
    s = json.loads(out)["streams"][0]
    num, den = s["r_frame_rate"].split("/")
    return {"w": int(s["width"]), "h": int(s["height"]), "fps": float(num) / float(den), "dur": float(s.get("duration") or 0)}


def par(n: int) -> int:
    return n - (n % 2)


def lector(ruta: str, w: int, h: int, fps: float, inicio: float | None, duracion: float | None):
    """Devuelve un generador de cuadros RGB (np.uint8 h×w×3)."""
    cmd = ["ffmpeg", "-v", "error"]
    if inicio:
        cmd += ["-ss", str(inicio)]
    cmd += ["-i", ruta]
    if duracion:
        cmd += ["-t", str(duracion)]
    cmd += ["-vf", f"fps={fps},scale={w}:{h}:flags=lanczos", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    tam = w * h * 3
    try:
        while True:
            buf = p.stdout.read(tam)
            if len(buf) < tam:
                break
            yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)
    finally:
        p.stdout.close()
        p.wait()


def escritor_webm(ruta: str, w: int, h: int, fps: float, crf: int):
    cmd = [
        "ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
        "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", str(crf), "-row-mt", "1",
        "-deadline", "good", "-cpu-used", "4", "-auto-alt-ref", "0", "-g", "15", "-keyint_min", "15",
        "-metadata:s:v:0", "alpha_mode=1", ruta,  # GOP corto: Remotion busca cuadros sueltos en el matte
    ]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


def escritor_mascara(ruta: str, w: int, h: int, fps: float):
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
           "-c:v", "libx264", "-crf", "16", "-preset", "fast", "-pix_fmt", "yuv420p", ruta]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


# ── Máscara ─────────────────────────────────────────────────────────────────
class Segmentador:
    def __init__(self, modelo: str):
        from rembg import new_session  # import tardío: tarda en cargar

        self.modelo = modelo
        self.sesion = new_session(modelo)
        self.lado = 1024 if modelo.startswith(("birefnet", "isnet", "bria")) else 640

    def __call__(self, rgb: np.ndarray) -> np.ndarray:
        """Máscara float32 0..1 del tamaño del cuadro."""
        im = Image.fromarray(rgb)
        # El modelo trabaja a ~320-1024 px: achicar antes ahorra el redimensionado LANCZOS a tamaño completo.
        lado = max(im.size)
        chico = im if lado <= self.lado else im.resize((round(im.width * self.lado / lado), round(im.height * self.lado / lado)), Image.BILINEAR)
        m = self.sesion.predict(chico)[0]
        if m.size != im.size:
            m = m.resize(im.size, Image.BICUBIC)
        return np.asarray(m, np.float32) / 255.0


def limpiar(m: np.ndarray, feather: float, erosion: int) -> np.ndarray:
    """Curva de niveles (quita el halo gris), erosión ligera (la orilla del fondo) y feather."""
    m = np.clip((m - 0.12) / 0.76, 0, 1)
    im = Image.fromarray((m * 255).astype(np.uint8))
    if erosion > 0:
        im = im.filter(ImageFilter.MinFilter(erosion * 2 + 1))
    if feather > 0:
        im = im.filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(im, np.float32) / 255.0


def pesos_suavizado(n: int) -> np.ndarray:
    """Pesos triangulares centrados: 3 → [1,2,1], 5 → [1,2,3,2,1]."""
    n = max(1, n | 1)  # impar
    r = n // 2
    w = np.array([r + 1 - abs(i - r) for i in range(n)], np.float32)
    return w / w.sum()


# ── Fondo fijo (tripié) ────────────────────────────────────────────────────
def zona_fondo_fijo(ruta, w, h, fps, inicio, duracion, rapido: Segmentador, modelo_fino: str, n_ref: int, total: int):
    """Compara el modelo rápido contra uno fino en `n_ref` cuadros. Devuelve (zona, placa): la zona que el rápido
    confunde con la persona en ALGÚN cuadro de referencia (silla, librero, halo del pelo) y la imagen del fondo ahí
    (mediana de los cuadros de referencia donde el modelo fino dice que es fondo)."""
    print(f"  fondo fijo: {n_ref} cuadros de referencia con {modelo_fino} (tarda ~30-60 s cada uno en CPU)…", flush=True)
    idx = set(int(round(x)) for x in np.linspace(total * 0.1, total * 0.9, n_ref))
    fino = Segmentador(modelo_fino)
    zonas, cuadros, fondos = [], [], []
    for i, rgb in enumerate(lector(ruta, w, h, fps, inicio, duracion)):
        if i not in idx:
            continue
        t0 = time.time()
        mr = rapido(rgb)
        mf = fino(rgb)
        zonas.append((mr > 0.5) & (mf < 0.3))
        # Fondo «seguro»: lejos (>12 px) del contorno de la persona en ese cuadro, para que la placa no se lleve pelo.
        seguro = Image.fromarray(((mf < 0.05) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(25))
        fondos.append(np.asarray(seguro) > 127)
        cuadros.append(rgb.astype(np.float32))
        print(f"    referencia {len(zonas)}/{n_ref} ({time.time() - t0:.0f} s)", flush=True)
    hay_placa = np.logical_or.reduce(fondos)
    zona = np.logical_or.reduce(zonas) & hay_placa  # sin placa limpia no se puede comparar: se deja como está
    # Crece un poco la zona para tragarse la orilla de la silla.
    zi = Image.fromarray((zona * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(3))
    zona_f = np.asarray(zi, np.float32) / 255.0
    # Placa: mediana solo de los cuadros donde ese píxel es fondo (la persona no lo tapa).
    pila = np.stack(cuadros)
    validos = np.stack(fondos)[..., None]
    pila = np.where(validos, pila, np.nan)
    with np.errstate(all="ignore"):
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            placa = np.nanmedian(pila, axis=0)
    placa = np.where(np.isnan(placa), np.median(np.stack(cuadros), axis=0), placa)
    print(f"  fondo fijo: {zona.mean() * 100:.1f}% del cuadro se trata como fondo pegado", flush=True)
    return zona_f, placa


def aplicar_fondo_fijo(m: np.ndarray, rgb: np.ndarray, zona: np.ndarray, placa: np.ndarray, umbral: float = 38.0) -> np.ndarray:
    """En la zona de fondo pegado solo queda persona donde el cuadro se aleja de la placa (alguien pasó por encima)."""
    dif = np.abs(rgb.astype(np.float32) - placa).max(axis=2)
    cambio = np.clip((dif - umbral) / 30.0, 0, 1)
    h, w = cambio.shape
    # A un cuarto de tamaño: quita ruido (mediana) y crece un poco (máximo) sin costar medio segundo por cuadro.
    ci = Image.fromarray((cambio * 255).astype(np.uint8)).resize((w // 4, h // 4), Image.BILINEAR)
    ci = ci.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.MaxFilter(3)).resize((w, h), Image.BILINEAR)
    cambio = np.asarray(ci, np.float32) / 255.0
    return m * (1 - zona * (1 - cambio))


# ── Proceso de un video ─────────────────────────────────────────────────────
def procesar(ruta: str, salida: str, a: argparse.Namespace, seg: Segmentador) -> None:
    inf = info_video(ruta)
    fps = a.fps or inf["fps"]
    w, h = par(round(inf["w"] * a.escala)), par(round(inf["h"] * a.escala))
    dur = a.duracion or max(0.0, inf["dur"] - (a.inicio or 0))
    total = max(1, int(round(dur * fps)))
    print(f"{os.path.basename(ruta)} → {salida}  ({w}×{h}, {fps:g} fps, ~{total} cuadros, modelo {seg.modelo})", flush=True)

    zona = placa = None
    if a.fondo_fijo:
        zona, placa = zona_fondo_fijo(ruta, w, h, fps, a.inicio, a.duracion, seg, a.modelo_fino, a.referencias, total)

    os.makedirs(os.path.dirname(os.path.abspath(salida)), exist_ok=True)
    pw = escritor_webm(salida, w, h, fps, a.crf)
    pm = escritor_mascara(os.path.splitext(salida)[0] + "-mascara.mp4", w, h, fps) if a.mascara else None

    pesos = pesos_suavizado(a.suavizado)
    r = len(pesos) // 2
    cola_rgb: deque = deque()   # cuadros esperando su máscara suavizada
    cola_m: deque = deque()     # máscaras crudas (ventana)
    barra = tqdm(total=total, unit="cuadro", ncols=80) if tqdm else None
    hechos = 0
    t0 = time.time()
    pool = ThreadPoolExecutor(max_workers=max(1, a.hilos))

    def emitir(rgb: np.ndarray, m: np.ndarray):
        nonlocal hechos
        m = limpiar(m, a.feather, a.erosion)
        if zona is not None:
            m = aplicar_fondo_fijo(m, rgb, zona, placa)
        alfa = (m * 255 + 0.5).astype(np.uint8)
        rgba = np.dstack([rgb, alfa])
        pw.stdin.write(rgba.tobytes())
        if pm:
            pm.stdin.write(alfa.tobytes())
        hechos += 1
        if barra:
            barra.update(1)
        elif hechos % 10 == 0:
            print(f"\r  {hechos}/{total} cuadros", end="", flush=True)

    def empujar(rgb: np.ndarray, m: np.ndarray):
        if not cola_m and not cola_rgb:  # arranque: repite la primera máscara hacia atrás
            cola_m.extend([m] * r)
        cola_rgb.append(rgb)
        cola_m.append(m)
        if len(cola_m) == len(pesos):
            emitir(cola_rgb.popleft(), sum(p * x for p, x in zip(pesos, cola_m)))
            cola_m.popleft()

    # Lee por lotes, infiere en paralelo (cada `paso` cuadros) e interpola en medio.
    lote: list[np.ndarray] = []
    ultimo_m = None
    ultimo_i = -1
    pendientes: list[tuple[int, np.ndarray]] = []

    def vaciar_lote(lote_cuadros: list[np.ndarray], base: int, final: bool):
        nonlocal ultimo_m, ultimo_i
        claves = [j for j in range(len(lote_cuadros)) if (base + j) % a.paso == 0 or (final and j == len(lote_cuadros) - 1)]
        mascaras = dict(zip(claves, pool.map(seg, [lote_cuadros[j] for j in claves])))
        for j, rgb in enumerate(lote_cuadros):
            pendientes.append((base + j, rgb))
            if j in mascaras:
                mk = mascaras[j]
                ik = base + j
                # Interpola linealmente las máscaras de los cuadros sin inferencia.
                for (ip, rp) in pendientes:
                    if ip == ik:
                        empujar(rp, mk)
                    else:
                        k = (ip - ultimo_i) / max(1, ik - ultimo_i)
                        base_m = ultimo_m if ultimo_m is not None else mk
                        empujar(rp, base_m * (1 - k) + mk * k)
                pendientes.clear()
                ultimo_m, ultimo_i = mk, ik

    base = 0
    for rgb in lector(ruta, w, h, fps, a.inicio, a.duracion):
        lote.append(rgb)
        if len(lote) >= a.lote:
            vaciar_lote(lote, base, False)
            base += len(lote)
            lote = []
    if lote:
        vaciar_lote(lote, base, True)
    for (ip, rp) in pendientes:  # por si acaso
        empujar(rp, ultimo_m)
    # Vacía la cola repitiendo la última máscara (ventana centrada).
    while cola_rgb:
        cola_m.append(cola_m[-1])
        emitir(cola_rgb.popleft(), sum(p * x for p, x in zip(pesos, cola_m)))
        cola_m.popleft()

    pool.shutdown()
    if barra:
        barra.close()
    pw.stdin.close()
    pw.wait()
    if pm:
        pm.stdin.close()
        pm.wait()
    dt = time.time() - t0
    print(f"\n  listo: {hechos} cuadros en {dt:.0f} s ({dt / max(1e-6, dur):.1f} s por segundo de video)", flush=True)


def main() -> None:
    for flujo in (sys.stdout, sys.stderr):  # la consola de Windows no siempre es UTF-8
        try:
            flujo.reconfigure(encoding="utf-8", errors="replace")
        except Exception:  # noqa: BLE001
            pass
    cfg = leer_config()
    ap = argparse.ArgumentParser(description="Recorta a la persona de un video → WebM VP9 con alfa.")
    ap.add_argument("entradas", nargs="+", help="uno o más videos")
    ap.add_argument("-o", "--salida", help="ruta del WebM (solo con un video)")
    ap.add_argument("--carpeta", help="carpeta de salida para varios videos")
    ap.add_argument("--modelo", default=cfg.get("matte_modelo", "u2net_human_seg"))
    ap.add_argument("--fondo-fijo", action="store_true", help="cámara fija: borra muebles pegados a la persona")
    ap.add_argument("--modelo-fino", default="birefnet-portrait")
    ap.add_argument("--referencias", type=int, default=3, help="cuadros de referencia para --fondo-fijo")
    ap.add_argument("--fps", type=float, help="fps de salida (por defecto los del video)")
    ap.add_argument("--escala", type=float, default=1.0, help="escala de salida (0.5 = mitad)")
    ap.add_argument("--paso", type=int, default=1, help="infiere la máscara cada N cuadros e interpola")
    ap.add_argument("--suavizado", type=int, default=3, help="media móvil de la máscara (cuadros)")
    ap.add_argument("--feather", type=float, default=1.5, help="desvanecido del borde en px")
    ap.add_argument("--erosion", type=int, default=1, help="px que se comen de la orilla (quita halo del fondo)")
    ap.add_argument("--mascara", action="store_true", help="también saca la máscara en grises (mp4)")
    ap.add_argument("--inicio", type=float, help="segundo de inicio")
    ap.add_argument("--duracion", type=float, help="segundos a procesar")
    ap.add_argument("--crf", type=int, default=28, help="calidad VP9 (menor = mejor)")
    ap.add_argument("--lote", type=int, default=24, help="cuadros por lote")
    ap.add_argument("--hilos", type=int, default=3, help="inferencias en paralelo")
    a = ap.parse_args()

    if a.salida and len(a.entradas) > 1:
        ap.error("-o solo sirve con un video; para varios usa --carpeta")
    a.paso = max(1, a.paso)

    seg = Segmentador(a.modelo)
    for ruta in a.entradas:
        if not os.path.exists(ruta):
            print(f"No existe: {ruta}", file=sys.stderr)
            continue
        nombre = os.path.splitext(os.path.basename(ruta))[0] + "-matte.webm"
        salida = a.salida or os.path.join(a.carpeta or os.path.dirname(os.path.abspath(ruta)), nombre)
        procesar(ruta, salida, a, seg)


if __name__ == "__main__":
    main()
