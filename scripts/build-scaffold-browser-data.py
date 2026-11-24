#!/usr/bin/env python3
"""Create classic-script versions of the scaffold catalog JSON for file:// use."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1] / "public-static" / "data"
DATASETS = (
    ("scaffold-components.json", "scaffold-components.js", "workspaceScaffoldComponentData"),
    ("scaffold-manufacturers.json", "scaffold-manufacturers.js", "workspaceScaffoldManufacturerData"),
)


for source_name, output_name, global_name in DATASETS:
    source = ROOT / source_name
    output = ROOT / output_name
    payload = json.loads(source.read_text(encoding="utf-8"))
    serialized = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    output.write_text(
        f"/* Generated from {source_name}; run scripts/build-scaffold-browser-data.py to refresh. */\n"
        f"window.{global_name}={serialized};\n",
        encoding="utf-8",
    )
    print(f"{output.relative_to(ROOT.parent)}: {output.stat().st_size:,} bytes")
