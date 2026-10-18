import Papa from 'papaparse';
import { DataPoint, DatasetSummary, RngConfig, RngResult } from '../types';

/**
 * Automatically inspects records and identifies date column and numeric columns
 */
export function analyzeData(
  data: DataPoint[],
  datasetName: string = 'Uploaded Dataset'
): {
  summary: DatasetSummary;
  dateCol: string;
  numCols: string[];
} {
  if (!data || data.length === 0) {
    throw new Error('Dataset is empty');
  }

  const sampleRow = data[0];
  const keys = Object.keys(sampleRow);

  // Look for date-like keys
  let dateCol =
    keys.find((k) =>
      /date|time|timestamp|day|year|month|period/i.test(k)
    ) || '';

  // If no obvious date column name, inspect values
  if (!dateCol) {
    for (const key of keys) {
      const val = String(sampleRow[key]);
      if (!isNaN(Date.parse(val)) && (val.includes('-') || val.includes('/') || val.includes(':'))) {
        dateCol = key;
        break;
      }
    }
  }

  // If still none, use first column or create an artificial index
  if (!dateCol) {
    dateCol = keys[0];
  }

  // Find numeric columns
  const numCols = keys.filter((key) => {
    if (key === dateCol) return false;
    // Check if at least 70% of rows are numbers
    let validNumCount = 0;
    const testLimit = Math.min(data.length, 50);
    for (let i = 0; i < testLimit; i++) {
      const val = data[i][key];
      if (typeof val === 'number' || (!isNaN(Number(val)) && String(val).trim() !== '')) {
        validNumCount++;
      }
    }
    return validNumCount / testLimit >= 0.7;
  });

  const selectedCol = numCols[0] || (keys[1] ?? keys[0]);

  // Compute date range
  let minDate = '';
  let maxDate = '';
  try {
    const dates = data.map((d) => String(d[dateCol])).filter(Boolean).sort();
    if (dates.length > 0) {
      minDate = dates[0];
      maxDate = dates[dates.length - 1];
    }
  } catch (e) {
    // fallback
  }

  // Compute basic stats for the selected column
  const values = data
    .map((d) => Number(d[selectedCol]))
    .filter((v) => !isNaN(v));

  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 0;
  const sumVal = values.reduce((a, b) => a + b, 0);
  const meanVal = values.length ? sumVal / values.length : 0;
  const latestVal = values.length ? values[values.length - 1] : 0;

  const summary: DatasetSummary = {
    name: datasetName,
    rowCount: data.length,
    dateColumn: dateCol,
    numericColumns: numCols,
    selectedColumn: selectedCol,
    dateRange: { min: minDate, max: maxDate },
    stats: {
      min: minVal,
      max: maxVal,
      mean: Number(meanVal.toFixed(2)),
      latest: latestVal,
    },
  };

  return { summary, dateCol, numCols };
}

/**
 * Parses raw CSV text into typed objects
 */
export function parseCSV(csvText: string): Promise<DataPoint[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<DataPoint>(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(results.errors[0].message));
        } else {
          resolve(results.data);
        }
      },
      error: (err: any) => reject(err),
    });
  });
}

/**
 * Computes simple moving average for a series
 */
export function calculateMovingAverage(
  values: number[],
  period: number
): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += values[i - j];
      }
      result.push(Number((sum / period).toFixed(4)));
    }
  }
  return result;
}

/**
 * Filter data by preset or specific date range
 */
export function filterDataByDate(
  data: DataPoint[],
  dateCol: string,
  preset?: 'last30d' | 'last7d' | 'last90d' | 'last1y' | 'all' | 'custom',
  startDate?: string,
  endDate?: string
): { filtered: DataPoint[]; appliedStart: string; appliedEnd: string } {
  if (!data || data.length === 0) {
    return { filtered: [], appliedStart: '', appliedEnd: '' };
  }

  if (preset === 'all' || (!preset && !startDate && !endDate)) {
    const dates = data.map((d) => String(d[dateCol])).filter(Boolean);
    return {
      filtered: data,
      appliedStart: dates[0] || '',
      appliedEnd: dates[dates.length - 1] || '',
    };
  }

  // Sort timestamps
  const sorted = [...data].sort((a, b) => {
    const da = new Date(String(a[dateCol])).getTime();
    const db = new Date(String(b[dateCol])).getTime();
    return da - db;
  });

  const lastRecord = sorted[sorted.length - 1];
  const maxTime = new Date(String(lastRecord[dateCol])).getTime();

  let cutoffTime = 0;

  if (preset === 'last7d') {
    cutoffTime = maxTime - 7 * 24 * 60 * 60 * 1000;
  } else if (preset === 'last30d') {
    cutoffTime = maxTime - 30 * 24 * 60 * 60 * 1000;
  } else if (preset === 'last90d') {
    cutoffTime = maxTime - 90 * 24 * 60 * 60 * 1000;
  } else if (preset === 'last1y') {
    cutoffTime = maxTime - 365 * 24 * 60 * 60 * 1000;
  } else if (startDate || endDate) {
    const startMs = startDate ? new Date(startDate).getTime() : 0;
    const endMs = endDate ? new Date(endDate).getTime() : Infinity;
    const filtered = sorted.filter((d) => {
      const t = new Date(String(d[dateCol])).getTime();
      return t >= startMs && t <= endMs;
    });
    return {
      filtered,
      appliedStart: startDate || String(filtered[0]?.[dateCol] || ''),
      appliedEnd: endDate || String(filtered[filtered.length - 1]?.[dateCol] || ''),
    };
  }

  const filtered = sorted.filter((d) => {
    const t = new Date(String(d[dateCol])).getTime();
    return t >= cutoffTime;
  });

  return {
    filtered,
    appliedStart: String(filtered[0]?.[dateCol] || ''),
    appliedEnd: String(lastRecord[dateCol] || ''),
  };
}

