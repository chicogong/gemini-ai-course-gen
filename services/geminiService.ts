import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CourseData, Slide } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Content Generation ---

export const generateCourseContent = async (topic: string): Promise<CourseData> => {
  const prompt = `
    请创建一个关于 "${topic}" 的结构化迷你网课。
    课程应包含正好 5 张幻灯片。
    对于每张幻灯片，请提供：
    1. 一个吸引人的中文标题。
    2. 3-4 个总结关键概念的简洁中文要点。
    3. 老师朗读的“讲稿” (script)。讲稿应口语化、亲切、专业、具有教育意义，长度约为 60-80 个字。以普通话口吻撰写，适合老师讲解。
    
    请输出严格合法的 JSON 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  bulletPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  script: { type: Type.STRING, description: "老师的中文口语讲稿" }
                },
                required: ["title", "bulletPoints", "script"]
              }
            }
          },
          required: ["topic", "slides"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No content generated");
    return JSON.parse(text) as CourseData;

  } catch (error) {
    console.error("Error generating course:", error);
    throw error;
  }
};

// --- TTS Audio Generation ---

// Helper to decode Base64
const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper to decode Audio Data
const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> => {
    // Note: The raw PCM from Gemini 2.5 Flash TTS is often 24kHz, mono.
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length; 
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        // Convert Int16 to Float32 [-1.0, 1.0]
        channelData[i] = dataInt16[i] / 32768.0;
    }

    return buffer;
};


export const generateSpeechAudio = async (text: string): Promise<ArrayBuffer> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore has a clear neutral tone working reasonably well for CN
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    const bytes = decodeBase64(base64Audio);
    return bytes.buffer; // Return ArrayBuffer for the audio context to process

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};

export { decodeAudioData };