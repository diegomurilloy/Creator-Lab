#!/usr/bin/env python3
"""Regenera `kit/src/libreria` (el kit plantilla público) desde tu kit de trabajo.

Cuando mejoras o agregas piezas a la librería de tu kit personal, este script las copia al kit plantilla
quitando lo de tu marca: paletas propias -> MARCA / MARCA_APP, logo propio -> LogoMarca, nombres fijos ->
valores de src/marca.ts y referencias a tus reels en los comentarios -> texto neutro.

Uso:
    python scripts/exportar_kit.py <ruta del kit de trabajo>             # en seco: muestra qué cambiaría
    python scripts/exportar_kit.py <ruta del kit de trabajo> --aplicar   # escribe en kit/src/libreria

Opciones de marca (para adaptar los reemplazos a tu kit):
    --paleta NOMBRE        constante de paleta de tu marca en tu kit (se repite)
    --paleta-app NOMBRE    constante de paleta de app de tu marca
    --logo NOMBRE          componente de tu logo
    --nombre TEXTO         nombres fijos a quitar de los textos (se repite; el primero = contacto del chat,
                           los demás = persona de ejemplo)
    --prohibido TEXTO      palabras que no pueden quedar en el kit (se repite; se suman a las de --nombre)

Lo que no pases por argumento se lee de personal/exportar_kit.json (carpeta ignorada por git):
    {"paleta": ["MIMARCA"], "paleta_app": "MIMARCA_APP", "logo": "LogoMio", "nombre": ["MiMarca", "MiNombre"],
     "prohibido": ["mi-dominio.com", "Ya quedó"]}
Agrega a "prohibido" tus frases firma (eslóganes, hashtags) para que nunca lleguen al kit público.

El kit plantilla conserva sus propios archivos (no se pisan): base.ts, paletas.ts, logos.tsx, tema.ts,
comun.tsx, pro.tsx, subtitulos-video.tsx y palabras-ejemplo.json. Si en tu kit esos archivos exportan algo
nuevo, el script te avisa para que lo pases a mano.

Al final revisa que no quede ninguna palabra prohibida. Si queda alguna, no escribe nada (aunque pases
--aplicar) y te dice archivo y línea.
"""
from __future__ import annotations

import argparse
import difflib
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "kit" / "src" / "libreria"

# Archivos que el kit plantilla mantiene a mano (versión genérica). No se sobrescriben.
PROPIOS = {"base.ts", "paletas.ts", "logos.tsx", "tema.ts", "comun.tsx", "pro.tsx", "subtitulos-video.tsx", "palabras-ejemplo.json"}
# Líneas que el kit agrega al final de index.ts (módulos que solo existen en el kit).
EXTRA_INDEX = ['export * from "./subtitulos-video";']
# Lo que puede importar la librería de la paleta (el resto viene de los archivos propios).
NOMBRES_PALETA = ["MARCA", "MARCA_APP", "WA", "WA_OSCURO"]


def reemplazos(o: argparse.Namespace) -> tuple[list[tuple[str, str]], list[tuple[str, str]]]:
    """Dos listas ordenadas (regex, reemplazo): las de código y las que solo se aplican a comentarios."""
    r: list[tuple[str, str]] = []
    # Rutas que en el kit de trabajo salían de la librería.
    r += [
        (r'from "\.\./reels/pro"', 'from "./pro"'),
        (r'from "\.\./reels/comun"', 'from "./comun"'),
        (r'import palabras from "\.\./reels/[^"]+\.json";', 'import palabras from "./palabras-ejemplo.json";'),
        (r"<Subtitulos t=\{t \+ \d+(?:\.\d+)?\} palabras=\{palabras as Palabra\[\]\}", "<Subtitulos t={t} palabras={palabras as Palabra[]}"),
        (r'corrige=\{\{ gaste: "gasté" \}\} ', ""),
        # Frase firma: se cambia por una neutra.
        (r"Ya \*?quedó\.?\*?", "*Listo.*"),
    ]
    # Logo.
    r += [(rf"\b{re.escape(o.logo)}\b", "LogoMarca")]
    # Paletas (la de app primero porque contiene a la otra).
    r += [(rf"\b{re.escape(o.paleta_app)}\b", "MARCA_APP")]
    for p in o.paleta:
        r += [(rf"\b{re.escape(p)}\b", "MARCA")]
    # Nombres fijos en defaults y textos de pantalla.
    for i, n in enumerate(o.nombre):
        destino = "MARCA.persona" if i > 0 else "MARCA.contacto"
        r += [
            (rf'= "{re.escape(n)}(?: AI)?"', f"= {destino}"),
            (rf'contacto="{re.escape(n)}(?: AI)?"', "contacto={MARCA.contacto}"),
            (rf'"{re.escape(n.lower())}"', '"marca"'),  # p. ej. de: "yo" | "mimarca"
            (rf'"logo-{re.escape(n.lower())}"', '"logo-marca"'),
            (rf">{re.escape(n)}<", ">{MARCA.nombre}<"),
        ]
    # Comentarios: referencias a tus reels y a tu marca (solo dentro de comentarios, para no tocar colores como #D80).
    c: list[tuple[str, str]] = []
    c += [
        (r"\(el de [KXD]\d{2}[^)]*\)", "(el otro chat solo trae uno)"),
        (r"\s*\((?:[KXD]\d{2})(?:[ ·][^)]*)?\)", ""),
        (r"\b(?:clonadas|sacado|sacadas|probadas|nacidas) (?:de|en) [KXD]\d{2}(?: v\d+)?", "probadas en reels reales"),
        (r"\bde [KXD]\d{2}(?: v\d+)?\b", "probados en reels reales"),
        (r"\b[KXD]\d{2}(?: v\d+)?\b", "reels reales"),
    ]
    for n in o.nombre:
        e = re.escape(n)
        c += [
            (rf"Paleta {e}(?: · app oficial)?(?: \(nada de cian\))?", "Paleta de la marca"),
            (rf"paleta {e}(?: · app oficial)?(?: \(nada de cian\))?", "paleta de la marca"),
            (rf"el crema de {e}", "el fondo de la marca"),
            (rf"\b{e} responde", "la marca responde"),
            (rf"con {e}\b", "con la marca"),
            (rf"\bde {e}\b", "de la marca"),
            (rf"\b{e}\b", "la marca"),
        ]
    return r, c


