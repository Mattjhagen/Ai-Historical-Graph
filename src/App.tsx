import React, { useState, useEffect } from 'react';
import {
  Activity,
  Dice5,
  Sparkles,
  HelpCircle,
  LayoutGrid,
  Maximize2,
  FileSpreadsheet,
  Check,
  Github,
  BookOpen,
  X,
  ExternalLink
} from 'lucide-react';
import {
  DataPoint,
  DatasetSummary,
  ChartType,
  RngConfig,
  RngResult,
  AIActionResponse,
} from './types';
import { analyzeData, parseCSV, generateRandomNumbers } from './utils/dataProcessor';
import { InteractiveGraph } from './components/InteractiveGraph';
import { RandomNumberGenerator } from './components/RandomNumberGenerator';
import { AIAssistant } from './components/AIAssistant';
import { DataUploader } from './components/DataUploader';

export default function App() {
  // Graph State
  const [data, setData] = useState<DataPoint[]>([]);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('Close');
  const [chartType, setChartType] = useState<ChartType>('scatter');
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(true);
  const [movingAvgPeriod, setMovingAvgPeriod] = useState<number>(7);
  const [showMinMax, setShowMinMax] = useState<boolean>(true);
  const [datePreset, setDatePreset] = useState<'all' | 'last7d' | 'last30d' | 'last90d' | 'last1y'>('all');

  // RNG State
  const [rngConfig, setRngConfig] = useState<RngConfig>({
    count: 50,
    min: 10,
    max: 100,
    type: 'integer',
    decimals: 2,
    unique: false,
    distribution: 'uniform',
    mean: 50,
    stdDev: 10,
  });
  const [rngResult, setRngResult] = useState<RngResult | null>(null);

  // App Layout State
  const [viewLayout, setViewLayout] = useState<'split' | 'graph-only' | 'rng-only'>('split');
  const [isAiOpen, setIsAiOpen] = useState<boolean>(true);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Initial Load: Load Tech Stocks Demo and Generate Initial RNG batch
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch('/datasets/demo_tech_stock_prices.csv');
        if (res.ok) {
          const csvText = await res.text();
          const records = await parseCSV(csvText);
          const { summary: sum, numCols } = analyzeData(records, 'Tech Stocks (AAPL 2024)');
          setData(records);
          setSummary(sum);
          setSelectedColumn(numCols.includes('Close') ? 'Close' : numCols[0]);
        }
      } catch (err) {
        console.error('Initial data load error:', err);
      }
    }
    loadInitialData();

    // Generate initial random batch
    const initialBatch = generateRandomNumbers(rngConfig);
    setRngResult(initialBatch);
  }, []);

  const handleDatasetLoaded = (newData: DataPoint[], name: string) => {
    try {
      const { summary: sum, numCols } = analyzeData(newData, name);
      setData(newData);
      setSummary(sum);
      setSelectedColumn(numCols[0] || 'Value');
      setDatePreset('all');
    } catch (err: any) {
      console.error('Failed to parse uploaded dataset:', err);
    }
  };

  const handleGenerateRNG = (override?: RngConfig) => {
    const configToUse = override || rngConfig;
    const res = generateRandomNumbers(configToUse);
    setRngResult(res);
  };

  // Allow plotting generated RNG numbers into the graph visualizer!
  const handlePlotRngInGraph = (numbers: number[], label: string) => {
    const now = new Date();
    const syntheticData: DataPoint[] = numbers.map((val, idx) => {
      const d = new Date(now.getTime() - (numbers.length - idx) * 24 * 60 * 60 * 1000);
      return {
        Date: d.toISOString().split('T')[0],
        GeneratedRandomValue: val,
      };
    });

    setData(syntheticData);
    const { summary: sum } = analyzeData(syntheticData, `RNG Series (${numbers.length} values)`);
    setSummary(sum);
    setSelectedColumn('GeneratedRandomValue');
    setDatePreset('all');
  };

  // Handle actions dispatched by the AI Copilot
  const handleExecuteAIAction = (action: NonNullable<AIActionResponse['action']>) => {
    if (action.type === 'GRAPH_FILTER_DATE' && action.graphDateRange?.preset) {
      if (action.graphDateRange.preset !== 'custom') {
        setDatePreset(action.graphDateRange.preset);
      }
    } else if (action.type === 'GRAPH_RESET') {
      setDatePreset('all');
    } else if (action.type === 'GRAPH_SET_SERIES' && action.graphSeries) {
      if (summary?.numericColumns.includes(action.graphSeries)) {
        setSelectedColumn(action.graphSeries);
      }
    } else if (action.type === 'GRAPH_SET_TYPE' && action.graphChartType) {
      setChartType(action.graphChartType);
    } else if (action.type === 'GRAPH_TOGGLE_MA') {
      setShowMovingAverage(action.graphShowMovingAvg ?? true);
      if (action.graphMovingAvgPeriod) {
        setMovingAvgPeriod(action.graphMovingAvgPeriod);
      }
    } else if (action.type === 'RNG_GENERATE') {
      const mergedConfig: RngConfig = {
        ...rngConfig,
        ...(action.rngParams || {}),
      };
      setRngConfig(mergedConfig);
      handleGenerateRNG(mergedConfig);
    } else if (action.type === 'LOAD_SAMPLE_DATA' && action.sampleDataset) {
      const fileMap: Record<string, { file: string; name: string }> = {
        tech_stocks: { file: '/datasets/demo_tech_stock_prices.csv', name: 'Tech Stocks (AAPL 2024)' },
        daily_sales: { file: '/datasets/demo_daily_ecommerce_sales.csv', name: 'Daily E-Commerce Sales' },
        sensor_temperature: { file: '/datasets/demo_iot_sensor_telemetry.csv', name: 'IoT Sensor Telemetry' },
      };
      const target = fileMap[action.sampleDataset];
      if (target) {
        fetch(target.file)
          .then((r) => r.text())
          .then((csv) => parseCSV(csv))
          .then((records) => handleDatasetLoaded(records, target.name))
          .catch((e) => console.error(e));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-950/40">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white">
                  OmniGraph &amp; RNG
                </h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Dual Utility
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Interactive Graphing • Instant Parametric RNG • AI Copilot
              </p>
            </div>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-3 text-xs">
            {/* View Layout Switcher */}
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewLayout('split')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  viewLayout === 'split' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Split dashboard view"
              >
                Dual View
              </button>
              <button
                onClick={() => setViewLayout('graph-only')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  viewLayout === 'graph-only' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Maximize Historical Graph"
              >
                Graph Only
              </button>
              <button
                onClick={() => setViewLayout('rng-only')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  viewLayout === 'rng-only' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Maximize Random Number Generator"
              >
                RNG Only
              </button>
            </div>

            {/* Quick Tour & Help */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Instructions &amp; Prompts</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main App Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Top Data Uploader & Demo Loader Section */}
        {viewLayout !== 'rng-only' && (
          <DataUploader
            onLoadDataset={handleDatasetLoaded}
            activeDatasetName={summary?.name || ''}
          />
        )}

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Visualizer Area (Graph and/or RNG) */}
          <div
            className={`space-y-5 ${
              isAiOpen ? 'lg:col-span-8' : 'lg:col-span-12'
            }`}
          >
            {/* Feature 1: Historical Interactive Graph */}
            {(viewLayout === 'split' || viewLayout === 'graph-only') && (
              <section className="h-[520px]">
                {summary && data.length > 0 ? (
                  <InteractiveGraph
                    data={data}
                    summary={summary}
                    selectedColumn={selectedColumn}
                    onSelectColumn={setSelectedColumn}
                    chartType={chartType}
                    onChangeChartType={setChartType}
                    showMovingAverage={showMovingAverage}
                    onToggleMovingAverage={setShowMovingAverage}
                    movingAvgPeriod={movingAvgPeriod}
                    onChangeMovingAvgPeriod={setMovingAvgPeriod}
                    datePreset={datePreset}
                    onSelectDatePreset={setDatePreset}
                    showMinMax={showMinMax}
                    onToggleMinMax={setShowMinMax}
                  />
                ) : (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                    <Activity className="w-8 h-8 animate-pulse text-cyan-400 mb-2" />
                    <p className="text-sm font-medium text-slate-300">Loading dataset...</p>
                  </div>
                )}
              </section>
            )}

            {/* Feature 2: On-Demand Random Number Generator */}
            {(viewLayout === 'split' || viewLayout === 'rng-only') && (
              <section className="min-h-[460px]">
                <RandomNumberGenerator
                  config={rngConfig}
                  onChangeConfig={setRngConfig}
                  result={rngResult}
                  onGenerate={handleGenerateRNG}
                  onPlotNumbersInGraph={handlePlotRngInGraph}
                />
              </section>
            )}
          </div>

          {/* Feature 3: Natural Language AI Assistant Copilot */}
          {isAiOpen && (
            <div className="lg:col-span-4 sticky top-20">
              <AIAssistant
                currentDatasetSummary={summary}
                currentRngConfig={rngConfig}
                onExecuteAction={handleExecuteAIAction}
                isOpen={isAiOpen}
                onToggleOpen={() => setIsAiOpen(false)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Floating button if AI Assistant is minimized */}
      {!isAiOpen && (
        <AIAssistant
          currentDatasetSummary={summary}
          currentRngConfig={rngConfig}
          onExecuteAction={handleExecuteAIAction}
          isOpen={isAiOpen}
          onToggleOpen={() => setIsAiOpen(true)}
        />
      )}

      {/* Help & Instruction Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  OmniGraph &amp; RNG Quick Reference
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-semibold text-white text-sm mb-1 text-cyan-300">
                  1. Interactive Historical Graph
                </h4>
                <p>
                  Upload your CSV/JSON file or click any of the built-in datasets.
                  The visualizer supports standard Plotly features:
                </p>
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-400">
                  <li><strong>Zoom &amp; Pan:</strong> Click and drag a box to zoom into any time range; double click to reset zoom.</li>
                  <li><strong>Hover tooltips:</strong> Inspect exact dates and series values across crosshairs.</li>
                  <li><strong>Export to PNG:</strong> Downloads a high-resolution 1600×900 image ready for presentations.</li>
                  <li><strong>Export to PDF:</strong> Compiles the chart and statistical summary into an executive A4 landscape report.</li>
                  <li><strong>Moving Average &amp; Peak Annotations:</strong> Toggle 7/14/30-day SMA trendlines and peak/low markers from Options.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white text-sm mb-1 text-emerald-400">
                  2. On-Demand Random Number Engine
                </h4>
                <p>
                  Generate sets of random numbers with instant copying and export:
                </p>
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-400">
                  <li><strong>Parametric controls:</strong> Set quantity (1 to 10,000), minimum, maximum, and choose integer or float.</li>
                  <li><strong>Unique Mode:</strong> Prevent duplicates (perfect for lotteries, raffles, and permutations).</li>
                  <li><strong>Distributions:</strong> Switch between Uniform and Gaussian / Normal bell curves.</li>
                  <li><strong>Export CSV:</strong> Instantly downloads indexed CSV format for Excel, Python, or Pandas.</li>
                  <li><strong>Plot in Graph:</strong> Directly transfers the generated batch into the historical chart visualizer!</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white text-sm mb-1 text-purple-400">
                  3. Natural Language AI Copilot
                </h4>
                <p>
                  Type natural language commands in the chat box or use the quick suggestion chips:
                </p>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
                  <p>• <em>"Show me only the last 30 days"</em></p>
                  <p>• <em>"Give me 50 random integers between 10 and 100"</em></p>
                  <p>• <em>"Highlight the maximum peak and show 7-day MA"</em></p>
                  <p>• <em>"Generate 20 floats between 0 and 1 with 3 decimals"</em></p>
                  <p>• <em>"Switch to Bar Chart"</em></p>
                  <p>• <em>"Reset zoom to full history"</em></p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs px-4 py-2 rounded-xl"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
