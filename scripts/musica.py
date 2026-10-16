# Cama musical sintetizada (cero créditos, sin derechos de terceros) para un reel.
# Uso: python musica.py voz.wav salida.wav duracion "corte1_ini:corte1_fin,corte2_ini:corte2_fin" [bpm=104] [estilo=editorial]
#   estilo: «editorial» (por defecto, A menor cálido) o «travesura» (D menor con A7: complicidad, plan a escondidas).
#   cortes: tramos donde la música se apaga (los loops abiertos) y regresa con golpe al final del tramo.
#   voz.wav: se usa para bajar la música cuando hablas (sidechain suave, ~5 dB).
# Estilo: groove editorial tipo «SaaS»: kick suave, clap, hats, acordes cálidos tipo Rhodes y arpegio pluck.
# La salida va a −26 LUFS aprox. (cama). Se mezcla con la voz en mezcla.py.
import sys
import wave

import numpy as np

SR = 48000
voz_f, out_f, DUR = sys.argv[1], sys.argv[2], float(sys.argv[3])
CORTES = [tuple(map(float, c.split(":"))) for c in sys.argv[4].split(",")] if len(sys.argv) > 4 and sys.argv[4] else []
BPM = float(sys.argv[5]) if len(sys.argv) > 5 else 104
ESTILO = sys.argv[6] if len(sys.argv) > 6 else "editorial"
B = 60 / BPM
N = int(DUR * SR) + SR * 2
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(7)


def nota(m):
    return 440 * 2 ** ((m - 69) / 12)


def poner(sig, t, gl=1.0, gr=1.0):
    i = int(t * SR)
    if i >= N:
        return
    s = sig[: N - i]
    L[i : i + len(s)] += s * gl
    R[i : i + len(s)] += s * gr


def env(d, a=0.005, dec=0.3):
    n = int(d * SR)
    tt = np.arange(n) / SR
    return np.minimum(1, tt / a) * np.exp(-tt / dec)


def kick():
    d = 0.45
    tt = np.arange(int(d * SR)) / SR
    f = 48 + 90 * np.exp(-tt * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7) * 0.9


def clap():
    d = 0.25
    n = rng.standard_normal(int(d * SR))
    e = env(d, 0.002, 0.07)
    n = np.convolve(n, np.ones(6) / 6, "same") - np.convolve(n, np.ones(40) / 40, "same")
    return n * e * 0.35


def hat(abierto=False):
    d = 0.18 if abierto else 0.05
    n = rng.standard_normal(int(d * SR))
    n = n - np.convolve(n, np.ones(8) / 8, "same")
    return n * env(d, 0.001, 0.06 if abierto else 0.015) * 0.12


def rhodes(m, d):
    tt = np.arange(int(d * SR)) / SR
    f = nota(m)
    s = np.sin(2 * np.pi * f * tt + 0.6 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt * 3)) + 0.25 * np.sin(2 * np.pi * f * 3 * tt) * np.exp(-tt * 5)
    return np.tanh(s * 0.9) * np.minimum(1, tt / 0.01) * np.exp(-tt / 1.6) * 0.09


def pluck(m, d=0.35):
    tt = np.arange(int(d * SR)) / SR
    f = nota(m)
    s = np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 + np.sin(2 * np.pi * f * tt)
    s = np.convolve(s, np.ones(10) / 10, "same")
    return s * np.minimum(1, tt / 0.003) * np.exp(-tt / 0.09) * 0.05


def sub(m, d):
    tt = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * nota(m) * tt) * np.minimum(1, tt / 0.02) * np.exp(-tt / 0.8) * 0.22


def apagada(t):
    return any(a <= t < b for a, b in CORTES)


# Progresión (A menor): Am9 · Fmaj7 · C(add9) · G6, un compás cada una.
ACORDES = [[57, 60, 64, 67, 71], [53, 57, 60, 64, 69], [48, 55, 60, 62, 64], [55, 59, 62, 64, 67]]
BAJOS = [45, 41, 48, 43]
ARP = [0, 2, 3, 4, 3, 2, 1, 2]
if ESTILO == "travesura":
    # Dm9 · Bbmaj7 · Gm6 · A7: la dominante con do# suena a «plan a escondidas»; arpegio que salta (staccato).
    ACORDES = [[50, 53, 57, 60, 64], [46, 50, 53, 57, 62], [43, 50, 55, 58, 64], [45, 49, 52, 55, 61]]
    BAJOS = [38, 34, 43, 45]
    ARP = [0, 4, 2, 4, 1, 4, 3, 4]
