import { Ionicons } from '@expo/vector-icons';
import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatSync } from '../hooks/useChatSync';
import { DiscoveryScreen } from '../screens/discovery/DiscoveryScreen';
import { MatchesScreen } from '../screens/matches/MatchesScreen';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { PremiumScreen } from '../screens/premium/PremiumScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors } from '../theme/colors';
import { MainTabBar } from './MainTabBar';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_LABEL_KEYS: Record<keyof MainTabParamList, string> = {
  Discover: 'nav.discover',
  Matches: 'nav.matches',
  Chat: 'nav.chat',
  Premium: 'nav.premium',
  Profile: 'nav.profile',
};

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
  const { t, i18n } = useTranslation();
  useChatSync();

  const screenOptions = useMemo(
    (): ((props: {
      route: RouteProp<MainTabParamList, keyof MainTabParamList>;
    }) => BottomTabNavigationOptions) =>
      ({ route }) => ({
        headerShown: false,
        headerStyle: { backgroundColor: colors.cream[200] },
        headerTitleStyle: { fontWeight: '700', color: colors.ink[700] },
        headerShadowVisible: false,
        // @ts-expect-error bottom-tabs supports this; community types lag behind
        sceneContainerStyle: { backgroundColor: 'transparent' },
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
        tabBarLabel: t(TAB_LABEL_KEYS[route.name]),
      }),
    [t, i18n.language],
  );

  return (
    <Tab.Navigator
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={screenOptions}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoveryScreen}
        options={{
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? 'heart' : 'heart-outline', focused),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? 'people' : 'people-outline', focused),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? 'chatbubble' : 'chatbubble-outline', focused),
        }}
      />
      <Tab.Screen
        name="Premium"
        component={PremiumScreen}
        options={{
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? 'ribbon' : 'ribbon-outline', focused),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? 'person' : 'person-outline', focused),
        }}
      />
    </Tab.Navigator>
  );
}
