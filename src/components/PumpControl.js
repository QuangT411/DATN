import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PumpControl = ({ autoMode, onToggleAuto, onPumpOn, onPumpOff, pumpOn, loading }) => {
  return (
    <View style={styles.container}>
      <View style={styles.autoRow}>
        <MaterialCommunityIcons name="autorenew" size={24} color="#2E7D32" />
        <Text style={styles.autoLabel}>Auto Mode</Text>
        <Switch
          value={autoMode}
          onValueChange={onToggleAuto}
          trackColor={{ false: '#ccc', true: '#81C784' }}
          thumbColor={autoMode ? '#2E7D32' : '#f4f3f4'}
          disabled={loading}
        />
      </View>

      <Text style={styles.desc}>
        {autoMode ? 'Hệ thống tự động tưới' : 'Chế độ thủ công'}
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.onButton]}
          onPress={onPumpOn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="power-on" size={20} color="#fff" />
              <Text style={styles.buttonText}>Pump ON</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.offButton]}
          onPress={onPumpOff}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="power-off" size={20} color="#fff" />
              <Text style={styles.buttonText}>Pump OFF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  autoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  autoLabel: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  desc: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    paddingLeft: 34,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 48,
    gap: 8,
  },
  onButton: {
    backgroundColor: '#1565C0',
  },
  offButton: {
    backgroundColor: '#c62828',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default PumpControl;
