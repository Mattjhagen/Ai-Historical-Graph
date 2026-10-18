import React, { useEffect, useRef, useState, useId } from 'react';
import Plotly from 'plotly.js-dist-min';
import jsPDF from 'jspdf';
import {
  Download,
  FileText,
  RotateCcw,
  TrendingUp,
  Maximize2,
  Calendar,
  Layers,
  BarChart2,
  Activity,
  Sliders,
  Check,
  ChevronDown
} from 'lucide-react';
import { DataPoint, ChartType, DatasetSummary } from '../types';
import { calculateMovingAverage, filterDataByDate } from '../utils/dataProcessor';

interface InteractiveGraphProps {
  data: DataPoint[];
  summary: DatasetSummary;
  selectedColumn: string;
  onSelectColumn: (col: string) => void;
  chartType: ChartType;
  onChangeChartType: (type: ChartType) => void;
  showMovingAverage: boolean;
  onToggleMovingAverage: (show: boolean) => void;
  movingAvgPeriod: number;
  onChangeMovingAvgPeriod: (period: number) => void;
  datePreset: 'all' | 'last7d' | 'last30d' | 'last90d' | 'last1y';
  onSelectDatePreset: (preset: 'all' | 'last7d' | 'last30d' | 'last90d' | 'last1y') => void;
  showMinMax: boolean;
  onToggleMinMax: (show: boolean) => void;
}

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
  data,
  summary,
  selectedColumn,
  onSelectColumn,
  chartType,
  onChangeChartType,
  showMovingAverage,
  onToggleMovingAverage,
  movingAvgPeriod,
  onChangeMovingAvgPeriod,
  datePreset,
  onSelectDatePreset,
  showMinMax,
  onToggleMinMax,
}) => {
  const plotContainerRef = useRef<HTMLDivElement>(null);
  const containerId = useId().replace(/:/g, '-');
  const [isExporting, setIsExporting] = useState(false);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);

  // Filter data according to active preset
  const { filtered, appliedStart, appliedEnd } = filterDataByDate(
    data,
    summary.dateColumn,
    datePreset
  );

  const dates = filtered.map((d) => String(d[summary.dateColumn] ?? ''));
  const values = filtered.map((d) => Number(d[selectedColumn] ?? 0));

  // Calculate moving average if enabled
  const maValues = showMovingAverage
    ? calculateMovingAverage(values, movingAvgPeriod)
    : [];

  // Find min and max points for annotations
  let minIdx = -1;
  let maxIdx = -1;
  if (values.length > 0 && showMinMax) {
    let minV = Infinity;
    let maxV = -Infinity;
    values.forEach((v, idx) => {
      if (v < minV) {
        minV = v;
        minIdx = idx;
      }
      if (v > maxV) {
        maxV = v;
        maxIdx = idx;
      }
    });
  }

  // Draw / Update Plotly
  useEffect(() => {
    if (!plotContainerRef.current || dates.length === 0) return;

    const traces: Plotly.Data[] = [];

    // Main trace
    if (chartType === 'bar') {
      traces.push({
        type: 'bar',
        x: dates,
        y: values,
        name: selectedColumn,
        marker: {
          color: 'rgba(56, 189, 248, 0.85)',
          line: { color: '#0284c7', width: 1 },
        },
        hovertemplate: '<b>%{x}</b><br>' + selectedColumn + ': %{y:,.2f}<extra></extra>',
      });
    } else if (chartType === 'area') {
      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: dates,
        y: values,
        name: selectedColumn,
        fill: 'tozeroy',
        fillcolor: 'rgba(56, 189, 248, 0.15)',
        line: {
          color: '#38bdf8',
          width: 2.5,
          shape: 'spline',
        },
        hovertemplate: '<b>%{x}</b><br>' + selectedColumn + ': %{y:,.2f}<extra></extra>',
      });
    } else {
      // Standard interactive line / scatter
      traces.push({
        type: 'scatter',
        mode: 'lines+markers',
        x: dates,
        y: values,
        name: selectedColumn,
        line: {
          color: '#38bdf8',
          width: 2.5,
          shape: 'spline',
        },
        marker: {
          color: '#0284c7',
          size: dates.length > 60 ? 3 : 6,
          line: { color: '#e0f2fe', width: 1 },
        },
        hovertemplate: '<b>%{x}</b><br>' + selectedColumn + ': %{y:,.2f}<extra></extra>',
      });
    }

    // Moving average trace
    if (showMovingAverage && maValues.length > 0) {
      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: dates,
        y: maValues as number[],
        name: `${movingAvgPeriod}-day SMA`,
        line: {
          color: '#f59e0b',
          width: 2,
          dash: 'dash',
        },
        hovertemplate: `<b>%{x}</b><br>${movingAvgPeriod}-day SMA: %{y:,.2f}<extra></extra>`,
      });
    }

    // Annotations for peak and trough
    const annotations: any[] = [];
    if (showMinMax && maxIdx !== -1 && minIdx !== -1) {
      annotations.push({
        x: dates[maxIdx],
        y: values[maxIdx],
        xref: 'x',
        yref: 'y',
        text: `▲ Peak: ${values[maxIdx].toLocaleString()}`,
        showarrow: true,
        arrowhead: 2,
        arrowcolor: '#10b981',
        ax: 0,
        ay: -35,
        bgcolor: '#064e3b',
        bordercolor: '#10b981',
        borderwidth: 1,
        borderpad: 4,
        font: { color: '#ecfdf5', size: 11, family: 'Plus Jakarta Sans' },
      });

      annotations.push({
        x: dates[minIdx],
        y: values[minIdx],
        xref: 'x',
        yref: 'y',
        text: `▼ Low: ${values[minIdx].toLocaleString()}`,
        showarrow: true,
        arrowhead: 2,
        arrowcolor: '#ef4444',
        ax: 0,
        ay: 35,
        bgcolor: '#7f1d1d',
        bordercolor: '#ef4444',
        borderwidth: 1,
        borderpad: 4,
        font: { color: '#fef2f2', size: 11, family: 'Plus Jakarta Sans' },
      });
    }

    const layout: Partial<Plotly.Layout> = {
      autosize: true,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: {
        family: 'Plus Jakarta Sans, sans-serif',
        color: '#94a3b8',
        size: 12,
      },
      margin: { l: 55, r: 25, t: 25, b: 50 },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#0f172a',
        bordercolor: '#334155',
        font: { family: 'Plus Jakarta Sans, sans-serif', color: '#f8fafc', size: 12 },
      },
      xaxis: {
        gridcolor: 'rgba(51, 65, 85, 0.4)',
        zerolinecolor: 'rgba(51, 65, 85, 0.6)',
        tickfont: { color: '#64748b' },
        showspikes: true,
        spikemode: 'across',
        spikesnap: 'cursor',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: '#38bdf8',
      },
      yaxis: {
        gridcolor: 'rgba(51, 65, 85, 0.4)',
        zerolinecolor: 'rgba(51, 65, 85, 0.6)',
        tickfont: { color: '#64748b' },
        showspikes: true,
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: '#38bdf8',
      },
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.12,
        font: { color: '#cbd5e1' },
      },
      annotations,
    };

    const config: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: `${summary.name}_${selectedColumn}`,
        height: 800,
        width: 1400,
        scale: 2,
      },
    };

    Plotly.react(plotContainerRef.current, traces, layout, config);

    const handleResize = () => {
      if (plotContainerRef.current) {
        Plotly.Plots.resize(plotContainerRef.current);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [
    dates,
    values,
    maValues,
    selectedColumn,
    chartType,
    showMovingAverage,
    movingAvgPeriod,
    showMinMax,
    summary.dateColumn,
  ]);

  // Export as PNG via Plotly
  const handleExportPNG = async () => {
    if (!plotContainerRef.current) return;
    setIsExporting(true);
    try {
      await Plotly.downloadImage(plotContainerRef.current, {
        format: 'png',
        width: 1600,
        height: 900,
        filename: `${summary.name.replace(/\s+/g, '_')}_${selectedColumn}_chart`,
      });
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export as PDF via jsPDF with high-res chart snapshot & summary
  const handleExportPDF = async () => {
    if (!plotContainerRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await Plotly.toImage(plotContainerRef.current, {
        format: 'png',
        width: 1400,
        height: 750,
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Dark header banner
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, 297, 26, 'F');

      pdf.setTextColor(248, 250, 252);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OmniGraph Historical Analysis Report', 14, 12);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Dataset: ${summary.name}  |  Metric: ${selectedColumn}  |  Generated: ${new Date().toLocaleString()}`, 14, 20);

      // Add chart image
      pdf.addImage(dataUrl, 'PNG', 14, 30, 269, 140);

      // Summary statistics footer
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(14, 175, 269, 22, 3, 3, 'F');

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Dataset Summary Statistics:', 18, 182);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);
      const statLine = `Range: ${appliedStart || summary.dateRange.min} → ${appliedEnd || summary.dateRange.max}   |   Points: ${filtered.length}   |   Min: ${summary.stats.min.toLocaleString()}   |   Max: ${summary.stats.max.toLocaleString()}   |   Mean: ${summary.stats.mean.toLocaleString()}   |   Latest: ${summary.stats.latest.toLocaleString()}`;
      pdf.text(statLine, 18, 190);

      pdf.save(`${summary.name.replace(/\s+/g, '_')}_${selectedColumn}_report.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetZoom = () => {
    if (plotContainerRef.current) {
      Plotly.relayout(plotContainerRef.current, {
        'xaxis.autorange': true,
        'yaxis.autorange': true,
      } as any);
    }
    onSelectDatePreset('all');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden flex flex-col h-full">
      {/* Chart Top Header & Controls */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Metric Column Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Activity className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Metric</div>
              <select
                value={selectedColumn}
                onChange={(e) => onSelectColumn(e.target.value)}
                className="bg-slate-800 hover:bg-slate-750 text-white font-semibold text-sm rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {summary.numericColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="hidden sm:flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => onSelectDatePreset('last7d')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                datePreset === 'last7d'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => onSelectDatePreset('last30d')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                datePreset === 'last30d'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30D
            </button>
            <button
              onClick={() => onSelectDatePreset('last90d')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                datePreset === 'last90d'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              90D
            </button>
            <button
              onClick={() => onSelectDatePreset('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                datePreset === 'all'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Right: Actions, Chart Style & Export Buttons */}
        <div className="flex items-center gap-2">
          {/* Chart Style Switcher */}
          <div className="flex bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              title="Line Chart"
              onClick={() => onChangeChartType('scatter')}
              className={`p-1.5 rounded-lg transition ${
                chartType === 'scatter' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              title="Area Chart"
              onClick={() => onChangeChartType('area')}
              className={`p-1.5 rounded-lg transition ${
                chartType === 'area' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              title="Bar Chart"
              onClick={() => onChangeChartType('bar')}
              className={`p-1.5 rounded-lg transition ${
                chartType === 'bar' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>

          {/* Options Dropdown (SMA, Min/Max Peak) */}
          <div className="relative">
            <button
              onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 transition"
              title="Analysis Options"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Options</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showOptionsDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-3 z-30 space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Analysis Overlays
                </div>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Moving Average (SMA)</span>
                  <input
                    type="checkbox"
                    checked={showMovingAverage}
                    onChange={(e) => onToggleMovingAverage(e.target.checked)}
                    className="accent-sky-500 w-4 h-4 rounded cursor-pointer"
                  />
                </label>

                {showMovingAverage && (
                  <div className="flex items-center justify-between text-xs text-slate-400 pl-2">
                    <span>SMA Window:</span>
                    <select
                      value={movingAvgPeriod}
                      onChange={(e) => onChangeMovingAvgPeriod(Number(e.target.value))}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200"
                    >
                      <option value={7}>7 periods</option>
                      <option value={14}>14 periods</option>
                      <option value={20}>20 periods</option>
                      <option value={30}>30 periods</option>
                      <option value={50}>50 periods</option>
                    </select>
                  </div>
                )}

                <div className="h-px bg-slate-800" />

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Highlight Peak & Low</span>
                  <input
                    type="checkbox"
                    checked={showMinMax}
                    onChange={(e) => onToggleMinMax(e.target.checked)}
                    className="accent-sky-500 w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Reset Zoom Button */}
          <button
            onClick={handleResetZoom}
            title="Reset Zoom & Pan"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl border border-slate-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* PNG Export */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 active:scale-95 text-xs font-medium text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 transition"
            title="Export chart as high-resolution PNG"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>PNG</span>
          </button>

          {/* PDF Export */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-xs font-medium text-white px-3 py-1.5 rounded-xl shadow-sm transition"
            title="Export formatted report as PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Plot Container */}
      <div className="relative flex-1 min-h-[360px] p-2">
        <div id={containerId} ref={plotContainerRef} className="w-full h-full min-h-[350px]" />
      </div>

      {/* Bottom status & metric bar */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Displaying: <strong className="text-slate-200">{filtered.length}</strong> points
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline">
            Range: <strong className="text-slate-200">{appliedStart || summary.dateRange.min}</strong> to{' '}
            <strong className="text-slate-200">{appliedEnd || summary.dateRange.max}</strong>
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px]">
          <div>
            Min: <span className="text-emerald-400">{summary.stats.min.toLocaleString()}</span>
          </div>
          <div>
            Max: <span className="text-rose-400">{summary.stats.max.toLocaleString()}</span>
          </div>
          <div>
            Mean: <span className="text-amber-400">{summary.stats.mean.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
