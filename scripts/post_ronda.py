# Uso: python post_ronda.py <carpeta_con_mp4> '{"id": {"archivo": "pop", "en": [0.5], "volumen": 0.12}}' [--sfx RUTA]
#   --sfx: carpeta de efectos; si no se pasa, `sfx` de personal/config.md, o <kit>/public/sfx.
# Por cada opción renderizada: versión completa con sonido (picos < -1 dB) y vista previa muda < 2 MB.
import os, subprocess, sys, json
from config import leer, valor
args = sys.argv[1:]
_sfx_arg = args[args.index("--sfx") + 1] if "--sfx" in args else None
if "--sfx" in args:
    i = args.index("--sfx"); del args[i:i + 2]
if not args or args[0] in ("-h", "--help"):
    sys.exit("Uso: python scripts/post_ronda.py <carpeta_con_mp4> '{\"id\": {\"archivo\": \"pop\", \"en\": [0.5], \"volumen\": 0.12}}' [--sfx RUTA]")
d = args[0]
_kit = leer().get("kit")
SFX = valor("sfx", _sfx_arg, os.path.join(_kit, "public", "sfx") if _kit else None)
sonidos = json.loads(args[1]) if len(args) > 1 else {}  # {"r1-b1": {"archivo": "pop", "en": [..], "volumen": 0.12}, ...}
for f in sorted(os.listdir(d)):
    if not f.endswith(".mp4") or f.endswith("-full.mp4") or f.endswith("-prev.mp4"):
        continue
    id_ = f[:-4]
    src = os.path.join(d, f)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], capture_output=True, text=True).stdout)
    full = os.path.join(d, id_ + "-full.mp4")
    s = sonidos.get(id_)
    if s:
        cmd = ["ffmpeg", "-y", "-v", "error", "-i", src]
        fil, etq = [], []
        for i, en in enumerate(s["en"]):
            cmd += ["-i", f"{SFX}/{s['archivo']}.wav"]
            ms = int(en * 1000)
            fil.append(f"[{i + 1}:a]aresample=48000,afade=t=in:d=0.005,volume={s['volumen'] * 4},adelay={ms}|{ms}[s{i}]")
            etq.append(f"[s{i}]")
        fil.append("".join(etq) + f"amix=inputs={len(etq)}:normalize=0,apad,atrim=0:{dur},alimiter=limit=0.89[a]")
        cmd += ["-filter_complex", ";".join(fil), "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", full]
    else:
        cmd = ["ffmpeg", "-y", "-v", "error", "-i", src, "-f", "lavfi", "-t", str(dur), "-i", "anullsrc=r=48000:cl=stereo", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", full]
    subprocess.run(cmd, check=True)
    prev = os.path.join(d, id_ + "-prev.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-vf", "scale=540:960", "-c:v", "libx264", "-crf", "30", "-preset", "slow", "-an", "-movflags", "+faststart", prev], check=True)
    print(id_, round(os.path.getsize(full) / 1e6, 2), "MB full,", round(os.path.getsize(prev) / 1e6, 2), "MB prev")
