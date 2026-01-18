// Horse Card Component - Displays horse details and form
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import SelectionPrompt from './SelectionPrompt';

// Equipment/headgear abbreviation mapping
const getHeadgearAbbrev = (headgear) => {
  if (!headgear) return null;
  const mapping = {
    'blinkers': 'b',
    'blinkers (first time)': 'b1',
    'blinkers (first time), eye shield': 'b1es',
    'blinkers (first time), hood': 'b1h',
    'blinkers (first time), hood, eye shield': 'b1hes',
    'blinkers (first time), tongue tie': 'b1t',
    'blinkers (first time), tongue tie, eye shield': 'b1tes',
    'blinkers (first time), tongue tie, hood': 'b1th',
    'blinkers (first time), tongue tie, hood, eye shield': 'b1thes',
    'blinkers, cheekpieces': 'bc',
    'blinkers, eye shield': 'bes',
    'blinkers, hood': 'bh',
    'blinkers, hood, eye shield': 'bhes',
    'blinkers, tongue tie': 'bt',
    'blinkers, tongue tie, cheekpieces': 'btc',
    'blinkers, tongue tie, eye shield': 'btes',
    'blinkers, tongue tie, hood': 'bth',
    'blinkers, tongue tie, hood, eye shield': 'bthes',
    'cheekpieces': 'c',
    'cheekpieces (first time)': 'c1',
    'cheekpieces (first time), blinkers': 'c1b',
    'cheekpieces (first time), eye shield': 'c1es',
    'cheekpieces (first time), hood': 'c1h',
    'cheekpieces (first time), hood, eye shield': 'c1hes',
    'cheekpieces (first time), tongue tie': 'c1t',
    'cheekpieces (first time), tongue tie, eye shield': 'c1tes',
    'cheekpieces (first time), tongue tie, hood': 'c1th',
    'cheekpieces (first time), tongue tie, hood, eye shield': 'c1thes',
    'cheekpieces (first time), visor': 'c1v',
    'cheekpieces, eye shield': 'ces',
    'cheekpieces, hood': 'ch',
    'cheekpieces, hood, eye shield': 'ches',
    'cheekpieces, visor': 'cv',
    'eye shield': 'es',
    'eye shield (first time)': 'es1',
    'eye shield (first time), hood': 'es1h',
    'hood': 'h',
    'hood (first time)': 'h1',
    'hood, eye shield': 'hes',
    'tongue tie': 't',
    'tongue tie (first time)': 't1',
    'tongue tie (first time), eye shield': 't1es',
    'tongue tie (first time), hood': 't1h',
    'tongue tie (first time), hood, eye shield': 't1hes',
    'tongue tie, cheekpieces': 'tc',
    'tongue tie, cheekpieces, hood': 'tch',
    'tongue tie, cheekpieces, hood, eye shield': 'tches',
    'tongue tie, cheekpieces, visor': 'tcv',
    'tongue tie, eye shield': 'tes',
    'tongue tie, hood': 'th',
    'tongue tie, hood, eye shield': 'thes',
    'tongue tie, visor': 'tv',
    'tongue tie, visor, hood': 'tvh',
    'visor': 'v',
    'visor (first time)': 'v1',
    'visor (first time), eye shield': 'v1es',
    'visor (first time), hood': 'v1h',
    'visor (first time), tongue tie': 'v1t',
    'visor (first time), tongue tie, hood': 'v1th',
    'visor, eye shield': 'ves',
    'visor, hood': 'vh',
    'visor, hood, eye shield': 'vhes',
  };
  const normalized = headgear.toLowerCase().trim();
  return mapping[normalized] || headgear;
};

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
              ({getHeadgearAbbrev(horse.todays_headgear)})
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

  const getSurfaceColor = (surface) => {
    const normalizedSurface = String(surface || '').trim().toLowerCase();
    switch (normalizedSurface) {
      case 'turf': return '#22c55e';
      case 'polytrack': return '#78350f';
      case 'tapeta': return '#a16207';
      case 'fibresand': return '#ca8a04';
      case 'artificial': return '#eab308';
      default: return '#64748b';
    }
  };

  const getGoingAbbreviation = (going) => {
    const mapping = {
      'Fast': 'F',
      'Firm': 'F',
      'Good': 'G',
      'Good To Firm': 'GF',
      'Good To Soft': 'GS',
      'Good To Yielding': 'GY',
      'Heavy': 'H',
      'Muddy': 'M',
      'Sloppy': 'S',
      'Slow': 'S',
      'Soft': 'S',
      'Soft To Heavy': 'SH',
      'Standard': 'ST',
      'Standard To Fast': 'SF',
      'Standard To Slow': 'Ss',
      'Very Soft': 'VS',
      'Yielding': 'Y',
      'Yielding To Soft': 'YS',
    };
    return mapping[going] || going || '-';
  };

  const formatSP = (sp) => {
    if (!sp) return '-';
    const val = parseFloat(sp);
    if (val >= 100) return Math.round(val);
    if (val >= 10) return val.toFixed(1);
    return sp;
  };

  const formatBeaten = (beaten) => {
    if (!beaten) return '0';
    const val = parseFloat(beaten);
    if (isNaN(val)) return beaten;
    if (val >= 10) return val.toFixed(1);
    return beaten;
  };

  return (
    <TouchableOpacity onPress={() => setExpanded(!expanded)}>
      {/* Line 1: Race Details (matches header) */}
      <View style={styles.formRowLine1}>
        <Text style={styles.formCourse} numberOfLines={1}>{perf.course || '-'}</Text>
        <Text style={styles.colDistance}>{perf.distance || '-'}</Text>
        <Text style={styles.colGoing}>{getGoingAbbreviation(perf.going)}</Text>
        <View style={styles.colClassWrap}>
          <Text style={styles.colClass}>C{perf.race_class ?? '-'}</Text>
          {getClassDiffIndicator() && (
            <Text style={getClassDiffStyle()}>{getClassDiffIndicator()}</Text>
          )}
        </View>
        <Text style={styles.colAge}>{perf.age_range || '-'}</Text>
        <Text style={styles.colHcap}>{perf.hcap_range ? `(${perf.hcap_range})` : ''}</Text>
        <Text style={styles.colPrize}>£{perf.first_place_prize_money || '-'}K</Text>
        <View style={[styles.surfaceChip, { backgroundColor: getSurfaceColor(perf.surface) }]} />
      </View>

      {/* Line 2: Performance Details (grid layout) */}
      <View style={styles.formRowLine2}>
        {/* Left side: position, beaten, headgear, SP, weeks */}
        <Text style={[
          styles.colPosition,
          perf.finishing_position === '1' && styles.positionWin,
          ['2', '3', '4'].includes(perf.finishing_position) && styles.positionPlace,
        ]}>
          {perf.finishing_position || '-'}/{perf.number_of_runners || '-'}
        </Text>
        <Text style={styles.colBeaten}>({formatBeaten(perf.total_distance_beaten)})</Text>
        {perf.headgear && (
          <Text style={[
            styles.colHeadgear,
            perf.headgear.toLowerCase().includes('first time') && styles.headgearFirstForm
          ]}>
            ({getHeadgearAbbrev(perf.headgear)})
          </Text>
        )}
        <Text style={styles.colSP}>{formatSP(perf.betfair_win_sp)}</Text>
        <Text style={[
          styles.colWeeks,
          perf.weeks_since_last_ran > 16 && styles.weeksWarning,
        ]}>
          {perf.weeks_since_last_ran ?? '-'}w
        </Text>
        <Text style={styles.colTotalWeeks}>{perf.total_weeks_since_run ?? '-'}w</Text>

        {/* Spacer to push right side */}
        <View style={styles.flexSpacer} />

        {/* Right side: OR, SF, Rating */}
        <Text style={styles.colOR}>{perf.official_rating || '-'}</Text>
        <Text style={styles.colSF}>{perf.speed_figure || '-'}</Text>
        <Text style={styles.colRating}>{perf.rating || '-'}</Text>
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
  // Line 1: Race Details (matches TodaysRaceDetails exactly)
  formRowLine1: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#334155',
  },
  // Line 2: Performance (grid layout)
  formRowLine2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 2,
  },
  formCourse: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  colDistance: {
    width: 42,
    fontSize: 11,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  colGoing: {
    width: 24,
    fontSize: 11,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  colClassWrap: {
    width: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colClass: {
    fontSize: 11,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  colAge: {
    width: 32,
    fontSize: 11,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  colHcap: {
    width: 42,
    fontSize: 11,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  colPrize: {
    width: 36,
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '600',
    textAlign: 'right',
  },
  classDiffHigher: {
    fontSize: 9,
    color: '#16a34a',
    marginLeft: 1,
  },
  classDiffLower: {
    fontSize: 9,
    color: '#ef4444',
    marginLeft: 1,
  },
  surfaceChip: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginLeft: 6,
  },
  // Line 2 grid columns
  colPosition: {
    width: 38,
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  positionWin: {
    color: '#16a34a',
  },
  positionPlace: {
    color: '#2563eb',
  },
  colBeaten: {
    width: 44,
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  colHeadgear: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginRight: 8,
  },
  headgearFirstForm: {
    color: '#dc2626',
    fontWeight: '600',
  },
  colSP: {
    width: 45,
    fontSize: 11,
    fontWeight: '600',
    color: '#1e40af',
    backgroundColor: '#dbeafe',
    textAlign: 'center',
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  colWeeks: {
    width: 28,
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
  colTotalWeeks: {
    width: 28,
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  flexSpacer: {
    flex: 1,
  },
  colOR: {
    width: 28,
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    textAlign: 'right',
  },
  colSF: {
    width: 28,
    fontSize: 11,
    color: '#7c3aed',
    fontWeight: '500',
    textAlign: 'right',
  },
  colRating: {
    width: 28,
    fontSize: 11,
    color: '#0891b2',
    fontWeight: '500',
    textAlign: 'right',
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
