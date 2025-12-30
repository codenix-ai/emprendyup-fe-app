'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts';

interface BarChartInternalProps {
  data: Array<{ [key: string]: any }>;
  xKey: string;
  yKey: string;
  title?: string;
  color?: string;
  height?: number;
}

export default function BarChartInternal({
  data,
  xKey,
  yKey,
  title,
  color = '#3b82f6',
  height = 300,
}: BarChartInternalProps) {
  // Validate data before rendering
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        )}
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No hay datos disponibles
        </div>
      </div>
    );
  }
  // Mostrar solo los últimos N periodos (6 por defecto)
  const LAST_N = 6;
  const displayedData = data.slice(Math.max(0, data.length - LAST_N));

  // Compute max value to add padding to Y domain (based on displayed data)
  const maxValue = Math.max(...displayedData.map((d: any) => Number(d[yKey] || 0)));
  const yDomainMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 10;

  // Check if all values are zero
  const allZero = displayedData.every((d: any) => Number(d[yKey] || 0) === 0);

  console.log('Chart metrics:', {
    totalPeriods: data.length,
    displayedPeriods: displayedData.length,
    maxValue,
    yDomainMax,
    allZero,
    sampleData: displayedData.slice(0, 3),
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}

      {/* Responsive fallback bar view (horizontally scrollable on small screens) */}
      <div style={{ height }} className="w-full">
        <div className="w-full h-full flex flex-col">
          <div
            className="flex items-end gap-3 overflow-x-auto"
            style={{
              alignItems: 'flex-end',
              height: '100%',
              paddingBottom: 28,
              paddingLeft: 8,
              paddingRight: 8,
            }}
          >
            {(() => {
              const items = displayedData || [];
              const barAreaHeight = Math.max(140, (height as number) - 80);
              return items.map((d: any, i: number) => {
                const val = Number(d[yKey] || 0);
                const px =
                  maxValue > 0 ? Math.max(10, Math.round((val / maxValue) * barAreaHeight)) : 10;
                return (
                  <div
                    key={i}
                    style={{ flex: '0 0 64px', minWidth: 64, padding: '0 6px' }}
                    className="flex flex-col items-center"
                  >
                    <div
                      style={{
                        height: barAreaHeight,
                        display: 'flex',
                        alignItems: 'flex-end',
                        width: '100%',
                      }}
                    >
                      <div
                        title={`${d[xKey]}: ${val}`}
                        style={{
                          height: `${px}px`,
                          width: '100%',
                          minHeight: px,
                          backgroundColor: color,
                          borderTopLeftRadius: '8px',
                          borderTopRightRadius: '8px',
                        }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-300 text-center truncate w-full">
                      {d[xKey]}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Debug info */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>Total periodos: {data.length}</span>
        <span>Valor máximo: {maxValue}</span>
        {allZero && (
          <span className="text-amber-600 dark:text-amber-400">⚠️ Todos los valores son 0</span>
        )}
      </div>
    </div>
  );
}
