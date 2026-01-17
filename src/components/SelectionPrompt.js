// Selection Prompt Modal - For placing bets
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

export default function SelectionPrompt({
    visible,
    onClose,
    onConfirm,
    defaultSide = 'back',
    defaultPrice,
    marketLabel = 'win',
    title = 'Place selection',
}) {
    const [side, setSide] = useState(defaultSide);
    const [price, setPrice] = useState(String(defaultPrice ?? ''));
    const [points, setPoints] = useState(1);
    const inputRef = useRef(null);

    useEffect(() => {
        if (visible) {
            setSide(defaultSide);
            setPrice(String(defaultPrice ?? ''));
            setPoints(1);
            setTimeout(() => inputRef.current?.focus?.(), 100);
        }
    }, [visible, defaultSide, defaultPrice]);

    const submit = () => {
        const num = Number(price);
        const finalPrice = Number.isFinite(num) ? num : Number(defaultPrice);
        onConfirm?.({ backLay: side, price: finalPrice, points });
    };

    const label = side === 'back' ? 'Lowest price to take' : 'Highest price to lay';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={[
                    styles.container,
                    side === 'back' ? styles.containerBack : styles.containerLay
                ]}>
                    {/* Title */}
                    <View style={[
                        styles.titleContainer,
                        side === 'back' ? styles.titleBack : styles.titleLay
                    ]}>
                        <Text style={[
                            styles.title,
                            side === 'back' ? styles.titleTextBack : styles.titleTextLay
                        ]}>
                            {title}
                        </Text>
                    </View>

                    {/* Market label */}
                    <Text style={styles.marketLabel}>Market: {marketLabel}</Text>

                    {/* Back/Lay toggle */}
                    <View style={styles.sideButtons}>
                        <TouchableOpacity
                            style={[
                                styles.sideButton,
                                side === 'back' ? styles.sideButtonBackActive : styles.sideButtonInactive
                            ]}
                            onPress={() => setSide('back')}
                        >
                            <Text style={[
                                styles.sideButtonText,
                                side === 'back' && styles.sideButtonTextActive
                            ]}>
                                Back
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.sideButton,
                                side === 'lay' ? styles.sideButtonLayActive : styles.sideButtonInactive
                            ]}
                            onPress={() => setSide('lay')}
                        >
                            <Text style={[
                                styles.sideButtonText,
                                side === 'lay' && styles.sideButtonTextActive
                            ]}>
                                Lay
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Price input */}
                    <Text style={styles.inputLabel}>{label}</Text>
                    <TextInput
                        ref={inputRef}
                        style={styles.priceInput}
                        keyboardType="decimal-pad"
                        value={price}
                        onChangeText={setPrice}
                        placeholder="Enter price"
                        placeholderTextColor="#94a3b8"
                    />

                    {/* Points selection */}
                    <Text style={styles.inputLabel}>Stake (points)</Text>
                    <View style={styles.pointsRow}>
                        {[0.5, 1, 1.5, 2].map((p) => {
                            const active = points === p;
                            return (
                                <TouchableOpacity
                                    key={p}
                                    style={[
                                        styles.pointButton,
                                        active && (side === 'back' ? styles.pointButtonBackActive : styles.pointButtonLayActive)
                                    ]}
                                    onPress={() => setPoints(p)}
                                >
                                    <Text style={[
                                        styles.pointButtonText,
                                        active && styles.pointButtonTextActive
                                    ]}>
                                        {p}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Action buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                side === 'back' ? styles.confirmButtonBack : styles.confirmButtonLay
                            ]}
                            onPress={submit}
                        >
                            <Text style={styles.confirmButtonText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '90%',
        maxWidth: 400,
        padding: 20,
        borderWidth: 2,
    },
    containerBack: {
        borderColor: '#bfdbfe',
    },
    containerLay: {
        borderColor: '#fbcfe8',
    },
    titleContainer: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    titleBack: {
        backgroundColor: '#eff6ff',
    },
    titleLay: {
        backgroundColor: '#fdf2f8',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
    },
    titleTextBack: {
        color: '#1e40af',
    },
    titleTextLay: {
        color: '#9d174d',
    },
    marketLabel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16,
    },
    sideButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    sideButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    sideButtonInactive: {
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
    },
    sideButtonBackActive: {
        backgroundColor: '#bfdbfe',
        borderColor: '#93c5fd',
    },
    sideButtonLayActive: {
        backgroundColor: '#fbcfe8',
        borderColor: '#f9a8d4',
    },
    sideButtonText: {
        fontSize: 16,
        color: '#475569',
    },
    sideButtonTextActive: {
        fontWeight: '600',
    },
    inputLabel: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 8,
    },
    priceInput: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 18,
        marginBottom: 20,
        color: '#1e293b',
    },
    pointsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    pointButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
    },
    pointButtonBackActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    pointButtonLayActive: {
        backgroundColor: '#db2777',
        borderColor: '#db2777',
    },
    pointButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    pointButtonTextActive: {
        color: '#fff',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#475569',
    },
    confirmButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    confirmButtonBack: {
        backgroundColor: '#2563eb',
    },
    confirmButtonLay: {
        backgroundColor: '#db2777',
    },
    confirmButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});
