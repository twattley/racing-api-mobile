// Betting Results Screen - Summary of betting performance
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useBettingResultsAnalysis } from '../api';
import BettingResultsGraph from '../components/graphs/BettingResultsGraph';

export default function BettingResultsScreen({ navigation }) {
  const {
    data,
    error,
    isLoading,
    refetch,
    isRefetching,
  } = useBettingResultsAnalysis();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading results</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No betting results available</Text>
      </View>
    );
  }

  // Get the latest datapoint for summary
  const results = Array.isArray(data.results) ? data.results : [];
  const sortedResults = [...results].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  const latest = sortedResults.length ? sortedResults[sortedResults.length - 1] : null;

  const formatCurrency = (val) => {
    if (val == null) return '–';
    return `£${val.toFixed(2)}`;
  };

  const formatPercent = (val) => {
    if (val == null) return '–';
    return `${val.toFixed(2)}%`;
  };

  const formatPoints = (val) => {
    if (val == null) return '–';
    return `${val.toFixed(2)} pts`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <Text style={styles.title}>Betting Performance</Text>

      {/* Performance Graph */}
      <BettingResultsGraph results={results} />

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Number of Bets</Text>
          <Text style={styles.summaryValue}>{data.number_of_bets ?? 0}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total PnL</Text>
          <Text style={[
            styles.summaryValue,
            latest?.running_total_all_bets_pnl > 0 ? styles.positive : styles.negative
          ]}>
            {formatCurrency(latest?.running_total_all_bets_pnl)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Stake Points PnL</Text>
          <Text style={[
            styles.summaryValue,
            latest?.running_stake_points_total_pnl > 0 ? styles.positive : styles.negative
          ]}>
            {formatPoints(latest?.running_stake_points_total_pnl)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>ROI (Overall)</Text>
          <Text style={[
            styles.summaryValue,
            latest?.running_roi_overall > 0 ? styles.positive : styles.negative
          ]}>
            {formatPercent(latest?.running_roi_overall)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>ROI (Stake Points)</Text>
          <Text style={[
            styles.summaryValue,
            latest?.running_roi_overall_stake_points > 0 ? styles.positive : styles.negative
          ]}>
            {formatPercent(latest?.running_roi_overall_stake_points)}
          </Text>
        </View>
      </View>

      {/* Recent bets */}
      <Text style={styles.sectionTitle}>Recent Bets</Text>
      {sortedResults.slice(-10).reverse().map((bet, idx) => (
        <View key={idx} style={styles.betCard}>
          <View style={styles.betHeader}>
            <Text style={styles.betHorse} numberOfLines={1}>
              {bet.horse_name || 'Unknown'}
            </Text>
            <View style={[
              styles.outcomeBadge,
              bet.outcome === 'WON' ? styles.won :
                bet.outcome === 'LOST' ? styles.lost : styles.pending
            ]}>
              <Text style={styles.outcomeBadgeText}>{bet.outcome || '-'}</Text>
            </View>
          </View>
          <View style={styles.betDetails}>
            <Text style={styles.betDetail}>
              {new Date(bet.created_at).toLocaleDateString()} •
              {bet.selection_type} @ {bet.price_matched?.toFixed(2) || '-'}
            </Text>
            <Text style={[
              styles.betPnl,
              bet.pnl > 0 ? styles.positive : bet.pnl < 0 ? styles.negative : null
            ]}>
              {formatCurrency(bet.pnl)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorDetail: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    padding: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    margin: '1%',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  positive: {
    color: '#16a34a',
  },
  negative: {
    color: '#dc2626',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  betCard: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  betHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  betHorse: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  won: {
    backgroundColor: '#dcfce7',
  },
  lost: {
    backgroundColor: '#fee2e2',
  },
  pending: {
    backgroundColor: '#f1f5f9',
  },
  outcomeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e293b',
  },
  betDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betDetail: {
    fontSize: 12,
    color: '#64748b',
  },
  betPnl: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
});
