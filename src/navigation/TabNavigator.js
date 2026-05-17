import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Home from '../pages/Home';
import Sensors from '../pages/Sensors';
import WaterPump from '../pages/WaterPump';
import Charts from '../pages/Charts';
import Settings from '../pages/Settings';
import { colors, fonts, radii } from '../styles/theme';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Sensors') {
            iconName = focused ? 'thermometer' : 'thermometer';
          } else if (route.name === 'WaterPump') {
            iconName = focused ? 'water' : 'water-outline';
          } else if (route.name === 'Charts') {
            iconName = focused ? 'chart-line' : 'chart-line';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'cog' : 'cog-outline';
          }
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 10,
          shadowColor: '#0F1A14',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          height: 66,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopLeftRadius: radii.lg,
          borderTopRightRadius: radii.lg,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fonts.semibold,
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Sensors" component={Sensors} />
      <Tab.Screen name="WaterPump" component={WaterPump} />
      <Tab.Screen name="Charts" component={Charts} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