compas = 4 * B
t = 0.0
paso = 0
while t < DUR:
    beat = paso % 16  # semicorcheas en grupos de 4 por pulso
    c = int(t // compas) % 4
    if not apagada(t):
        if beat in (0, 8):
            poner(kick(), t)
        if beat in (4, 12):
            poner(clap(), t, 0.9, 1.0)
        if beat % 2 == 0:
            poner(hat(beat == 14), t, 0.7 if beat % 4 else 1, 1 if beat % 4 else 0.7)
        if beat == 0:
            for j, m in enumerate(ACORDES[c]):
                poner(rhodes(m, compas * 1.1), t + j * 0.008, 1 - j * 0.1, 0.6 + j * 0.1)
            poner(sub(BAJOS[c], compas), t)
        if beat % 2 == 1 or beat % 4 == 0:
            m = ACORDES[c][ARP[(paso // 1) % 8] % 5] + 12
            poner(pluck(m), t, 0.5 + 0.5 * (paso % 2), 1 - 0.5 * (paso % 2))
    paso += 1
    t = paso * B / 4

# Loops: en el apagón queda un drone grave y un «riser» de ruido que sube; regresa con golpe.
for a, b in CORTES:
    d = b - a
    tt = np.arange(int(d * SR)) / SR
    drone = (np.sin(2 * np.pi * nota(33) * tt) + 0.3 * np.sin(2 * np.pi * nota(45) * tt)) * 0.12 * np.minimum(1, tt / 0.1)
    n = rng.standard_normal(len(tt))
    n = n - np.convolve(n, np.ones(30) / 30, "same")
    riser = n * (tt / d) ** 3 * 0.12
    poner(drone + riser, a)
    golpe = kick() * 1.3
    poner(golpe, b)
    tt2 = np.arange(int(1.5 * SR)) / SR
    crash = rng.standard_normal(len(tt2))
    crash = (crash - np.convolve(crash, np.ones(4) / 4, "same")) * np.exp(-tt2 / 0.5) * 0.12
    poner(crash, b, 1, 0.9)

# Final: acorde que resuena.
fin = DUR - 0.9
for j, m in enumerate(ACORDES[0]):
    poner(rhodes(m, 2.0) * 1.4, fin + j * 0.01)

# Reverb corta por convolución (ruido con caída exponencial).
ir_t = np.arange(int(1.2 * SR)) / SR
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.35)
ir[0] = 0
ir /= np.abs(ir).sum() / 6
from numpy.fft import irfft, rfft

def rev(x):
    n = len(x) + len(ir)
    return irfft(rfft(x, n) * rfft(ir, n), n)[: len(x)]

L = L + 0.18 * rev(L)
R = R + 0.18 * rev(R)

# Sidechain con la voz: baja ~5 dB donde hay voz (ataque 40 ms, suelta 250 ms).
import subprocess
crudo = subprocess.run(["ffmpeg", "-v", "error", "-i", voz_f, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
v = np.frombuffer(crudo, np.int16).astype(float) / 32768
blk = int(0.01 * SR)
nb = len(v) // blk
rms = np.sqrt((v[: nb * blk].reshape(nb, blk) ** 2).mean(1))
activo = (20 * np.log10(rms + 1e-9) > -38).astype(float)
g = np.ones(nb)
for i in range(1, nb):
    obj = 10 ** (-5 / 20) if activo[i] else 1.0
    k = 0.25 if obj < g[i - 1] else 0.04
    g[i] = g[i - 1] + (obj - g[i - 1]) * k
gan = np.interp(np.arange(N), np.arange(nb) * blk, g)
L *= gan
R *= gan

y = np.stack([L, R], 1)[: int(DUR * SR)]
y = np.tanh(y * 1.2) / 1.2
y *= 10 ** (-12 / 20) / (np.sqrt((y**2).mean()) + 1e-9) * 0.35  # ~−26 LUFS
y = np.clip(y, -1, 1)
fade = int(0.05 * SR)
y[:fade] *= np.linspace(0, 1, fade)[:, None]
o = wave.open(out_f, "wb")
o.setnchannels(2)
o.setsampwidth(2)
o.setframerate(SR)
o.writeframes((y * 32767).astype(np.int16).tobytes())
o.close()
print("listo", out_f)
