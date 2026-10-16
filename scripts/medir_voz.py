# Mide la voz antes y después de procesarla, para decidir con números y no a oído.
# Uso:
#   python medir_voz.py espectro archivo.(wav|mp4) [referencia]   balance de bandas (contra un reel aprobado)
#   python medir_voz.py tramos archivo tramos.json                 nivel de voz por tramo (¿hay frases más bajas?)
#   python medir_voz.py ruido original procesado                   ruido en las pausas reales (¿subió el fondo?)
#
# Ojo con «ruido»: si el corte es muy apretado casi no hay silencios reales y mide los empalmes entre tramos.
# En ese caso compara el piso (percentil 10 de bloques de 50 ms) contra la toma original llevada al mismo volumen.
# Metas que funcionaron: variación entre tramos < 2.5 dB, SNR en pausas > 30 dB y bandas parecidas a la
# referencia (150–400 Hz vs 3–6 kHz ≈ 28–30 dB; vs 6–12 kHz ≈ 34–37 dB con este método).
import json
import subprocess
import sys

import numpy as np

SR = 48000


def leer(f):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def niveles(x, ms):
    w = int(SR * ms / 1000)
    return np.array([10 * np.log10(np.mean(x[i:i + w] ** 2) + 1e-12) for i in range(0, len(x) - w, w)])


def espectro(f):
    x = leer(f)
    n = len(x) // 4096 * 4096
    F = (np.abs(np.fft.rfft(x[:n].reshape(-1, 4096) * np.hanning(4096), axis=1)) ** 2).mean(0)
    fr = np.fft.rfftfreq(4096, 1 / SR)
    b = lambda a, c: 10 * np.log10(F[(fr >= a) & (fr < c)].mean())
    lo = b(150, 400)
    bl = niveles(x, 400)
    voz = bl[bl > -45]
    return {"150-400 vs 3-6k": round(float(lo - b(3000, 6000)), 1), "150-400 vs 6-12k": round(float(lo - b(6000, 12000)), 1),
            "400-1k (rel)": round(float(b(400, 1000) - lo), 1), "desv. bloques 400 ms": round(float(voz.std()), 2)}


modo = sys.argv[1]
if modo == "espectro":
    for f in sys.argv[2:]:
        print(f, espectro(f))
elif modo == "tramos":
    x = leer(sys.argv[2])
    T = json.load(open(sys.argv[3], encoding="utf8"))
    acc, med = 0, []
    for a, b in T:
        n = round(b * 30) - round(a * 30)
        seg = x[int(acc / 30 * SR):int((acc + n) / 30 * SR)]
        acc += n
        bl = niveles(seg, 100)
        v = bl[bl > -40]
        med.append(np.median(v) if len(v) else np.nan)
        print(f"{a:6.2f}-{b:6.2f}  mediana de voz {med[-1]:.1f} dB")
    print("rango entre tramos:", round(float(np.nanmax(med) - np.nanmin(med)), 1), "dB")
elif modo == "ruido":
    o, p = niveles(leer(sys.argv[2]), 50), niveles(leer(sys.argv[3]), 50)
    n = min(len(o), len(p))
    pausa, voz = o[:n] < -47, o[:n] > -35
    print(f"pausas {p[:n][pausa].mean():.1f} dB · voz {p[:n][voz].mean():.1f} dB · SNR {p[:n][voz].mean() - p[:n][pausa].mean():.1f} dB")
