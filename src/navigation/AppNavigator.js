import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <TabNavigator /> : <AuthNavigator />;
};

const AppWrapper = () => {
  const { colors } = useTheme();

  // Create high-end outer background matching the theme mode
  const isDark = colors.background === '#0D1410';
  const outerBg = isDark ? '#060B08' : '#E2EAE5';

  return (
    <View style={[styles.outerContainer, { backgroundColor: outerBg }]}>
      <View style={[styles.webWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <NavigationContainer>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </NavigationContainer>
      </View>
    </View>
  );
};

const AppNavigator = () => {
  return (
    <ThemeProvider>
      <AppWrapper />
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  outerContainer: Platform.select({
    web: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    },
    default: {
      flex: 1,
    },
  }),
  webWrapper: Platform.select({
    web: {
      flex: 1,
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      borderLeftWidth: 1,
      borderRightWidth: 1,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 10,
    },
    default: {
      flex: 1,
    },
  }),
});

export default AppNavigator;
