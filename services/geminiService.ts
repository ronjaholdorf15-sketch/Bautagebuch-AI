import { GoogleGenAI } from "@google/genai";

// Lazy initialization holder
let aiClient: GoogleGenAI | null = null;

// Helper to get or create the client only when needed (Lazy Loading)
const getAiClient = () => {
  if (!aiClient) {
    // Falls der Key leer ist, wird ein Dummy gesetzt, damit new GoogleGenAI nicht crasht.
    // Der Fehler fliegt dann erst beim echten Aufruf der API.
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      console.warn("API Key fehlt! KI-Funktionen werden nicht funktionieren.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

// Helper: Convert File to Base64 for Gemini
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        // remove data:image/jpeg;base64, prefix
        const result = reader.result as string;
        const base64String = result.includes(',') ? result.split(',')[1] : result;
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
  if (!process.env.API_KEY) {
    console.warn("Kein API Key gefunden.");
    return text + " (KI nicht konfiguriert)";
  }

  try {
    const client = getAiClient();
    const prompt = `
      Du bist ein professioneller Bauleiter für Glasfaserausbau.
      Formuliere die folgenden Notizen eines Technikers in einen professionellen, sachlichen Bautagebuch-Eintrag um.
      Die Tätigkeit war: ${activity}.
      
      Notizen des Technikers:
      "${text}"
      
      Antworte nur mit dem verbesserten Text, ohne Einleitung oder Formatierung.
    `;

    const response = await client.models.generateContent({
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
    if (images.length === 0) return "";
    if (!process.env.API_KEY) throw new Error("API Key fehlt.");

    try {
        const client = getAiClient();
        const imageParts = await Promise.all(images.map(fileToGenerativePart));
        
        const prompt = `
            Du bist ein Experte für Glasfaser-Tiefbau und Dokumentation.
            Analysiere diese Baustellenfotos genau.
            Die gewählte Tätigkeit ist: "${activity}".

            Erstelle basierend auf den Bildern eine sachliche, technische Beschreibung der durchgeführten Arbeiten für das Bautagebuch.
            Erwähne erkennbare Materialien (Rohre, Kabel, Schächte), Oberflächen (Asphalt, Wiese, Pflaster) und den Zustand.
            
            Fasse dich kurz und präzise. Keine Einleitung ("Auf den Bildern sieht man..."), sondern direkt: "Graben erstellt, Leerrohr DN50 verlegt...".
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash', 
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
        throw new Error("KI-Bildanalyse fehlgeschlagen. Bitte API Key prüfen.");
    }
};

export const suggestMissingWork = async (doneDescription: string, activity: string): Promise<string> => {
    if (!doneDescription) return "";
    if (!process.env.API_KEY) return "";

    try {
        const client = getAiClient();
        const prompt = `
            Basierend auf diesem Bautagebuch-Eintrag (Erledigt): "${doneDescription}"
            und der Tätigkeit: "${activity}".

            Welche logischen Restarbeiten oder nächsten Schritte fehlen noch oder müssen als nächstes erfolgen?
            (Beispiele: Oberfläche schließen, Einmessen, Dokumentation, Muffe ablegen).

            Liste 2-3 Punkte stichpunktartig auf.
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "";
    } catch (error) {
        console.error("Gemini suggestions failed", error);
        return "";
    }
};