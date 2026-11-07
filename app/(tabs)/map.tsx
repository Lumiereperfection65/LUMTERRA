import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ReportMap } from '@/components/ReportMap';
import { colors } from '@/constants/theme';
import { useReports } from '@/hooks/useReports';

export default function MapScreen() {
  const router = useRouter();
  const { reports, error } = useReports();
  return (
    <View style={s.root}>
      <ReportMap reports={reports} onSelect={(r) => router.push({ pathname: '/report/[id]', params: { id: r.id } })} />
      <View style={s.legend}>
        <Text style={s.item}>🟠 En attente</Text><Text style={s.item}>🔵 En cours</Text><Text style={s.item}>🟢 Résolu</Text>
        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  legend: { position: 'absolute', top: 50, left: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 10, flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' },
  item: { fontSize: 12, fontWeight: '600', color: colors.text },
});
