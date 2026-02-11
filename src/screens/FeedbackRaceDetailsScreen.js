// Feedback Race Details Screen - Review historical race with results
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRaceFormFull, useRaceResult, usePostBettingSelection } from '../api';
import HorseCard from '../components/HorseCard';
import TodaysRaceDetails from '../components/TodaysRaceDetails';
import { useProcessRaceData } from '../hooks/useProcessRaceData';

export default function FeedbackRaceDetailsScreen({ route, navigation }) {
  const { raceId, raceTitle } = route.params;
  const [visibleHorses, setVisibleHorses] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [isMarketView, setIsMarketView] = useState(false);

  const {
    data: fullData,
    error,
    isLoading,
    refetch,
    isRefetching,
  } = useRaceFormFull('feedback', raceId);

  const {
    data: resultData,
    isLoading: resultLoading,
  } = useRaceResult('feedback', raceId);

  // Mutation for posting betting selections
  const postSelection = usePostBettingSelection('betting', {
    onSuccess: () => {
      Alert.alert('Selection Saved', 'Your betting selection has been recorded.');
    },
    onError: (err) => {
      Alert.alert('Error', err.message || 'Failed to save selection');
    },
  });

  // Process the race data using shared hook
  const raceData = useProcessRaceData(fullData);

  // Merge result data with horse data
  const sortedHorses = useMemo(() => {
    if (!raceData?.horse_data) return [];

    const resultMap = new Map();
    if (resultData?.horse_performance_data) {
      for (const r of resultData.horse_performance_data) {
        if (r.horse_id) resultMap.set(r.horse_id, r);
      }
    }

    return [...raceData.horse_data]
      .map((horse) => {
        const result = resultMap.get(horse.horse_id);
        return {
          ...horse,
          result_position: result?.finishing_position,
          result_sp: result?.betfair_win_sp,
          result_distance_beaten: result?.total_distance_beaten,
          result_tf_comment: result?.tf_comment,
          result_rp_comment: result?.rp_comment,
        };
      })
      .sort((a, b) => {
        if (showResults && a.result_position && b.result_position) {
          const posA = parseInt(a.result_position) || 999;
          const posB = parseInt(b.result_position) || 999;
          return posA - posB;
        }
        const priceA = a.todays_betfair_win_sp ?? Infinity;
        const priceB = b.todays_betfair_win_sp ?? Infinity;
        return priceA - priceB;
      });
  }, [raceData, resultData, showResults]);

  // Initialize visibility
  const resetVisibility = useCallback(() => {
    if (!sortedHorses.length) return;
    const initialVisibility = sortedHorses.reduce((acc, horse) => {
      acc[horse.horse_id] = true; // Show all for feedback
      return acc;
    }, {});
    setVisibleHorses(initialVisibility);
  }, [sortedHorses]);

  useEffect(() => {
    resetVisibility();
  }, [resetVisibility]);

  // Navigate to graphs screen
  const navigateToGraphs = useCallback(() => {
    navigation.navigate('FeedbackRaceGraphs', {
      raceData,
      visibleHorses,
    });
  }, [navigation, raceData, visibleHorses]);

  useEffect(() => {
    if (raceData?.race_time) {
      const time = new Date(raceData.race_time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      navigation.setOptions({
        title: `${time} - ${raceData.course || ''}`,
        headerRight: () => (
          <TouchableOpacity
            onPress={navigateToGraphs}
            style={{ marginRight: 12, padding: 4 }}
          >
            <Ionicons name="stats-chart" size={24} color="#16a34a" />
          </TouchableOpacity>
        ),
      });
    }
  }, [raceData, navigation, navigateToGraphs]);

  const toggleHorseVisibility = (horseId) => {
    setVisibleHorses((prev) => ({
      ...prev,
      [horseId]: !prev[horseId],
    }));
  };

  // Handle betting selection from price click
  const handlePriceClick = useCallback(({ horse, market, backLay, price, points }) => {
    if (!raceData) return;

    // Build market_state from all horses in the race
    const marketState = sortedHorses
      .filter((h) => h.horse_id)
      .map((h) => ({
        horse_id: h.horse_id,
        betfair_win_sp: h.todays_betfair_win_sp ?? h.result_sp ?? null,
        selection_id: h.todays_selection_id ?? null,
      }));

    const payload = {
      horse_id: horse.horse_id,
      horse_name: horse.horse_name,
      selection_id: horse.todays_selection_id ?? null,
      market_id_win: horse.todays_market_id_win ?? 'feedback',
      market_id_place: horse.todays_market_id_place ?? 'feedback',
      race_id: raceData.race_id,
      race_date: typeof raceData.race_date === 'string' 
        ? raceData.race_date.split('T')[0] 
        : raceData.race_date,
      race_time: raceData.race_time,
      number_of_runners: sortedHorses.length,
      stake_points: points,
      bet_type: { back_lay: backLay, market: market },
      market_state: marketState,
      clicked: {
        type: market,
        price: price,
      },
      ts: new Date().toISOString(),
    };

    postSelection.mutate(payload);
  }, [raceData, sortedHorses, postSelection]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading race data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading race</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header controls */}
      <View style={styles.header}>
        {!showResults && (
          <TouchableOpacity
            style={[styles.toggleButton, isMarketView && styles.toggleActiveMarket, { marginRight: 8 }]}
            onPress={() => setIsMarketView(!isMarketView)}
          >
            <Text style={[styles.toggleButtonText, isMarketView && styles.toggleTextActive]}>
              {isMarketView ? 'Show Form' : 'Market View'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.toggleButton, showResults && styles.toggleActive]}
          onPress={() => setShowResults(!showResults)}
        >
          <Text style={[styles.toggleButtonText, showResults && styles.toggleTextActive]}>
            {showResults ? 'Hide Results' : 'Show Results'}
          </Text>
        </TouchableOpacity>

        {resultLoading && (
          <ActivityIndicator size="small" color="#16a34a" style={{ marginLeft: 12 }} />
        )}
      </View>

      {/* Fixed Race Details Header */}
      <TodaysRaceDetails data={raceData} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {sortedHorses.map((horse) => (
          <View key={horse.horse_id}>
            {showResults && horse.result_position && (
              <View style={[
                styles.resultCard,
                horse.result_position === '1' && styles.resultCardWin,
                ['2', '3', '4'].includes(horse.result_position) && styles.resultCardPlace,
              ]}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultPosition}>{horse.result_position}</Text>
                  <Text style={styles.resultHorseName}>{horse.horse_name}</Text>
                  <Text style={styles.resultSP}>{horse.result_sp || '-'}</Text>
                  {horse.result_position !== '1' && horse.result_distance_beaten && (
                    <Text style={styles.resultBeaten}>({horse.result_distance_beaten})</Text>
                  )}
                </View>
                {horse.result_tf_comment && (
                  <View style={styles.resultCommentRow}>
                    <Text style={styles.resultCommentLabel}>TF: </Text>
                    <Text style={styles.resultCommentText}>{horse.result_tf_comment}</Text>
                  </View>
                )}
                {horse.result_rp_comment && (
                  <View style={styles.resultCommentRow}>
                    <Text style={styles.resultCommentLabel}>RP: </Text>
                    <Text style={styles.resultCommentText}>{horse.result_rp_comment}</Text>
                  </View>
                )}
              </View>
            )}
            {!showResults && (
              <HorseCard
                horse={horse}
                isVisible={visibleHorses[horse.horse_id]}
                isMarketView={isMarketView}
                onToggleVisibility={() => toggleHorseVisibility(horse.horse_id)}
                onContenderClick={() => { }}
                onPriceClick={handlePriceClick}
                raceData={raceData}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
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
  retryButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#16a34a',
  },
  toggleActiveMarket: {
    backgroundColor: '#2563eb',
  },
  toggleButtonText: {
    fontWeight: '600',
    color: '#1e293b',
  },
  toggleTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultCardWin: {
    backgroundColor: '#fef9c3',
    borderLeftWidth: 4,
    borderLeftColor: '#eab308',
  },
  resultCardPlace: {
    backgroundColor: '#dcfce7',
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultPosition: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginRight: 8,
    minWidth: 24,
  },
  resultHorseName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  resultSP: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  resultBeaten: {
    fontSize: 13,
    color: '#64748b',
  },
  resultCommentRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  resultCommentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    width: 28,
  },
  resultCommentText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});
