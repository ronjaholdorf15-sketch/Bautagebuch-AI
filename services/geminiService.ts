import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

// Helper: Convert File to Base64 for Gemini
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        // remove data:image/jpeg;base64, prefix
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

export const enhanceDiaryEntry = async (text: string, activity: string): Promise<string> => {
  if (!aiClient) return text;

  try {
    const prompt = `
      Du bist ein professioneller Bauleiter für Glasfaserausbau.
      Formuliere die folgenden Notizen eines Technikers in einen professionellen, sachlichen Bautagebuch-Eintrag um.
      Die Tätigkeit war: ${activity}.
      
      Notizen des Technikers:
      "${text}"
      
      Antworte nur mit dem verbesserten Text, ohne Einleitung oder Formatierung.
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || text;
  } catch (error) {
    console.error("Gemini enhancement failed", error);
    return text;
  }
};

export const analyzeImagesForReport = async (images: File[], activity: string): Promise<string> => {
    if (!aiClient || images.length === 0) return "";

    try {
        const imageParts = await Promise.all(images.map(fileToGenerativePart));
        
        const prompt = `
            Du bist ein Experte für Glasfaser-Tiefbau und Dokumentation.
            Analysiere diese Baustellenfotos genau.
            Die gewählte Tätigkeit ist: "${activity}".

            Erstelle basierend auf den Bildern eine sachliche, technische Beschreibung der durchgeführten Arbeiten für das Bautagebuch.
            Erwähne erkennbare Materialien (Rohre, Kabel, Schächte), Oberflächen (Asphalt, Wiese, Pflaster) und den Zustand.
            
            Fasse dich kurz und präzise. Keine Einleitung ("Auf den Bildern sieht man..."), sondern direkt: "Graben erstellt, Leerrohr DN50 verlegt...".
        `;

        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash', // Flash is great for vision tasks
            contents: {
                parts: [
                    { text: prompt },
                    ...imageParts
                ]
            }
        });

        return response.text || "";
    } catch (error) {
        console.error("Gemini vision analysis failed", error);
        throw new Error("KI-Bildanalyse fehlgeschlagen.");
    }
};

export const suggestMissingWork = async (doneDescription: string, activity: string): Promise<string> => {
    if (!aiClient || !doneDescription) return "";

    try {
        const prompt = `
            Basierend auf diesem Bautagebuch-Eintrag (Erledigt): "${doneDescription}"
            und der Tätigkeit: "${activity}".

            Welche logischen Restarbeiten oder nächsten Schritte fehlen noch oder müssen als nächstes erfolgen?
            (Beispiele: Oberfläche schließen, Einmessen, Dokumentation, Muffe ablegen).

            Liste 2-3 Punkte stichpunktartig auf.
        `;

        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "";
    } catch (error) {
        console.error("Gemini suggestions failed", error);
        return "";
    }
};