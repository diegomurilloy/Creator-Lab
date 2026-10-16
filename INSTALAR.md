# Instalar Creator Lab desde cero

Esta guía la sigue Claude Code paso a paso (también la puedes seguir tú a mano). Instala solo lo que falte,
confirma cada paso con su comando de verificación y al final corre `scripts/verificar_instalacion.py`.

> **Para Claude:** antes de instalar algo con un gestor de paquetes (winget, brew, apt), dile a la persona qué vas a
> instalar y por qué en una línea, y pide su confirmación. No uses `sudo` sin avisar. Si algo falla, explica el
> error en simple y propone la alternativa de la sección «Si algo falla».

## Qué se instala y para qué

| Herramienta | Para qué | ¿Obligatoria? |
|---|---|---|
| **git** | Descargar Creator Lab y recibir actualizaciones | Sí |
| **Python 3.10+** y `pip` | Los scripts: transcribir, cortar voz, música, análisis de virales, portadas, carruseles | Sí |
| **ffmpeg** (incluye `ffprobe`) | Cortar, medir y mezclar audio y video | Sí |
| Paquetes de `requirements.txt` | faster-whisper (transcripción local), numpy, Pillow, rembg (recorte para portadas), playwright (exportar carruseles) | Sí |
| **Chromium de Playwright** | Exportar carruseles y portadas a PNG/MP4/PDF | Sí, si harás carruseles |
| **Node.js 18+** y `npm` | El kit de video (Remotion) | Sí, si harás reels con motion |
| Dependencias del kit (`kit/`) | Remotion y React | Sí, si harás reels con motion |
| **Conector de Google Sheets** en Claude | Planear tu parrilla en una hoja de cálculo | Opcional |

La primera vez que transcribas, faster-whisper descarga su modelo (unos cientos de MB) y rembg descarga el suyo
la primera vez que recortes una foto. Es normal que esa primera vez tarde más.

## Paso 1 · Revisar lo que ya hay

```bash
git --version
python --version        # en macOS/Linux puede ser python3
ffmpeg -version
node --version
npm --version
```

Anota qué falta y continúa solo con eso.

## Paso 2 · Instalar lo que falte

**Windows** (PowerShell, con winget):
```powershell
winget install --id Git.Git -e
winget install --id Python.Python.3.12 -e
winget install --id Gyan.FFmpeg -e
winget install --id OpenJS.NodeJS.LTS -e
```
Cierra y vuelve a abrir la terminal para que se actualice el PATH.

**macOS** (con Homebrew; si no lo tienes: https://brew.sh):
```bash
brew install git python ffmpeg node
```

**Linux** (Debian/Ubuntu):
```bash
sudo apt update && sudo apt install -y git python3 python3-pip python3-venv ffmpeg nodejs npm
```
Si `node --version` da menos de 18, instala la versión LTS desde https://nodejs.org.

## Paso 3 · Descargar Creator Lab en tu carpeta de skills

**macOS / Linux**
```bash
git clone https://github.com/diegomurilloy/Creator-Lab.git ~/.claude/skills/creator-lab
cd ~/.claude/skills/creator-lab
```

**Windows (PowerShell)**
```powershell
git clone https://github.com/diegomurilloy/Creator-Lab.git "$env:USERPROFILE\.claude\skills\creator-lab"
cd "$env:USERPROFILE\.claude\skills\creator-lab"
```

Si ya existe la carpeta, no la borres: entra y corre `git pull`.

## Paso 4 · Paquetes de Python

```bash
python -m pip install -r requirements.txt
python -m playwright install chromium
```

En macOS/Linux, si `pip` se queja de un entorno «externally managed», usa un entorno virtual:
```bash
python3 -m venv .venv && source .venv/bin/activate
python -m pip install -r requirements.txt && python -m playwright install chromium
```
(`.venv/` no se sube a git.)

## Paso 5 · Kit de video

```bash
cd kit
npm install
npx tsc --noEmit
cd ..
```

Para comprobar que renderiza, saca un cuadro del reel de ejemplo:
```bash
cd kit && npx remotion still ejemplo-reel out/prueba.png --frame=60 && cd ..
```

## Paso 6 · Verificar todo

```bash
python scripts/verificar_instalacion.py
```

Debe salir todo en ✅. Lo que salga en ❌ trae el comando para arreglarlo.

## Paso 7 · Opcional: Google Sheets

Si quieres tu parrilla en Google Sheets, conecta el conector de Google Sheets (Google Drive) en Claude
(claude.ai → Configuración → Conectores). Si no, el onboarding te arma la parrilla de otra forma.

## Paso 8 · Empezar

Abre una **sesión nueva** de Claude Code y escribe:
```
/creator-lab
```
Arranca el onboarding guiado: define tu marca, tus colores y tu parrilla. Todo lo tuyo se guarda en `personal/`, que
nunca se sube a git ni se toca al actualizar.

## Si algo falla

- **`python` no se encuentra en Windows:** reinstala Python marcando «Add python.exe to PATH», o usa `py` en vez de
  `python`.
- **`ffmpeg` no se encuentra después de instalarlo:** cierra y abre la terminal (o reinicia Claude Code).
- **Error al instalar `rembg` o `onnxruntime`:** actualiza pip (`python -m pip install -U pip`) y vuelve a intentar.
  Si sigue fallando, todo lo demás funciona; solo no podrás recortar fotos para portadas.
- **`npx remotion still` tarda mucho la primera vez:** Remotion descarga su navegador. Si ya tienes Chrome, puedes
  usarlo con la variable `REMOTION_CHROME=<ruta a chrome>`.
- **La skill no aparece al escribir `/creator-lab`:** revisa que exista `~/.claude/skills/creator-lab/SKILL.md` y
  abre una sesión nueva de Claude Code.

## Actualizar después

Dile a Claude Code «actualiza Creator Lab», o corre `git pull` dentro de la carpeta de la skill.
