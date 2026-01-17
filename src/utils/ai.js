// src/utils/ai.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// Ensure you added VITE_GEMINI_API_KEY to your .env file!
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Improved Parser: Handles "Rogue JSON" gracefully
const safeParseJSON = (content) => {
  try {
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanContent);

    // Check if AI followed our schema
    const hasSummary = typeof parsed.summary === 'string';
    const hasDetail = typeof parsed.detail === 'string';

    if (hasSummary && hasDetail) {
      return parsed;
    }

    // FALLBACK: If AI returned a different object (like your example),
    // we convert it into a readable text format.
    return {
      summary: parsed.description || parsed.summary || "Technical analysis available.",
      // Pretty-print the whole object so it's readable
      detail: JSON.stringify(parsed, null, 2) 
    };

  } catch (e) {
    // If it's just raw text, return it as the detail
    return { 
      summary: "AI Insight", 
      detail: content 
    };
  }
};

export const generateFileExplanation = async (fileName, fileCode, allFilePaths) => {
  try {
    const truncatedCode = fileCode.length > 3000 ? fileCode.substring(0, 3000) + "..." : fileCode;
    const projectStructure = allFilePaths.slice(0, 100).join("\n");

    const prompt = `
      Analyze the file "${fileName}".
      
      CONTEXT: ${projectStructure}
      CODE: ${truncatedCode}
      
      You MUST return a JSON object with exactly these two string fields.
      Do NOT return nested objects. The "detail" field must be a SINGLE STRING.
      
      {
        "summary": "A 2-sentence high-level overview.",
        "detail": "A plain text explanation of the logic, imports, and key functions. Use bullet points (-) for readability."
      }
    `;

    // const completion = await openai.chat.completions.create({
    //   messages: [{ role: "user", content: prompt }],
    //   model: "gpt-4o-mini",
    //   response_format: { type: "json_object" }
    // });

    //return safeParseJSON(completion.choices[0].message.content);

    // Gemini API Call
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return safeParseJSON(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { summary: "Could not analyze file.", detail: "" };
  }
};

// ... (keep generateFolderSummary as is)
export const generateFolderSummary = async (folderName, folderFiles, allProjectFiles) => {
    // Reuse the same safeParseJSON logic here if you want consistency
    // ... copy logic from previous step ...
    // For brevity, ensuring generateFileExplanation is fixed solves your immediate issue.
    try {
        const projectContext = allProjectFiles.slice(0, 200).join("\n");
        const targetFiles = folderFiles.join(", ");
    
        const prompt = `
          You are a Senior Architect.
          CONTEXT: ${projectContext}
          FOLDER: "${folderName}" (Files: ${targetFiles})
          
          Return valid JSON with two STRING fields:
          {
            "summary": "High-level purpose (max 2 sentences).",
            "detail": "Technical details (max 100 words)."
          }
        `;
    
        // const completion = await openai.chat.completions.create({
        //   messages: [{ role: "user", content: prompt }],
        //   model: "gpt-4o-mini",
        //   response_format: { type: "json_object" } 
        // });
    
        // return safeParseJSON(completion.choices[0].message.content);

        // Gemini API Call
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return safeParseJSON(text);
    
      } catch (error) {
        console.error("Gemini Error:", error);
        return { summary: "Could not analyze folder.", detail: "" };
      }
};

export const findImports = (code, allNodes) => {
  const imports = [];
  // Regex to find: import X from "path" OR import "path"
  const regex = /from\s+['"](.+)['"]|import\s+['"](.+)['"]/g;
  
  let match;
  while ((match = regex.exec(code)) !== null) {
    // Group 1 or Group 2 contains the path (e.g., "./components/Button")
    const importPath = match[1] || match[2];
    if (!importPath) continue;

    // Clean up the name (remove ./, ../, and extension)
    const cleanName = importPath.split('/').pop().replace(/\.(js|jsx|ts|tsx|css)$/, '');

    // FUZZY SEARCH: Find a node in the graph that matches this name
    // We look for files that START with this name (to handle .js vs .tsx)
    const targetNode = allNodes.find(n => {
        const nodeFileName = n.name.split('.')[0]; // Remove extension from graph node
        return nodeFileName === cleanName && n.group !== 'folder';
    });

    if (targetNode) {
      imports.push(targetNode.id);
    }
  }
  return imports;
};