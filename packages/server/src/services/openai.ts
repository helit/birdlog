import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BirdIdentification {
  swedishName: string;
  scientificName: string;
  confidence: "high" | "medium" | "low";
  description: string;
}

export async function identifyBird(
  base64Data: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif",
): Promise<BirdIdentification[]> {
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
            text: `You are a bird identification expert specializing in Swedish birds.
Analyze this photo and identify the bird species.

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
