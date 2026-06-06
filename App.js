import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { MqttProvider } from './src/context/MqttContext';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  // Trên web: fontsLoaded không bao giờ = true vì font load qua CSS
  // → phải dùng Platform.OS để bỏ qua chờ, tránh màn trắng
  if (Platform.OS !== 'web' && !fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0D1410" />
      <MqttProvider>
        <AppNavigator />
      </MqttProvider>
    </SafeAreaProvider>
  );
}
