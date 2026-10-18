# OmniGraph & Parametric RNG Assistant

A unified, interactive dual utility that pairs **high-performance historical graphing** with an **on-demand random number generator**, wrapped in a natural language **AI Copilot** powered by Gemini.

---

## Key Features

### 1. Interactive Historical Graphing
- **Interactive Plotting (Plotly Engine):** Standard zoom, pan, hover crosshairs, and date range slider.
- **Dynamic File Ingestion:** Drag and drop or browse any CSV or JSON file. Automatically detects time/date columns and numeric series.
- **Analysis Overlays:** Simple Moving Averages (7, 14, 30 days) and automated Peak & Low detection.
- **High-Resolution Exports:**
  - **PNG:** 1-click 1600×900 high-dpi image download.
  - **PDF:** Executive formatted landscape A4 report with chart snapshot and statistical summary table.
- **Pre-Loaded Demonstration Datasets:**
  - Tech Stock Prices (`AAPL 2024`) with Open/High/Low/Close and Volume.
  - Daily E-Commerce Sales with revenue, orders, and customer retention.
  - IoT Sensor Telemetry with temperature, humidity, and barometric pressure.

### 2. On-Demand Random Number Engine
- **Parametric Generation:** Configure quantity ($N=1$ to $10,000$), range minimum, maximum, and toggle integer vs. floating-point decimals.
- **Unique Mode:** Generate numbers without duplicates (ideal for lottery draws, sampling, and permutations).
- **Distributions:** Choose between standard **Uniform** distribution and **Gaussian / Normal** bell curves with configurable mean ($\mu$) and standard deviation ($\sigma$).
- **Export & Clipboard:**
  - Instant **"Copy"** button with visual confirmation.
  - 1-click **"Save CSV"** formatted with indexes and values.
  - **"Plot in Graph"** bridge: plot newly generated numbers directly into the historical chart visualizer.

### 3. Natural Language AI Copilot
- Ask in plain English in the side chat panel:
  - *"Show me only the last 30 days"*
  - *"Give me 50 random integers between 10 and 100"*
  - *"Highlight the maximum peak and show 7-day MA"*
  - *"Generate 20 floats between 0 and 1 with 3 decimals"*
  - *"Switch to Bar Chart"*
  - *"Reset zoom to full history"*

---

## Quick Setup Instructions

### Running the Web Application (Node + React + Vite + Express)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server (runs full-stack Express server with Vite middleware on port 3000):
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

*(Optional)* If you want full Gemini AI natural language features locally, configure your `GEMINI_API_KEY` in a `.env` file. The app includes a built-in intelligent rule engine that functions seamlessly even offline or without an API key!

### Running the Companion Python Script (Python + Pandas + Plotly)
If you prefer running a command line script on your desktop:
```bash
# 1. Install standard data science libraries
pip install pandas plotly numpy kaleido

# 2. Plot historical data (last 30 days, export to PNG)
python scripts/standalone_utility.py --plot public/datasets/demo_tech_stock_prices.csv --column Close --days 30 --export stock_plot.png

# 3. Generate 50 random integers between 10 and 100 and export to CSV
python scripts/standalone_utility.py --rng 50 --min 10 --max 100 --csv my_random_numbers.csv
```

---

## Sample UI Clicks & Walkthrough

1. **Test Historical Zoom & Export:**
   - On the top bar, pick metric **"Close"** or **"Volume"**.
   - Click the **"30D"** pill to zoom into the last 30 days, or drag a selection box on the graph canvas.
   - Click **"Options"** and check **"Moving Average (SMA)"** and **"Highlight Peak & Low"**.
   - Click **"PNG"** or **"PDF"** to export your report.

2. **Generate and Export Random Numbers:**
   - In the RNG panel, set **Quantity = 50**, **Min = 10**, **Max = 100**.
   - Click **"GENERATE INSTANTLY"**.
   - Click **"Copy"** to copy to clipboard, or **"Save CSV"** to download the CSV file.
   - Click **"Plot in Graph"** to render the numbers as a time series in the top chart!

3. **Use the AI Copilot:**
   - Click the prompt chip *"Show me only the last 30 days"*.
   - Watch the chart dynamically filter to the 30-day window.
   - Click *"Give me 50 random integers between 10 and 100"* to instantly generate the requested set.
