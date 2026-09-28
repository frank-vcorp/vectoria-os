#!/usr/bin/env python3
"""
Genera public/logo.png y public/logo-on-dark.png con canal alpha real.

Si existe Docs/Marca/systronia-logo-transparent.png (RGBA), se usa tal cual.
Si no, se elimina el fondo negro o blanco de los PNG fuente (export sin alpha).
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MARCA = ROOT / "Docs" / "Marca"
PUBLIC = ROOT / "public"

DARK_SOURCE = MARCA / "systronia-logo-dark-source.png"
LIGHT_SOURCE = MARCA / "systronia-logo-light-source.png"
TRANSPARENT_MASTER = MARCA / "systronia-logo-transparent.png"

OUT_LIGHT = PUBLIC / "logo.png"
OUT_DARK = PUBLIC / "logo-on-dark.png"


def _black_key_rgba(im: Image.Image, cutoff: int = 20, feather: int = 12) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, _a = px[x, y]
            lum = max(r, g, b)
            if lum <= cutoff:
                px[x, y] = (r, g, b, 0)
            elif lum <= cutoff + feather:
                alpha = int(255 * (lum - cutoff) / feather)
                px[x, y] = (r, g, b, alpha)
    return im


def _white_key_rgba(im: Image.Image, cutoff: int = 246, feather: int = 10) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, _a = px[x, y]
            if r >= cutoff and g >= cutoff and b >= cutoff:
                px[x, y] = (r, g, b, 0)
                continue
            if min(r, g, b) >= cutoff - feather:
                # borde suave hacia blanco
                dist = min(r, g, b) - (cutoff - feather)
                alpha = int(255 * (1 - dist / feather))
                alpha = max(0, min(255, alpha))
                px[x, y] = (r, g, b, alpha)
            else:
                px[x, y] = (r, g, b, 255)
    return im


def _save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, format="PNG", optimize=True)


def build_light_logo() -> Image.Image:
    if TRANSPARENT_MASTER.exists():
        master = Image.open(TRANSPARENT_MASTER)
        if master.mode == "RGBA":
            return master
    if not DARK_SOURCE.exists():
        raise SystemExit(f"Falta {DARK_SOURCE} (logo oscuro sobre negro)")
    return _black_key_rgba(Image.open(DARK_SOURCE))


def build_dark_bg_logo() -> Image.Image:
    if not LIGHT_SOURCE.exists():
        raise SystemExit(f"Falta {LIGHT_SOURCE} (logo claro sobre blanco)")
    return _white_key_rgba(Image.open(LIGHT_SOURCE))


def main() -> None:
    light = build_light_logo()
    dark = build_dark_bg_logo()
    _save_png(light, OUT_LIGHT)
    _save_png(dark, OUT_DARK)
    print(f"OK {OUT_LIGHT} mode={light.mode} size={light.size}")
    print(f"OK {OUT_DARK} mode={dark.mode} size={dark.size}")


if __name__ == "__main__":
    main()
