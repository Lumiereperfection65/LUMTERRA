import { LogOut, Mail, User as UserIcon } from 'lucide-react-native';
import React from 'react';
import { Alert, Text, View } from 'react-native';
import { StatCard } from '@/components/ReportCard';
import { Screen } from '@/components/Screen';
import { Button, Card, Title } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { reports } = useReports(user?.id);
  const name = (user?.user_metadata?.full_name as string | undefined) ?? 'Utilisateur';
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: unknown) {
      Alert.alert('Déconnexion impossible', error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };
  return (
    <Screen>
      <Title>Profil</Title>
      <Card style={{ alignItems: 'center', gap: 8 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center' }}>
          <UserIcon color={colors.white} size={40} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{name}</Text>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Mail size={14} color={colors.muted} /><Text style={{ color: colors.muted }}>{user?.email}</Text></View>
      </Card>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard label="Signalements" value={reports.length} color={colors.emeraldDark} />
        <StatCard label="Résolus" value={reports.filter((r) => r.status === 'resolved').length} color={colors.emerald} />
      </View>
      <Button title="Se déconnecter" variant="danger" icon={<LogOut color={colors.white} size={18} />} onPress={handleSignOut} />
    </Screen>
  );
}
