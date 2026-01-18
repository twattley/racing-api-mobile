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
} from 'react-native';
import { useRaceFormFull, useRaceResult } from '../api';
import HorseCard from '../components/HorseCard';
import TodaysRaceDetails from '../components/TodaysRaceDetails';
import { useProcessRaceData } from '../hooks/useProcessRaceData';

export default function FeedbackRaceDetailsScreen({ route, navigation }) {
  const { raceId, raceTitle } = route.params;
  const [visibleHorses, setVisibleHorses] = useState({});
  const [showResults, setShowResults] = useState(false);

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

  // Process the race data using shared hook
  const raceData = useProcessRaceData(fullData);

  // Merge result data with horse data
  const sortedHorses = useMemo(() => {
    if (!raceData?.horse_data) return [];

    const resultMap = new Map();
    if (resultData?.data) {
      for (const r of resultData.data) {
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

  useEffect(() => {
    if (raceData?.race_time) {
      const time = new Date(raceData.race_time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      navigation.setOptions({ title: `${time} - ${raceData.course || ''}` });
    }
  }, [raceData, navigation]);

  const toggleHorseVisibility = (horseId) => {
    setVisibleHorses((prev) => ({
      ...prev,
      [horseId]: !prev[horseId],
    }));
  };

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
                styles.resultBanner,
                horse.result_position === '1' && styles.resultWin,
                ['2', '3', '4'].includes(horse.result_position) && styles.resultPlace,
              ]}>
                <Text style={styles.resultText}>
                  Finished {horse.result_position} @ {horse.result_sp || '-'}
                </Text>
              </View>
            )}
            <HorseCard
              horse={horse}
              isVisible={visibleHorses[horse.horse_id]}
              isMarketView={false}
              onToggleVisibility={() => toggleHorseVisibility(horse.horse_id)}
              onContenderClick={() => { }} // No contender actions in feedback
              raceData={raceData}
            />
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
  resultBanner: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    marginTop: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  resultWin: {
    backgroundColor: '#fef08a',
  },
  resultPlace: {
    backgroundColor: '#bbf7d0',
  },
  resultText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
});
