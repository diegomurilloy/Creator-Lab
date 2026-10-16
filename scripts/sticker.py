# Recorte → sticker con borde blanco (estilo portada). Uso: python sticker.py entrada.png salida.png [ancho=1000] [borde=20]
import sys
from PIL import Image, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
W = int(sys.argv[3]) if len(sys.argv) > 3 else 1000
R = int(sys.argv[4]) if len(sys.argv) > 4 else 20
im = Image.open(src).convert("RGBA")
im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
a = im.getchannel("A").filter(ImageFilter.MinFilter(3))  # quita el halo de la orilla
a = a.point(lambda v: 0 if v < 40 else v)
im.putalpha(a)
pad = R * 2
lienzo = Image.new("RGBA", (im.width + pad * 2, im.height + pad), (0, 0, 0, 0))
borde = Image.new("L", lienzo.size, 0)
borde.paste(a, (pad, pad))
borde = borde.filter(ImageFilter.GaussianBlur(R * 0.6)).point(lambda v: 255 if v > 8 else 0).filter(ImageFilter.GaussianBlur(1.2))
blanco = Image.new("RGBA", lienzo.size, (255, 255, 255, 255))
blanco.putalpha(borde)
lienzo = Image.alpha_composite(lienzo, blanco)
capa = Image.new("RGBA", lienzo.size, (0, 0, 0, 0))
capa.paste(im, (pad, pad), im)
lienzo = Image.alpha_composite(lienzo, capa)
lienzo.save(dst)
print(dst, lienzo.size)
