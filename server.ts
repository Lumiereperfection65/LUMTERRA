import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // API Route for Image Analysis
  app.post('/api/analyze-report', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      const prompt = `
        En tant qu'assistant intelligent pour la plateforme citoyenne LUMTERRA, analyse cette photo de signalement urbain.
        Identifie le problème, suggère une catégorie parmi : Nids-de-poule, Déchets, Inondations, Éclairage, Routes, Canalisations, Espaces verts, Insalubrité, Pollution.
        Estime la gravité (LOW, MEDIUM, HIGH, CRITICAL).
        Génère un court résumé du problème.
        Réponds uniquement au format JSON suivant :
        {
          "problem": "nom du problème",
          "category": "catégorie suggérée",
          "severity": "gravité",
          "summary": "résumé en une phrase",
          "confidence": 0.95
        }
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64.split(',')[1],
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const responseText = result.response.text();
      const jsonStr = responseText.match(/\{[\s\S]*\}/)?.[0] || '{}';
      res.json(JSON.parse(jsonStr));
    } catch (error: any) {
      console.error('AI Analysis Error:', error);
      res.status(500).json({ error: 'Failed to analyze image' });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
