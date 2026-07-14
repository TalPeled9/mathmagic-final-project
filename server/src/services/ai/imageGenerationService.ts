import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from '../../config';
import { logger } from '../../lib/logger';
import { getStoryWorldById } from '../../config/storyWorlds';

const IMAGE_MODEL = 'gemini-2.5-flash-image';

const IMAGE_SYSTEM_INSTRUCTION = `You are an image generation assistant that creates child-friendly, colorful cartoon-style illustrations.

GOAL:
Generate a single image that accurately represents the provided scene description.

CHARACTER RULE:
- The main character must be the child's avatar.
- Always use the provided avatar image as the visual reference for the child.
- The character must remain clearly recognizable as the same avatar.
- The child MUST be active and expressive — never static or just standing/floating in the scene.
- Show a clear facial expression that matches the scene's emotion (e.g. curious, excited, determined, surprised, delighted, focused).
- Show the child in a dynamic body position or action that fits the story moment (e.g. running, jumping, reaching, pointing, celebrating, crouching, spinning, peering around a corner).
- Any changes must preserve the core identity and recognizable features of the avatar.

SCENE RULES:
- The image must match the scene description exactly.
- Focus on one clear moment from the scene.
- Include only relevant characters and objects mentioned in the description.

BACKGROUND & SETTING RULES:
- The background must completely fill the entire rectangular 16:9 frame, edge to edge — no vignette, no circular/oval or sticker-style crop, no letterboxing or black bars, no blank/white/empty margins.
- The full frame must depict a painted environment that matches the story world setting given in the scene description (for example: a galactic space station, a medieval fantasy kingdom, a tropical jungle) — never just the character floating on an empty or undefined backdrop.
- Even if the scene description does not explicitly redescribe the background, you must still render a complete themed environment consistent with the stated story world setting.

MATH OBJECT CLARITY:
- If the scene includes a mathematical object (analog clock, geometric shape, 3D solid, fraction diagram, groups of countable objects), render it LARGE, simple, and unambiguous — flat front view, clean outlines, high contrast against the background.
- An analog clock must show all 12 hour marks, with a clearly shorter hour hand and longer minute hand pointing exactly where the description says.
- Shapes and solids must be geometrically accurate (correct number of sides, faces, corners) and not stylized beyond recognition.
- Fraction diagrams must show exactly the number of equal parts and shaded parts described.
- Countable objects must appear in exactly the stated quantity, clearly separated and easy to count.
- Never write numbers, words, or labels in the image that reveal the answer.

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

function getDefaultAvatarDataUrl(): string {
  const pngPath = join(__dirname, '../../assets/default_avatar.png');
  const data = readFileSync(pngPath).toString('base64');
  return `data:image/png;base64,${data}`;
}

function describeStoryWorldTheme(storyWorldId: string): string {
  const world = getStoryWorldById(storyWorldId);
  if (!world) return `Story world setting: ${storyWorldId}.`;
  return `Story world setting: ${world.name} — a ${world.theme} setting. ${world.description}.`;
}

// ---- public API ----

/**
 * Generates a story scene image using Gemini image generation.
 *
 * @param imageDescription  The scene description returned by the LLM (imageDescription field).
 * @param avatarDataUrl     The child's avatar as a base64 data URL. Empty string or SVG
 *                          both fall back to the bundled default_avatar.png reference image.
 * @param storyWorldId      The adventure's story world id (e.g. "space"), used to keep the
 *                          generated background consistent with the story's theme.
 * @returns  A base64 data URL of the generated image, or null if generation fails.
 */
export async function generateStoryImage(
  imageDescription: string,
  avatarDataUrl: string,
  storyWorldId: string
): Promise<string | null> {
  if (!config.gemini.apiKey) return null;

  try {
    const { GoogleGenAI } = (await import('@google/genai')) as GeminiImageModule;
    const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

    // Build content parts — include avatar as inline image unless it is the SVG fallback,
    // which Gemini does not accept as a valid image input. Fall back to the default avatar
    // PNG when the child has no custom avatar (empty imageData).
    const parts: unknown[] = [];

    const resolvedAvatarUrl = !avatarDataUrl || isSvgDataUrl(avatarDataUrl)
      ? getDefaultAvatarDataUrl()
      : avatarDataUrl;

    const parsed = parseDataUrl(resolvedAvatarUrl);
    if (parsed) {
      parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.base64 } });
    }

    const themeLine = describeStoryWorldTheme(storyWorldId);
    parts.push({ text: `${themeLine}\n\n${imageDescription}` });

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
    logger.error({ err }, 'Gemini story image generation failed');
  }

  return null;
}
