from __future__ import annotations

from config.settings import HISTORICAL_DIR, get_stock_universe
from src.data_loader import download_stock_data


def main() -> None:
    for stock in get_stock_universe():
        symbol = stock["symbol"]
        print(f"Downloading {symbol}...")
        download_stock_data(symbol=symbol, save_dir=HISTORICAL_DIR)
    print("Completed download for all configured symbols.")


if __name__ == "__main__":
    main()