/**
 * Standard Random Number Generation Engine
 */
export function generateRandomNumbers(config: RngConfig): RngResult {
  const { count, min, max, type, decimals, unique, distribution, mean, stdDev } = config;
  const numbers: number[] = [];

  const actualCount = Math.max(1, Math.min(count, 50000));
  const effectiveMin = Math.min(min, max);
  const effectiveMax = Math.max(min, max);

  if (distribution === 'normal') {
    // Box-Muller transform for Gaussian distribution
    for (let i = 0; i < actualCount; i++) {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      let val = mean + num * stdDev;
      // Clamp between min and max if desired or leave as distribution
      val = Math.max(effectiveMin, Math.min(effectiveMax, val));

      if (type === 'integer') {
        numbers.push(Math.round(val));
      } else {
        numbers.push(Number(val.toFixed(decimals)));
      }
    }
  } else if (unique && type === 'integer') {
    // Generate unique integers without repetition
    const totalPossible = Math.floor(effectiveMax) - Math.ceil(effectiveMin) + 1;
    const poolSize = Math.min(actualCount, totalPossible);
    const pool = new Set<number>();

    // If poolSize is high percentage of range, shuffle array
    if (poolSize > totalPossible * 0.5) {
      const all: number[] = [];
      for (let i = Math.ceil(effectiveMin); i <= Math.floor(effectiveMax); i++) {
        all.push(i);
      }
      // Fisher-Yates shuffle
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      for (let i = 0; i < poolSize; i++) {
        numbers.push(all[i]);
      }
    } else {
      while (pool.size < poolSize) {
        const val = Math.floor(Math.random() * (effectiveMax - effectiveMin + 1)) + effectiveMin;
        pool.add(val);
      }
      numbers.push(...Array.from(pool));
    }
  } else {
    // Standard uniform distribution
    for (let i = 0; i < actualCount; i++) {
      if (type === 'integer') {
        const val = Math.floor(Math.random() * (effectiveMax - effectiveMin + 1)) + effectiveMin;
        numbers.push(val);
      } else {
        const val = Math.random() * (effectiveMax - effectiveMin) + effectiveMin;
        numbers.push(Number(val.toFixed(decimals)));
      }
    }
  }

  // Calculate statistics
  const minVal = numbers.length ? Math.min(...numbers) : 0;
  const maxVal = numbers.length ? Math.max(...numbers) : 0;
  const sumVal = numbers.reduce((a, b) => a + b, 0);
  const meanVal = numbers.length ? sumVal / numbers.length : 0;

  // Median
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianVal = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Standard Deviation
  const variance =
    numbers.reduce((acc, val) => acc + Math.pow(val - meanVal, 2), 0) /
    (numbers.length || 1);
  const stdDevVal = Math.sqrt(variance);

  return {
    id: 'rng-' + Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    numbers,
    config: { ...config },
    stats: {
      min: minVal,
      max: maxVal,
      mean: Number(meanVal.toFixed(3)),
      median: Number(medianVal.toFixed(3)),
      sum: Number(sumVal.toFixed(3)),
      stdDev: Number(stdDevVal.toFixed(3)),
    },
  };
}

/**
 * Intelligent Client-Side NLP Parser for fallback when offline or no API key
 */
