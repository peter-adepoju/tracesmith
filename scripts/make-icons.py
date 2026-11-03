"""
Generate the app icons.

Pure standard library: no Pillow, nothing to install. Draws a signal trace —
a baseline that steps, spikes and settles — which is the mark the course is
named after.

    python -I scripts/make-icons.py

Rerun it after changing COLOURS or POINTS. Output goes to public/.
"""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public"

BG = (0x14, 0x13, 0x0F)
INK = (0xFB, 0x92, 0x3C)

# The trace, in 0..1 coordinates. Baseline, step up, spike, settle.
POINTS = [
    (0.10, 0.60),
    (0.30, 0.60),
    (0.40, 0.32),
    (0.52, 0.76),
    (0.62, 0.48),
    (0.90, 0.48),
]


def distance_to_segment(px, py, ax, ay, bx, by):
    """Shortest distance from a point to a line segment."""
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def render(size: int, inset: float, thickness: float) -> bytes:
    """Draw the icon as raw RGB rows.

    `inset` shrinks the mark towards the centre, which is what a maskable
    icon needs: Android may crop up to 20% off every edge.
    """
    half = thickness * size / 2
    pts = [
        (
            (0.5 + (x - 0.5) * inset) * size,
            (0.5 + (y - 0.5) * inset) * size,
        )
        for x, y in POINTS
    ]
    segments = list(zip(pts, pts[1:]))

    rows = bytearray()
    for y in range(size):
        rows.append(0)  # PNG filter: none
        for x in range(size):
            cx, cy = x + 0.5, y + 0.5
            nearest = min(
                distance_to_segment(cx, cy, ax, ay, bx, by)
                for (ax, ay), (bx, by) in segments
            )
            # Soft edge over one pixel, which is enough to look smooth.
            alpha = max(0.0, min(1.0, (half - nearest) + 0.5))
            rows.extend(
                round(BG[i] + (INK[i] - BG[i]) * alpha) for i in range(3)
            )
    return bytes(rows)


def write_png(path: Path, size: int, raw: bytes) -> None:
    def chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(
            ">I", zlib.crc32(body) & 0xFFFFFFFF
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)
    print(f"  {path.name}  {size}x{size}  {len(png) // 1024} KB")


def main() -> None:
    OUT.mkdir(exist_ok=True)
    print("writing icons to public/")
    # name, size, inset (1.0 = full bleed), stroke thickness
    jobs = [
        ("icon-192.png", 192, 1.0, 0.085),
        ("icon-512.png", 512, 1.0, 0.085),
        ("icon-maskable-512.png", 512, 0.72, 0.085),
        ("apple-touch-icon.png", 180, 0.84, 0.090),
    ]
    for name, size, inset, thickness in jobs:
        write_png(OUT / name, size, render(size, inset, thickness))


if __name__ == "__main__":
    main()
