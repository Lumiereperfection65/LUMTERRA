import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { ReportCard, StatCard } from '@/components/ReportCard';
import { Screen } from '@/components/Screen';
import { Banner, Button, Loading, Title } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { reports, loading, error, refresh } = useReports(user?.id);
  const name = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? '';
  const count = (s: string) => reports.filter((r) => r.status === s).length;

  return (
    <Screen onRefresh={refresh} refreshing={loading}>
      <View style={{ backgroundColor: colors.emerald, borderRadius: 24, padding: 20, gap: 4 }}>
        <Text style={{ color: colors.mint, fontSize: 14 }}>Bonjour{name ? `, ${name}` : ''} 👋</Text>
        <Text style={{ color: colors.white, fontSize: 22, fontWeight: '800' }}>Ensemble, améliorons notre territoire</Text>
      </View>
      <Button title="Nouveau signalement" icon={<Plus color={colors.white} />} onPress={() => router.push('/new')} />
      {error && <Banner tone="danger" text={error} />}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <StatCard label="Total" value={reports.length} color={colors.emeraldDark} />
        <StatCard label="En attente" value={count('pending')} color={colors.warning} />
        <StatCard label="En cours" value={count('in_progress')} color={colors.turquoise} />
        <StatCard label="Résolus" value={count('resolved')} color={colors.emerald} />
      </View>
      <Title>Derniers signalements</Title>
      {loading ? <Loading /> : reports.length === 0
        ? <Text style={{ color: colors.muted }}>Aucun signalement pour le moment. Créez le premier !</Text>
        : reports.slice(0, 3).map((r) => <ReportCard key={r.id} report={r} />)}
    </Screen>
  );
}
