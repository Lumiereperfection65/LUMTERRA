# LUMTERRA — Terre de lumière

Application web de signalement citoyen construite avec React, Vite, TypeScript, Supabase et PostgreSQL.

## Prérequis

- Node.js 22 ou plus récent
- npm
- Un projet Supabase pour l’authentification, les données et le stockage de photos
- Facultatif : une clé Gemini pour l’analyse de photos (serveur uniquement)

## Installation et configuration

```bash
npm install
```

### Mode démo local (par défaut)

Aucune configuration Supabase n’est requise. Vous pouvez lancer l’interface immédiatement :

```bash
npm run dev
```

Le mode démo propose l’inscription, la connexion, les signalements, la carte, le tableau de bord et l’historique, avec des données conservées dans le `localStorage` du navigateur. Les comptes sont propres à ce navigateur. Les photos sont facultatives en démo et limitées à 500 Ko.

### Mode production avec Supabase

Copiez `.env.example` vers `.env`, définissez `VITE_APP_MODE=production`, puis renseignez les valeurs fournies par votre projet Supabase :

```dotenv
VITE_APP_MODE=production
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-ou-publishable-key>
GEMINI_API_KEY=
```

Seules l’URL Supabase et la clé publique anon/publishable sont destinées au client. N’utilisez jamais de clé `service_role`, `sb_secret_*` ou de clé Gemini dans une variable `VITE_*`. `GEMINI_API_KEY` est facultative et reste côté serveur.

Vérifiez que l’URL utilise `https://` et que la clé est la clé publique **anon** ou **publishable** (les clés anon JWT historiques et `sb_publishable_*` sont prises en charge). Vite refuse de démarrer ou de construire le client si `VITE_SUPABASE_ANON_KEY` contient une clé `service_role` ou `sb_secret_*`.

Dans le SQL Editor Supabase, exécutez `supabase/schema.sql`, puis `supabase/seed.sql`. Activez l’authentification par e-mail dans les paramètres Supabase. Le schéma crée les politiques RLS et le bucket public `report-photos` (lecture publique des images, dépôt limité au dossier de l’utilisateur). Attribuez les rôles `AGENT` et `ADMIN` de manière contrôlée dans la base ; ne permettez pas aux utilisateurs de s’attribuer eux-mêmes un rôle.

En production, les variables Supabase sont obligatoires pour l’authentification et les données. Le projet refuse toute clé secrète dans les variables client.

Pour revenir en mode démo, définissez `VITE_APP_MODE=demo` dans `.env` (ou supprimez la variable), puis redémarrez Vite. Les données de démo ne sont jamais envoyées vers Supabase.

## Développement

```bash
npm run dev
```

Ouvrez http://localhost:3000. Le serveur fournit le frontend Vite et l’API Gemini, lorsqu’elle est configurée.

## Vérification et production

```bash
npm run typecheck
npm run build
npm start
```

`npm start` sert le build de production sur le port `3000` (ou la valeur de `PORT`). Le serveur API vérifie l’authentification Supabase avant de transmettre une photo à Gemini. Les rapports et images restent stockés dans Supabase.
