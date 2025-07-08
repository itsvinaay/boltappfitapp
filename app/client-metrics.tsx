import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Plus, ChevronDown } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { MetricData, MetricType } from '@/types/metrics';
import { getMetrics } from '@/utils/metricsStorage';

export default function ClientMetricsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [metrics, setMetrics] = useState<MetricData>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const loadedMetrics = await getMetrics();
      setMetrics(loadedMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMetricPress = (metricType: MetricType) => {
    router.push(`/metric-tracking/${metricType}`);
  };

  const handleLogAllMetrics = () => {
    router.push('/log-all-metrics');
  };

  const renderMetricItem = (metricType: MetricType) => {
    const metric = metrics[metricType];
    if (!metric) return null;

    return (
      <TouchableOpacity
        key={metricType}
        style={styles.metricItem}
        onPress={() => handleMetricPress(metricType)}
      >
        <View style={styles.metricLeft}>
          <Text style={styles.metricIcon}>{metric.icon}</Text>
          <View style={styles.metricInfo}>
            <Text style={styles.metricName}>{metric.name}</Text>
            {metric.lastUpdated && (
              <Text style={styles.metricUpdated}>
                updated on {new Date(metric.lastUpdated).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.metricRight}>
          {metric.currentValue && (
            <Text style={styles.metricValue}>
              {metric.currentValue} {metric.unit}
            </Text>
          )}
          <ChevronRight size={20} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading metrics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Metrics</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Plus size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Metrics Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.metricsIcon}>
            <Text style={styles.iconEmoji}>📊</Text>
          </View>
        </View>

        {/* Metrics List */}
        <View style={styles.metricsList}>
          {Object.keys(metrics).map((metricType) => 
            renderMetricItem(metricType as MetricType)
          )}
        </View>

        {/* Log All Metrics Button */}
        <TouchableOpacity style={styles.logAllButton} onPress={handleLogAllMetrics}>
          <Text style={styles.logAllText}>Log all metrics</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Metric Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <ChevronDown size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add data</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {Object.keys(metrics).map((metricType) => {
              const metric = metrics[metricType as MetricType];
              return (
                <TouchableOpacity
                  key={metricType}
                  style={styles.modalMetricItem}
                  onPress={() => {
                    setShowAddModal(false);
                    router.push(`/add-metric/${metricType}`);
                  }}
                >
                  <Text style={styles.modalMetricIcon}>{metric.icon}</Text>
                  <Text style={styles.modalMetricName}>{metric.name}</Text>
                  <ChevronRight size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  metricsIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 32,
  },
  metricsList: {
    paddingHorizontal: 20,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  metricUpdated: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
  },
  logAllButton: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  logAllText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  modalMetricIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  modalMetricName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
});