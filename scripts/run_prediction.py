from __future__ import annotations

import json

from config.settings import ensure_directories
from src.pipeline import StockPipeline


def main() -> None:
    ensure_directories()
    pipeline = StockPipeline()
    payload = pipeline.run_top10()
    print(json.dumps(payload, indent=2, default=str))


if __name__ == "__main__":
    main()
