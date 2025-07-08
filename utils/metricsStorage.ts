import AsyncStorage from '@react-native-async-storage/async-storage';
import { MetricData, Metric, MetricEntry, MetricType } from '../types/metrics';

const STORAGE_KEY = '@client_metrics';

export const getMetrics = async (): Promise<MetricData> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : getDefaultMetrics();
  } catch (error) {
    console.error('Error loading metrics:', error);
    return getDefaultMetrics();
  }
};

export const saveMetrics = async (metrics: MetricData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch (error) {
    console.error('Error saving metrics:', error);
    throw error;
  }
};

export const addMetricEntry = async (
  metricType: MetricType,
  value: number,
  date: string = new Date().toISOString().split('T')[0],
  time: string = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
): Promise<void> => {
  const metrics = await getMetrics();
  const metric = metrics[metricType];
  
  if (!metric) return;

  const newEntry: MetricEntry = {
    id: Date.now().toString(),
    value,
    unit: metric.unit,
    date,
    time,
  };

  metric.entries.unshift(newEntry);
  metric.currentValue = value;
  metric.lastUpdated = date;

  await saveMetrics(metrics);
};

export const getMetric = async (metricType: MetricType): Promise<Metric | null> => {
  const metrics = await getMetrics();
  return metrics[metricType] || null;
};

const getDefaultMetrics = (): MetricData => {
  return {
    weight: {
      id: 'weight',
      name: 'Weight',
      unit: 'kg',
      icon: '⚖️',
      color: '#3B82F6',
      currentValue: 78,
      lastUpdated: '2024-06-05',
      entries: [
        { id: '1', value: 78, unit: 'kg', date: '2024-06-05', time: '10:31 AM' },
        { id: '2', value: 68, unit: 'kg', date: '2024-06-02', time: '9:15 AM' },
        { id: '3', value: 52, unit: 'kg', date: '2024-05-26', time: '8:30 AM' },
        { id: '4', value: 58, unit: 'kg', date: '2024-04-21', time: '7:45 AM' },
      ]
    },
    chest: {
      id: 'chest',
      name: 'Chest',
      unit: 'in',
      icon: '💪',
      color: '#10B981',
      currentValue: 36,
      lastUpdated: '2024-06-03',
      entries: [
        { id: '1', value: 36, unit: 'in', date: '2024-06-03', time: '2:15 PM' },
      ]
    },
    shoulders: {
      id: 'shoulders',
      name: 'Shoulders',
      unit: 'in',
      icon: '🏋️',
      color: '#F59E0B',
      entries: []
    },
    waist: {
      id: 'waist',
      name: 'Waist',
      unit: 'in',
      icon: '📏',
      color: '#EF4444',
      entries: []
    },
    thigh: {
      id: 'thigh',
      name: 'Thigh',
      unit: 'in',
      icon: '🦵',
      color: '#8B5CF6',
      entries: []
    },
    hip: {
      id: 'hip',
      name: 'Hip',
      unit: 'in',
      icon: '📐',
      color: '#EC4899',
      entries: []
    },
    bodyFat: {
      id: 'bodyFat',
      name: 'Body Fat',
      unit: '%',
      icon: '📊',
      color: '#06B6D4',
      entries: []
    },
    bicep: {
      id: 'bicep',
      name: 'Bicep',
      unit: 'in',
      icon: '💪',
      color: '#84CC16',
      entries: []
    },
    waterIntake: {
      id: 'waterIntake',
      name: 'Water intake',
      unit: 'L',
      icon: '💧',
      color: '#0EA5E9',
      entries: []
    },
    steps: {
      id: 'steps',
      name: 'Steps',
      unit: 'steps',
      icon: '👣',
      color: '#F97316',
      entries: []
    }
  };
};