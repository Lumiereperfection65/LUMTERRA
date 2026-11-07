import { useLocalSearchParams } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Text, View } from 'react-native';
import { StatusBadge } from '@/components/ReportCard';
import { Screen } from '@/components/Screen';
import { Button, Card, Loading } from '@/components/ui';
import { STATUS_META, STATUSES } from '@/constants/config';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getReport, updateStatus } from '@/services/reports';
import type { Report, ReportStatus } from '@/types';

export default function ReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { getReport(id).then(setReport).catch((e) => setError(e.message)); }, [id]);

  const change = async (s: ReportStatus) => {
    if (!report) return;
    try { await updateStatus(report.id, s); setReport({ ...report, status: s }); }
    catch (e: any) { Alert.alert('Mise à jour impossible', e?.message ?? 'Erreur'); }
  };

  if (error) return <Screen><Text style={{ color: colors.danger }}>{error}</Text></Screen>;
  if (!report) return <Screen><Loading /></Screen>;
  const mine = report.user_id === user?.id;

  return (
    <Screen>
      {report.photo_url && <Image source={{ uri: report.photo_url }} style={{ width: '100%', height: 240, borderRadius: 24 }} />}
      <Card style={{ gap: 10 }}>
        <StatusBadge status={report.status} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{report.title}</Text>
        <Text style={{ color: colors.muted }}>{report.category} · {new Date(report.created_at).toLocaleString('fr-FR')}</Text>
        <Text style={{ color: colors.text, lineHeight: 22 }}>{report.description || 'Aucune description.'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MapPin size={16} color={colors.emerald} /><Text style={{ color: colors.muted }}>{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</Text>
        </View>
        <Button title="Ouvrir dans Maps" variant="outline" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`)} />
      </Card>
      {mine && (
        <Card style={{ gap: 10 }}>
          <Text style={{ fontWeight: '700', color: colors.text }}>Mettre à jour le statut</Text>
          {STATUSES.map((s) => <Button key={s} title={STATUS_META[s].label} variant={report.status === s ? 'primary' : 'outline'} onPress={() => change(s)} />)}
        </Card>
      )}
    </Screen>
  );
}
