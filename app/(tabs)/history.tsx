import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ReportCard } from '@/components/ReportCard';
import { Screen } from '@/components/Screen';
import { Loading, Title } from '@/components/ui';
import { STATUS_META, STATUSES } from '@/constants/config';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import type { ReportStatus } from '@/types';

export default function History() {
  const { user } = useAuth();
  const { reports, loading, refresh } = useReports(user?.id);
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all');
  const list = filter === 'all' ? reports : reports.filter((r) => r.status === filter);

  return (
    <Screen onRefresh={refresh} refreshing={loading}>
      <Title sub="Suivez l'avancement de vos signalements">Historique</Title>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {(['all', ...STATUSES] as const).map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: filter === f ? colors.emerald : colors.white, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: filter === f ? colors.white : colors.text, fontWeight: '600' }}>{f === 'all' ? 'Tous' : STATUS_META[f].label}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? <Loading /> : list.length === 0 ? <Text style={{ color: colors.muted }}>Aucun signalement.</Text> : list.map((r) => <ReportCard key={r.id} report={r} />)}
    </Screen>
  );
}
