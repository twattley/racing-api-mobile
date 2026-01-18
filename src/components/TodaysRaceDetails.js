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

export default function TodaysRaceDetails({ data }) {
  if (!data) return null;

  return (
    <View style={styles.container}>
      {/* Row 1: Course, Distance, Going */}
      <View style={styles.row}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{data.course || '-'}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{data.distance || '-'}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{data.going || '-'}</Text>
        </View>
      </View>

      {/* Row 2: Class, Hcap Range, Age Range, Race Type */}
      <View style={styles.row}>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>Class</Text>
          <Text style={styles.chipValue}>{data.race_class || '-'}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>Hcap</Text>
          <Text style={styles.chipValue}>{data.hcap_range || '-'}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>Age</Text>
          <Text style={styles.chipValue}>{data.age_range || '-'}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{data.race_type || '-'}</Text>
        </View>
      </View>

      {/* Row 3: Prize Money, Surface */}
      <View style={styles.row}>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>1st Prize</Text>
          <Text style={styles.chipValue}>
            {data.first_place_prize_money
              ? `£${data.first_place_prize_money.toLocaleString()}`
              : '-'}
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: getSurfaceColor(data.surface) }]}>
          <Text style={[styles.chipText, styles.surfaceText]}>{data.surface || '-'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    padding: 10,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#334155',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 45,
  },
  chipText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  chipLabel: {
    fontSize: 9,
    color: '#94a3b8',
  },
  chipValue: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  surfaceText: {
    color: '#fff',
    fontWeight: '600',
  },
});
