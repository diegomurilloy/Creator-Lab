# Hoja de un video completo, un cuadro por segundo: para revisar un reel terminado de un vistazo
# (huecos sin overlay, cuándo entra cada gráfico, si algo tapa la cara, ritmo). Es la base de la auditoría.
# Uso: python hoja_video.py final.mp4 hoja.jpg
import io
import subprocess
import sys

from PIL import Image, ImageDraw

f, out = sys.argv[1], sys.argv[2]
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True).stdout)
n, W, H, COLS = int(dur), 135, 240, 12
o = Image.new("RGB", (COLS * W, ((n + COLS - 1) // COLS) * (H + 14)), "white")
d = ImageDraw.Draw(o)
for k in range(n):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(k + 0.5), "-i", f, "-frames:v", "1", "-vf", f"scale={W}:{H}", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    if raw:
        o.paste(Image.open(io.BytesIO(raw)), ((k % COLS) * W, (k // COLS) * (H + 14) + 14))
        d.text(((k % COLS) * W + 2, (k // COLS) * (H + 14) + 1), f"{k}s", fill="black")
o.save(out)
print("listo:", out)
