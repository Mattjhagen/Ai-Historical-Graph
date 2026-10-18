#!/usr/bin/env python3
"""
OmniGraph & RNG Standalone Python Utility
Using Pandas, Plotly, and NumPy for easy local extension.

Usage:
    python standalone_utility.py --plot tech_stocks.csv --column Close --days 30 --export plot.png
    python standalone_utility.py --rng 50 --min 10 --max 100 --csv random_numbers.csv
"""

import argparse
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

def plot_historical_data(csv_path: str, column: str = "Close", last_n_days: int = None, export_img: str = None):
    df = pd.read_csv(csv_path)
    
    # Identify date column
    date_col = next((c for c in df.columns if any(k in c.lower() for k in ["date", "time", "day"])), df.columns[0])
    df[date_col] = pd.to_datetime(df[date_col])
    df = df.sort_values(by=date_col)

    if last_n_days:
        cutoff = df[date_col].max() - pd.Timedelta(days=last_n_days)
        df = df[df[date_col] >= cutoff]

    fig = go.Figure()

    # Main series
    fig.add_trace(go.Scatter(
        x=df[date_col],
        y=df[column],
        mode='lines+markers',
        name=column,
        line=dict(color='#0284c7', width=2)
    ))

    # Optional 7-day Simple Moving Average
    if len(df) >= 7:
        df['SMA_7'] = df[column].rolling(window=7).mean()
        fig.add_trace(go.Scatter(
            x=df[date_col],
            y=df['SMA_7'],
            mode='lines',
            name='7-Day SMA',
            line=dict(color='#f59e0b', dash='dash')
        ))

    fig.update_layout(
        title=f"Historical Analysis - {column}",
        xaxis_title="Date",
        yaxis_title=column,
        template="plotly_dark",
        hovermode="x unified"
    )

    if export_img:
        fig.write_image(export_img)
        print(f"Graph saved to {export_img}")
    else:
        fig.show()

def generate_random_numbers(count: int, min_val: float, max_val: float, is_int: bool = True, output_csv: str = None):
    if is_int:
        numbers = np.random.randint(int(min_val), int(max_val) + 1, size=count)
    else:
        numbers = np.random.uniform(min_val, max_val, size=count).round(3)

    df_rng = pd.DataFrame({"Index": range(1, count + 1), "RandomValue": numbers})
    print(f"Generated {count} numbers between {min_val} and {max_val}:")
    print(df_rng.head(10))
    print(f"Summary: Min={numbers.min()}, Max={numbers.max()}, Mean={numbers.mean():.2f}")

    if output_csv:
        df_rng.to_csv(output_csv, index=False)
        print(f"Exported to {output_csv}")

    return numbers

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OmniGraph & RNG Python Tool")
    parser.add_argument("--plot", type=str, help="Path to historical CSV data file")
    parser.add_argument("--column", type=str, default="Close", help="Column to plot")
    parser.add_argument("--days", type=int, default=None, help="Show only the last N days")
    parser.add_argument("--export", type=str, default=None, help="Save image as PNG or PDF")
    parser.add_argument("--rng", type=int, default=None, help="Number of random values to generate")
    parser.add_argument("--min", type=float, default=10, help="RNG Minimum range")
    parser.add_argument("--max", type=float, default=100, help="RNG Maximum range")
    parser.add_argument("--csv", type=str, default=None, help="Save generated RNG set to CSV")

    args = parser.parse_args()

    if args.plot:
        plot_historical_data(args.plot, args.column, args.days, args.export)
    elif args.rng:
        generate_random_numbers(args.rng, args.min, args.max, output_csv=args.csv)
    else:
        print("Please provide --plot or --rng options. Run with --help for details.")
