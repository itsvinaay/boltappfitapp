import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export interface MetricDataPoint {
  date: string;
  value: number;
}

interface MetricChartProps {
  data: MetricDataPoint[];
  unit: string;
  colors: any;
  chartWidth?: number;
  chartHeight?: number;
  showYAxis?: boolean;
  showXAxis?: boolean;
  showTrend?: boolean;
  onPointPress?: (point: MetricDataPoint, index: number) => void;
  lineColor?: string;
  pointColor?: string;
  fillArea?: boolean;
  animated?: boolean;
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  date: string;
  index: number;
}

// Chart Line Component
const ChartLine: React.FC<{ points: ChartPoint[]; colors: any; lineColor?: string }> = ({ 
  points, 
  colors, 
  lineColor 
}) => {
  if (points.length < 2) return null;
  
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {points.map((point, index) => {
        if (index === 0) return null;
        const prevPoint = points[index - 1];
        
        const dx = point.x - prevPoint.x;
        const dy = point.y - prevPoint.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        return (
          <View
            key={`line-${index}`}
            style={[
              {
                position: 'absolute',
                left: prevPoint.x,
                top: prevPoint.y,
                width: length,
                height: 2,
                backgroundColor: lineColor || colors.primary,
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: 'left center',
              }
            ]}
          />
        );
      })}
    </View>
  );
};

// Fill Area Component
const ChartFillArea: React.FC<{ points: ChartPoint[]; colors: any; chartHeight: number }> = ({ 
  points, 
  colors, 
  chartHeight 
}) => {
  if (points.length < 2) return null;

  // Create SVG-like path for fill area
  const pathPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* This would need react-native-svg for proper implementation */}
      {/* For now, we'll use a simple gradient overlay */}
      <View
        style={{
          position: 'absolute',
          left: firstPoint.x,
          top: firstPoint.y,
          width: lastPoint.x - firstPoint.x,
          height: chartHeight - firstPoint.y,
          backgroundColor: `${colors.primary}20`,
          opacity: 0.3,
        }}
      />
    </View>
  );
};

export const MetricChart: React.FC<MetricChartProps> = ({
  data,
  unit,
  colors,
  chartWidth = width - 120,
  chartHeight = 120,
  showYAxis = true,
  showXAxis = true,
  showTrend = true,
  onPointPress,
  lineColor,
  pointColor,
  fillArea = false,
  animated = false,
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyChart, { height: chartHeight }]}>
        <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
          No data available
        </Text>
      </View>
    );
  }

  // Calculate chart dimensions
  const chartPadding = 20;
  const availableWidth = chartWidth - (showYAxis ? 40 : 0) - chartPadding;
  const availableHeight = chartHeight - (showXAxis ? 30 : 0) - chartPadding;

  // Calculate min/max values
  const values = data.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  // Generate chart points
  const chartPoints: ChartPoint[] = data.map((point, index) => {
    const x = chartPadding + (index / Math.max(data.length - 1, 1)) * availableWidth;
    const normalizedValue = (point.value - minValue) / range;
    const y = chartPadding + (1 - normalizedValue) * availableHeight;
    
    return {
      x,
      y,
      value: point.value,
      date: point.date,
      index
    };
  });

  // Calculate Y-axis labels
  const getYAxisLabels = (): string[] => {
    if (data.length === 0) return ['0', '50', '100'];
    
    return [
      maxValue.toFixed(1),
      ((minValue + maxValue) / 2).toFixed(1),
      minValue.toFixed(1)
    ];
  };

  // Calculate trend
  const getTrend = () => {
    if (data.length < 2) return { direction: 'neutral', percentage: 0 };
    
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = lastValue - firstValue;
    const percentage = Math.abs((change / firstValue) * 100);
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: percentage.toFixed(1)
    };
  };

  const trend = getTrend();

  return (
    <View style={styles.container}>
      {/* Trend Indicator */}
      {showTrend && (
        <View style={styles.trendContainer}>
          <View style={[styles.trendIndicator, { backgroundColor: `${colors.primary}15` }]}>
            {trend.direction === 'up' && <TrendingUp size={16} color={colors.success} />}
            {trend.direction === 'down' && <TrendingDown size={16} color={colors.error} />}
            {trend.direction === 'neutral' && <Minus size={16} color={colors.textSecondary} />}
            <Text style={[
              styles.trendText,
              { 
                color: trend.direction === 'up' ? colors.success : 
                       trend.direction === 'down' ? colors.error : 
                       colors.textSecondary 
              }
            ]}>
              {trend.percentage}%
            </Text>
          </View>
        </View>
      )}

      {/* Chart Container */}
      <View style={[styles.chartContainer, { height: chartHeight }]}>
        <View style={styles.chartWrapper}>
          {/* Y-Axis Labels */}
          {showYAxis && (
            <View style={[styles.yAxisLabels, { height: availableHeight + chartPadding }]}>
              {getYAxisLabels().map((label, index) => (
                <Text key={index} style={[styles.yAxisLabel, { color: colors.textTertiary }]}>
                  {label}
                </Text>
              ))}
            </View>
          )}

          {/* Chart Area */}
          <View
            style={[
              styles.chartArea,
              {
                width: chartWidth - (showYAxis ? 40 : 0),
                height: availableHeight + chartPadding,
              }
            ]}
          >
            {/* Fill Area */}
            {fillArea && (
              <ChartFillArea 
                points={chartPoints} 
                colors={colors} 
                chartHeight={availableHeight + chartPadding}
              />
            )}

            {/* Chart Line */}
            <ChartLine 
              points={chartPoints} 
              colors={colors} 
              lineColor={lineColor}
            />
            
            {/* Chart Points */}
            {chartPoints.map((point, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.chartPoint,
                  {
                    left: point.x - 4,
                    top: point.y - 4,
                    backgroundColor: pointColor || colors.primary,
                    borderColor: colors.surface,
                  }
                ]}
                onPress={() => onPointPress?.(data[index], index)}
                activeOpacity={0.7}
              />
            ))}
          </View>
        </View>

        {/* X-Axis Labels */}
        {showXAxis && (
          <View style={[styles.chartLabels, { width: chartWidth - (showYAxis ? 40 : 0) }]}>
            {chartPoints.map((point, index) => {
              // Show every nth label to avoid crowding
              if (index % Math.ceil(chartPoints.length / 4) !== 0) return null;
              
              const date = new Date(point.date);
              const label = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
              
              return (
                <Text
                  key={index}
                  style={[
                    styles.chartLabel,
                    { 
                      left: point.x - 25,
                      color: colors.textTertiary 
                    },
                  ]}
                >
                  {label}
                </Text>
              );
            })}
          </View>
        )}
      </View>

      {/* Chart Summary */}
      <View style={styles.chartSummary}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Current</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {data[data.length - 1]?.value.toFixed(1)} {unit}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Average</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {(values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1)} {unit}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Range</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {minValue.toFixed(1)} - {maxValue.toFixed(1)} {unit}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  trendContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  chartContainer: {
    marginBottom: 12,
  },
  chartWrapper: {
    flexDirection: 'row',
    flex: 1,
  },
  yAxisLabels: {
    width: 40,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  yAxisLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textAlign: 'right',
  },
  chartArea: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  chartPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  chartLabels: {
    height: 30,
    position: 'relative',
    marginLeft: 40,
  },
  chartLabel: {
    position: 'absolute',
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    width: 50,
  },
  emptyChart: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
});

export default MetricChart;