# Stock Prediction and Risk Intelligence Engine

This project provides a production-oriented AI forecasting module for a configurable 10-stock universe. The implementation treats KPIs and model outputs as decision-support information rather than guaranteed returns.

## Project focus

- Primary forecasting model: Kronos
- Horizon: 10 trading days
- Universe: a manually configured Top-10 list stored in `config/stocks.json`
- Data abstraction: loading is separated behind the `src/data_loader.py` interface so `yfinance` can be replaced later
- Risk and regime logic: simple, explainable calculations based on volatility, drawdown, and trend
- Output contract: JSON-friendly results with machine-readable schema in `src/api_contract.py`

## Key files

- `config/stocks.json` — exact 10-stock universe
- `config/settings.py` — global configuration and directory setup
- `src/data_loader.py` — abstracted historical data loading
- `src/data_validator.py` — OHLCV validation and fail-fast checks
- `src/kronos_forecaster.py` — Kronos forecast wrapper with graceful fallback behavior
- `src/postprocessor.py` — candle-level validation and correction
- `src/risk_engine.py` — calculation of risk level from volatility and drawdown
- `src/regime_detector.py` — explainable regime detection
- `src/ranking_engine.py` — scoring and ranking of the top-10 universe
- `src/pipeline.py` — full single-stock and top-10 orchestration
- `scripts/run_prediction.py` — generate the latest JSON and CSV predictions

## Usage

1. Install dependencies:
   `pip install -r requirements.txt`
2. Configure the stock universe in `config/stocks.json`
3. Run the prediction pipeline:
   `python scripts/run_prediction.py`
4. Inspect output files under `predictions/` and `backtesting/results/`

## API contract

The project includes Pydantic request/response models in `src/api_contract.py` to help developers integrate the AI service into an API layer later.

## Safety note

This module is designed for forecasting and decision support. It does not claim guaranteed returns, guaranteed profits, or recommendation of any specific security.
