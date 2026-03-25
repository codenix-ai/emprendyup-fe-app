'use client';

import React from 'react';
import dynamic from 'next/dynamic';

interface BarChartProps {
  data: Array<{ [key: string]: any }>;
  xKey: string;
  yKey: string;
  title?: string;
  color?: string;
  height?: number;
  containerClassName?: string;
}

// Dynamically import recharts to avoid SSR issues
const BarChartComponent = dynamic(() => import('./charts/BarChartInternal'), {
  ssr: false,
  loading: () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="animate-pulse h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </div>
  ),
});

export default function BarChart(props: BarChartProps) {
  return <BarChartComponent {...props} />;
}
