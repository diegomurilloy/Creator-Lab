# Corte de voz a precisión de muestra: reordena palabras y quita silencios (solo audio).
# Uso:
#   python cambiar_palabras.py energia audio.(wav|mp4|m4a) ini fin
#       imprime energía (dB) y bandas cada 10 ms entre ini y fin, para encontrar dónde cortar.
#   python cambiar_palabras.py cortar audio.(wav|mp4|m4a) tramos.json salida.wav [mapa.json]
#       tramos.json: [[desde, hasta], ...] en segundos de la toma, EN EL ORDEN DE SALIDA (se pueden reordenar).
#       mapa.json (opcional): de qué segundo de la toma sale cada tramo y en qué segundo del corte queda.
#
# Cómo encontrar los límites (Whisper da tiempos aproximados):
# - Los cierres de oclusivas (k, p, t) son un hueco de energía de ~30–50 ms: ahí el corte es limpio.
# - Bandas: F2 alto (1.8–3 kHz) = «i/e»; fricción (4–9 kHz) = «s/c/z»; mucho grave (300–1000) = «a/o».
#   Ej. (una toma real): «ca» 29.58–29.64, «s» 29.645–29.715, «i» 29.72–29.80, «a» de «hace» desde 29.805.
# - Después de cortar, RETRANSCRIBE (transcribir.py) para confirmar que no quedó una sílaba suelta.
import json
import subprocess
import sys
import wave

import numpy as np

sys.stdout.reconfigure(encoding="utf-8")

SR = 48000


def leer(f):
    crudo = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(crudo, np.int16).astype(float) / 32768


modo = sys.argv[1]
x = leer(sys.argv[2])

if modo == "energia":
    ini, fin = float(sys.argv[3]), float(sys.argv[4])
    n = 1200
    f = np.fft.rfftfreq(8192, 1 / SR)
    print("seg     dB    grave  F2alto  fricción")
    for t in np.arange(ini, fin, 0.01):
        i = int(round(t * SR))
        s = x[i:i + n]
        if len(s) < n:
            break
        r = 20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9)
        S = np.abs(np.fft.rfft(s * np.hanning(n), 8192))
        lo, hi, fr = S[(f > 300) & (f < 1000)].sum(), S[(f > 1800) & (f < 3000)].sum(), S[(f > 4000) & (f < 9000)].sum()
        tot = lo + hi + fr + 1e-9
        print(f"{t:6.2f} {r:6.1f}   {lo/tot:.2f}   {hi/tot:.2f}    {fr/tot:.2f}  " + "#" * int(max(0, r + 70) / 2))

elif modo == "cortar":
    tramos = json.load(open(sys.argv[3], encoding="utf8"))
    salida = sys.argv[4]
    fade = int(0.006 * SR)
    rampa = np.linspace(0, 1, fade)
    piezas, mapa, t = [], [], 0.0
    for a, b in tramos:
        s = x[int(a * SR):int(b * SR)].copy()
        s[:fade] *= rampa
        s[-fade:] *= rampa[::-1]
        piezas.append(s)
        mapa.append({"desde": round(a, 4), "hasta": round(b, 4), "en": round(t, 4)})
        t += len(s) / SR
    y = np.concatenate(piezas + [np.zeros(int(0.15 * SR))])
    w = wave.open(salida, "wb")
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
    w.close()
    if len(sys.argv) > 5:
        json.dump(mapa, open(sys.argv[5], "w", encoding="utf8"), indent=1)
    print(f"{len(x)/SR:.2f} s → {len(y)/SR:.2f} s en {len(tramos)} tramos → {salida}")
else:
    sys.exit("modo: energia | cortar")
