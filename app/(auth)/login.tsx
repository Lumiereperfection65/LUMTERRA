import { Link } from 'expo-router';
import { Leaf } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Input } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/services/supabase';

export default function Login() {
  const { signIn, initializationError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) return Alert.alert('Champs requis', 'Saisissez votre e-mail et votre mot de passe.');
    setBusy(true);
    try { await signIn(email.trim(), password); }
    catch (error: unknown) { Alert.alert('Connexion impossible', error instanceof Error ? error.message : 'Erreur inconnue'); }
    finally { setBusy(false); }
  };

  return (
    <Screen style={{ justifyContent: 'center', minHeight: 700 }}>
      <View style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <View style={{ backgroundColor: colors.emerald, padding: 16, borderRadius: 24 }}><Leaf color={colors.white} size={36} /></View>
        <Text style={{ fontSize: 32, fontWeight: '900', color: colors.emeraldDark, letterSpacing: 2 }}>LUMTERRA</Text>
        <Text style={{ color: colors.muted }}>Signalez, suivez, améliorez votre territoire</Text>
      </View>
      {initializationError && <Banner tone="danger" text={`Impossible de restaurer la session : ${initializationError}`} />}
      {!isSupabaseConfigured && <Banner text="Supabase n'est pas configuré : renseignez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env puis relancez avec « npx expo start -c »." />}
      <Card style={{ gap: 14 }}>
        <Input label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="vous@exemple.com" />
        <Input label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        <Button title="Se connecter" onPress={submit} loading={busy} />
      </Card>
      <Link href="/register" style={{ textAlign: 'center', color: colors.emerald, fontWeight: '700' }}>Pas de compte ? Créer un compte</Link>
    </Screen>
  );
}
