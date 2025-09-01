// app/navigation/AppTabs.tsx
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import DailyHoursScreen from '../screens/hours/DailyHoursScreen';
import MonthlySummaryScreen from '../screens/hours/MonthlySummaryScreen';
import RequestsScreen from '../screens/hours/RequestsScreen';
import ProfileScreen from '../screens/misc/ProfileScreen';
import LeaderboardScreen from '../screens/misc/LeaderboardScreen';
// ÜNS: RequestsScreen üçin dogry ýol

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Daily"
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800' },

        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: styles.tabBar,

        tabBarBackground: () => (
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        ),

        tabBarIcon: ({ focused, color, size }) => {
          let name: keyof typeof Ionicons.glyphMap = 'ellipse';
          switch (route.name) {
            case 'Daily':
              name = focused ? 'time' : 'time-outline';
              break;
            case 'Summary':
              name = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Leaderboard':
              name = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Requests':
              // Ionicons-da “request” ýok — dokument ikonkasyny ulanýarys
              name = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Profile':
              name = focused ? 'person' : 'person-outline';
              break;
          }
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Daily"
        component={DailyHoursScreen}
        options={{ title: 'Ежедневные', headerTitle: 'Ежедневные часы' }}
      />
      <Tab.Screen
        name="Summary"
        component={MonthlySummaryScreen}
        options={{ title: 'Итоги', headerTitle: 'Итоги месяца' }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: 'Топ', headerTitle: 'Топ работники' }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{ title: 'Заявки', headerTitle: 'Заявки' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Профиль', headerTitle: 'Профиль' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    height: 64,
    borderRadius: 18,
    paddingBottom: 8,
    paddingTop: 6,
    borderTopWidth: 0,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'android' ? 'rgba(15,23,42,0.8)' : 'transparent',
    // web-de shadow* yerine boxShadow ulan
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 10px 20px rgba(0,0,0,0.25)' }
      : { elevation: 10 }),
  },
});
