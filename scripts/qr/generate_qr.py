#!/usr/bin/env python3
"""Generate a QR image using a local python-qrcode checkout.

Expected local checkout:
  vendor/python-qrcode

Usage:
  python scripts/qr/generate_qr.py --data "token" --output /tmp/qr.png
  python scripts/qr/generate_qr.py --data "token" --output /tmp/qr.svg --format svg
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_QRCODE_PATH = ROOT / "vendor" / "python-qrcode"


def add_local_qrcode_to_path() -> None:
    checkout_path = Path(os.environ.get("PYTHON_QRCODE_PATH", DEFAULT_QRCODE_PATH))
    if checkout_path.exists():
        sys.path.insert(0, str(checkout_path))


def generate_png(data: str, output: Path) -> None:
    import qrcode

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output)


def generate_svg(data: str, output: Path) -> None:
    import qrcode
    import qrcode.image.svg

    factory = qrcode.image.svg.SvgPathImage
    img = qrcode.make(data, image_factory=factory)
    img.save(output)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a QR image.")
    parser.add_argument("--data", required=True, help="QR payload. Use qr_token only.")
    parser.add_argument("--output", required=True, help="Output image path.")
    parser.add_argument("--format", choices=["png", "svg"], default="png")
    args = parser.parse_args()

    add_local_qrcode_to_path()

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)

    if args.format == "svg":
        generate_svg(args.data, output)
    else:
        generate_png(args.data, output)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
