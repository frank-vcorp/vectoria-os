#!/usr/bin/env python3
"""
Copia los logos oficiales de Docs/Marca a public/.

- logo-transparente.png → public/logo.png (fondos claros, login, tarjeta blanca)
- logo-blanco.png → public/logo-blanco.png (referencia con fondo blanco; opcional en documentos)

public/logo-on-dark.png es el mismo arte que logo.png (texto oscuro); en sidebar va dentro del recuadro blanco.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MARCA = ROOT / "Docs" / "Marca"
PUBLIC = ROOT / "public"

SRC_TRANSPARENT = MARCA / "logo-transparente.png"
SRC_BLANCO = MARCA / "logo-blanco.png"

OUT_LOGO = PUBLIC / "logo.png"
OUT_LOGO_BLANCO = PUBLIC / "logo-blanco.png"
OUT_LOGO_ON_DARK = PUBLIC / "logo-on-dark.png"

MAX_WIDTH = 1400


def _load_rgba(path: Path) -> Image.Image:
    if not path.exists():
        raise SystemExit(f"No se encontró {path}")
    im = Image.open(path)
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    return im


def _maybe_resize(im: Image.Image) -> Image.Image:
    if im.width <= MAX_WIDTH:
        return im
    ratio = MAX_WIDTH / im.width
    height = max(1, int(im.height * ratio))
    return im.resize((MAX_WIDTH, height), Image.Resampling.LANCZOS)


def _save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, format="PNG", optimize=True)


def main() -> None:
    transparent = _maybe_resize(_load_rgba(SRC_TRANSPARENT))
    _save_png(transparent, OUT_LOGO)
    _save_png(transparent, OUT_LOGO_ON_DARK)

    if SRC_BLANCO.exists():
        blanco = Image.open(SRC_BLANCO)
        if blanco.mode != "RGB":
            blanco = blanco.convert("RGB")
        blanco = _maybe_resize(blanco)
        _save_png(blanco.convert("RGBA"), OUT_LOGO_BLANCO)

    print(f"OK {OUT_LOGO} {transparent.size} RGBA")
    print(f"OK {OUT_LOGO_ON_DARK} (mismo arte que logo.png)")
    if SRC_BLANCO.exists():
        print(f"OK {OUT_LOGO_BLANCO}")


if __name__ == "__main__":
    main()
