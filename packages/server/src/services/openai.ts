import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000 });

export interface BirdIdentification {
  swedishName: string;
  scientificName: string;
  confidence: "high" | "medium" | "low";
  description: string;
}

export async function identifyBird(
  base64Data: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif",
  options?: { month?: number; latitude?: number; longitude?: number },
): Promise<BirdIdentification[]> {
  const contextParts = [
    options?.month ? `Month: ${options.month} (${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][options.month - 1]})` : null,
    options?.latitude && options?.longitude ? `Location: ${options.latitude.toFixed(1)}°N, ${options.longitude.toFixed(1)}°E (Sweden)` : null,
  ].filter(Boolean);

  const contextLine = contextParts.length > 0
    ? `\n\nObservation context: ${contextParts.join(". ")}.`
    : "";

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mediaType};base64,${base64Data}`,
            },
          },
          {
            type: "text",
            text: `You are an expert ornithologist specializing in Swedish birds.
Analyze this photo and identify the bird species.

Important guidelines:
- Pay close attention to key field marks: bill shape and color, leg color, body proportions, plumage patterns.
- CRITICAL: Make sure the swedishName and scientificName refer to the SAME species. Do not mix up names between similar-looking species.
- Consider which species are present in Sweden during the given season and location.
- Prefer common species over rare ones when the image is ambiguous.${contextLine}

Respond with ONLY a JSON array (no markdown, no code fences) of up to 3 candidates, ranked by likelihood:
[
  {
    "swedishName": "Swedish common name",
    "scientificName": "Latin species name",
    "confidence": "high" | "medium" | "low",
    "description": "Brief explanation in Swedish of why you think this is the species (key field marks, plumage, etc.)"
  }
]

If the image does not contain a bird, respond with an empty array: []`,
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";

  try {
    return JSON.parse(text) as BirdIdentification[];
  } catch {
    console.error("Failed to parse OpenAI response:", text);
    return [];
  }
}

export interface BirdDescription {
  size: string;
  colors: string[];
  habitat: string;
  notes?: string;
  month?: number;
  latitude?: number;
  longitude?: number;
}

export interface GuidedIdentificationResult {
  candidates: BirdIdentification[];
  tip: string | null;
}

export async function identifyBirdFromDescription({
  size,
  colors,
  habitat,
  notes,
  month,
  latitude,
  longitude,
}: BirdDescription): Promise<GuidedIdentificationResult> {
  const userMessage = [
    `Storlek: ${size}`,
    `Färger: ${colors.join(", ")}`,
    `Miljö: ${habitat}`,
    month ? `Månad: ${month} (${["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"][month - 1]})` : null,
    latitude && longitude ? `Plats: ${latitude.toFixed(1)}°N, ${longitude.toFixed(1)}°E` : null,
    notes ? `Övriga detaljer: ${notes}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert ornithologist helping a casual birdwatcher identify a bird they saw in Sweden.
The user's description may be imprecise — they are not an expert. Your job is to interpret their input generously and figure out what they most likely saw.

Important guidelines:
- The user may misjudge size by one category (e.g. say "medium" for a bird that's actually large). Consider species one size category above and below.
- Colors: the user may list extra colors (e.g. "white" on a mostly green bird) or miss subtle ones. Focus on the most distinctive color combination rather than requiring an exact match. A green + red bird in forest is almost certainly a woodpecker, even if the user also added "white".
- Habitat and color combination together are often the strongest signal — weigh these heavily.
- Consider which species are actually present in Sweden during the given month (migration, wintering, breeding).
- Use the latitude to determine the region (south, central, or northern Sweden) and filter accordingly.
- Think like a detective: what bird would a non-expert MOST LIKELY describe this way? Prioritize the most recognizable/common species that fits the overall picture.
- CRITICAL: Make sure the swedishName and scientificName refer to the SAME species.

Respond with ONLY a JSON object (no markdown, no code fences) with this structure:
{
  "candidates": [
    {
      "swedishName": "Swedish common name",
      "scientificName": "Latin species name",
      "confidence": "high" | "medium" | "low",
      "description": "Brief explanation in Swedish of why this species matches the description"
    }
  ],
  "tip": "A short suggestion in Swedish for what extra detail would help narrow it down, e.g. 'Såg du en lång svans?' or 'Hade fågeln en böjd näbb?'. Only include this if none of the candidates have high confidence. Set to null if a candidate has high confidence."
}

Return up to 3 candidates ranked by likelihood. If the description does not match any known Swedish bird, return {"candidates": [], "tip": null}.`,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return { candidates: parsed as BirdIdentification[], tip: null };
    }
    return parsed as GuidedIdentificationResult;
  } catch {
    console.error("Failed to parse OpenAI response:", text);
    return { candidates: [], tip: null };
  }
}
