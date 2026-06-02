import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <TabNavigator /> : <AuthNavigator />;
};

const AppNavigator = () => {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default AppNavigator;
