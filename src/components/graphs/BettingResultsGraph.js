// Betting Results Graph Component - Shows P&L over time
import React, { useState } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function BettingResultsGraph({ results }) {
  const [mode, setMode] = useState('pnl'); // 'pnl' | 'roi'

  if (!results?.length) {
    return (
      <View style={styles.noData}>
        <Text style={styles.noDataText}>No betting data available</Text>
      </View>
    );
  }

  // Sort by created_at
  const sortedResults = [...results].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  // Limit to last 50 bets for cleaner display on mobile
  const recentResults = sortedResults.slice(-50);

  // Create labels (bet numbers)
  const startBetNum = sortedResults.length - recentResults.length + 1;
  const labels = recentResults.map((_, i) => {
    const betNum = startBetNum + i;
    // Show every 10th label to avoid crowding
    return (betNum % 10 === 0 || i === 0 || i === recentResults.length - 1) 
      ? String(betNum) 
      : '';
  });

  // Define datasets based on mode
  let datasets;
  let legend;

  if (mode === 'roi') {
    datasets = [
      {
        data: recentResults.map((r) => r.running_roi_overall ?? 0),
        color: (opacity = 1) => `rgba(255, 88, 240, ${opacity})`, // Pink - ROI
        strokeWidth: 2,
      },
      {
        data: recentResults.map((r) => r.running_roi_overall_stake_points ?? 0),
        color: (opacity = 1) => `rgba(255, 141, 246, ${opacity})`, // Light pink - Weighted ROI
        strokeWidth: 2,
      },
    ];
    legend = ['ROI %', 'Weighted ROI %'];
  } else {
    datasets = [
      {
        data: recentResults.map((r) => r.running_total_all_bets_pnl ?? 0),
        color: (opacity = 1) => `rgba(51, 48, 255, ${opacity})`, // Blue - Total PnL
        strokeWidth: 2,
      },
      {
        data: recentResults.map((r) => r.running_stake_points_total_pnl ?? 0),
        color: (opacity = 1) => `rgba(94, 164, 207, ${opacity})`, // Light blue - Stake Points PnL
        strokeWidth: 2,
      },
    ];
    legend = ['Total PnL (£)', 'Stake Points PnL'];
  }

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 1,
    propsForLabels: {
      fontSize: 9,
    },
    propsForDots: {
      r: '2',
      strokeWidth: '1',
    },
  };

  const data = {
    labels,
    datasets,
    legend,
  };

  return (
    <View style={styles.container}>
      {/* Mode toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'pnl' && styles.toggleActive]}
          onPress={() => setMode('pnl')}
        >
          <Text style={[styles.toggleText, mode === 'pnl' && styles.toggleTextActive]}>
            PnL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'roi' && styles.toggleActive]}
          onPress={() => setMode('roi')}
        >
          <Text style={[styles.toggleText, mode === 'roi' && styles.toggleTextActive]}>
            ROI
          </Text>
        </TouchableOpacity>
      </View>

      <LineChart
        data={data}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        withDots={false}
        withShadow={false}
        fromZero={false}
      />

      {/* Legend */}
      <View style={styles.legendContainer}>
        {legend.map((item, idx) => (
          <View key={idx} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: datasets[idx].color(1) },
              ]}
            />
            <Text style={styles.legendText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noData: {
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  noDataText: {
    color: '#64748b',
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
  },
  toggleActive: {
    backgroundColor: '#2563eb',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#fff',
  },
  chart: {
    borderRadius: 8,
    marginLeft: -8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
});
