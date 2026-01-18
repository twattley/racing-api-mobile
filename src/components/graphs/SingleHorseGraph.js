// Single Horse Graph Component - Shows OR, Rating, Speed Figure for one horse
import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getSurfaceColor, formatDate } from './utils';

const screenWidth = Dimensions.get('window').width;

export default function SingleHorseGraph({ selectedHorse }) {
    // Debug logging
    console.log('=== SingleHorseGraph Debug ===');
    console.log('selectedHorse:', selectedHorse?.horse_name);
    console.log('performance_data length:', selectedHorse?.performance_data?.length);
    if (selectedHorse?.performance_data?.length > 0) {
        console.log('First 3 performance records:');
        selectedHorse.performance_data.slice(0, 3).forEach((p, i) => {
            console.log(`  [${i}] date: ${p.race_date}, OR: ${p.official_rating}, rating: ${p.rating}, SF: ${p.speed_figure}`);
        });
    }

    if (!selectedHorse?.performance_data?.length) {
        return (
            <View style={styles.noData}>
                <Text style={styles.noDataText}>No performance data available</Text>
            </View>
        );
    }

    // Sort performance data by date (handle ISO strings by extracting date part)
    const parseDate = (dateStr) => {
        if (!dateStr) return 0;
        // Handle ISO format or date-only strings
        const datePart = String(dateStr).split('T')[0];
        return new Date(datePart).getTime();
    };

    const sortedData = [...selectedHorse.performance_data].sort(
        (a, b) => parseDate(a.race_date) - parseDate(b.race_date)
    );

    // Get last 10 runs for cleaner display
    const recentData = sortedData.slice(-10);

    // Extract data series
    const labels = recentData.map((d) => formatDate(d.race_date));
    const officialRatings = recentData.map((d) => d.official_rating || 0);
    const ratings = recentData.map((d) => d.rating || 0);
    const speedFigures = recentData.map((d) => d.speed_figure || 0);

    // Get surface colors for each point
    const surfaceColors = recentData.map((d) => getSurfaceColor(d.surface));

    // Calculate y-axis range
    const allValues = [...officialRatings, ...ratings, ...speedFigures].filter((v) => v > 0);
    const minVal = Math.min(...allValues, 0);
    const maxVal = Math.max(...allValues, 100);

    const chartConfig = {
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        strokeWidth: 2,
        decimalPlaces: 0,
        propsForLabels: {
            fontSize: 10,
        },
        propsForDots: {
            r: '4',
            strokeWidth: '1',
        },
    };

    const data = {
        labels,
        datasets: [
            {
                data: officialRatings,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue - OR
                strokeWidth: 2,
                strokeDashArray: [5, 5], // Dashed for OR
            },
            {
                data: ratings,
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // Green - Rating
                strokeWidth: 2,
            },
            {
                data: speedFigures,
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Red - Speed Figure
                strokeWidth: 2,
            },
        ],
        legend: ['OR', 'Rating', 'SF'],
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{selectedHorse.horse_name}</Text>
            <LineChart
                data={data}
                width={screenWidth - 32}
                height={220}
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
                yAxisLabel=""
                yAxisSuffix=""
                segments={5}
            />
            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
                    <Text style={styles.legendText}>OR (dashed)</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#22c55e' }]} />
                    <Text style={styles.legendText}>Rating</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
                    <Text style={styles.legendText}>Speed Fig</Text>
                </View>
            </View>
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
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
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
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
        gap: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    legendText: {
        fontSize: 12,
        color: '#64748b',
    },
});
