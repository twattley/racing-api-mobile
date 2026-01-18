// Horse Card Component - Displays horse details and form
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import SelectionPrompt from './SelectionPrompt';

export default function HorseCard({
  horse,
  isVisible,
  isMarketView,
  onToggleVisibility,
  onContenderClick,
  onPriceClick,
  raceData,
}) {
  const [promptState, setPromptState] = useState({
    visible: false,
    market: 'win',
    price: null,
  });

  const handlePriceClick = (type, price) => {
    setPromptState({ visible: true, market: type, price });
  };

  const handleConfirmSelection = ({ backLay, price, points }) => {
    // Call parent handler with full selection data
    onPriceClick?.({
      horse,
      market: promptState.market,
      backLay,
      price,
      points,
    });
    setPromptState((s) => ({ ...s, visible: false }));
  };

  const getValueStyle = () => {
    if (horse.value_percentage != null) {
      return parseFloat(horse.value_percentage) > 0
        ? styles.valuePositive
        : styles.valueNegative;
    }
    if (horse.is_value_lay === true) {
      return styles.valueLay;
    }
    return styles.valueNeutral;
  };

  const getValueText = () => {
    if (horse.value_percentage != null) {
      return `${horse.value_percentage}%`;
    }
    if (horse.is_value_lay === true) {
      return `L ${horse.lay_value_percentage}%`;
    }
    if (horse.is_value_lay === false) {
      return 'NO LAY';
    }
    return '-';
  };

  return (
    <View style={styles.card}>
      {/* Horse Header */}
      <View style={styles.header}>
        {/* Contender buttons */}
        <TouchableOpacity
          style={[
            styles.contenderButton,
            horse.contender_status === 'contender' && styles.contenderActive,
          ]}
          onPress={() => onContenderClick('contender')}
        >
          <Text style={styles.contenderButtonText}>C</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.contenderButton,
            styles.notContenderButton,
            horse.contender_status === 'not-contender' && styles.notContenderActive,
          ]}
          onPress={() => onContenderClick('not-contender')}
        >
          <Text style={styles.contenderButtonText}>N</Text>
        </TouchableOpacity>

        {/* Horse name */}
        <TouchableOpacity
          style={styles.nameContainer}
          onPress={onToggleVisibility}
        >
          <Text style={styles.horseName} numberOfLines={1}>
            {horse.horse_name}
          </Text>
          {horse.todays_headgear && (
            <Text style={[
              styles.headgear,
              horse.todays_headgear.toLowerCase().includes('first time') && styles.headgearFirst
            ]}>
              ({horse.todays_headgear})
            </Text>
          )}
        </TouchableOpacity>

        {/* Key stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{horse.todays_horse_age || '-'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{horse.todays_official_rating || '-'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.statBox, styles.priceBox]}
            onPress={() => handlePriceClick('win', horse.todays_betfair_win_sp)}
          >
            <Text style={styles.priceValue}>{horse.todays_betfair_win_sp || '-'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statBox, styles.priceBox]}
            onPress={() => handlePriceClick('place', horse.todays_betfair_place_sp)}
          >
            <Text style={styles.priceValue}>{horse.todays_betfair_place_sp || '-'}</Text>
          </TouchableOpacity>
          <View style={[styles.statBox, getValueStyle()]}>
            <Text style={styles.valueText}>{getValueText()}</Text>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsContainer}>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatLabel}>Sim Place</Text>
          <Text style={styles.miniStatValue}>{horse.todays_sim_place_sp || '-'}</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatLabel}>Win %</Text>
          <Text style={styles.miniStatValue}>{horse.todays_win_percentage || '-'}</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatLabel}>Place %</Text>
          <Text style={styles.miniStatValue}>{horse.todays_place_percentage || '-'}</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatLabel}>Runs</Text>
          <Text style={styles.miniStatValue}>{horse.number_of_runs || '-'}</Text>
        </View>
      </View>

      {/* Performance history */}
      {isVisible && !isMarketView && horse.performance_data?.length > 0 && (
        <View style={styles.formContainer}>
          <Text style={styles.formHeader}>Recent Form</Text>
          {horse.performance_data.slice(-6).reverse().map((perf, idx) => (
            <FormRow key={idx} perf={perf} />
          ))}
        </View>
      )}

      {/* Selection Prompt Modal */}
      <SelectionPrompt
        visible={promptState.visible}
        onClose={() => setPromptState((s) => ({ ...s, visible: false }))}
        onConfirm={handleConfirmSelection}
        defaultPrice={promptState.price}
        marketLabel={promptState.market}
        title={`${horse.horse_name} - ${promptState.market.toUpperCase()}`}
      />
    </View>
  );
}

