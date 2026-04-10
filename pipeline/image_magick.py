from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


def require_magick() -> str:
    magick = shutil.which("magick")
    if not magick:
        raise RuntimeError("ImageMagick CLI `magick` is required but was not found in PATH.")
    return magick


def normalize_comic_png(source: Path, target: Path, max_width: int = 1800) -> Path:
    magick = require_magick()
    target.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            magick,
            str(source),
            "-auto-orient",
            "-strip",
            "-colorspace",
            "sRGB",
            "-resize",
            f"{max_width}x>",
            "-define",
            "png:compression-level=9",
            "-define",
            "png:compression-filter=5",
            "-define",
            "png:compression-strategy=1",
            str(target),
        ],
        check=True,
    )
    return target
