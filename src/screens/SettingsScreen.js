// Settings Screen - Configure API endpoint
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { getApiBase, setApiBase, clearApiBaseCache } from '../api';
import { useQueryClient } from '@tanstack/react-query';

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadCurrentUrl();
  }, []);

  const loadCurrentUrl = async () => {
    const url = await getApiBase();
    setApiUrl(url);
    setSavedUrl(url);
  };

  const handleSave = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    // Basic URL validation
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      Alert.alert('Error', 'URL must start with http:// or https://');
      return;
    }

    setIsSaving(true);
    try {
      const success = await setApiBase(apiUrl.trim());
      if (success) {
        setSavedUrl(apiUrl.trim());
        // Clear all cached queries so they refetch with new URL
        clearApiBaseCache();
        queryClient.clear();
        Alert.alert('Success', 'API URL saved successfully');
      } else {
        Alert.alert('Error', 'Failed to save URL');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save URL');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const testUrl = `${apiUrl.trim()}/today/todays-race-times`;
      const response = await fetch(testUrl);
      if (response.ok) {
        Alert.alert('Success', 'Connection successful! ✓');
      } else {
        Alert.alert('Connection Failed', `Server responded with status ${response.status}`);
      }
    } catch (err) {
      Alert.alert(
        'Connection Failed',
        'Could not connect to the API. Make sure:\n\n' +
        '1. The URL is correct\n' +
        '2. Your API server is running\n' +
        '3. Tailscale is connected (if using remote access)\n\n' +
        `Error: ${err.message}`
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Configuration</Text>
          <Text style={styles.description}>
            Enter your Racing API server URL. If using Tailscale, use your Mac mini's
            Tailscale IP address (e.g., http://100.x.x.x:3000/racing-api/api/v2)
          </Text>

          <Text style={styles.label}>API Base URL</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://100.x.x.x:3000/racing-api/api/v2"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          {savedUrl !== apiUrl && (
            <Text style={styles.unsavedNote}>* Unsaved changes</Text>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={handleTestConnection}
            >
              <Text style={styles.testButtonText}>Test Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, isSaving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tailscale Setup</Text>
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>Using Tailscale for Remote Access</Text>
            <Text style={styles.helpText}>
              1. Install Tailscale on your iPhone from the App Store{'\n'}
              2. Sign in with the same account as your Mac mini{'\n'}
              3. Connect to your Tailnet{'\n'}
              4. Find your Mac mini's Tailscale IP by running:{'\n'}
              {'   '}tailscale ip -4{'\n'}
              5. Use that IP in the URL above
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current API URL</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {savedUrl || 'Not configured'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#f8fafc',
  },
  unsavedNote: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  testButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  helpBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#15803d',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 14,
  },
  infoValue: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
});
