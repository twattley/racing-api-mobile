// Multi Horse Graph Component - Shows selected horses' performance comparison
import React, { useMemo } from 'react';
import { View, Text, Dimensions, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colorPalette } from './utils';

const screenWidth = Dimensions.get('window').width;

export default function MultiHorseGraph({ raceData, filter = 'rating', visibleHorses }) {
    // Build chart data from visible horses
    const chartData = useMemo(() => {
        if (!raceData?.horse_data?.length) {
            return { labels: [], datasets: [], legend: [] };
        }

        // Get price for sorting (shorter odds = more likely to win = plot first)
        const priceOf = (horse) => {
            const raw = horse.todays_betfair_win_sp ?? horse.bf_decimal_sp_win;
            const n = parseFloat(raw);
            return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
        };

        // Filter to visible horses first
        const visibleHorseData = raceData.horse_data
            .filter((horse) => visibleHorses[horse.horse_id])
            .sort((a, b) => priceOf(a) - priceOf(b))
            .slice(0, 6); // Max 6 horses for readability

        if (!visibleHorseData.length) {
            return { labels: [], datasets: [], legend: [] };
        }

        // Helper to parse dates
        const parseDate = (dateStr) => {
            if (!dateStr) return 0;
            const datePart = String(dateStr).split('T')[0];
            return new Date(datePart).getTime();
        };

        // Build individual datasets for each horse using ONLY their own race dates
        // This avoids plotting 0 for dates a horse didn't race
        const horsesWithData = visibleHorseData.map((horse, index) => {
            const color = colorPalette[index % colorPalette.length];
            
            // Get this horse's races with valid data for the filter, sorted by date
            const validPerfs = (horse.performance_data || [])
                .filter((p) => p.race_date && p[filter] != null && p[filter] > 0)
                .sort((a, b) => parseDate(a.race_date) - parseDate(b.race_date))
                .slice(-8); // Last 8 races

            return {
                horse,
                color,
                perfs: validPerfs,
            };
        });

        // Collect all unique dates from visible horses only (where they have valid data)
        const allDatesSet = new Set();
        horsesWithData.forEach(({ perfs }) => {
            perfs.forEach((p) => allDatesSet.add(p.race_date));
        });
        const sortedDates = Array.from(allDatesSet).sort((a, b) => parseDate(a) - parseDate(b));
        const recentDates = sortedDates.slice(-10);

        // Format labels
        const labels = recentDates.map((d) => {
            const datePart = String(d).split('T')[0];
            const date = new Date(datePart);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });

        // Build datasets - use null-like handling by finding closest value or skipping
        const datasets = horsesWithData.map(({ horse, color, perfs }) => {
            const dataPoints = recentDates.map((date) => {
                const perf = perfs.find((p) => p.race_date === date);
                // If horse didn't race on this date, return null (we'll filter later)
                return perf ? perf[filter] : null;
            });

            // react-native-chart-kit doesn't handle nulls well, so we need to 
            // either interpolate or only plot this horse's actual races
            // For now, replace null with previous valid value (flat line to show no change)
            const filledData = [];
            let lastValid = null;
            for (const val of dataPoints) {
                if (val !== null) {
                    filledData.push(val);
                    lastValid = val;
                } else {
                    // Use last valid value to create a flat line (or 0 if no previous)
                    filledData.push(lastValid !== null ? lastValid : 0);
                }
            }

            return {
                data: filledData.length ? filledData : [0],
                color: (opacity = 1) => color,
                strokeWidth: 2,
            };
        });

        // Build legend
        const legend = horsesWithData.map(({ horse }) => horse.horse_name);

        return { labels: labels.length ? labels : [''], datasets, legend };
    }, [raceData, filter, visibleHorses]);

    if (!chartData.datasets.length) {
        return (
            <View style={styles.noData}>
                <Text style={styles.noDataText}>Select horses to compare</Text>
            </View>
        );
    }

    const chartConfig = {
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        strokeWidth: 2,
        decimalPlaces: 0,
        propsForLabels: {
            fontSize: 9,
        },
        propsForDots: {
            r: '3',
            strokeWidth: '1',
        },
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {filter === 'rating' ? 'Rating' : filter === 'speed_figure' ? 'Speed Figure' : 'Official Rating'}
            </Text>
            <LineChart
                data={{
                    labels: chartData.labels,
                    datasets: chartData.datasets,
                }}
                width={screenWidth - 32}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                withDots={true}
                withShadow={false}
                fromZero={false}
                segments={4}
            />
            {/* Custom Legend */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendScroll}>
                <View style={styles.legend}>
                    {chartData.legend.map((name, index) => (
                        <View key={name} style={styles.legendItem}>
                            <View
                                style={[
                                    styles.legendColor,
                                    { backgroundColor: colorPalette[index % colorPalette.length] }
                                ]}
                            />
                            <Text style={styles.legendText} numberOfLines={1}>
                                {name.length > 12 ? name.substring(0, 12) + '...' : name}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        margin: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#1e293b',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 8,
    },
    noData: {
        padding: 40,
        alignItems: 'center',
    },
    noDataText: {
        color: '#64748b',
        fontSize: 16,
    },
    legendScroll: {
        marginTop: 8,
    },
    legend: {
        flexDirection: 'row',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 2,
    },
    legendText: {
        fontSize: 11,
        color: '#64748b',
    },
});
