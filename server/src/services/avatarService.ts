import { config } from '../config/index';

function buildPrompt(name: string, gradeLevel: number, description?: string): string {
  const base =
    `A cute, colorful cartoon wizard avatar for a child named ${name} in grade ${gradeLevel}. ` +
    `Friendly expression, magical pointy hat, holding a glowing star wand. ` +
    `Bright cheerful colors, simple clean illustration, white background, square composition.`;
  return description ? `${base} ${description}.` : base;
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

    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: buildPrompt(name, gradeLevel, description),
      config: { numberOfImages: 1 },
    });

    const image = response.generatedImages?.[0]?.image;
    if (image?.imageBytes && image.mimeType) {
      return `data:${image.mimeType};base64,${image.imageBytes}`;
    }
  } catch (err) {
    console.error('[avatarService] Imagen generation failed, using fallback:', err);
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
