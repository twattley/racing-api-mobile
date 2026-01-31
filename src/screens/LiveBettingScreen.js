// Live Betting Screen - Shows current betting selections
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useLiveBettingSelections, useVoidBettingSelection, useAmendBettingSelectionPrice } from '../api';

export default function LiveBettingScreen({ navigation }) {
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editedPrice, setEditedPrice] = useState('');

  const {
    data,
    error,
    isLoading,
    refetch,
    isRefetching,
  } = useLiveBettingSelections();

  const voidMutation = useVoidBettingSelection();
  const amendMutation = useAmendBettingSelectionPrice();

  const handleEditPrice = (selection) => {
    setEditingPriceId(selection.unique_id);
    setEditedPrice(selection.requested_odds?.toString() || '');
  };

  const handleCancelEdit = () => {
    setEditingPriceId(null);
    setEditedPrice('');
  };

  const handleSavePrice = async (selection) => {
    const newPrice = parseFloat(editedPrice);
    if (isNaN(newPrice) || newPrice <= 1) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than 1.00');
      return;
    }

    try {
      await amendMutation.mutateAsync({
        unique_id: selection.unique_id,
        market_id: selection.market_id,
        selection_id: selection.selection_id,
        horse_name: selection.horse_name,
        market_type: selection.market_type,
        selection_type: selection.selection_type,
        race_time: selection.race_time,
        new_requested_odds: newPrice,
        size_matched: selection.size_matched || 0,
        price_matched: selection.price_matched,
      });
      setEditingPriceId(null);
      setEditedPrice('');
      Alert.alert('Success', `Price amended to ${newPrice} for ${selection.horse_name}`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to amend price');
    }
  };

  const handleVoidSelection = (selection) => {
    Alert.alert(
      'Void Selection',
      `Are you sure you want to void the ${selection.selection_type} bet on ${selection.horse_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void',
          style: 'destructive',
          onPress: async () => {
            try {
              await voidMutation.mutateAsync({
                market_id: selection.market_id,
                selection_id: selection.selection_id,
                horse_name: selection.horse_name,
                market_type: selection.market_type,
                selection_type: selection.selection_type,
                race_time: selection.race_time,
                bet_id: selection.unique_id,
                requested_odds: selection.requested_odds,
                size_matched: selection.size_matched,
                price_matched: selection.price_matched,
              });
              Alert.alert('Success', 'Selection voided successfully');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to void selection');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '-';
    return `£${value.toFixed(2)}`;
  };

  const formatOdds = (odds) => {
    if (odds == null || isNaN(odds)) return '-';
    return odds.toFixed(2);
  };

  const getOutcomeStyle = (outcome) => {
    switch (outcome) {
      case 'WON': return styles.outcomeWon;
      case 'LOST': return styles.outcomeLost;
      case 'TO_BE_RUN': return styles.outcomePending;
      default: return styles.outcomeDefault;
    }
  };

  const getSelectionTypeStyle = (type) => {
    return type === 'LAY' ? styles.typeLay : styles.typeBack;
  };

  const getStatusStyle = (selection) => {
    if (selection.is_pending) return styles.statusPending;
    if (selection.fully_matched) return styles.statusMatched;
    return styles.statusPartial;
  };

  const getStatusText = (selection) => {
    if (selection.is_pending) return '📋 Pending';
    if (selection.fully_matched) return '✓ Matched';
    return '⏳ Partial';
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading bets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading bets</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toRunList = data?.to_run?.list ?? [];
  const ranList = data?.ran?.list ?? [];
  const hasNoData = toRunList.length === 0 && ranList.length === 0;

  if (hasNoData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No live betting selections</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.retryButton, styles.resultsButton]}
          onPress={() => navigation.navigate('BettingResults')}
        >
          <Text style={styles.retryButtonText}>View Results</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderSelection = (selection, showVoid = false) => (
    <View key={selection.unique_id} style={styles.selectionCard}>
      <View style={styles.selectionHeader}>
        <Text style={styles.horseName} numberOfLines={1}>
          {selection.horse_name}
        </Text>
        <View style={[styles.typeBadge, getSelectionTypeStyle(selection.selection_type)]}>
          <Text style={styles.typeBadgeText}>{selection.selection_type}</Text>
        </View>
        <View style={[styles.outcomeBadge, getOutcomeStyle(selection.outcome)]}>
          <Text style={styles.outcomeBadgeText}>
            {selection.outcome?.replace('_', ' ') || '-'}
          </Text>
        </View>
      </View>

      <View style={styles.selectionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Race Time:</Text>
          <Text style={styles.detailValue}>
            {selection.race_time ? new Date(selection.race_time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }) : '-'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Market:</Text>
          <Text style={styles.detailValue}>{selection.market_type || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Requested:</Text>
          {showVoid && editingPriceId === selection.unique_id ? (
            <View style={styles.editPriceContainer}>
              <TextInput
                style={styles.priceInput}
                value={editedPrice}
                onChangeText={setEditedPrice}
                keyboardType="decimal-pad"
                autoFocus
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSavePrice(selection)}
                disabled={amendMutation.isPending}
              >
                <Text style={styles.saveButtonText}>
                  {amendMutation.isPending ? '...' : '✓'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => showVoid && handleEditPrice(selection)}
              disabled={!showVoid}
            >
              <Text style={[styles.detailValue, showVoid && styles.editableValue]}>
                {formatOdds(selection.requested_odds)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Matched:</Text>
          {selection.is_pending ? (
            <Text style={[styles.detailValue, styles.pendingValue]}>
              {formatCurrency(selection.size_matched)}/{formatCurrency(selection.requested_size)}
            </Text>
          ) : (
            <Text style={styles.detailValue}>
              {formatOdds(selection.price_matched)} @ {formatCurrency(selection.size_matched)}
            </Text>
          )}
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={[styles.detailValue, getStatusStyle(selection)]}>
            {getStatusText(selection)}
          </Text>
        </View>
      </View>

      {showVoid && (
        <TouchableOpacity
          style={styles.voidButton}
          onPress={() => handleVoidSelection(selection)}
        >
          <Text style={styles.voidButtonText}>Void Selection</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.resultsLink}
        onPress={() => navigation.navigate('BettingResults')}
      >
        <Text style={styles.resultsLinkText}>View Full Results →</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* To Run Section */}
        {toRunList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              To Be Run ({toRunList.length})
            </Text>
            {toRunList.map((sel) => renderSelection(sel, true))}
          </View>
        )}

        {/* Ran Section */}
        {ranList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Completed ({ranList.length})
            </Text>
            {ranList.map((sel) => renderSelection(sel, false))}
          </View>
        )}
      </ScrollView>
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
    marginTop: 8,
  },
  resultsButton: {
    backgroundColor: '#16a34a',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsLink: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  resultsLinkText: {
    color: '#2563eb',
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#1e293b',
    color: '#fff',
    padding: 12,
  },
  selectionCard: {
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
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  horseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  typeBack: {
    backgroundColor: '#dbeafe',
  },
  typeLay: {
    backgroundColor: '#fce7f3',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  outcomeWon: {
    backgroundColor: '#dcfce7',
  },
  outcomeLost: {
    backgroundColor: '#fee2e2',
  },
  outcomePending: {
    backgroundColor: '#dbeafe',
  },
  outcomeDefault: {
    backgroundColor: '#f1f5f9',
  },
  outcomeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e293b',
  },
  selectionDetails: {
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 13,
  },
  detailValue: {
    color: '#1e293b',
    fontWeight: '500',
    fontSize: 13,
  },
  pendingValue: {
    color: '#ea580c',
    fontWeight: '600',
  },
  statusPending: {
    color: '#ea580c',
  },
  statusMatched: {
    color: '#16a34a',
  },
  statusPartial: {
    color: '#ca8a04',
  },
  editableValue: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  editPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceInput: {
    width: 70,
    height: 28,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 13,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  cancelButton: {
    backgroundColor: '#9ca3af',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  voidButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    alignItems: 'center',
  },
  voidButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
