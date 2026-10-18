import React, { useState } from 'react';
import {
  Dice5,
  Copy,
  Check,
  Download,
  Sparkles,
  BarChart3,
  RefreshCw,
  Hash,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { RngConfig, RngResult } from '../types';

interface RandomNumberGeneratorProps {
  config: RngConfig;
  onChangeConfig: (newConfig: RngConfig) => void;
  result: RngResult | null;
  onGenerate: (overrideConfig?: RngConfig) => void;
  onPlotNumbersInGraph?: (numbers: number[], label: string) => void;
}

export const RandomNumberGenerator: React.FC<RandomNumberGeneratorProps> = ({
  config,
  onChangeConfig,
  result,
  onGenerate,
  onPlotNumbersInGraph,
}) => {
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'raw'>('grid');

  const updateConfig = (patch: Partial<RngConfig>) => {
    onChangeConfig({ ...config, ...patch });
  };

  const handleCopy = () => {
    if (!result || result.numbers.length === 0) return;
    const text = result.numbers.join(', ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    if (!result || result.numbers.length === 0) return;
    let csvContent = 'Index,RandomValue\n';
    result.numbers.forEach((val, idx) => {
      csvContent += `${idx + 1},${val}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `random_numbers_${result.numbers.length}_${result.config.type}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Quick preset buttons for common scenarios
  const applyPreset = (presetName: string) => {
    if (presetName === 'd20') {
      const cfg: RngConfig = { ...config, count: 10, min: 1, max: 20, type: 'integer', unique: false };
      onChangeConfig(cfg);
      onGenerate(cfg);
    } else if (presetName === 'lottery') {
      const cfg: RngConfig = { ...config, count: 6, min: 1, max: 49, type: 'integer', unique: true };
      onChangeConfig(cfg);
      onGenerate(cfg);
    } else if (presetName === 'percentage') {
      const cfg: RngConfig = { ...config, count: 50, min: 0, max: 100, type: 'float', decimals: 2, unique: false };
      onChangeConfig(cfg);
      onGenerate(cfg);
    } else if (presetName === 'hundredInts') {
      const cfg: RngConfig = { ...config, count: 100, min: 1, max: 1000, type: 'integer', unique: false };
      onChangeConfig(cfg);
      onGenerate(cfg);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Dice5 className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              On-Demand Random Number Engine
            </h2>
            <p className="text-xs text-slate-400">
              Parametric RNG with instant copy &amp; CSV export
            </p>
          </div>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 hidden sm:inline">Presets:</span>
          <button
            onClick={() => applyPreset('lottery')}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
            title="6 unique numbers between 1 and 49"
          >
            Lottery 6/49
          </button>
          <button
            onClick={() => applyPreset('d20')}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
            title="10 rolls of 20-sided dice"
          >
            10x D20
          </button>
          <button
            onClick={() => applyPreset('hundredInts')}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
            title="100 integers 1-1000"
          >
            100 Ints
          </button>
        </div>
      </div>

      {/* Control Form Bar */}
      <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Quantity */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Quantity (N)
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={config.count}
              onChange={(e) => updateConfig({ count: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Range Min */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Minimum (Min)
            </label>
            <input
              type="number"
              value={config.min}
              onChange={(e) => updateConfig({ min: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Range Max */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Maximum (Max)
            </label>
            <input
              type="number"
              value={config.max}
              onChange={(e) => updateConfig({ max: parseFloat(e.target.value) || 100 })}
              className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Type: Integer vs Float */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Number Format
            </label>
            <select
              value={config.type}
              onChange={(e) => updateConfig({ type: e.target.value as 'integer' | 'float' })}
              className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="integer">Integers</option>
              <option value="float">Floats / Decimals</option>
            </select>
          </div>
        </div>

        {/* Advanced Options Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-4 text-xs">
            {config.type === 'float' && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Decimals:</span>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={config.decimals}
                  onChange={(e) => updateConfig({ decimals: Math.max(1, Math.min(6, parseInt(e.target.value) || 2)) })}
                  className="w-14 bg-slate-900 border border-slate-750 rounded-lg px-2 py-1 text-white font-mono text-center"
                />
              </div>
            )}

            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.unique}
                onChange={(e) => updateConfig({ unique: e.target.checked })}
                className="accent-emerald-500 w-3.5 h-3.5 rounded cursor-pointer"
              />
              <span>Unique (No Duplicates)</span>
            </label>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Distribution' : 'Distribution options'}</span>
            </button>
          </div>

          {/* Big Action Button */}
          <button
            onClick={() => onGenerate()}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-spin-hover" />
            <span>GENERATE INSTANTLY</span>
          </button>
        </div>

        {/* Expanded Distribution Settings */}
        {showAdvanced && (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-2">
            <div>
              <label className="block text-slate-400 mb-1">Distribution Type</label>
              <select
                value={config.distribution}
                onChange={(e) => updateConfig({ distribution: e.target.value as 'uniform' | 'normal' })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
              >
                <option value="uniform">Uniform (Flat chance)</option>
                <option value="normal">Gaussian / Normal (Bell curve)</option>
              </select>
            </div>
            {config.distribution === 'normal' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-1">Mean (μ)</label>
                  <input
                    type="number"
                    value={config.mean}
                    onChange={(e) => updateConfig({ mean: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Std Deviation (σ)</label>
                  <input
                    type="number"
                    min={0.1}
                    value={config.stdDev}
                    onChange={(e) => updateConfig({ stdDev: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Output & Results Container */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[220px]">
        {result ? (
          <div className="space-y-4">
            {/* Quick Metrics & Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">
                  Generated <strong className="text-emerald-400">{result.numbers.length}</strong> values at {result.timestamp}
                </span>

                {/* Display mode buttons */}
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-2 py-0.5 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    Chips
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`px-2 py-0.5 rounded ${viewMode === 'raw' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    Raw Text
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2 py-0.5 rounded ${viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    Indexed Table
                  </button>
                </div>
              </div>

              {/* Action buttons: Copy & CSV */}
              <div className="flex items-center gap-2">
                {onPlotNumbersInGraph && (
                  <button
                    onClick={() => onPlotNumbersInGraph(result.numbers, `RNG_${result.numbers.length}pts`)}
                    className="flex items-center gap-1.5 bg-sky-950/60 hover:bg-sky-900 text-sky-300 border border-sky-800/80 text-xs px-2.5 py-1.5 rounded-xl transition"
                    title="Plot these generated numbers into the historical graph visualizer"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Plot in Graph</span>
                  </button>
                )}

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 transition"
                  title="Copy all numbers to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs px-3 py-1.5 rounded-xl shadow-sm transition"
                  title="Download values as a CSV file"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Save CSV</span>
                </button>
              </div>
            </div>

            {/* Display Body */}
            {viewMode === 'grid' && (
              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
                {result.numbers.map((num, i) => (
                  <div
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-750 font-mono text-xs text-emerald-300 shadow-sm transition"
                  >
                    <span className="text-[10px] text-slate-500 mr-1.5 select-none">#{i + 1}</span>
                    {num}
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'raw' && (
              <div className="relative">
                <textarea
                  readOnly
                  value={result.numbers.join(', ')}
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none selection:bg-emerald-500/30"
                />
              </div>
            )}

            {viewMode === 'table' && (
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-950 sticky top-0 text-slate-400">
                    <tr>
                      <th className="p-2 border-b border-slate-800 font-medium">Index</th>
                      <th className="p-2 border-b border-slate-800 font-medium">Value</th>
                      <th className="p-2 border-b border-slate-800 font-medium">Deviation from Mean</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-mono">
                    {result.numbers.map((num, i) => (
                      <tr key={i} className="hover:bg-slate-850/50">
                        <td className="p-2 text-slate-500">#{i + 1}</td>
                        <td className="p-2 text-emerald-300 font-semibold">{num}</td>
                        <td className="p-2 text-slate-400">
                          {(num - result.stats.mean > 0 ? '+' : '') + (num - result.stats.mean).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Statistical summary strip */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 text-center font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Min</span>
                <span className="text-slate-200 font-semibold">{result.stats.min}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Max</span>
                <span className="text-slate-200 font-semibold">{result.stats.max}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Mean (Avg)</span>
                <span className="text-amber-400 font-semibold">{result.stats.mean}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Median</span>
                <span className="text-slate-200 font-semibold">{result.stats.median}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Std Dev</span>
                <span className="text-slate-200 font-semibold">{result.stats.stdDev}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Total Sum</span>
                <span className="text-slate-200 font-semibold">{result.stats.sum.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
              <Dice5 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">No numbers generated yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Click "GENERATE INSTANTLY", select a preset, or type in the AI chat like "Give me 50 random integers between 10 and 100".
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
