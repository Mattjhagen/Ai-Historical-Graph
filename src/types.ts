export interface DataPoint {
  [key: string]: string | number;
}

export interface DatasetSummary {
  name: string;
  rowCount: number;
  dateColumn: string;
  numericColumns: string[];
  selectedColumn: string;
  dateRange: { min: string; max: string };
  stats: {
    min: number;
    max: number;
    mean: number;
    latest: number;
  };
}

export type ChartType = 'scatter' | 'bar' | 'area';

export interface GraphConfig {
  selectedColumn: string;
  secondaryColumn?: string;
  chartType: ChartType;
  showMovingAverage: boolean;
  movingAvgPeriod: number;
  showMinMax: boolean;
  dateRange: { start?: string; end?: string };
  logScale: boolean;
}

export interface RngConfig {
  count: number;
  min: number;
  max: number;
  type: 'integer' | 'float';
  decimals: number;
  unique: boolean;
  distribution: 'uniform' | 'normal';
  mean: number;
  stdDev: number;
}

export interface RngResult {
  id: string;
  timestamp: string;
  numbers: number[];
  config: RngConfig;
  stats: {
    min: number;
    max: number;
    mean: number;
    median: number;
    sum: number;
    stdDev: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  actionExecuted?: string;
}

export interface AIActionResponse {
  reply: string;
  action?: {
    type: 'NONE' | 'GRAPH_FILTER_DATE' | 'GRAPH_RESET' | 'GRAPH_SET_SERIES' | 'GRAPH_SET_TYPE' | 'GRAPH_TOGGLE_MA' | 'RNG_GENERATE' | 'LOAD_SAMPLE_DATA';
    graphDateRange?: { preset?: 'last30d' | 'last7d' | 'last90d' | 'last1y' | 'all' | 'custom'; startDate?: string; endDate?: string };
    graphSeries?: string;
    graphChartType?: ChartType;
    graphShowMovingAvg?: boolean;
    graphMovingAvgPeriod?: number;
    rngParams?: Partial<RngConfig>;
    sampleDataset?: 'tech_stocks' | 'daily_sales' | 'sensor_temperature';
  };
}