COMENTARIO = re.compile(r"^(\s*(?://|/\*|\*).*)$|(\s//\s.*)$")


def en_comentarios(texto: str, regs: list[tuple[str, str]]) -> str:
    """Aplica `regs` solo a líneas de comentario y a comentarios al final de una línea."""

    def cambia(m: re.Match[str]) -> str:
        frag = m.group(0)
        for patron, rep in regs:
            frag = re.sub(patron, rep, frag)
        return frag

    return "\n".join(COMENTARIO.sub(cambia, linea) for linea in texto.split("\n"))


def ajustar_import_paleta(texto: str) -> str:
    """Deja el import de ./paletas con exactamente los nombres que el archivo usa."""
    sin_import = re.sub(r'^import \{[^}]*\} from "\./paletas";\n', "", texto, flags=re.M)
    usados = [n for n in NOMBRES_PALETA if re.search(rf"\b{n}\b", sin_import)]
    linea = f'import {{ {", ".join(usados)} }} from "./paletas";\n' if usados else ""
    if re.search(r'^import \{[^}]*\} from "\./paletas";\n', texto, flags=re.M):
        return re.sub(r'^import \{[^}]*\} from "\./paletas";\n', lambda _m: linea, texto, count=1, flags=re.M)
    if not linea:
        return texto
    # Sin import previo: va después del último import.
    imports = list(re.finditer(r'^import [^\n]*;\n', texto, flags=re.M))
    pos = imports[-1].end() if imports else 0
    return texto[:pos] + linea + texto[pos:]


def transformar(nombre: str, texto: str, regs: list[tuple[str, str]], regs_com: list[tuple[str, str]]) -> str:
    for patron, rep in regs:
        texto = re.sub(patron, rep, texto)
    texto = en_comentarios(texto, regs_com)
    if nombre.endswith((".ts", ".tsx")) and nombre != "index.ts":
        texto = ajustar_import_paleta(texto)
    if nombre == "index.ts":
        texto = texto.rstrip("\n") + "\n"
        for linea in EXTRA_INDEX:
            if linea not in texto:
                texto += linea + "\n"
    return texto


