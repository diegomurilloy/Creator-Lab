# Exporta un carrusel HTML: MP4 por lámina si está animada, PNG si no; más PNG de todas (portada) y el PDF.
# Uso: python export_carrusel.py carrusel.html carpeta_salida nombre [--dur 5] [--fps 30] [--solo-png]
#
# Convención del HTML (modos/carrusel.md):
# - Cada lámina es <section class="slide"> de 1080×1350.
# - Las animaciones se disparan cuando la lámina tiene la clase .on. El estilo base es el estado FINAL y los
#   keyframes solo definen `from`; con la clase html.still (animaciones apagadas) la lámina sale completa.
# - Fuentes por Google Fonts (<link>) o locales; el script espera document.fonts.ready.
# Salida en carpeta_salida/:
#   nombre-01.png … (todas, estáticas: la 01 es la portada del grid), nombre-02.mp4 … (solo las animadas),
#   nombre.pdf (PNG en orden, para LinkedIn) y nombre-png.zip (respaldo).
import os
import subprocess
import sys
import zipfile

from PIL import Image
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

args = sys.argv[1:]
html, out, nombre = os.path.abspath(args[0]), args[1], args[2]
dur = float(args[args.index("--dur") + 1]) if "--dur" in args else 5.0
fps = int(args[args.index("--fps") + 1]) if "--fps" in args else 30
solo_png = "--solo-png" in args
CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
os.makedirs(out, exist_ok=True)

# Fuerza las láminas a su tamaño natural, una debajo de otra (sin el visor que escala y desliza).
CSS = """
html, body { margin: 0 !important; padding: 0 !important; background: transparent !important; }
.track { transform: none !important; display: flex !important; flex-direction: column !important; width: 1080px !important; }
.slide { position: relative !important; flex: none !important; width: 1080px !important; height: 1350px !important; overflow: hidden !important; }
.visor-ui, .dots, .arrows, .repetir { display: none !important; }
"""


def abrir(p, still):
    b = p.chromium.launch(executable_path=CHROME if os.path.exists(CHROME) else None)
    pg = b.new_page(viewport={"width": 1080, "height": 1350}, device_scale_factor=1)
    pg.goto("file:///" + html.replace("\\", "/"))
    pg.add_style_tag(content=CSS)
    if still:
        pg.evaluate("document.documentElement.classList.add('still')")
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(300)
    return b, pg


with sync_playwright() as p:
    # 1) PNG estáticos de todas las láminas
    b, pg = abrir(p, still=True)
    slides = pg.query_selector_all("section.slide")
    n = len(slides)
    pngs = []
    for i, s in enumerate(slides, 1):
        f = os.path.join(out, f"{nombre}-{i:02d}.png")
        s.screenshot(path=f)
        pngs.append(f)
    b.close()
    print(f"{n} láminas → PNG")

    # 2) MP4 de las láminas animadas, cuadro por cuadro
    animadas = []
    if not solo_png:
        b, pg = abrir(p, still=False)
        slides = pg.query_selector_all("section.slide")
        for i, s in enumerate(slides, 1):
            tiene = pg.evaluate("(el) => { el.classList.add('on'); return el.getAnimations({ subtree: true }).length; }", s)
            if not tiene:
                continue
            animadas.append(i)
            pg.evaluate("(el) => el.getAnimations({ subtree: true }).forEach(a => a.pause())", s)
            f = os.path.join(out, f"{nombre}-{i:02d}.mp4")
            ff = subprocess.Popen(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
                                   "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-r", str(fps), "-movflags", "+faststart", f], stdin=subprocess.PIPE)
            for k in range(int(dur * fps)):
                ms = k * 1000 / fps
                pg.evaluate("([el, ms]) => el.getAnimations({ subtree: true }).forEach(a => { a.currentTime = ms; })", [s, ms])
                ff.stdin.write(s.screenshot(type="png"))
            ff.stdin.close()
            ff.wait()
        b.close()
        print("animadas → MP4:", ", ".join(f"{i:02d}" for i in animadas) if animadas else "ninguna")

# 3) PDF y zip de respaldo
ims = [Image.open(f).convert("RGB") for f in pngs]
ims[0].save(os.path.join(out, f"{nombre}.pdf"), save_all=True, append_images=ims[1:], resolution=144)
with zipfile.ZipFile(os.path.join(out, f"{nombre}-png.zip"), "w") as z:
    for f in pngs:
        z.write(f, os.path.basename(f))
print(f"PDF y zip listos en {out}")
print("Para Instagram: lámina 01 en PNG (portada) y, desde la 02, MP4 si existe o PNG si no.")
