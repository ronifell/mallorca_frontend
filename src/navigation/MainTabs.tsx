import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DiscoveryScreen } from '../screens/discovery/DiscoveryScreen';
import { MatchesScreen } from '../screens/matches/MatchesScreen';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { PremiumScreen } from '../screens/premium/PremiumScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors } from '../theme/colors';
import { MainTabBar } from './MainTabBar';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function tabIcon(name: keyof typeof Ionicons.glyphMap, focused: boolean) {
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? colors.coral[500] : colors.ink[400]}
    />
  );
}

export function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream[200] },
        headerTitleStyle: { fontWeight: '700', color: colors.ink[700] },
        headerShadowVisible: false,
        sceneContainerStyle: { backgroundColor: colors.cream[200] },
        safeAreaInsets: { bottom: 0 },
        tabBarActiveTintColor: colors.coral[500],
        tabBarInactiveTintColor: colors.ink[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          elevation: 0,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoveryScreen}
        options={{
          headerShown: false,
          title: t('nav.discover'),
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? 'heart' : 'heart-outline', focused),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          title: t('nav.matches'),
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? 'people' : 'people-outline', focused),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          title: t('nav.chat'),
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? 'chatbubble' : 'chatbubble-outline', focused),
        }}
      />
      <Tab.Screen
        name="Premium"
        component={PremiumScreen}
        options={{
          title: t('nav.premium'),
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? 'ribbon' : 'ribbon-outline', focused),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          title: t('nav.profile'),
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? 'person' : 'person-outline', focused),
        }}
      />
    </Tab.Navigator>
  );
}
