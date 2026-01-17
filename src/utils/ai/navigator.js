import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { safeParseJSON } from "./helpers"; // <--- REUSING YOUR LOGIC

// const openai = new OpenAI({
//   apiKey: import.meta.env.VITE_OPENAI_API_KEY,
//   dangerouslyAllowBrowser: true 
// });
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const runNavigator = async (question, fileStructure) => {
  try {
    const contextList = fileStructure.slice(0, 300).join("\n");
    
    const prompt = `
      You are 'The Navigator', a specialized file search agent.
      REPO STRUCTURE:
      ${contextList}
      
      USER QUESTION: "${question}"
      
      TASK:
      Return a JSON object with a single key "files" containing an array of paths.
      Example: { "files": ["src/App.jsx", "src/utils/api.js"] }
      Return { "files": [] } if no specific files are needed.
    `;

    // const completion = await openai.chat.completions.create({
    //   messages: [{ role: "user", content: prompt }],
    //   model: "gpt-4o-mini",
    //   response_format: { type: "json_object" }
    // });

    // const result = safeParseJSON(completion.choices[0].message.content);

    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const res = await model.generateContent(prompt);
    const result = safeParseJSON(res.response.text());
    return result.files || [];

  } catch (error) {
    console.error("Navigator Error:", error);
    return [];
  }
};