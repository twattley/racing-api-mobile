// Today's Race Details Component - Shows race metadata
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const getSurfaceColor = (surface) => {
  const normalizedSurface = String(surface || '').trim().toLowerCase();
  switch (normalizedSurface) {
    case 'turf':
      return '#22c55e';
    case 'polytrack':
      return '#78350f';
    case 'tapeta':
      return '#a16207';
    case 'fibresand':
      return '#ca8a04';
    case 'artificial':
      return '#eab308';
    default:
      return '#64748b';
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

export default function TodaysRaceDetails({ data }) {
  if (!data) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.courseText} numberOfLines={1}>{data.course || '-'}</Text>
        <Text style={styles.colDistance}>{data.distance || '-'}</Text>
        <Text style={styles.colGoing}>{getGoingAbbreviation(data.going)}</Text>
        <Text style={styles.colClass}>C{data.race_class || '-'}</Text>
        <Text style={styles.colAge}>{data.age_range || '-'}</Text>
        <Text style={styles.colHcap}>{data.hcap_range ? `(${data.hcap_range})` : ''}</Text>
        <Text style={styles.colPrize}>£{data.first_place_prize_money || '-'}K</Text>
        <View style={[styles.surfaceChip, { backgroundColor: getSurfaceColor(data.surface) }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#334155',
    paddingHorizontal: 28,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseText: {
    flex: 1,
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
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
  colClass: {
    width: 24,
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
  surfaceChip: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginLeft: 6,
  },
});
