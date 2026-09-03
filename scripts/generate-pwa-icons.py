#!/usr/bin/env python3
"""Genera iconos PWA en tamaños correctos desde Docs/Marca/favicon.png."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "Docs/Marca/favicon.png"
OUT = ROOT / "public"

SIZES = {
    "apple-touch-icon.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
    "icon-maskable-512.png": 512,
}


def make_icon(src: Image.Image, size: int, *, maskable: bool = False) -> Image.Image:
    if not maskable:
        return src.resize((size, size), Image.Resampling.LANCZOS)

    # Zona segura ~80% para iconos maskable (Android)
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    inner = int(size * 0.72)
    resized = src.resize((inner, inner), Image.Resampling.LANCZOS)
    offset = (size - inner) // 2
    canvas.paste(resized, (offset, offset), resized if resized.mode == "RGBA" else None)
    return canvas


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"No se encontró {SRC}")

    source = Image.open(SRC).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)

    for filename, px in SIZES.items():
        maskable = "maskable" in filename
        icon = make_icon(source, px, maskable=maskable)
        dest = OUT / filename
        icon.save(dest, format="PNG", optimize=True)
        print(f"OK {dest.name} ({px}x{px})")


if __name__ == "__main__":
    main()
