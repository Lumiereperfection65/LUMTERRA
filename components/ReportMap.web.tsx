import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { STATUS_META } from '@/constants/config';
import { colors } from '@/constants/theme';
import type { Report } from '@/types';

/** La carte native n'est pas disponible sur le web : liste des positions à la place. */
export function ReportMap({ reports, onSelect }: { reports: Report[]; onSelect: (r: Report) => void }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
      <Text style={{ color: colors.muted }}>La carte interactive est disponible sur Android et iOS (Expo Go). Positions des signalements :</Text>
      {reports.map((r) => (
        <Pressable key={r.id} onPress={() => onSelect(r)} style={{ backgroundColor: colors.white, padding: 12, borderRadius: 12 }}>
          <View><Text style={{ fontWeight: '700' }}>{r.title} · {STATUS_META[r.status].label}</Text>
          <Text style={{ color: colors.muted }}>{r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}</Text></View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
