#!/usr/bin/env python3
import sys

from PIL import Image, ImageOps
from pillow_heif import register_heif_opener


def main():
    if len(sys.argv) != 3:
        print("Usage: decodeHeic.py <input.heic> <output.png>", file=sys.stderr)
        return 2

    register_heif_opener()

    with Image.open(sys.argv[1]) as image:
        image = ImageOps.exif_transpose(image)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        image.save(sys.argv[2], format="PNG")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
