
// Constants
const API_KEY = "YOUR_GEMINI_API_KEY"; // Replace with your actual API key
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Compares a user answer with a flashcard's correct answer using Gemini AI
 * @param userAnswer The answer provided by the user
 * @param correctAnswer The correct answer from the flashcard
 * @returns Promise with a score between 0-1 and feedback
 */
export const evaluateAnswer = async (
  userAnswer: string, 
  correctAnswer: string
): Promise<{ score: number; feedback: string }> => {
  try {
    // Default response in case of API failure
    const defaultResponse = { 
      score: 0.5, 
      feedback: "Impossible d'évaluer la réponse. Vérifiez vous-même." 
    };

    // Don't call API for empty answers
    if (!userAnswer.trim()) {
      return { score: 0, feedback: "Réponse vide." };
    }

    const prompt = `
      Tu es un assistant qui évalue des réponses de flashcards.
      
      Réponse correcte: "${correctAnswer}"
      Réponse de l'utilisateur: "${userAnswer}"
      
      Évalue si la réponse de l'utilisateur correspond à la réponse correcte.
      Attribue un score entre 0 et 1, où:
      - 0 est complètement incorrect
      - 0.5 est partiellement correct
      - 1 est complètement correct
      
      Donne uniquement un objet JSON contenant "score" (number) et "feedback" (string) qui explique brièvement pourquoi la réponse est correcte ou incorrecte.
      Exemple: {"score": 0.7, "feedback": "Bonne compréhension du concept, mais il manque un détail important..."}
    `;

    const response = await fetch(
      `${API_URL}?key=${API_KEY}`, 
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000
          }
        })
      }
    );

    if (!response.ok) {
      console.error("Gemini API error:", await response.text());
      return defaultResponse;
    }

    const data = await response.json() as GeminiResponse;
    
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
      return defaultResponse;
    }

    try {
      // Extract JSON from response text
      const jsonText = data.candidates[0].content.parts[0].text;
      const jsonStr = jsonText.match(/\{[\s\S]*\}/)?.[0] || "{}";
      const result = JSON.parse(jsonStr);

      return {
        score: Number(result.score) || 0.5,
        feedback: result.feedback || "Pas de feedback disponible."
      };
    } catch (e) {
      console.error("Error parsing Gemini response:", e);
      return defaultResponse;
    }
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return { 
      score: 0.5, 
      feedback: "Une erreur est survenue lors de l'évaluation." 
    };
  }
};
