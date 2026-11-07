import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button, Card, Input, Title } from '@/components/ui';
import { CATEGORIES } from '@/constants/config';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { createReport } from '@/services/reports';

type Coords = { latitude: number; longitude: number };

/** Assistant en 3 étapes : 1) Photo  2) Géolocalisation  3) Détails. */
export default function NewReport() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission refusée', "Autorisez l'accès dans les réglages de l'appareil.");
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled) setPhoto(res.assets[0].uri);
  };

  const locate = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permission refusée', 'La localisation est nécessaire pour situer le signalement.');
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ latitude: p.coords.latitude, longitude: p.coords.longitude });
    } catch (e: any) { Alert.alert('Localisation impossible', e?.message ?? 'Réessayez.'); }
    finally { setLocating(false); }
  };

  const submit = async () => {
    if (!user || !coords) return;
    if (!title.trim()) return Alert.alert('Titre requis', 'Donnez un titre au signalement.');
    setBusy(true);
    try {
      const r = await createReport(user.id, { title: title.trim(), category, description: description.trim(), ...coords, photoUri: photo });
      setStep(1); setPhoto(null); setCoords(null); setTitle(''); setDescription(''); setCategory(CATEGORIES[0]);
      router.push({ pathname: '/report/[id]', params: { id: r.id } });
    } catch (e: any) { Alert.alert("Échec de l'envoi", e?.message ?? 'Erreur inconnue'); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <Title sub={`Étape ${step} sur 3`}>{step === 1 ? 'Photo' : step === 2 ? 'Géolocalisation' : 'Détails'}</Title>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3].map((i) => <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= step ? colors.emerald : colors.border }} />)}
      </View>

      {step === 1 && (
        <Card style={{ gap: 12 }}>
          {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: 240, borderRadius: 16 }} /> : <View style={{ height: 160, borderRadius: 16, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }}><Camera color={colors.turquoise} size={40} /><Text style={{ color: colors.muted, marginTop: 6 }}>Aucune photo (facultative)</Text></View>}
          <Button title="Prendre une photo" icon={<Camera color={colors.white} size={18} />} onPress={() => pick(true)} />
          <Button title="Choisir dans la galerie" variant="outline" icon={<ImageIcon color={colors.emerald} size={18} />} onPress={() => pick(false)} />
          <Button title="Suivant" onPress={() => setStep(2)} />
        </Card>
      )}

      {step === 2 && (
        <Card style={{ gap: 12 }}>
          <View style={{ alignItems: 'center', gap: 6, padding: 12 }}>
            <MapPin color={coords ? colors.emerald : colors.muted} size={40} />
            <Text style={{ color: colors.text, fontWeight: '600' }}>{coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Position non définie'}</Text>
          </View>
          <Button title={coords ? 'Actualiser ma position' : 'Utiliser ma position GPS'} variant={coords ? 'outline' : 'primary'} onPress={locate} loading={locating} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Button title="Retour" variant="outline" onPress={() => setStep(1)} /></View>
            <View style={{ flex: 1 }}><Button title="Suivant" disabled={!coords} onPress={() => setStep(3)} /></View>
          </View>
        </Card>
      )}

      {step === 3 && (
        <Card style={{ gap: 14 }}>
          <Input label="Titre" value={title} onChangeText={setTitle} placeholder="Ex. : Nid-de-poule avenue principale" />
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>Catégorie</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map((c) => (
                <Pressable key={c} onPress={() => setCategory(c)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: category === c ? colors.turquoise : colors.mint }}>
                  <Text style={{ color: category === c ? colors.white : colors.emeraldDark, fontWeight: '600' }}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Input label="Description" value={description} onChangeText={setDescription} multiline placeholder="Décrivez le problème…" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Button title="Retour" variant="outline" onPress={() => setStep(2)} /></View>
            <View style={{ flex: 1 }}><Button title="Envoyer" onPress={submit} loading={busy} /></View>
          </View>
        </Card>
      )}
    </Screen>
  );
}
