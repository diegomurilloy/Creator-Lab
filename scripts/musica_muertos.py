# Cama de Día de Muertos sintetizada (cero créditos, sin derechos de terceros): vals mexicano en La menor a 3/4.
# Bajo de guitarrón en el 1, rasgueo de guitarra (Karplus-Strong) en el 2 y el 3, y una melodía de marimba con trémolo
# en las notas largas. Progresión: Am Am Dm E7 | Am Am E7 Am (la del vals ranchero de toda la vida).
# Uso: python musica_muertos.py voz.wav salida.wav duracion "ini:fin,..." [cambio_kipu_seg] [musica_kipu.wav]
#   cortes: tramos donde la música se apaga y regresa con golpe al final del tramo (como musica.py).
#   cambio_kipu_seg + musica_kipu.wav: en ese segundo el vals se funde (0.5 s) con la cama de Kipu de siempre
#   (la salida de musica.py editorial). Así, en piezas de producto, cuando se habla de Kipu entra su música.
#   voz.wav: para bajar la música cuando se habla (sidechain suave, ~5 dB). Sale a nivel de cama, como musica.py.
import sys
import wave

import numpy as np

SR = 48000
voz_f, out_f, DUR = sys.argv[1], sys.argv[2], float(sys.argv[3])
CORTES = [tuple(map(float, c.split(":"))) for c in sys.argv[4].split(",")] if len(sys.argv) > 4 and sys.argv[4] else []
CAMBIO = float(sys.argv[5]) if len(sys.argv) > 5 and sys.argv[5] else None
KIPU_F = sys.argv[6] if len(sys.argv) > 6 else None
BPM = 150
B = 60 / BPM
N = int(DUR * SR) + SR
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(11)


def f(m):
    return 440 * 2 ** ((m - 69) / 12)


def poner(sig, t, gl=1.0, gr=1.0):
    i = int(t * SR)
    if i >= N:
        return
    s = sig[: N - i]
    L[i:i + len(s)] += s * gl
    R[i:i + len(s)] += s * gr


def cuerda(m, dur=1.2, brillo=0.5):
    """Karplus-Strong: cuerda pulsada."""
    p = max(2, int(SR / f(m)))
    n = int(dur * SR)
    buf = rng.uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * (0.994 + 0.004 * brillo)
    return out


CACHE = {}


def cuerda_c(m, dur):
    k = (m, dur)
    if k not in CACHE:
        CACHE[k] = cuerda(m, dur)
    return CACHE[k]


def marimba(m, dur=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f(m) * t) + 0.25 * np.sin(2 * np.pi * f(m) * 4.0 * t) * np.exp(-t / 0.05)
    return s * np.exp(-t / 0.22) * np.minimum(1, t / 0.002)


ACORDES = {"Am": [57, 60, 64], "Dm": [62, 65, 69], "E7": [56, 59, 62, 64]}
BAJO = {"Am": 45, "Dm": 50, "E7": 40}
PROG = ["Am", "Am", "Dm", "E7", "Am", "Am", "E7", "Am"]
# melodía (MIDI, duración en tiempos) por compás, en La menor armónica
MEL = [[(76, 2), (74, 1)], [(72, 3)], [(74, 1), (77, 1), (76, 1)], [(74, 2), (71, 1)],
       [(72, 1), (74, 1), (76, 1)], [(81, 2), (79, 1)], [(77, 1), (76, 1), (74, 1)], [(76, 3)]]

compas = 3 * B
c = 0
t0 = 0.0
while t0 < DUR:
    ac = PROG[c % 8]
    poner(cuerda_c(BAJO[ac], 1.1) * 0.55, t0)
    for k in (1, 2):
        for j, m in enumerate(ACORDES[ac]):
            poner(cuerda_c(m, 0.7) * 0.16, t0 + k * B + j * 0.012, 0.8, 1.0)
    tt = t0
    for m, d in MEL[c % 8]:
        if d >= 2:  # trémolo de marimba en notas largas
            r = 0.0
            while r < d * B - 0.05:
                poner(marimba(m, 0.25) * 0.12, tt + r, 1.0, 0.75)
                r += 0.075
        else:
            poner(marimba(m, 0.5) * 0.2, tt, 1.0, 0.75)
        tt += d * B
    t0 += compas
    c += 1

mus = np.stack([L, R], 1)[: int(DUR * SR)]
n = len(mus)
t = np.arange(n) / SR

# cortes: silencio y regreso con golpe (bajo + acorde) al final del tramo
g = np.ones(n)
for a, b in CORTES:
    g[(t >= a) & (t < b)] = 0
    r = (t >= a - 0.12) & (t < a)
    g[r] = (a - t[r]) / 0.12
mus *= g[:, None]
for a, b in CORTES:
    golpe = np.zeros((int(1.0 * SR), 2))
    s = cuerda(45, 1.0) * 0.6 + sum(cuerda(m, 1.0) * 0.18 for m in ACORDES["Am"])
    golpe[:, 0] = s
    golpe[:, 1] = s
    i = int(b * SR)
    if i < n:
        e = min(n, i + len(golpe))
        mus[i:e] += golpe[: e - i]

# nivel de cama (~ el de musica.py)
rms = np.sqrt(np.mean(mus[mus != 0] ** 2)) if np.any(mus) else 1
mus *= 0.075 / max(rms, 1e-6)

# cambio a la música de Kipu
if CAMBIO is not None and KIPU_F:
    w = wave.open(KIPU_F, "rb")
    k = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    if w.getnchannels() == 1:
        k = np.stack([k, k], 1)
    else:
        k = k.reshape(-1, 2)
    w.close()
    k = k[:n] if len(k) >= n else np.vstack([k, np.zeros((n - len(k), 2))])
    x = np.clip((t - CAMBIO) / 0.5, 0, 1)
    mus = mus * (1 - x)[:, None] + k * x[:, None]

# sidechain con la voz
w = wave.open(voz_f, "rb")
v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
if w.getnchannels() == 2:
    v = v.reshape(-1, 2).mean(1)
vsr = w.getframerate()
w.close()
if vsr != SR:
    v = np.interp(np.arange(int(len(v) * SR / vsr)) * vsr / SR, np.arange(len(v)), v)
v = np.abs(v[:n]) if len(v) >= n else np.concatenate([np.abs(v), np.zeros(n - len(v))])
ventana = int(0.12 * SR)
envv = np.convolve(v, np.ones(ventana) / ventana, mode="same")
duck = 1 - 0.44 * np.clip(envv / 0.05, 0, 1)
mus *= duck[:, None]

# fade de salida
fo = int(0.6 * SR)
mus[-fo:] *= np.linspace(1, 0, fo)[:, None]
y = (np.clip(mus, -1, 1) * 32767).astype(np.int16)
w = wave.open(out_f, "wb")
w.setnchannels(2)
w.setsampwidth(2)
w.setframerate(SR)
w.writeframes(y.tobytes())
w.close()
print("listo", out_f)
