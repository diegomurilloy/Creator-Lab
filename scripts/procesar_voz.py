# Voz final de un reel: rider por frase + cadena ligera + efectos opcionales + loudnorm a -14 LUFS.
# Uso: python procesar_voz.py corte.mp4 salida.wav [cadena.txt] [efectos.json]
#   cadena.txt: filtros de ffmpeg para la voz (por defecto el cadena-voz.txt de esta carpeta).
#   efectos.json (opcional): [{"archivo": "sfx/pop.wav", "en": 2.85, "volumen": 0.1}, ...]
#     "en" va en segundos DEL CORTE (no de la toma). Volúmenes sutiles: 0.08–0.2.
# Después se junta con el video mudo:
#   ffmpeg -i video_mudo.mp4 -i salida.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest final.mp4
import json
import os
import subprocess
import sys
import tempfile

aqui = os.path.dirname(os.path.abspath(__file__))
corte, salida = sys.argv[1], sys.argv[2]
cadena = open(sys.argv[3] if len(sys.argv) > 3 else os.path.join(aqui, "cadena-voz.txt"), encoding="utf8").read().strip()
efectos = json.load(open(sys.argv[4], encoding="utf8")) if len(sys.argv) > 4 else []
tmp = tempfile.mkdtemp()

# 1) Rider: empareja el nivel frase por frase solo donde hay voz (no sube el ruido de las pausas).
rider = os.path.join(tmp, "rider.wav")
subprocess.run([sys.executable, os.path.join(aqui, "rider.py"), corte, rider], check=True)

# 2) Cadena + efectos.
cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", rider]
fil = [f"[0:a]aresample=48000,{cadena}[voz]"]
etq = ["[voz]"]
for i, e in enumerate(efectos):
    cmd += ["-i", e["archivo"]]
    ms = int(round(e["en"] * 1000))
    fil.append(f"[{i + 1}:a]aresample=48000,volume={e.get('volumen', 0.12)},adelay={ms}|{ms}[s{i}]")
    etq.append(f"[s{i}]")
fil.append("".join(etq) + f"amix=inputs={len(etq)}:normalize=0:duration=first[mix]" if efectos else "[voz]anull[mix]")
script = os.path.join(tmp, "filtro.txt")
open(script, "w").write(";\n".join(fil))
pre = os.path.join(tmp, "pre.wav")
subprocess.run(cmd + ["-/filter_complex", script, "-map", "[mix]", "-ac", "2", "-c:a", "pcm_s24le", pre], check=True)

# 3) Loudnorm en dos pasadas, lineal, a -14 LUFS / -1.5 dBTP.
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", pre, "-af", "loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
j = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", pre, "-af", af, "-ar", "48000", "-c:a", "pcm_s24le", salida], check=True)

# 4) Verificación: si no quedó en -14.0, se corrige con ganancia fija.
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", salida, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True)
I = float(r.stderr[r.stderr.rindex("I:"):].split()[1])
if abs(I + 14) > 0.15:
    fijo = salida + ".tmp.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", salida, "-af", f"volume={-14 - I:.2f}dB", "-c:a", "pcm_s24le", fijo], check=True)
    os.replace(fijo, salida)
    print(f"ajustado de {I} a -14 LUFS con ganancia fija")
print("listo:", salida)
