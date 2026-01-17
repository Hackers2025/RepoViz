import OpenAI from "openai";
import { safeParseJSON } from "./helpers";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true 
});

export const runArchitect = async (question, codeContext, previousChat) => {
  try {
    const prompt = `
      You are 'The Architect', a senior software engineer.

      CHAT HISTORY:
      ${previousChat}
        
      CURRENT USER QUESTION: "${question}"
      
      CODE CONTEXT:
      ${codeContext || "No specific code files loaded."}
      
      INSTRUCTIONS:
      Answer the question technically. If providing code, explain WHERE it goes. Use the CHAT HISTORY to understand context (like what we just discussed).
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.log(error);
    return "I am unable to generate an answer right now.";
  }
};