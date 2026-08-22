#!/usr/bin/env python3
"""Run the canonical Friendly Adversary prepack gate."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    subprocess.run(
        ["npm.cmd" if os.name == "nt" else "npm", "run", "prepack"],
        cwd=ROOT,
        check=True,
    )


if __name__ == "__main__":
    main()
