"""Export the interaction log as a CSV -- the Voice-First validation evidence.

Usage:  python -m tools.make_evidence > evidence.csv
"""
from __future__ import annotations

import csv
import json
import os
import sys

# Allow running as `python -m tools.make_evidence` from the server/ dir.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings  # noqa: E402

FIELDS = ["ts", "channel", "language", "user_ref", "latency_ms", "transcript", "reply"]


def main() -> None:
    path = os.path.join(settings.data_dir, "interactions.jsonl")
    writer = csv.DictWriter(sys.stdout, fieldnames=FIELDS, extrasaction="ignore")
    writer.writeheader()
    n = 0
    try:
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                writer.writerow(json.loads(line))
                n += 1
    except FileNotFoundError:
        pass
    print(f"# {n} interactions", file=sys.stderr)


if __name__ == "__main__":
    main()
