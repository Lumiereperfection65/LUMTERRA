import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Input, Title } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/services/supabase';

export default function Register() {
  const { signUp, initializationError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) return Alert.alert('Champs requis', 'Nom, e-mail et mot de passe (6 caractères min.).');
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(email.trim(), password, name.trim());
      if (needsConfirmation) Alert.alert('Compte créé', 'Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.');
    } catch (error: unknown) { Alert.alert('Inscription impossible', error instanceof Error ? error.message : 'Erreur inconnue'); }
    finally { setBusy(false); }
  };

  return (
    <Screen style={{ paddingTop: 40 }}>
      <Title sub="Rejoignez la communauté LUMTERRA">Créer un compte</Title>
      {initializationError && <Banner tone="danger" text={`Impossible de restaurer la session : ${initializationError}`} />}
      {!isSupabaseConfigured && <Banner text="Supabase n'est pas configuré : renseignez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env puis relancez avec « npx expo start -c »." />}
      <Card style={{ gap: 14 }}>
        <Input label="Nom complet" value={name} onChangeText={setName} placeholder="Votre nom" />
        <Input label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="vous@exemple.com" />
        <Input label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry placeholder="6 caractères minimum" />
        <Button title="S'inscrire" onPress={submit} loading={busy} />
      </Card>
      <Link href="/login" style={{ textAlign: 'center', color: colors.emerald, fontWeight: '700' }}>Déjà un compte ? Se connecter</Link>
    </Screen>
  );
}
