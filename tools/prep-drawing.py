#!/usr/bin/env python3
"""Turn a sourced scientific drawing into the four files the lab expects.

    python3 tools/prep-drawing.py <source-image> <base-name>

writes assets/photos/<base-name>-900.jpg, -1400.jpg, -900.webp, -1400.webp

A drawing is treated differently from a photograph on purpose. The photographs in this lab are
centre-cropped to 3:2, which is right for a photograph and wrong for a drawing: cropping a
drawing cuts off the very legs and antennae a student is meant to count. So this TRIMS the
white border away, then PADS onto white to the frame, so the specimen is as large as it can be
with none of it lost.

The white background is kept genuinely white. A scanned plate is usually a warm grey, which
next to the lab's white cards looks like a dirty rectangle, so anything near-white is lifted to
white and the ink is left alone.

WebP is written lossless where that is smaller — line art is mostly flat white, so lossless
usually wins outright and there is no reason to accept any loss on a drawing.
"""
import sys, os, io
import numpy as np
from PIL import Image

# A drawing keeps its OWN shape. The photographs in this lab are cropped to 3:2, but a
# drawing padded to 3:2 just gets white bars and is drawn smaller — and a smaller drawing is
# a harder drawing to label and to read. Only a shape more extreme than these bounds is
# padded, so nothing comes out as a sliver.
ASPECT_MIN, ASPECT_MAX = 0.62, 5.6
WIDTHS = (1400, 900)
JPEG_Q = 90             # line art shows ringing early; this is deliberately generous
PAPER = 246             # anything at or above this becomes pure white


def trim(im):
    """Cut the empty margin away, so the animal fills the frame."""
    g = np.array(im.convert('L'))
    ink = g < 235
    if not ink.any():
        return im
    rows, cols = np.where(ink.any(1))[0], np.where(ink.any(0))[0]
    pad = max(4, int(0.012 * max(im.size)))
    top, bot = max(0, rows[0] - pad), min(im.height, rows[-1] + 1 + pad)
    left, right = max(0, cols[0] - pad), min(im.width, cols[-1] + 1 + pad)
    return im.crop((left, top, right, bot))


def whiten(im):
    """Lift a scan's warm grey paper to white without touching the ink."""
    a = np.array(im.convert('RGB')).astype(np.int16)
    near = a.min(axis=2) >= PAPER
    a[near] = 255
    return Image.fromarray(a.astype(np.uint8), 'RGB')


def frame(im):
    """Keep the drawing's own shape; pad onto white only if it is extreme.
       Never crop — a cropped leg cannot be counted."""
    w, h = im.size
    a = w / h
    if ASPECT_MIN <= a <= ASPECT_MAX:
        return im
    want = min(ASPECT_MAX, max(ASPECT_MIN, a))
    if a > want:
        W, H = w, round(w / want)
    else:
        H, W = h, round(h * want)
    out = Image.new('RGB', (W, H), 'white')
    out.paste(im, ((W - w) // 2, (H - h) // 2))
    return out


def sharpen_lines(im, factor):
    """Enlarge a SMALL line drawing without turning it to mush.

    A plain resize of a 76 px drawing to display size gives grey porridge: every line becomes a
    soft gradient. Upscaling first and then pulling the mid-tones back apart restores a black
    line on white paper — which is what the drawing was. Nothing is redrawn and no line moves;
    only the contrast the enlargement washed out is put back.
    """
    from PIL import ImageFilter
    w, h = im.size
    im = im.resize((round(w * factor), round(h * factor)), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=factor * 0.8, percent=110, threshold=2))
    a = np.asarray(im.convert('L')).astype(np.float32)
    lo, hi = 90.0, 215.0                      # ink floor and paper ceiling after the blur
    a = np.clip((a - lo) / (hi - lo), 0, 1) ** 0.95 * 255
    g = Image.fromarray(a.astype(np.uint8), 'L')
    return Image.merge('RGB', (g, g, g))


def save_webp(im, path):
    lossless = io.BytesIO(); im.save(lossless, 'WEBP', lossless=True, method=6)
    lossy = io.BytesIO(); im.save(lossy, 'WEBP', quality=92, method=6)
    data = lossless.getvalue() if len(lossless.getvalue()) <= len(lossy.getvalue()) else lossy.getvalue()
    how = 'lossless' if data is lossless.getvalue() else 'q92'
    open(path, 'wb').write(data)
    return len(data), how


def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(2)
    src, base = sys.argv[1], sys.argv[2]
    # --rotate <deg> turns the paper, nothing else. A long animal drawn down the page is
    # 2000 px tall on screen and unreadable beside its labels; laid along its length it reads
    # the same way as the photograph above it.
    rot = 0
    if '--rotate' in sys.argv:
        rot = int(sys.argv[sys.argv.index('--rotate') + 1])
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, 'assets', 'photos')

    im = trim(Image.open(src).convert('RGB'))
    if rot:
        im = im.rotate(rot, expand=True, fillcolor='white')
        print(f'{base}: turned {rot}deg -> {im.size}')
    if im.width < 640:                        # a small scan: enlarge it properly, once
        im = sharpen_lines(im, min(6.0, 900 / im.width))
        print(f'{base}: small source enlarged to {im.size} with the line contrast restored')
    im = frame(whiten(im))
    print(f'{base}: source {Image.open(src).size} -> framed {im.size}')
    for w in WIDTHS:
        r = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)
        j = os.path.join(out_dir, f'{base}-{w}.jpg')
        r.save(j, 'JPEG', quality=JPEG_Q, optimize=True, progressive=True, subsampling='4:4:4')
        n, how = save_webp(r, os.path.join(out_dir, f'{base}-{w}.webp'))
        print(f'  {w:>4}px  jpg {os.path.getsize(j)/1024:6.1f} KB   webp {n/1024:6.1f} KB ({how})')


main()
