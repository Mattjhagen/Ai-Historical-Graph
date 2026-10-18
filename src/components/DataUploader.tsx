import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Check,
  TrendingUp,
  ShoppingBag,
  Cpu,
  Download,
  AlertCircle
} from 'lucide-react';
import { DataPoint } from '../types';
import { parseCSV, analyzeData } from '../utils/dataProcessor';

interface DataUploaderProps {
  onLoadDataset: (data: DataPoint[], name: string) => void;
  activeDatasetName: string;
}

const DEMO_DATASETS = [
  {
    id: 'tech_stocks',
    name: 'Tech Stock Prices (AAPL 2024)',
    file: '/datasets/demo_tech_stock_prices.csv',
    icon: TrendingUp,
    description: 'Daily Close, Volume, Open, High, Low with rally & corrections',
  },
  {
    id: 'daily_sales',
    name: 'Daily E-Commerce Sales',
    file: '/datasets/demo_daily_ecommerce_sales.csv',
    icon: ShoppingBag,
    description: 'Revenue, orders, customer retention and avg basket size',
  },
  {
    id: 'sensor_telemetry',
    name: 'IoT Sensor Telemetry',
    file: '/datasets/demo_iot_sensor_telemetry.csv',
    icon: Cpu,
    description: 'High-frequency Temperature, humidity, pressure, and battery life',
  },
];

export const DataUploader: React.FC<DataUploaderProps> = ({
  onLoadDataset,
  activeDatasetName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const text = await file.text();
      let records: DataPoint[] = [];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        records = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        records = await parseCSV(text);
      }

      if (!records || records.length === 0) {
        throw new Error('File does not contain any valid data rows.');
      }

      onLoadDataset(records, file.name.replace(/\.[^/.]+$/, ''));
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg(err.message || 'Failed to parse file. Please upload a valid CSV or JSON file.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemo = async (demo: typeof DEMO_DATASETS[0]) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(demo.file);
      if (!res.ok) throw new Error(`Failed to load ${demo.name}`);
      const text = await res.text();
      const records = await parseCSV(text);
      onLoadDataset(records, demo.name);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading demo dataset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Drag and drop or Browse Upload */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileProcess(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 flex items-center justify-center gap-3 p-3.5 border-2 border-dashed rounded-xl cursor-pointer transition ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-750 hover:border-slate-600 bg-slate-950/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">
              Upload your historical data file
            </div>
            <div className="text-[11px] text-slate-400">
              Drag &amp; drop or click to browse CSV or JSON
            </div>
          </div>
        </div>

        {/* Right: Quick Demo Dataset Pickers */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Or test with built-in datasets:</span>
            {isLoading && <span className="text-cyan-400 animate-pulse text-[10px]">Loading...</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DEMO_DATASETS.map((demo) => {
              const Icon = demo.icon;
              const isActive = activeDatasetName === demo.name;
              return (
                <button
                  key={demo.id}
                  onClick={() => loadDemo(demo)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left border text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200 ring-1 ring-cyan-500/40'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                  title={demo.description}
                >
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="truncate font-medium">{demo.name.split(' ')[0]}</span>
                  {isActive && <Check className="w-3 h-3 text-cyan-400 ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
