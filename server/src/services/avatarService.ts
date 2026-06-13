import { config } from '../config/index';
import { logger } from '../lib/logger';
import { validateDescription } from './ai/avatarValidationService';
import { ApiError } from '../utils/ApiError';

export interface GeneratedAvatarSlot {
  imageData: string;
  description: string;
}

function buildImagePrompt(name: string, gradeLevel: number, description: string): string {
  return (
    `Create an avatar for a child according to the following description: ${description}. ` +
    `Style: Chibi character design, soft digital hand-drawn illustration style, thick and smooth brushwork, gentle cell shading, glowing magical highlights, friendly and warm expression, big expressive sparkling eyes, vibrant and saturated colors, clean white background, center-aligned square composition.`
  );
}

async function callGeminiImage(prompt: string): Promise<string | null> {
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: { responseModalities: ['TEXT', 'IMAGE'] },
    });
    const parts = response.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find((p) => p.inlineData);
    if (imagePart?.inlineData?.data && imagePart.inlineData.mimeType) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }
    return null;
  } catch (err) {
    logger.error({ err }, 'Gemini image generation failed');
    return null;
  }
}

function generateFallbackAvatar(name: string): string {
  const palettes = [
    ['#7C3AED', '#A78BFA'],
    ['#D97706', '#FCD34D'],
    ['#059669', '#6EE7B7'],
    ['#DC2626', '#FCA5A5'],
    ['#2563EB', '#93C5FD'],
    ['#DB2777', '#F9A8D4'],
  ];
  const [bg, accent] = palettes[name.charCodeAt(0) % palettes.length];
  const initials = name.slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="${bg}"/>
  <text x="50" y="58" font-family="Arial,sans-serif" font-size="30" font-weight="bold"
        text-anchor="middle" fill="${accent}">${initials}</text>
  <polygon points="50,6 56,24 75,24 61,36 66,54 50,43 34,54 39,36 25,24 44,24"
           fill="${accent}" opacity="0.55"/>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export async function generateAvatar(
  name: string,
  gradeLevel: number,
  description: string
): Promise<GeneratedAvatarSlot> {
  const validation = await validateDescription(description);
  if (!validation.valid) {
    throw ApiError.badRequest(validation.rejectionReason ?? 'invalid_description');
  }
  const imageData = config.gemini.apiKey
    ? ((await callGeminiImage(
        buildImagePrompt(name, gradeLevel, validation.correctedDescription)
      )) ?? generateFallbackAvatar(name))
    : generateFallbackAvatar(name);
  return { imageData, description: validation.correctedDescription };
}