export function parseLocalNLPCommand(
  text: string,
  numericColumns: string[]
): {
  reply: string;
  action: {
    type: 'NONE' | 'GRAPH_FILTER_DATE' | 'GRAPH_RESET' | 'GRAPH_SET_SERIES' | 'GRAPH_SET_TYPE' | 'GRAPH_TOGGLE_MA' | 'RNG_GENERATE' | 'LOAD_SAMPLE_DATA';
    graphDateRange?: { preset?: 'last30d' | 'last7d' | 'last90d' | 'last1y' | 'all' };
    graphSeries?: string;
    graphChartType?: 'scatter' | 'bar' | 'area';
    graphShowMovingAvg?: boolean;
    graphMovingAvgPeriod?: number;
    rngParams?: Partial<RngConfig>;
    sampleDataset?: 'tech_stocks' | 'daily_sales' | 'sensor_temperature';
  };
} {
  const lower = text.toLowerCase();

  // RNG patterns: "Give me 50 random integers between 10 and 100"
  // "Generate 20 numbers", "50 random integers from 1 to 500"
  const rngMatch = lower.match(/(?:give|generate|produce|roll|create)?\s*(\d+)\s*(?:random)?\s*(integer|int|float|decimal|number)?s?\s*(?:between|from|in range)?\s*(-?\d+)\s*(?:and|to|-)\s*(-?\d+)/i);
  if (rngMatch) {
    const count = parseInt(rngMatch[1], 10);
    const isFloat = /float|decimal/i.test(rngMatch[2] || '');
    const min = parseFloat(rngMatch[3]);
    const max = parseFloat(rngMatch[4]);
    return {
      reply: `Generated ${count} random ${isFloat ? 'floats' : 'integers'} between ${min} and ${max}. You can copy them or export to CSV!`,
      action: {
        type: 'RNG_GENERATE',
        rngParams: {
          count,
          min: Math.min(min, max),
          max: Math.max(min, max),
          type: isFloat ? 'float' : 'integer',
          decimals: isFloat ? 2 : 0,
        },
      },
    };
  }

  // Date filter patterns: "Show me only the last 30 days"
  if (lower.includes('last 30 days') || lower.includes('last 30 d') || lower.includes('past month') || lower.includes('30 days')) {
    return {
      reply: 'Filtering graph to show the last 30 days.',
      action: {
        type: 'GRAPH_FILTER_DATE',
        graphDateRange: { preset: 'last30d' },
      },
    };
  }

  if (lower.includes('last 7 days') || lower.includes('past week') || lower.includes('last week')) {
    return {
      reply: 'Zooming in to the last 7 days.',
      action: {
        type: 'GRAPH_FILTER_DATE',
        graphDateRange: { preset: 'last7d' },
      },
    };
  }

  if (lower.includes('last 90 days') || lower.includes('past quarter')) {
    return {
      reply: 'Filtering graph to the last 90 days.',
      action: {
        type: 'GRAPH_FILTER_DATE',
        graphDateRange: { preset: 'last90d' },
      },
    };
  }

  if (lower.includes('reset') || lower.includes('show all') || lower.includes('full history') || lower.includes('all days')) {
    return {
      reply: 'Resetting graph view to display the entire historical dataset.',
      action: {
        type: 'GRAPH_RESET',
        graphDateRange: { preset: 'all' },
      },
    };
  }

  // Moving average toggle
  if (lower.includes('moving average') || lower.includes('sma') || lower.includes('trendline')) {
    const periodMatch = lower.match(/(\d+)\s*(?:day|period)?\s*(?:moving average|ma|sma)/i);
    const period = periodMatch ? parseInt(periodMatch[1], 10) : 7;
    return {
      reply: `Toggled ${period}-day Simple Moving Average overlay.`,
      action: {
        type: 'GRAPH_TOGGLE_MA',
        graphShowMovingAvg: true,
        graphMovingAvgPeriod: period,
      },
    };
  }

  // Chart type switch
  if (lower.includes('bar chart') || lower.includes('bars')) {
    return {
      reply: 'Switched chart type to Bar graph.',
      action: {
        type: 'GRAPH_SET_TYPE',
        graphChartType: 'bar',
      },
    };
  }
  if (lower.includes('area chart') || lower.includes('area plot')) {
    return {
      reply: 'Switched chart type to Filled Area graph.',
      action: {
        type: 'GRAPH_SET_TYPE',
        graphChartType: 'area',
      },
    };
  }
  if (lower.includes('line chart') || lower.includes('line plot') || lower.includes('scatter')) {
    return {
      reply: 'Switched chart type to Line graph.',
      action: {
        type: 'GRAPH_SET_TYPE',
        graphChartType: 'scatter',
      },
    };
  }

  // Series selection
  for (const col of numericColumns) {
    if (lower.includes(col.toLowerCase())) {
      return {
        reply: `Selected column "${col}" for historical visualization.`,
        action: {
          type: 'GRAPH_SET_SERIES',
          graphSeries: col,
        },
      };
    }
  }

  // Sample data loading
  if (lower.includes('stock') || lower.includes('market') || lower.includes('apple') || lower.includes('prices')) {
    return {
      reply: 'Loaded Tech Stocks demonstration dataset.',
      action: {
        type: 'LOAD_SAMPLE_DATA',
        sampleDataset: 'tech_stocks',
      },
    };
  }
  if (lower.includes('sales') || lower.includes('ecommerce') || lower.includes('revenue')) {
    return {
      reply: 'Loaded E-Commerce Daily Sales demonstration dataset.',
      action: {
        type: 'LOAD_SAMPLE_DATA',
        sampleDataset: 'daily_sales',
      },
    };
  }
  if (lower.includes('sensor') || lower.includes('temperature') || lower.includes('iot')) {
    return {
      reply: 'Loaded IoT Sensor Telemetry demonstration dataset.',
      action: {
        type: 'LOAD_SAMPLE_DATA',
        sampleDataset: 'sensor_temperature',
      },
    };
  }

  return {
    reply: "I understand! You can ask me to filter dates ('show me only the last 30 days'), generate numbers ('give me 50 random integers between 10 and 100'), switch chart styles ('switch to bar chart'), or toggle moving averages.",
    action: { type: 'NONE' },
  };
}
