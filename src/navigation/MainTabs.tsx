import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DiscoveryScreen } from '../screens/discovery/DiscoveryScreen';
import { MatchesScreen } from '../screens/matches/MatchesScreen';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors } from '../theme/colors';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function tabIcon(label: string, focused: boolean) {
  return (
    <Text style={{ fontSize: 22, color: focused ? colors.brand[500] : colors.ink[400] }}>
      {label}
    </Text>
  );
}

export function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream[200] },
        headerTitleStyle: { fontWeight: '700', color: colors.ink[700] },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.brand[500],
        tabBarInactiveTintColor: colors.ink[400],
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: colors.cream[300],
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoveryScreen}
        options={{
          title: t('nav.discover'),
          tabBarIcon: ({ focused }) => tabIcon('♥', focused),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          title: t('nav.matches'),
          tabBarIcon: ({ focused }) => tabIcon('✦', focused),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          title: t('nav.chat'),
          tabBarIcon: ({ focused }) => tabIcon('✉', focused),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ focused }) => tabIcon('☻', focused),
        }}
      />
    </Tab.Navigator>
  );
}
