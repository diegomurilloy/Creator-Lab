"""Lector común de `personal/config.md` para los scripts de Creator Lab.

Uso desde otro script:
    from config import valor, raiz
    base = valor("carpeta_contenido", args.base)      # el argumento manda; si no hay, la config; si no, error claro

Uso en la terminal:
    python scripts/config.py              → imprime la config que encontró
    python scripts/config.py kit          → imprime solo ese valor (vacío si no existe)

Formato de la config: dentro del primer bloque ``` del archivo, una `clave: valor` por renglón; `#` es comentario.
Si no existe `personal/config.md`, los scripts funcionan igual pasándoles las rutas por argumento.
"""
from __future__ import annotations

import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(RAIZ, "personal", "config.md")


def raiz() -> str:
    """Carpeta raíz de creator-lab."""
    return RAIZ


def leer(ruta: str | None = None) -> dict:
    """Devuelve {clave: valor} de la config (o {} si no existe)."""
    ruta = ruta or os.environ.get("CREATOR_LAB_CONFIG") or CONFIG
    if not os.path.exists(ruta):
        return {}
    texto = open(ruta, encoding="utf-8").read()
    m = re.search(r"```[^\n]*\n(.*?)```", texto, flags=re.S)
    cuerpo = m.group(1) if m else texto
    datos = {}
    for renglon in cuerpo.splitlines():
        renglon = renglon.split(" #")[0].strip() if not renglon.strip().startswith("#") else ""
        if not renglon or ":" not in renglon:
            continue
        clave, val = renglon.split(":", 1)
        clave = clave.strip()
        if re.fullmatch(r"[a-z_]+", clave):
            datos[clave] = val.strip()
    return datos


def marcas(datos: dict | None = None) -> list[tuple[str, str]]:
    """[(clave, nombre), …] a partir de `marcas: yo=Yo (personal), cafe=Café`."""
    datos = leer() if datos is None else datos
    salida = []
    for parte in (datos.get("marcas") or "").split(","):
        parte = parte.strip()
        if not parte:
            continue
        clave, _, nombre = parte.partition("=")
        salida.append((clave.strip(), (nombre or clave).strip()))
    return salida


def valor(clave: str, argumento: str | None = None, defecto: str | None = None, requerido: bool = True) -> str | None:
    """El argumento manda; si no hay, la config; si no, el defecto. Si falta y es requerido, sale con un aviso claro."""
    if argumento:
        return argumento
    v = leer().get(clave) or defecto
    if not v and requerido:
        sys.exit(f"Falta «{clave}». Pásalo por argumento o agrégalo a personal/config.md (plantilla: plantillas/config.ejemplo.md).")
    return v


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    d = leer()
    if len(sys.argv) > 1:
        print(d.get(sys.argv[1], ""))
    elif not d:
        print("No hay personal/config.md todavía. Corre /creator-lab para el onboarding o copia plantillas/config.ejemplo.md.")
    else:
        for k, v in d.items():
            print(f"{k}: {v}")
