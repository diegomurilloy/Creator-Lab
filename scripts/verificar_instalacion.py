# Revisa que Creator Lab tenga todo lo que necesita y dice cómo arreglar lo que falte.
# Uso: python scripts/verificar_instalacion.py   (desde la carpeta de la skill)
import importlib.util
import platform
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SO = platform.system()

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

INSTALAR = {
    "git": {"Windows": "winget install --id Git.Git -e", "Darwin": "brew install git", "Linux": "sudo apt install -y git"},
    "ffmpeg": {"Windows": "winget install --id Gyan.FFmpeg -e", "Darwin": "brew install ffmpeg", "Linux": "sudo apt install -y ffmpeg"},
    "node": {"Windows": "winget install --id OpenJS.NodeJS.LTS -e", "Darwin": "brew install node", "Linux": "instala Node LTS desde https://nodejs.org"},
}

resultados = []


def ok(nombre, detalle=""):
    resultados.append((True, nombre, detalle))


def falla(nombre, arreglo, obligatoria=True):
    resultados.append((False if obligatoria else None, nombre, arreglo))


def version(cmd):
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        return (out.stdout or out.stderr).strip().splitlines()[0]
    except Exception:
        return None


# Python
if sys.version_info >= (3, 10):
    ok("Python 3.10+", platform.python_version())
else:
    falla("Python 3.10+", f"tienes {platform.python_version()}; instala Python 3.12 (https://www.python.org/downloads/)")

# Herramientas de sistema
for nombre, cmd, obligatoria in [("git", ["git", "--version"], True), ("ffmpeg", ["ffmpeg", "-version"], True),
                                 ("ffprobe", ["ffprobe", "-version"], True), ("node", ["node", "--version"], False),
                                 ("npm", ["npm", "--version"], False)]:
    if shutil.which(nombre):
        v = version(cmd) or "instalado"
        if nombre == "node":
            try:
                mayor = int(v.lstrip("v").split(".")[0])
                if mayor < 18:
                    falla("Node.js 18+", f"tienes {v}; instala la versión LTS", obligatoria=False)
                    continue
            except ValueError:
                pass
        ok(nombre, v[:60])
    else:
        clave = "ffmpeg" if nombre == "ffprobe" else ("node" if nombre == "npm" else nombre)
        falla(nombre, INSTALAR.get(clave, {}).get(SO, "instálalo y vuelve a abrir la terminal"), obligatoria)

# Paquetes de Python
for modulo, paquete, obligatoria in [("faster_whisper", "faster-whisper", True), ("numpy", "numpy", True),
                                     ("PIL", "Pillow", True), ("rembg", "rembg[cpu]", False),
                                     ("playwright", "playwright", False)]:
    if importlib.util.find_spec(modulo):
        ok(f"Python: {paquete}")
    else:
        falla(f"Python: {paquete}", "python -m pip install -r requirements.txt", obligatoria)

# Navegador de Playwright (carruseles)
if importlib.util.find_spec("playwright"):
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            ruta = p.chromium.executable_path
        if ruta and Path(ruta).exists():
            ok("Chromium de Playwright")
        else:
            falla("Chromium de Playwright", "python -m playwright install chromium", obligatoria=False)
    except Exception:
        falla("Chromium de Playwright", "python -m playwright install chromium", obligatoria=False)

# Kit de video
kit = RAIZ / "kit"
if (kit / "node_modules" / "remotion").exists():
    ok("Kit de video (npm install)")
elif kit.exists():
    falla("Kit de video (npm install)", "cd kit && npm install", obligatoria=False)

# La skill en su lugar
skills = Path.home() / ".claude" / "skills" / "creator-lab" / "SKILL.md"
if skills.exists():
    ok("Skill visible para Claude Code", str(skills.parent))
else:
    falla("Skill visible para Claude Code",
          "clona el repo en ~/.claude/skills/creator-lab o crea un enlace a esta carpeta (ver INSTALAR.md)")

# Lo tuyo
if (RAIZ / "personal" / "config.md").exists():
    ok("Tu configuración (personal/)")
else:
    resultados.append((None, "Tu configuración (personal/)", "todavía no existe: escribe /creator-lab y el onboarding la crea"))

print("\nCreator Lab · verificación de instalación\n")
for estado, nombre, detalle in resultados:
    icono = "✅" if estado else ("❌" if estado is False else "⚠️ ")
    print(f"{icono} {nombre}" + (f"  →  {detalle}" if detalle else ""))

faltan = [r for r in resultados if r[0] is False]
print()
if faltan:
    print(f"Faltan {len(faltan)} cosas obligatorias. Corre los comandos de arriba y vuelve a verificar.")
    sys.exit(1)
print("Todo listo. Abre una sesión nueva de Claude Code y escribe /creator-lab.")
