import { useRouter } from 'expo-router';
import { ChevronRight, MapPin } from 'lucide-react-native';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { STATUS_META } from '@/constants/config';
import { colors, radius, shadow } from '@/constants/theme';
import type { Report, ReportStatus } from '@/types';

export function StatusBadge({ status }: { status: ReportStatus }) {
  const m = STATUS_META[status];
  return <View style={[s.badge, { backgroundColor: m.bg }]}><Text style={{ color: m.color, fontWeight: '700', fontSize: 12 }}>{m.label}</Text></View>;
}

export function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[s.stat, { borderLeftColor: color }]}>
      <Text style={{ fontSize: 26, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
    </View>
  );
}

export function ReportCard({ report }: { report: Report }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push({ pathname: '/report/[id]', params: { id: report.id } })} style={s.card}>
      {report.photo_url ? <Image source={{ uri: report.photo_url }} style={s.thumb} /> : <View style={[s.thumb, s.noPhoto]}><MapPin color={colors.turquoise} /></View>}
      <View style={{ flex: 1, gap: 4 }}>
        <Text numberOfLines={1} style={s.title}>{report.title}</Text>
        <Text style={s.meta}>{report.category} · {new Date(report.created_at).toLocaleDateString('fr-FR')}</Text>
        <StatusBadge status={report.status} />
      </View>
      <ChevronRight color={colors.muted} size={20} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  stat: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.md, padding: 14, borderLeftWidth: 5, ...shadow },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: radius.lg, padding: 12, ...shadow },
  thumb: { width: 64, height: 64, borderRadius: radius.md },
  noPhoto: { backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
});
