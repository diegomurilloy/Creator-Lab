# Vocal rider: ganancia por frase hacia un nivel parejo, solo donde hay voz (las pausas no suben).
import sys, subprocess, numpy as np, wave
src, out = sys.argv[1], sys.argv[2]
SR = 48000
x = np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",src,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout,np.float32).astype(np.float64)
B = 480  # 10 ms
n = len(x)//B
lv = 10*np.log10(np.array([np.mean(x[i*B:(i+1)*B]**2) for i in range(n)])+1e-12)
# Umbral de voz relativo al piso de ruido de ESTA toma: con ruido de cuarto alto, un umbral fijo confunde
# las pausas con voz y las sube.
piso = np.percentile(lv, 10)
umbral = max(-45.0, piso + 14)
voz = lv > umbral
k = np.exp(-0.5*(np.arange(-40,41)/15.0)**2)  # ~0.4 s de ventana
pw = np.where(voz, 10**(lv/10), 0.0)
num = np.convolve(pw, k, "same"); den = np.convolve(voz.astype(float), k, "same")
nivel = 10*np.log10(num/np.maximum(den,1e-9)+1e-12)
obj = np.median(nivel[voz])
g = np.clip(obj - nivel, -5, 6)
g = np.where(voz | (den > 0.5), g, np.minimum(g, 0))  # en pausas no se sube
ks = np.ones(8)/8  # suaviza 80 ms
g = np.convolve(g, ks, "same")
gs = np.repeat(10**(g/20), B); gs = np.concatenate([gs, np.full(len(x)-len(gs), gs[-1])])
y = x*gs
print(f"piso {piso:.1f} dB, umbral {umbral:.1f} dB, objetivo {obj:.1f} dB, ganancia min {g.min():.1f} max {g.max():.1f}")
with wave.open(out, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1)*32767).astype(np.int16).tobytes())
