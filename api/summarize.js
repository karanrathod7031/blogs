import { GoogleGenAI } from '@google/genai';

const MAX_CONTENT_LENGTH = 20000;

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '';
}

export default async function handler(req, res) {
  res.setHeader('Allow', 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service is not configured' });
  }

  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return res.status(413).json({ error: 'Content is too large to summarize' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following blog post in exactly 1-2 sentences. Return only plain text without labels, markdown, or bullet points.\n\n${content}`
    });

    const summary = response.text?.trim();
    if (!summary) {
      return res.status(502).json({ error: 'AI service returned an empty summary' });
    }

    return res.status(200).json({ summary });
  } catch (error) {
    console.error('Summarize API failed:', error);
    return res.status(502).json({ error: 'Failed to generate summary' });
  }
}
