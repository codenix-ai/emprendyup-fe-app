'use client';

import React, { useRef, useEffect, useState } from 'react';

interface LineChartProps {
  data: Array<{ [key: string]: any }>;
  xKey: string;
  yKey: string;
  title?: string;
  color?: string;
  height?: number;
  theme?: 'light' | 'dark';
  containerClassName?: string;
}

export default function LineChart({
  data,
  xKey,
  yKey,
  title,
  color = '#22c55e',
  height = 300,
  theme = 'light',
  containerClassName,
}: LineChartProps) {
  const defaultContainerClass =
    'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6';
  const wrapClass = containerClassName ?? defaultContainerClass;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    value: any;
    label: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Chart margins
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = rect.width - margin.left - margin.right;
    const chartHeight = rect.height - margin.top - margin.bottom;

    // Get data values
    const values = data.map((d) => Number(d[yKey]) || 0);
    const labels = data.map((d) => String(d[xKey]));

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Helper functions
    const getX = (index: number) =>
      margin.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const getY = (value: number) =>
      margin.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

    // Theme-based colors
    const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
    const axisColor = theme === 'dark' ? 'rgba(240,238,233,0.3)' : '#6b7280';
    const labelColor = theme === 'dark' ? 'rgba(240,238,233,0.4)' : '#6b7280';
    const pointBorder = theme === 'dark' ? '#13151F' : '#ffffff';

    // Draw grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i < data.length; i++) {
      const x = getX(i);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = getX(i);
      const y = getY(values[i]);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw data points
    ctx.fillStyle = color;
    for (let i = 0; i < data.length; i++) {
      const x = getX(i);
      const y = getY(values[i]);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();

      // White border around points
      ctx.strokeStyle = pointBorder;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
    }

    // Draw axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = labelColor;
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';

    // X-axis labels
    for (let i = 0; i < data.length; i++) {
      const x = getX(i);
      const label = labels[i];
      // Format date if it looks like a date
      const displayLabel = label.includes('-')
        ? new Date(label).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
        : label;
      ctx.fillText(displayLabel, x, margin.top + chartHeight + 20);
    }

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (i / 5) * valueRange;
      const y = margin.top + chartHeight - (i / 5) * chartHeight;
      ctx.fillText(value.toFixed(0), margin.left - 10, y + 4);
    }
  }, [mounted, data, xKey, yKey, color, height, theme]);

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = rect.width - margin.left - margin.right;

    // Find closest data point
    const relativeX = x - margin.left;
    const index = Math.round((relativeX / chartWidth) * (data.length - 1));

    if (index >= 0 && index < data.length) {
      const dataPoint = data[index];
      const value = dataPoint[yKey];
      const label = dataPoint[xKey];

      setTooltipData({
        x: event.clientX,
        y: event.clientY,
        value,
        label,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltipData(null);
  };

  if (!mounted) {
    return (
      <div className={wrapClass}>
        <div className="animate-pulse h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={wrapClass}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        )}
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className={`${wrapClass} relative`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={height}
          className="w-full cursor-crosshair"
          style={{ height: `${height}px` }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {tooltipData && (
          <div
            className="absolute bg-black text-white text-xs rounded px-2 py-1 pointer-events-none z-10"
            style={{
              left: tooltipData.x - 50,
              top: tooltipData.y - 40,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-medium">{tooltipData.label}</div>
            <div>
              {typeof tooltipData.value === 'number'
                ? tooltipData.value.toLocaleString()
                : tooltipData.value}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
