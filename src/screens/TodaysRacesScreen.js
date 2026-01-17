// Today's Races Screen - List of races for today
import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTodaysRaceTimes } from '../api';

export default function TodaysRacesScreen({ navigation }) {
  const {
    data,
    error,
    isLoading,
    refetch,
    isRefetching,
  } = useTodaysRaceTimes('today');

  const todaysRaceData = useMemo(() => {
    const courses = data?.data || [];
    if (!courses.length) return [];

    const byDate = new Map();
    for (const course of courses) {
      for (const race of course.races || []) {
        const dateKey = race.race_date ||
          (race.race_time ? new Date(race.race_time).toISOString().slice(0, 10) : '');
        if (!dateKey) continue;
        if (!byDate.has(dateKey)) byDate.set(dateKey, new Map());
        const courseMap = byDate.get(dateKey);
        if (!courseMap.has(course.course)) courseMap.set(course.course, []);
        courseMap.get(course.course).push({ ...race, skip_flag: race.skip_flag ?? false });
      }
    }

    return Array.from(byDate.entries())
      .map(([race_date, courseMap]) => ({
        race_date,
        courses: Array.from(courseMap.entries()).map(([courseName, races]) => ({
          course: courseName,
          races: races.sort((a, b) => new Date(a.race_time) - new Date(b.race_time)),
        })),
      }))
      .sort((a, b) => new Date(a.race_date) - new Date(b.race_date));
  }, [data]);

  const extractTime = (raceTime) => {
    if (!raceTime) return '';
    const dateStr = raceTime.split(' ')[0];
    return dateStr.split('T')[1]?.slice(0, 5) || '';
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading races...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading races</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!todaysRaceData?.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No races available for today</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      {todaysRaceData.map((raceDay, dayIndex) => (
        <View key={dayIndex} style={styles.dayContainer}>
          <Text style={styles.dateHeader}>
            {new Date(raceDay.race_date).toDateString()}
          </Text>

          {raceDay.courses.map((course, courseIndex) => (
            <View key={courseIndex} style={styles.courseContainer}>
              <Text style={styles.courseName}>{course.course}</Text>

              {course.races.map((race) => {
                const isSkipped = race.skip_flag === true || race.skip_flag === 1;
                return (
                  <TouchableOpacity
                    key={race.race_id}
                    style={[styles.raceItem, isSkipped && styles.raceItemSkipped]}
                    onPress={() => navigation.navigate('RaceDetails', {
                      raceId: race.race_id,
                      raceTitle: race.race_title,
                    })}
                    disabled={isSkipped}
                  >
                    <View style={styles.raceTimeContainer}>
                      <Text style={[styles.raceTime, isSkipped && styles.textSkipped]}>
                        {extractTime(race.race_time)}
                      </Text>
                    </View>
                    <View style={styles.raceInfo}>
                      <Text
                        style={[styles.raceTitle, isSkipped && styles.textSkipped]}
                        numberOfLines={1}
                      >
                        {race.race_title}
                      </Text>
                      <Text style={styles.raceDetails}>
                        {race.distance} • {race.number_of_runners} runners • Class {race.race_class}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
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
  dayContainer: {
    marginBottom: 16,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#2563eb',
    color: '#fff',
    padding: 12,
  },
  courseContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  raceItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  raceItemSkipped: {
    backgroundColor: '#f1f5f9',
    opacity: 0.6,
  },
  raceTimeContainer: {
    width: 50,
    marginRight: 12,
  },
  raceTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  raceInfo: {
    flex: 1,
  },
  raceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  raceDetails: {
    fontSize: 12,
    color: '#64748b',
  },
  textSkipped: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
});