def exportados(texto: str) -> set[str]:
    nombres = set(re.findall(r"^export (?:const|function|type|class|let)\s+(\w+)", texto, flags=re.M))
    for grupo in re.findall(r"^export \{([^}]*)\}", texto, flags=re.M):
        nombres |= {x.strip().split(" as ")[-1] for x in grupo.split(",") if x.strip()}
    return nombres


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("origen", help="ruta de tu kit de trabajo (la carpeta que tiene src/libreria)")
    ap.add_argument("--aplicar", action="store_true", help="escribe los cambios (sin esto solo muestra)")
    ap.add_argument("--paleta", action="append", help="constante de la paleta de tu marca")
    ap.add_argument("--paleta-app")
    ap.add_argument("--logo")
    ap.add_argument("--nombre", action="append", help="nombre fijo a quitar (el primero = contacto del chat)")
    ap.add_argument("--prohibido", action="append", default=[], help="palabra que no puede quedar")
    ap.add_argument("--diff", action="store_true", help="muestra el diff completo de cada archivo")
    o = ap.parse_args()
    # Lo que no venga por argumento se lee de personal/exportar_kit.json (ignorado por git), p. ej.:
    #   {"paleta": ["MIMARCA"], "paleta_app": "MIMARCA_APP", "logo": "LogoMio", "nombre": ["MiMarca", "MiNombre"],
    #    "prohibido": ["mi-dominio.com"]}
    conf_path = RAIZ / "personal" / "exportar_kit.json"
    conf = json.loads(conf_path.read_text(encoding="utf-8")) if conf_path.exists() else {}
    o.paleta = o.paleta or conf.get("paleta") or []
    o.paleta_app = o.paleta_app or conf.get("paleta_app") or ""
    o.logo = o.logo or conf.get("logo") or ""
    o.nombre = o.nombre or conf.get("nombre") or []
    o.prohibido = [*o.prohibido, *conf.get("prohibido", [])]
    if not (o.paleta and o.paleta_app and o.logo and o.nombre):
        print("Faltan datos de tu marca: pasa --paleta, --paleta-app, --logo y --nombre, o créalos en personal/exportar_kit.json.", file=sys.stderr)
        return 2

    lib = Path(o.origen).expanduser().resolve() / "src" / "libreria"
    if not lib.is_dir():
        print(f"No encontré {lib}", file=sys.stderr)
        return 2

    regs, regs_com = reemplazos(o)
    prohibidos = [*o.nombre, *o.prohibido, *o.paleta, o.paleta_app, o.logo, "C:" + "/Users", "C:" + "\\Users", "One" + "Drive", "../reels/", "../kit\"", "PERSONAL_"]
    patron_prohibido = re.compile("|".join(re.escape(p) for p in prohibidos), re.IGNORECASE)

    nuevos: dict[Path, str] = {}
    avisos: list[str] = []
    for f in sorted(lib.iterdir()):
        if not f.is_file() or f.suffix not in {".ts", ".tsx", ".json"}:
            continue
        if f.name in PROPIOS:
            dest = DESTINO / f.name
            if dest.exists() and f.suffix != ".json":
                faltan = exportados(f.read_text(encoding="utf-8")) - exportados(dest.read_text(encoding="utf-8"))
                # Lo tuyo (paletas, logo y nombres propios) no se avisa: el kit plantilla lo cambia por MARCA / LogoMarca.
                faltan = {x for x in faltan if not patron_prohibido.search(x)}
                if faltan:
                    avisos.append(f"{f.name}: tu kit exporta {', '.join(sorted(faltan))} y el kit plantilla no (pásalo a mano).")
            continue
        if f.suffix == ".json":
            avisos.append(f"{f.name}: JSON no copiado (puede traer datos tuyos). Si es genérico, cópialo a mano.")
            continue
        nuevos[DESTINO / f.name] = transformar(f.name, f.read_text(encoding="utf-8"), regs, regs_com)

    # Archivos del kit plantilla que ya no existen en tu kit.
    for dest in sorted(DESTINO.glob("*")):
        if dest.name not in PROPIOS and dest not in nuevos and dest.is_file():
            avisos.append(f"{dest.name}: existe en el kit plantilla pero no en tu kit (no se borra).")

    errores = []
    for dest, texto in nuevos.items():
        for n, linea in enumerate(texto.splitlines(), 1):
            if patron_prohibido.search(linea):
                errores.append(f"{dest.name}:{n}: {linea.strip()[:140]}")

    cambios = 0
    for dest, texto in nuevos.items():
        actual = dest.read_text(encoding="utf-8") if dest.exists() else ""
        if actual == texto:
            continue
        cambios += 1
        estado = "nuevo" if not actual else "cambia"
        print(f"[{estado}] {dest.relative_to(RAIZ)}")
        if o.diff:
            sys.stdout.writelines(difflib.unified_diff(actual.splitlines(True), texto.splitlines(True), f"a/{dest.name}", f"b/{dest.name}"))

    for a in avisos:
        print(f"[aviso] {a}")
    if errores:
        print("\nQuedan palabras prohibidas; no se escribió nada. Agrega un reemplazo o corrige en tu kit:")
        for e in errores:
            print(f"  {e}")
        return 1
    if not cambios:
        print("Sin cambios: el kit plantilla ya está al día.")
        return 0
    if not o.aplicar:
        print(f"\nEn seco: {cambios} archivo(s) cambiarían. Corre con --aplicar para escribirlos.")
        return 0
    for dest, texto in nuevos.items():
        dest.write_text(texto, encoding="utf-8", newline="\n")
    print(f"\nListo: {cambios} archivo(s) escritos en {DESTINO.relative_to(RAIZ)}. Corre `npx tsc --noEmit` en kit/.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