// Separate component for expandable form rows
function FormRow({ perf }) {
  const [expanded, setExpanded] = useState(false);

  const hasRpComment = perf.rp_comment &&
    perf.rp_comment.toLowerCase() !== 'no comment available';

  const getClassDiffIndicator = () => {
    if (perf.class_diff === 'higher') return '▲';
    if (perf.class_diff === 'lower') return '▼';
    return '';
  };

  const getClassDiffStyle = () => {
    if (perf.class_diff === 'higher') return styles.classDiffHigher;
    if (perf.class_diff === 'lower') return styles.classDiffLower;
    return null;
  };

  return (
    <TouchableOpacity onPress={() => setExpanded(!expanded)}>
      <View style={styles.formRow}>
        <Text style={styles.formSP}>
          {perf.betfair_win_sp
            ? (parseFloat(perf.betfair_win_sp) >= 100
              ? Math.round(parseFloat(perf.betfair_win_sp))
              : parseFloat(perf.betfair_win_sp) >= 10
                ? parseFloat(perf.betfair_win_sp).toFixed(1)
                : perf.betfair_win_sp)
            : '-'}
        </Text>
        <View style={styles.formClassContainer}>
          <Text style={styles.formClass}>{perf.race_class ?? '-'}</Text>
          {getClassDiffIndicator() && (
            <Text style={getClassDiffStyle()}>{getClassDiffIndicator()}</Text>
          )}
        </View>
        <Text style={styles.formDistance}>
          {perf.distance}
        </Text>
        <Text style={styles.formCourse} numberOfLines={1}>
          {perf.course}
        </Text>
        <Text style={[
          styles.formWeeks,
          perf.weeks_since_last_ran > 16 && styles.weeksWarning,
        ]}>
          {perf.weeks_since_last_ran ?? '-'}
        </Text>
        <Text style={styles.formTotalWeeks}>
          {perf.total_weeks_since_run ?? '-'}
        </Text>
        <Text style={[
          styles.formPosition,
          perf.finishing_position === '1' && styles.positionWin,
          ['2', '3', '4'].includes(perf.finishing_position) && styles.positionPlace,
        ]}>
          {perf.finishing_position || '-'}/{perf.number_of_runners || '-'}
        </Text>
        <Text style={styles.formBeaten}>
          ({perf.total_distance_beaten || '0'})
        </Text>
      </View>

      {/* Comments section */}
      {perf.tf_comment && (
        <View style={styles.commentContainer}>
          <Text style={styles.commentText}>
            <Text style={styles.commentLabel}>TF - </Text>
            {perf.tf_comment}
          </Text>
          {hasRpComment && (
            <Text style={[styles.commentText, styles.rpComment]}>
              <Text style={styles.commentLabel}>RP - </Text>
              {perf.rp_comment}
            </Text>
          )}
        </View>
      )}

      {/* Expanded main race comment */}
      {expanded && perf.main_race_comment && (
        <View style={styles.expandedComment}>
          {perf.race_title && (
            <Text style={styles.raceTitle}>{perf.race_title}</Text>
          )}
          <Text style={styles.mainRaceComment}>{perf.main_race_comment}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  contenderButton: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#9ca3af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  contenderActive: {
    backgroundColor: '#16a34a',
  },
  notContenderButton: {
    backgroundColor: '#9ca3af',
  },
  notContenderActive: {
    backgroundColor: '#dc2626',
  },
  contenderButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  horseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  headgear: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  headgearFirst: {
    color: '#2563eb',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  statBox: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  priceBox: {
    backgroundColor: '#dbeafe',
  },
  priceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  valuePositive: {
    backgroundColor: '#22c55e',
  },
  valueNegative: {
    backgroundColor: '#ef4444',
  },
  valueLay: {
    backgroundColor: '#a855f7',
  },
  valueNeutral: {
    backgroundColor: '#e2e8f0',
  },
  valueText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
  },
  miniStatLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginBottom: 2,
  },
  miniStatValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  tappablePrice: {
    color: '#1e40af',
    fontWeight: '600',
  },
  formContainer: {
    padding: 8,
  },
  formHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  formWeeks: {
    width: 24,
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
  weeksWarning: {
    color: '#fff',
    backgroundColor: '#ef4444',
    borderRadius: 3,
    overflow: 'hidden',
  },
  formTotalWeeks: {
    width: 28,
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginRight: 6,
  },
  formClassContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 28,
    marginRight: 4,
  },
  formClass: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
  },
  classDiffHigher: {
    fontSize: 9,
    color: '#16a34a',
    marginLeft: 2,
  },
  classDiffLower: {
    fontSize: 9,
    color: '#ef4444',
    marginLeft: 2,
  },
  formCourse: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    marginRight: 2,
  },
  formPosition: {
    width: 40,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#475569',
  },
  positionWin: {
    color: '#16a34a',
  },
  positionPlace: {
    color: '#2563eb',
  },
  formDistance: {
    width: 45,
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  formBeaten: {
    width: 35,
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  formSP: {
    width: 40,
    fontSize: 11,
    fontWeight: '600',
    color: '#1e40af',
    backgroundColor: '#dbeafe',
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  commentContainer: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  commentText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  commentLabel: {
    fontWeight: '700',
    color: '#1e293b',
  },
  rpComment: {
    marginTop: 6,
  },
  expandedComment: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  raceTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
  },
  mainRaceComment: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
