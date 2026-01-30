import React, { useState, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps
} from 'recharts';
import { Calendar, ChevronDown, BarChart2 } from 'lucide-react';

export interface ChartDataPoint {
    timestamp: number; // micros or any timestamp
    value: number;
    label?: string; // Optional custom label
}

interface StatsChartProps {
    data: ChartDataPoint[];
    dataLabel: string; // e.g., "Earnings" or "Orders"
    color?: string; // Hex color for bars
}

type GroupBy = 'DAY' | 'MONTH';

const StatsChart: React.FC<StatsChartProps> = ({ data, dataLabel, color = '#10B981' }) => {
    const [groupBy, setGroupBy] = useState<GroupBy>('DAY');

    // Memos for aggregation
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const groupedMap = new Map<string, number>();

        // Sort by time first
        const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

        sortedData.forEach(item => {
            const date = new Date(item.timestamp / 1000); // assume micros input
            let key = '';

            if (groupBy === 'DAY') {
                // Key: YYYY-MM-DD
                key = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            } else {
                // Key: YYYY-MM
                key = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
            }

            const current = groupedMap.get(key) || 0;
            groupedMap.set(key, current + item.value);
        });

        // Convert Map to Array
        return Array.from(groupedMap.entries()).map(([name, value]) => ({
            name,
            value
        }));
    }, [data, groupBy]);

    return (
        <div className="bg-white border-2 border-deep-black shadow-hard p-6 animate-fade-in">
            {/* Header / Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="font-display text-xl font-bold flex items-center gap-2 uppercase">
                    <BarChart2 className="w-5 h-5" /> {dataLabel} Overview
                </h3>

                {/* Toggle */}
                <div className="flex bg-gray-100 p-1 border-2 border-deep-black rounded-lg">
                    <button
                        onClick={() => setGroupBy('DAY')}
                        className={`px-4 py-1.5 font-mono text-xs font-bold uppercase transition-all rounded ${groupBy === 'DAY'
                            ? 'bg-deep-black text-white shadow-sm'
                            : 'text-gray-500 hover:text-deep-black'
                            }`}
                    >
                        Daily
                    </button>
                    <button
                        onClick={() => setGroupBy('MONTH')}
                        className={`px-4 py-1.5 font-mono text-xs font-bold uppercase transition-all rounded ${groupBy === 'MONTH'
                            ? 'bg-deep-black text-white shadow-sm'
                            : 'text-gray-500 hover:text-deep-black'
                            }`}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            {/* Chart Area */}
            <div className="h-[300px] w-full min-w-0">
                {chartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 bg-gray-50 rounded-lg">
                        <BarChart2 className="w-8 h-8 mb-2 opacity-50" />
                        <span className="font-mono text-xs">No data available for this period</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#6B7280' }}
                                dy={10}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#6B7280' }}
                            />
                            <Tooltip content={<CustomTooltip labelText={dataLabel} />} cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
                            <Bar
                                dataKey="value"
                                fill={color}
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                                activeBar={{ stroke: '#000', strokeWidth: 2 }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label, labelText }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-deep-black text-white p-3 border-2 border-white shadow-xl rounded-lg">
                <p className="font-mono text-xs font-bold mb-1 opacity-70">{label}</p>
                <p className="font-display text-lg">
                    {payload[0].value.toFixed(2)} <span className="text-xs font-mono font-normal opacity-70">LIN</span>
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 mt-1">
                    {labelText}
                </p>
            </div>
        );
    }
    return null;
};

export default StatsChart;
