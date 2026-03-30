import { config } from '../../config';

const IMAGE_MODEL = 'gemini-2.5-flash-image';

const IMAGE_SYSTEM_INSTRUCTION = `You are an image generation assistant that creates child-friendly, colorful cartoon-style illustrations.

GOAL:
Generate a single image that accurately represents the provided scene description.

CHARACTER RULE:
- The main character must be the child's avatar.
- Always use the provided avatar image as the visual reference for the child.
- The character must remain clearly recognizable as the same avatar.
- You may adapt facial expressions, pose, actions, and clothing to fit the scene.
- Any changes must preserve the core identity and recognizable features of the avatar.

SCENE RULES:
- The image must match the scene description exactly.
- Focus on one clear moment from the scene.
- Include only relevant characters and objects mentioned in the description.

STYLE:
- Bright, colorful, and friendly cartoon style.
- Soft lighting and playful, magical atmosphere.
- Suitable for young children.

CONSISTENCY:
- Maintain consistent style and character identity across images.

RESTRICTIONS:
- No scary, violent, or inappropriate content.
- Do not add elements that are not described in the scene.`;

// ---- internal types (CJS/ESM bridge pattern, matching geminiClient.ts) ----

interface GeminiImageModelClient {
  models: {
    generateContentStream: (request: unknown) => Promise<AsyncIterable<GeminiStreamChunk>>;
  };
}

interface GeminiImageModule {
  GoogleGenAI: new (params: { apiKey: string }) => GeminiImageModelClient;
}

interface GeminiStreamChunk {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { mimeType?: string; data?: string };
        text?: string;
      }>;
    };
  }>;
}

// ---- helpers ----

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

function isSvgDataUrl(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/svg+xml');
}

// ---- public API ----

/**
 * Generates a story scene image using Gemini image generation.
 *
 * @param imageDescription  The scene description returned by the LLM (imageDescription field).
 * @param avatarDataUrl     The child's avatar as a base64 data URL.
 *                          If the avatar is the SVG fallback, the reference image is omitted
 *                          and the scene is generated from the description alone.
 * @returns  A base64 data URL of the generated image, or null if generation fails.
 */
export async function generateStoryImage(
  imageDescription: string,
  avatarDataUrl: string
): Promise<string | null> {
  if (!config.gemini.apiKey) return null;

  try {
    const { GoogleGenAI } = (await import('@google/genai')) as GeminiImageModule;
    const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

    // Build content parts — include avatar as inline image unless it is the SVG fallback,
    // which Gemini does not accept as a valid image input.
    const parts: unknown[] = [];

    if (!isSvgDataUrl(avatarDataUrl)) {
      const parsed = parseDataUrl(avatarDataUrl);
      if (parsed) {
        parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.base64 } });
      }
    }

    parts.push({ text: imageDescription });

    const stream = await ai.models.generateContentStream({
      model: IMAGE_MODEL,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: { aspectRatio: '16:9' },
        systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
      },
      contents: [{ role: 'user', parts }],
    });

    for await (const chunk of stream) {
      const part = chunk.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData?.data && part.inlineData.mimeType) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (err) {
    console.error('[imageGenerationService] Gemini story image generation failed:', err);
  }

  return null;
}
