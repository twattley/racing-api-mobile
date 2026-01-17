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
import { useRaceFormFull, usePostContenderSelection, useDeleteContenderSelection, usePostBettingSelection } from '../api';
import HorseCard from '../components/HorseCard';

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

  const postContenderSelection = usePostContenderSelection('betting', raceId);
  const deleteContenderSelection = useDeleteContenderSelection('betting', raceId);
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

  // Process the race data
  const raceData = useMemo(() => {
    if (!fullData) return null;
    
    const details = fullData.race_details || {};
    const raceInfoRows = fullData.race_info?.data || [];
    const formRows = fullData.race_form?.data || [];

    // Build maps for horse meta
    const infoByHorseId = new Map();
    for (const r of raceInfoRows) {
      if (r?.horse_id != null) infoByHorseId.set(r.horse_id, r);
    }

    // Group form by horse
    const grouped = new Map();
    for (const row of formRows) {
      const hid = row.horse_id;
      if (hid == null) continue;
      if (!grouped.has(hid)) grouped.set(hid, []);
      grouped.get(hid).push(row);
    }

    const horse_data = Array.from(grouped.entries()).map(([horse_id, rows]) => {
      rows.sort((a, b) => new Date(a.race_date) - new Date(b.race_date));
      const info = infoByHorseId.get(horse_id) || {};
      
      // Calculate days since last run
      const weeks = rows
        .map((r) => r.total_weeks_since_run)
        .filter((x) => typeof x === 'number' && x >= 0);
      const minWeeks = weeks.length ? Math.min(...weeks) : undefined;
      const todays_days_since_last_ran = typeof minWeeks === 'number' ? Math.round(minWeeks * 7) : undefined;

      return {
        horse_id,
        horse_name: rows[rows.length - 1]?.horse_name || info.horse_name,
        todays_betfair_win_sp: info.betfair_win_sp ?? null,
        todays_betfair_place_sp: info.betfair_place_sp ?? null,
        todays_sim_place_sp: info.sim_place_sp ?? null,
        todays_horse_age: info.age ?? null,
        todays_headgear: info.headgear ?? null,
        todays_official_rating: info.official_rating ?? null,
        todays_weight_carried: info.weight_carried_lbs ?? null,
        todays_win_percentage: info.win_percentage ?? null,
        todays_place_percentage: info.place_percentage ?? null,
        todays_days_since_last_ran,
        number_of_runs: info.number_of_runs ?? null,
        contender_status: info.contender_status ?? null,
        value_percentage: info.value_percentage ?? null,
        adjusted_odds: info.adjusted_odds ?? null,
        is_value_lay: info.is_value_lay ?? null,
        lay_value_percentage: info.lay_value_percentage ?? null,
        // Betfair IDs for betting
        todays_selection_id: info.selection_id ?? null,
        todays_market_id_win: info.market_id_win ?? null,
        todays_market_id_place: info.market_id_place ?? null,
        performance_data: rows.map((r) => ({
          race_id: r.race_id,
          race_date: r.race_date,
          race_class: r.race_class,
          distance: r.distance,
          going: r.going,
          course: r.course,
          finishing_position: r.finishing_position,
          number_of_runners: r.number_of_runners,
          total_distance_beaten: r.total_distance_beaten,
          betfair_win_sp: r.betfair_win_sp,
          official_rating: r.official_rating,
          headgear: r.headgear,
          speed_figure: r.speed_figure,
          rating: r.rating,
          weeks_since_last_ran: r.weeks_since_last_ran,
          total_weeks_since_run: r.total_weeks_since_run,
          hcap_range: r.hcap_range,
          age_range: r.age_range,
          race_type: r.race_type,
          surface: r.surface,
          first_place_prize_money: r.first_place_prize_money,
          class_diff: r.class_diff,
          rating_range_diff: r.rating_range_diff,
          tf_comment: r.tf_comment,
          rp_comment: r.rp_comment,
          main_race_comment: r.main_race_comment,
          race_title: r.race_title,
        })),
      };
    });

    return {
      ...details,
      horse_data,
    };
  }, [fullData]);

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

  // Set navigation title
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

  const handleContenderClick = (horse, status) => {
    const newStatus = horse.contender_status === status ? null : status;
    
    if (!newStatus) {
      deleteContenderSelection.mutate({ raceId, horseId: horse.horse_id });
    } else {
      postContenderSelection.mutate({
        horse_id: horse.horse_id,
        horse_name: horse.horse_name,
        race_id: raceId,
        race_date: raceData?.race_date,
        race_time: raceData?.race_time,
        status: newStatus,
        timestamp: new Date().toISOString(),
      });
    }
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

  const contenderCount = sortedHorses.filter(h => h.contender_status === 'contender').length;

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
        
        {contenderCount > 0 && (
          <View style={styles.contenderBadge}>
            <Text style={styles.contenderBadgeText}>
              {contenderCount}/{sortedHorses.length} Contenders
            </Text>
          </View>
        )}
      </View>

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
            onContenderClick={(status) => handleContenderClick(horse, status)}
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
  contenderBadge: {
    marginLeft: 12,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  contenderBadgeText: {
    color: '#166534',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
});
