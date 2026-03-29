import { config } from '../config/index';

function buildPrompt(name: string, gradeLevel: number, description?: string): string {
  if (description) {
    return (
      `A cartoon wizard avatar for a child named ${name}. ` +
      `MOST IMPORTANT: ${description}. ` +
      `Style: friendly expression, magical pointy hat, holding a glowing star wand, ` +
      `bright cheerful colors, simple clean illustration, white background, square composition.`
    );
  }

  return (
    `A cute, colorful cartoon wizard avatar for a child named ${name} in grade ${gradeLevel}. ` +
    `Friendly expression, magical pointy hat, holding a glowing star wand. ` +
    `Bright cheerful colors, simple clean illustration, white background, square composition.`
  );
}

export async function generateAvatar(
  name: string,
  gradeLevel: number,
  description?: string
): Promise<string> {
  if (!config.gemini.apiKey) {
    return generateFallbackAvatar(name);
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: buildPrompt(name, gradeLevel, description),
      config: { responseModalities: ['TEXT', 'IMAGE'] },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find((p) => p.inlineData);
    if (imagePart?.inlineData?.data && imagePart.inlineData.mimeType) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }
  } catch (err) {
    console.error('[avatarService] Gemini image generation failed, using fallback:', err);
  }

  return generateFallbackAvatar(name);
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
