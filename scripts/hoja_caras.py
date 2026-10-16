# Hoja densa de caras para elegir el cuadro de la portada (o cualquier momento con la cara bien).
# Uso: python hoja_caras.py toma.mp4 salida.jpg 0.0-2.0 [44.5-46.7 ...]
#   Cada rango se muestrea cada 0.1 s. Busca SONRISAS (dientes, ojos abiertos) al inicio o al final de la toma:
#   ahí no estás a media palabra. Nunca uses una cara neutra o seria aunque el tema sea serio.
# Ajusta Y0/ALTO si la cara de tu encuadre queda más arriba o más abajo (fracciones del cuadro).
import io
import subprocess
import sys

from PIL import Image, ImageDraw

f, out = sys.argv[1], sys.argv[2]
X0, Y0, ANCHO = 0.25, 0.24, 0.5  # recorte alrededor de la cara (fracción del cuadro)
W, H, COLS = 180, 260, 10
ts = []
for rango in sys.argv[3:]:
    a, b = map(float, rango.split("-"))
    t = a
    while t <= b + 1e-6:
        ts.append(round(t, 2))
        t += 0.1
ts = ts[:60]
o = Image.new("RGB", (COLS * W, ((len(ts) + COLS - 1) // COLS) * (H + 16)), "white")
d = ImageDraw.Draw(o)
for k, t in enumerate(ts):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", f, "-frames:v", "1", "-vf", "scale=900:-1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    if not raw:
        continue
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    x0, y0 = int(im.width * X0), int(im.height * Y0)
    c = im.crop((x0, y0, x0 + int(im.width * ANCHO), y0 + int(im.width * ANCHO * H / W))).resize((W, H))
    o.paste(c, ((k % COLS) * W, (k // COLS) * (H + 16) + 16))
    d.text(((k % COLS) * W + 3, (k // COLS) * (H + 16) + 2), f"{t:.1f}", fill="black")
o.save(out)
print("listo:", out)
