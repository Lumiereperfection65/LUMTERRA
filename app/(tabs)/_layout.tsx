import { Tabs } from 'expo-router';
import { History, Home, Map as MapIcon, PlusCircle, User } from 'lucide-react-native';
import React from 'react';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.emerald, tabBarInactiveTintColor: colors.muted, tabBarStyle: { borderTopColor: colors.border, height: 62, paddingBottom: 8, paddingTop: 6 } }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="map" options={{ title: 'Carte', tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} /> }} />
      <Tabs.Screen name="new" options={{ title: 'Signaler', tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size + 4} /> }} />
      <Tabs.Screen name="history" options={{ title: 'Historique', tabBarIcon: ({ color, size }) => <History color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  );
}
