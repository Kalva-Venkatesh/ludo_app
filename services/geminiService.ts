import { GoogleGenAI } from "@google/genai";
import { GameState, PlayerColor } from "../types";

const createClient = () => {
    if (!process.env.API_KEY) {
        console.warn("API_KEY not set. Gemini features disabled.");
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getGameCommentary = async (
    gameState: GameState,
    lastAction: string
): Promise<string> => {
    const ai = createClient();
    if (!ai) return "Let's play Ludo!";

    const { players, currentPlayer, diceValue } = gameState;

    // Simplify state for the prompt
    const positions = Object.entries(players).map(([color, player]) => {
        const active = player.pieces.filter(p => p.state === 'ACTIVE').length;
        const home = player.pieces.filter(p => p.state === 'HOME').length;
        const base = player.pieces.filter(p => p.state === 'BASE').length;
        return `${color}: ${active} on board, ${home} home, ${base} in base.`;
    }).join('\n');

    const prompt = `
    You are an energetic, witty sports commentator for a Ludo game.
    Current Context:
    - Current Player: ${currentPlayer}
    - Dice Roll: ${diceValue}
    - Last Action: ${lastAction}
    - Board Status:
    ${positions}

    Give me a very short, one-sentence punchy commentary about this move or the current state of the game. Be excited.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text?.trim() || "What a move!";
    } catch (error) {
        console.error("Gemini commentary failed:", error);
        return "The game heats up!";
    }
};