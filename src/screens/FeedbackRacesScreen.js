// Feedback Races Screen - Historical races with date picker
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useFeedbackRaceTimes, useCurrentDate, useSetCurrentDate } from '../api';

export default function FeedbackRacesScreen({ navigation }) {
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [dateInput, setDateInput] = useState('');

  const { data: currentDateData } = useCurrentDate('feedback');
  const setDateMutation = useSetCurrentDate('feedback');

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

  const handleSetDate = async () => {
    if (!dateInput) return;
    try {
      await setDateMutation.mutateAsync(dateInput);
      setDateModalVisible(false);
      setDateInput('');
      refetch();
    } catch (err) {
      console.error('Failed to set date:', err);
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
        <Text style={styles.currentDateLabel}>
          Current Date: {currentDateData?.date || 'Not set'}
        </Text>
        <TouchableOpacity
          style={styles.changeDateButton}
          onPress={() => setDateModalVisible(true)}
        >
          <Text style={styles.changeDateButtonText}>Change Date</Text>
        </TouchableOpacity>
      </View>

      {/* Date input modal */}
      <Modal
        visible={dateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Feedback Date</Text>
            <TextInput
              style={styles.dateInputField}
              placeholder="YYYY-MM-DD"
              value={dateInput}
              onChangeText={setDateInput}
              keyboardType="default"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDateModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSetDate}
              >
                <Text style={styles.confirmButtonText}>Set Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                  
                  {course.races.map((race) => (
                    <TouchableOpacity
                      key={race.race_id}
                      style={styles.raceItem}
                      onPress={() => navigation.navigate('FeedbackRaceDetails', { 
                        raceId: race.race_id,
                        raceTitle: race.race_title,
                      })}
                    >
                      <View style={styles.raceTimeContainer}>
                        <Text style={styles.raceTime}>
                          {extractTime(race.race_time)}
                        </Text>
                      </View>
                      <View style={styles.raceInfo}>
                        <Text style={styles.raceTitle} numberOfLines={1}>
                          {race.race_title}
                        </Text>
                        <Text style={styles.raceDetails}>
                          {race.distance} • {race.number_of_runners} runners
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
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
    backgroundColor: '#fff',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  currentDateLabel: {
    fontSize: 14,
    color: '#475569',
  },
  changeDateButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  changeDateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
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
    color: '#475569',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#16a34a',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
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
});
