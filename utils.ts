import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is missing. Smart features will not work.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export interface ItineraryActivity {
  time: string;
  placeName: string;
  description: string;
  category: string;
  lat?: number;
  lng?: number;
  estimatedCost?: string;
  imageSearchQuery?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  activities: ItineraryActivity[];
}

export interface TripPlan {
  destination: string;
  startDate: string;
  endDate: string;
  vibe: string;
  days: ItineraryDay[];
}

export async function generateItinerary(
  destination: string,
  startDate: string,
  endDate: string,
  preferences: { vibe: string; budget: string; pace: string }
): Promise<TripPlan> {
  const prompt = `Generate a detailed day-by-day travel itinerary for ${destination} from ${startDate} to ${endDate}. 
  The traveler prefers a ${preferences.vibe} vibe, a ${preferences.budget} budget, and a ${preferences.pace} pace.
  For each activity, provide: 
  - time
  - place name
  - a brief description
  - a category (e.g., sight, food, activity)
  - approximate coordinates (lat, lng)
  - estimatedCost (e.g. "$25", "Free", "$150")
  - imageSearchQuery (a 3-4 word descriptive phrase to find a photo of this place)`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          destination: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          vibe: { type: Type.STRING },
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayNumber: { type: Type.INTEGER },
                activities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      placeName: { type: Type.STRING },
                      description: { type: Type.STRING },
                      category: { type: Type.STRING },
                      lat: { type: Type.NUMBER },
                      lng: { type: Type.NUMBER },
                      estimatedCost: { type: Type.STRING },
                      imageSearchQuery: { type: Type.STRING }
                    },
                    required: ["time", "placeName", "description", "category", "lat", "lng", "estimatedCost", "imageSearchQuery"]
                  }
                }
              }
            }
          }
        },
        required: ["destination", "startDate", "endDate", "vibe", "days"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from service");
  return JSON.parse(text);
}

export async function adaptItinerary(
  currentPlan: TripPlan,
  update: string
): Promise<TripPlan> {
  const prompt = `Update the following travel itinerary based on this real-time update: "${update}".
  Current Plan: ${JSON.stringify(currentPlan)}
  Keep the overall structure but adapt the specific activities to accommodate the change. Ensure estimatedCost and imageSearchQuery are included for all activities.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          destination: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          vibe: { type: Type.STRING },
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayNumber: { type: Type.INTEGER },
                activities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      placeName: { type: Type.STRING },
                      description: { type: Type.STRING },
                      category: { type: Type.STRING },
                      lat: { type: Type.NUMBER },
                      lng: { type: Type.NUMBER },
                      estimatedCost: { type: Type.STRING },
                      imageSearchQuery: { type: Type.STRING }
                    },
                    required: ["time", "placeName", "description", "category", "lat", "lng", "estimatedCost", "imageSearchQuery"]
                  }
                }
              }
            }
          }
        },
        required: ["destination", "startDate", "endDate", "vibe", "days"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from service");
  return JSON.parse(text);
}
