// Feedback Races Screen - Historical races with date picker
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFeedbackRaceTimes, useCurrentDate, useSetCurrentDate } from '../api';

export default function FeedbackRacesScreen({ navigation }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: currentDateData } = useCurrentDate('feedback');
  const setDateMutation = useSetCurrentDate('feedback');

  // Initialize selectedDate from currentDateData
  useEffect(() => {
    if (currentDateData?.date) {
      setSelectedDate(new Date(currentDateData.date));
    }
  }, [currentDateData?.date]);

  const {
    data,
    error,
    isLoading,
    refetch,
    isRefetching,
  } = useFeedbackRaceTimes('feedback');

  const raceData = useMemo(() => {
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
        courseMap.get(course.course).push(race);
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

  const handleSetDate = async (date) => {
    try {
      // Format date as YYYY-MM-DD
      const isoDate = date.toISOString().slice(0, 10);
      await setDateMutation.mutateAsync(isoDate);
      refetch();
    } catch (err) {
      console.error('Failed to set date:', err);
    }
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date && event.type !== 'dismissed') {
      setSelectedDate(date);
      handleSetDate(date);
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
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

  return (
    <View style={styles.container}>
      {/* Date picker header */}
      <View style={styles.dateHeader}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.currentDateLabel}>
            {formatDisplayDate(currentDateData?.date)}
          </Text>
          <Text style={styles.changeDateText}>Tap to change</Text>
        </TouchableOpacity>
      </View>

      {/* Date picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {!raceData?.length ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No races for selected date</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {raceData.map((raceDay, dayIndex) => (
            <View key={dayIndex} style={styles.dayContainer}>
              <Text style={styles.dateTitle}>
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
                        onPress={() => navigation.navigate('FeedbackRaceDetails', {
                          raceId: race.race_id,
                          raceTitle: race.race_title,
                        })}
                      >
                        <View style={styles.raceTimeContainer}>
                          <Text style={[styles.raceTime, isSkipped && styles.textSkipped]}>
                            {extractTime(race.race_time)}
                          </Text>
                        </View>
                        <View style={styles.raceInfo}>
                          <Text style={[styles.raceTitle, isSkipped && styles.textSkipped]} numberOfLines={1}>
                            {race.race_title}
                          </Text>
                          <Text style={[styles.raceDetails, isSkipped && styles.textSkipped]}>
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
      )}
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
  dateHeader: {
    backgroundColor: '#16a34a',
    padding: 16,
    alignItems: 'center',
  },
  dateButton: {
    alignItems: 'center',
  },
  currentDateLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  changeDateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  datePicker: {
    height: 200,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
  dateInputField: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#16a34a',
  },
  confirmButtonText: {
    color: '#16a34a',
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  dayContainer: {
    marginBottom: 16,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#16a34a',
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
  raceTimeContainer: {
    width: 50,
    marginRight: 12,
  },
  raceTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
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
  raceItemSkipped: {
    backgroundColor: '#f1f5f9',
    opacity: 0.6,
  },
  textSkipped: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
});
