# Mezcla final de un reel: voz (con efectos) + música → −14 LUFS, pico ≤ −1 dB.
# Uso: python mezcla.py voz.wav musica.wav salida.wav [musica_db=-6.5]
#   voz.wav: la salida de procesar_voz.py (ya trae efectos y está a −14).
#   musica.wav: la salida de musica.py (cama a ~−20 LUFS con sidechain).
#   musica_db: cuánto se baja la música antes de juntar (−6.5 deja la cama ~13 dB bajo la voz).
# Ojo: alimiter de ffmpeg trae level=true (reajusta el nivel solo) y sube el volumen después de normalizar;
# aquí va con level=false.
import os
import re
import subprocess
import sys
import tempfile

sys.stdout.reconfigure(encoding="utf-8")

voz, musica, salida = sys.argv[1], sys.argv[2], sys.argv[3]
mdb = float(sys.argv[4]) if len(sys.argv) > 4 else -6.5


def lufs(f):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", f, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, errors="ignore").stderr
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1])
    p = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])
    return i, p


tmp = os.path.join(tempfile.mkdtemp(), "mezcla.wav")
subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", voz, "-i", musica, "-filter_complex",
                f"[0:a]aresample=48000,aformat=channel_layouts=stereo[v];[1:a]volume={mdb}dB[m];[v][m]amix=inputs=2:normalize=0:duration=first",
                "-c:a", "pcm_f32le", "-ar", "48000", tmp], check=True)
i0, _ = lufs(tmp)
g = -14 - i0
subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", tmp, "-af",
                f"volume={g:.2f}dB,alimiter=limit=0.84:level=false:attack=3:release=60", "-c:a", "pcm_s16le", salida], check=True)
i, p = lufs(salida)
print(f"mezcla: {i0:.1f} → {i:.1f} LUFS, pico {p:.1f} dBFS → {salida}")
if abs(i + 14) > 0.3 or p > -1.0:
    print("REVISA: fuera de meta (−14 ±0.3 LUFS, pico ≤ −1 dB)")
