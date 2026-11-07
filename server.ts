import express, { type ErrorRequestHandler } from 'express';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const imageDataPattern = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;
const maxImageBytes = 8 * 1024 * 1024;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '11mb' }));

  app.post('/api/analyze-report', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'Analyse IA indisponible : configurez GEMINI_API_KEY côté serveur.' });
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const authorization = req.header('authorization');
    const accessToken = authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!supabaseUrl || !supabaseAnonKey) {
      res.status(503).json({ error: 'Analyse IA indisponible : configurez les variables Supabase côté serveur.' });
      return;
    }
    if (!accessToken) {
      res.status(401).json({ error: 'Une session authentifiée est requise pour analyser une photo.' });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    let user: { id: string } | null = null;
    try {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (error) {
        res.status(401).json({ error: 'La session a expiré. Reconnectez-vous puis réessayez.' });
        return;
      }
      user = data.user;
    } catch (error) {
      console.error('Unable to verify Supabase session for image analysis:', error);
      res.status(503).json({ error: 'Impossible de vérifier la session Supabase pour le moment.' });
      return;
    }
    if (!user) {
      res.status(401).json({ error: 'La session a expiré. Reconnectez-vous puis réessayez.' });
      return;
    }

    const imageBase64: unknown = req.body?.imageBase64;
    if (typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'Une image encodée est requise.' });
      return;
    }

    const match = imageDataPattern.exec(imageBase64);
    if (!match) {
      res.status(400).json({ error: 'Format image invalide. Formats pris en charge : JPEG, PNG et WebP.' });
      return;
    }

    const [, mimeType, data] = match;
    if (Buffer.from(data, 'base64').byteLength > maxImageBytes) {
      res.status(413).json({ error: 'La photo dépasse la taille maximale autorisée de 8 Mo.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [
            {
              text: `Analyse cette photo de signalement urbain pour LUMTERRA. Identifie le problème et suggère une catégorie parmi : Nids-de-poule, Déchets, Inondations, Éclairage, Routes, Canalisations, Espaces verts, Insalubrité, Pollution, Autres. Estime la gravité parmi LOW, MEDIUM, HIGH, CRITICAL. Réponds uniquement en JSON avec les champs problem (titre court), category, severity, summary (une phrase) et confidence (nombre entre 0 et 1).`,
            },
            { inlineData: { mimeType, data } },
          ],
        }],
        config: { responseMimeType: 'application/json' },
      });

      const responseText = result.text;
      if (!responseText) {
        res.status(502).json({ error: 'Le service d’analyse n’a renvoyé aucun résultat.' });
        return;
      }

      const analysis: unknown = JSON.parse(responseText);
      if (
        typeof analysis !== 'object' ||
        analysis === null ||
        !('problem' in analysis) ||
        typeof analysis.problem !== 'string' ||
        !('category' in analysis) ||
        typeof analysis.category !== 'string' ||
        !('summary' in analysis) ||
        typeof analysis.summary !== 'string' ||
        !('severity' in analysis) ||
        !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(String(analysis.severity)) ||
        !('confidence' in analysis) ||
        typeof analysis.confidence !== 'number'
      ) {
        res.status(502).json({ error: 'Le résultat du service d’analyse est invalide.' });
        return;
      }
      res.json(analysis);
    } catch (error) {
      console.error('Gemini image analysis failed:', error);
      res.status(502).json({ error: 'L’analyse de la photo a échoué. Réessayez plus tard.' });
    }
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    const status = typeof error === 'object' && error !== null && 'status' in error &&
      typeof error.status === 'number' ? error.status : 500;
    if (status === 400) {
      res.status(400).json({ error: 'La requête JSON est invalide.' });
      return;
    }
    if (status === 413) {
      res.status(413).json({ error: 'La requête dépasse la taille maximale autorisée.' });
      return;
    }
    console.error('Unhandled LUMTERRA API error:', error);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  };
  app.use(errorHandler);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distributionDirectory = path.resolve(currentDirectory, 'dist');
    app.use(express.static(distributionDirectory));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(distributionDirectory, 'index.html'));
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT doit être un entier compris entre 1 et 65535.');
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`LUMTERRA ${isProduction ? 'production' : 'development'} server running at http://localhost:${port}`);
  });
}

startServer().catch((error: unknown) => {
  console.error('Unable to start LUMTERRA server:', error);
  process.exitCode = 1;
});
