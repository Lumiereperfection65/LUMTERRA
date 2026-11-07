# LUMTERRA

Application mobile de signalement citoyen (React Native · Expo · TypeScript · Expo Router · Supabase).

## 1. Installation
```bash
npm install
npx expo-doctor             # vérifie la compatibilité
npm run typecheck           # tsc --noEmit
```

## 2. Configuration Supabase
1. Créez un projet sur https://supabase.com et attendez la fin de son initialisation.
2. Dans **SQL Editor**, exécutez le contenu de `supabase/schema.sql`. Cela crée `profiles`, `reports`, les politiques RLS et le bucket `report-photos`.
3. Dans **Project Settings → API**, récupérez :
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Une clé **publishable** (`sb_publishable_...`) convient également.
4. Copiez `.env.example` vers `.env` (PowerShell : `Copy-Item .env.example .env`) et remplacez les deux valeurs vides par celles de votre projet.
5. Dans **Authentication → Providers → Email**, activez Email. Si la confirmation par e-mail est activée, l’utilisateur doit confirmer son adresse avant de se connecter. Vous pouvez la désactiver pour les essais.

Les deux variables `EXPO_PUBLIC_*` sont intégrées à l’application cliente : seule une clé publique/anon/publishable peut y être mise. **N’utilisez jamais une clé `service_role` ou `sb_secret_...`**. La clé `service_role` contourne les politiques RLS et ne doit exister que dans un environnement serveur sécurisé.

## 3. Lancer
```bash
npx expo start -c
```
Scannez le QR code avec Expo Go ou ouvrez le serveur web avec `npm run web`. Après toute modification de `.env`, redémarrez Expo avec `npx expo start -c`.
La carte native (react-native-maps) fonctionne sur Android/iOS ; le web affiche une liste de positions.
Pour un build Android autonome, une clé Google Maps est requise (`android.config.googleMaps.apiKey` dans app.json) ; Expo Go n'en a pas besoin.

## Données et accès
Les signalements sont visibles par les utilisateurs authentifiés pour alimenter la carte collective. Seul leur auteur peut modifier ou supprimer un signalement. Les photos sont stockées dans le bucket public `report-photos` (leurs URL sont donc accessibles à toute personne qui les connaît) ; l’envoi et la suppression sont limités au dossier de l’utilisateur. Les statuts disponibles sont `pending`, `in_progress` et `resolved`.

## Structure
`app/` routes (auth, tabs, report/[id]) · `components/` · `services/` Supabase · `hooks/` · `constants/` · `types/` · `supabase/schema.sql` · `assets/`
