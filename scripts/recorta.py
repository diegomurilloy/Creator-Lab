import sys, os
from rembg import new_session, remove
from PIL import Image
ses = new_session(sys.argv[1])
for f in sys.argv[3:]:
    im = Image.open(f).convert("RGB")
    out = remove(im, session=ses, post_process_mask=True)
    bb = out.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    out = out.crop(bb)
    dst = os.path.join(sys.argv[2], os.path.basename(f).rsplit(".", 1)[0] + ".png")
    out.save(dst); print(dst, out.size)
