// Race Details Screen - Shows horse form for a race
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
import { useRaceFormFull, usePostBettingSelection } from '../api';
import HorseCard from '../components/HorseCard';
import TodaysRaceDetails from '../components/TodaysRaceDetails';
import { useProcessRaceData } from '../hooks/useProcessRaceData';

export default function RaceDetailsScreen({ route, navigation }) {
  const { raceId, raceTitle } = route.params;
  const [visibleHorses, setVisibleHorses] = useState({});
  const [isMarketView, setIsMarketView] = useState(false);

  const {
    data: fullData,
    error,
    isLoading,
    refetch,
    isRefetching,
  } = useRaceFormFull('today', raceId);

  const postBettingSelection = usePostBettingSelection('betting');

  // Helper functions for payload
  const toInt = (v) => {
    const n = Number(v);
    return Number.isInteger(n) ? n : undefined;
  };
  const toDecimalStr = (v) => {
    if (v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? String(n) : undefined;
  };
  const toStr = (v) => {
    if (v === null || v === undefined) return undefined;
    return String(v);
  };
  const toDateStr = (d) => {
    if (!d) return undefined;
    const s = String(d);
    return s.includes('T') ? s.slice(0, 10) : s;
  };
  const sanitize = (val) => {
    if (Array.isArray(val)) return val.map(sanitize).filter((v) => v !== undefined);
    if (val && typeof val === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(val)) {
        const sv = sanitize(v);
        if (sv !== undefined) out[k] = sv;
      }
      return out;
    }
    if (typeof val === 'number' && !Number.isFinite(val)) return undefined;
    return val === undefined ? undefined : val;
  };

  // Process the race data using shared hook
  const raceData = useProcessRaceData(fullData);

  // Sort horses by SP
  const sortedHorses = useMemo(() => {
    if (!raceData?.horse_data) return [];
    return [...raceData.horse_data].sort((a, b) => {
      const priceA = a.todays_betfair_win_sp ?? Infinity;
      const priceB = b.todays_betfair_win_sp ?? Infinity;
      return priceA - priceB;
    });
  }, [raceData]);

  // Initialize visibility
  const resetVisibility = useCallback(() => {
    if (!sortedHorses.length) return;

    const outsiders = sortedHorses
      .filter((h) => (h.todays_betfair_win_sp ?? 0) > 20)
      .map((h) => h.horse_id);
    const longBreak = sortedHorses
      .filter((h) => (h.todays_days_since_last_ran ?? 0) > 52)
      .map((h) => h.horse_id);
    const shortBreak = sortedHorses
      .filter((h) => (h.todays_days_since_last_ran ?? 9999) <= 6)
      .map((h) => h.horse_id);

    const hidden = new Set([...longBreak, ...shortBreak, ...outsiders]);

    const initialVisibility = sortedHorses.reduce((acc, horse) => {
      acc[horse.horse_id] = !hidden.has(horse.horse_id);
      return acc;
    }, {});

    setVisibleHorses(initialVisibility);
  }, [sortedHorses]);

  useEffect(() => {
    resetVisibility();
  }, [resetVisibility]);

  // Navigate to graphs screen
  const navigateToGraphs = useCallback(() => {
    navigation.navigate('RaceGraphs', {
      raceData,
      visibleHorses,
    });
  }, [navigation, raceData, visibleHorses]);

  // Set navigation title and header button
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
            <Ionicons name="stats-chart" size={24} color="#2563eb" />
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

  const handlePriceClick = ({ horse, market, backLay, price, points }) => {
    // Check if selection_id is available (required for betting)
    if (!horse.todays_selection_id) {
      Alert.alert(
        'Cannot Place Bet',
        'Betfair selection ID not available for this horse. The market may not be open yet.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Build market state for all horses
    const market_state = (sortedHorses || [])
      .filter((h) => toInt(h.horse_id) !== undefined && toInt(h.todays_selection_id) !== undefined)
      .map((h) => ({
        horse_id: toInt(h.horse_id),
        betfair_win_sp: toDecimalStr(h.todays_betfair_win_sp),
        selection_id: toInt(h.todays_selection_id),
      }));

    const payload = sanitize({
      horse_id: toInt(horse.horse_id),
      horse_name: toStr(horse.horse_name),
      selection_id: toInt(horse.todays_selection_id),
      market_id_win: toStr(horse.todays_market_id_win),
      market_id_place: toStr(horse.todays_market_id_place),
      race_id: toInt(raceId),
      race_date: toDateStr(raceData?.race_date),
      race_time: toStr(raceData?.race_time),
      number_of_runners: toInt(sortedHorses.length),
      stake_points: points,
      bet_type: { back_lay: backLay, market },
      market_state,
      clicked: {
        type: market,
        price: toDecimalStr(price),
      },
      ts: new Date().toISOString(),
    });

    console.log('Submitting selection:', payload);
    postBettingSelection.mutate(payload, {
      onSuccess: () => {
        Alert.alert(
          'Selection Placed',
          `${horse.horse_name} - ${market.toUpperCase()} ${backLay.toUpperCase()} @ ${price}`,
          [{ text: 'OK' }]
        );
      },
      onError: (err) => {
        Alert.alert('Error', `Failed to place selection: ${err.message}`);
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
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
          style={styles.toggleButton}
          onPress={() => setIsMarketView(!isMarketView)}
        >
          <Text style={styles.toggleButtonText}>
            {isMarketView ? 'Show Form' : 'Market View'}
          </Text>
        </TouchableOpacity>
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
          <HorseCard
            key={horse.horse_id}
            horse={horse}
            isVisible={visibleHorses[horse.horse_id]}
            isMarketView={isMarketView}
            onToggleVisibility={() => toggleHorseVisibility(horse.horse_id)}
            onPriceClick={handlePriceClick}
            raceData={raceData}
          />
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
    backgroundColor: '#2563eb',
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
  toggleButtonText: {
    fontWeight: '600',
    color: '#1e293b',
  },
  scrollView: {
    flex: 1,
  },
});
