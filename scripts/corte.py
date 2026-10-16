# Arma el corte de un reel en UN mp4 continuo a partir de tramos de la toma.
# Uso: python corte.py toma.mp4 tramos.json corte.mp4 [sostener=0.4]
#   tramos.json: [[desde, hasta], ...] en segundos de la toma, en el orden de salida (se pueden reordenar).
#   sostener: segundos que se congela el último cuadro al final (si la toma termina en seco). 0 = nada.
#
# Por qué así:
# - Un solo mp4 continuo y Remotion lo reproduce de corrido. Saltar por tramos dentro de Remotion repite cuadros.
# - Cada tramo lleva un fade de audio de 8 ms en las orillas para que no truene el corte.
# - -g 30 -bf 0 cfr y timescale fijo: el navegador decodifica cada cuadro exacto (sin «No frame found»).
# Cómo elegir los tramos: transcribe (transcribir.py), mide silencios (ffmpeg silencedetect) y quita los
# de más de 0.3 s, muletillas, repeticiones y las pausas de ~0.2 s a media frase que suenan a «se trabó».
import json
import subprocess
import sys
import tempfile

src, tramos_f, out = sys.argv[1], sys.argv[2], sys.argv[3]
sostener = float(sys.argv[4]) if len(sys.argv) > 4 else 0.4
FPS = 30
T = json.load(open(tramos_f, encoding="utf8"))
f, cadena = [], ""
for i, (a, b) in enumerate(T):
    sa, sb = round(a * FPS), round(b * FPS)
    A, B = sa / FPS, sb / FPS
    d = B - A
    ultimo = i == len(T) - 1
    fo = 0.04 if ultimo else 0.008
    vx = f",tpad=stop_mode=clone:stop_duration={sostener}" if ultimo and sostener > 0 else ""
    ax = f",apad=pad_dur={sostener}" if ultimo and sostener > 0 else ""
    f.append(f"[0:v]trim=start_frame={sa}:end_frame={sb},setpts=PTS-STARTPTS{vx}[v{i}];"
             f"[0:a]atrim=start={A}:end={B},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st={d - fo:.4f}:d={fo}{ax}[a{i}]")
    cadena += f"[v{i}][a{i}]"
f.append(cadena + f"concat=n={len(T)}:v=1:a=1[v][a]")
filtro = tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False)
filtro.write(";".join(f))
filtro.close()
subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", src, "-/filter_complex", filtro.name,
                "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-g", "30", "-bf", "0",
                "-fps_mode", "cfr", "-r", str(FPS), "-video_track_timescale", "15360", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", out], check=True)
# Cuenta real (si el último tramo llega al final de la toma, puede salir un cuadro menos que la suma teórica).
n = int(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-count_frames", "-show_entries", "stream=nb_read_frames",
                        "-of", "csv=p=0", out], capture_output=True, text=True).stdout.strip())
print(f"listo: {out} · {n} cuadros ({n / FPS:.2f} s). La duración de la edición en Remotion debe dar lo mismo.")
