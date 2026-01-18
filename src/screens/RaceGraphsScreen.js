// Race Graphs Screen - Shows race and individual horse graphs
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import SingleHorseGraph from '../components/graphs/SingleHorseGraph';
import MultiHorseGraph from '../components/graphs/MultiHorseGraph';
import { colorPalette } from '../components/graphs/utils';

export default function RaceGraphsScreen({ route }) {
    const { raceData, visibleHorses: initialVisibleHorses } = route.params;

    const [activeTab, setActiveTab] = useState('race'); // 'race' or 'horse'
    const [filter, setFilter] = useState('rating'); // 'rating', 'speed_figure', 'official_rating'
    const [selectedHorseId, setSelectedHorseId] = useState(null);
    const [visibleHorses, setVisibleHorses] = useState(initialVisibleHorses || {});

    // Get sorted horses by price
    const sortedHorses = useMemo(() => {
        if (!raceData?.horse_data) return [];
        return [...raceData.horse_data].sort((a, b) => {
            const priceA = a.todays_betfair_win_sp ?? Infinity;
            const priceB = b.todays_betfair_win_sp ?? Infinity;
            return priceA - priceB;
        });
    }, [raceData]);

    // Get selected horse data
    const selectedHorse = useMemo(() => {
        if (!selectedHorseId || !raceData?.horse_data) return null;
        return raceData.horse_data.find((h) => h.horse_id === selectedHorseId);
    }, [selectedHorseId, raceData]);

    // Toggle horse visibility in race graphs
    const toggleHorseVisibility = (horseId) => {
        setVisibleHorses((prev) => ({
            ...prev,
            [horseId]: !prev[horseId],
        }));
    };

    const filterOptions = [
        { key: 'rating', label: 'Rating' },
        { key: 'speed_figure', label: 'Speed' },
        { key: 'official_rating', label: 'OR' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'race' && styles.tabActive]}
                    onPress={() => setActiveTab('race')}
                >
                    <Text style={[styles.tabText, activeTab === 'race' && styles.tabTextActive]}>
                        Race Graphs
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'horse' && styles.tabActive]}
                    onPress={() => setActiveTab('horse')}
                >
                    <Text style={[styles.tabText, activeTab === 'horse' && styles.tabTextActive]}>
                        Horse Graphs
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {activeTab === 'race' && (
                    <View>
                        {/* Filter selector */}
                        <View style={styles.filterRow}>
                            {filterOptions.map((opt) => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[styles.filterButton, filter === opt.key && styles.filterButtonActive]}
                                    onPress={() => setFilter(opt.key)}
                                >
                                    <Text
                                        style={[styles.filterText, filter === opt.key && styles.filterTextActive]}
                                    >
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Multi Horse Graph */}
                        <MultiHorseGraph
                            raceData={raceData}
                            filter={filter}
                            visibleHorses={visibleHorses}
                        />

                        {/* Horse Toggle List */}
                        <View style={styles.horseToggleSection}>
                            <Text style={styles.sectionTitle}>Toggle Horses</Text>
                            <View style={styles.horseToggleList}>
                                {sortedHorses.map((horse, index) => {
                                    const isVisible = visibleHorses[horse.horse_id];
                                    const color = colorPalette[
                                        sortedHorses.filter((h) => visibleHorses[h.horse_id]).indexOf(horse) % colorPalette.length
                                    ] || '#ccc';

                                    return (
                                        <TouchableOpacity
                                            key={horse.horse_id}
                                            style={[
                                                styles.horseToggle,
                                                isVisible && styles.horseToggleActive,
                                                isVisible && { borderColor: color },
                                            ]}
                                            onPress={() => toggleHorseVisibility(horse.horse_id)}
                                        >
                                            {isVisible && (
                                                <View style={[styles.colorDot, { backgroundColor: color }]} />
                                            )}
                                            <Text
                                                style={[
                                                    styles.horseToggleText,
                                                    isVisible && styles.horseToggleTextActive,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {horse.horse_name}
                                            </Text>
                                            <Text style={styles.horsePrice}>
                                                {horse.todays_betfair_win_sp || '-'}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                )}

                {activeTab === 'horse' && (
                    <View>
                        {/* Horse Selector */}
                        <View style={styles.horseSelectorSection}>
                            <Text style={styles.sectionTitle}>Select Horse</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.horseSelectorList}>
                                    {sortedHorses.map((horse) => (
                                        <TouchableOpacity
                                            key={horse.horse_id}
                                            style={[
                                                styles.horseSelector,
                                                selectedHorseId === horse.horse_id && styles.horseSelectorActive,
                                            ]}
                                            onPress={() => setSelectedHorseId(horse.horse_id)}
                                        >
                                            <Text
                                                style={[
                                                    styles.horseSelectorText,
                                                    selectedHorseId === horse.horse_id && styles.horseSelectorTextActive,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {horse.horse_name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* Single Horse Graph */}
                        {selectedHorse ? (
                            <SingleHorseGraph selectedHorse={selectedHorse} />
                        ) : (
                            <View style={styles.placeholder}>
                                <Text style={styles.placeholderText}>
                                    Select a horse above to view their performance graph
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 8,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: '#2563eb',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    tabTextActive: {
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    filterRow: {
        flexDirection: 'row',
        padding: 12,
        gap: 8,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        backgroundColor: '#e2e8f0',
    },
    filterButtonActive: {
        backgroundColor: '#2563eb',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
    },
    filterTextActive: {
        color: '#fff',
    },
    horseToggleSection: {
        padding: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    horseToggleList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    horseToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 4,
    },
    horseToggleActive: {
        backgroundColor: '#f0f9ff',
        borderWidth: 2,
    },
    horseToggleText: {
        fontSize: 12,
        color: '#64748b',
        maxWidth: 100,
    },
    horseToggleTextActive: {
        color: '#1e293b',
        fontWeight: '500',
    },
    horsePrice: {
        fontSize: 11,
        color: '#94a3b8',
        marginLeft: 4,
    },
    colorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    horseSelectorSection: {
        padding: 12,
    },
    horseSelectorList: {
        flexDirection: 'row',
        gap: 8,
    },
    horseSelector: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    horseSelectorActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    horseSelectorText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    horseSelectorTextActive: {
        color: '#fff',
    },
    placeholder: {
        padding: 40,
        alignItems: 'center',
    },
    placeholderText: {
        color: '#64748b',
        fontSize: 14,
        textAlign: 'center',
    },
});
