import OpenAI from "openai";
import { fetchFileContent } from '../../github'; 
import { RepoMemory } from './memory';
import { runNavigator } from './navigator';
import { runArchitect } from './architect';
import { safeParseJSON } from './helpers';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true 
});

// ==========================================
// PART 1: PREVIOUS AI LOGIC (NODE ANALYSIS)
// We preserved your specific prompts & JSON logic here
// ==========================================

export const generateFolderSummary = async (folderName, folderFiles, allProjectFiles) => {
  try {
    const projectContext = allProjectFiles.slice(0, 200).join("\n");
    const targetFiles = folderFiles.join(", ");

    const prompt = `
      You are a Senior Architect.
      CONTEXT: ${projectContext}
      FOLDER: "${folderName}" (Files: ${targetFiles})
      
      Return valid JSON (NO Markdown):
      {
        "summary": "High-level purpose (max 2 sentences).",
        "detail": "Technical details (max 100 words)."
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" } 
    });
    return safeParseJSON(completion.choices[0].message.content);

  } catch (error) {
    return { summary: "Could not analyze folder.", detail: "" };
  }
};

export const generateFileExplanation = async (fileName, fileCode, allFilePaths) => {
  try {
    const truncatedCode = fileCode.length > 3000 ? fileCode.substring(0, 3000) + "..." : fileCode;
    const projectStructure = allFilePaths.slice(0, 100).join("\n");

    const prompt = `
      Analyze file "${fileName}".
      CONTEXT: ${projectStructure}
      CODE: ${truncatedCode}
      
      Return valid JSON (NO Markdown):
      {
        "summary": "Purpose (2 sentences).",
        "detail": "Technical logic explanation."
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    return safeParseJSON(completion.choices[0].message.content);

  } catch (error) {
    return { summary: "Could not analyze file.", detail: "" };
  }
};


// ==========================================
// PART 2: NEW MULTI-AGENT CHAT LOGIC
// ==========================================

export const askRepoQuestion = async (question, allFilePaths, owner, repo, onAgentUpdate, history = []) => {
  try {
    // 1. NAVIGATOR
    onAgentUpdate("Navigator", "Scanning file structure...");
    const filesToRead = await runNavigator(question, allFilePaths);
    
    if (filesToRead.length > 0) {
      onAgentUpdate("Navigator", `Targeting: ${filesToRead.map(f => f.split('/').pop()).join(", ")}`);
    } else {
      onAgentUpdate("Navigator", "General question. Skipping file fetch.");
    }

    // 2. MEMORY & FETCHING
    onAgentUpdate("System", `Retrieving content...`);
    
    const contextParts = await Promise.all(filesToRead.map(async (path) => {
      // Memory Check
      if (RepoMemory.has(path)) {
        console.log(`[Memory] Serving ${path}`);
        return `\n--- FILE: ${path} (Cached) ---\n${RepoMemory.get(path)}\n`;
      }

      // Fresh Fetch
      console.log(`[Fetch] Downloading ${path}`);
      const content = await fetchFileContent(owner, repo, path);
      RepoMemory.set(path, content); // Save to brain
      
      return `\n--- FILE: ${path} ---\n${content}\n`;
    }));

    const codeContext = contextParts.join("\n");
    const previousChat = history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n");

    // 3. ARCHITECT
    onAgentUpdate("Architect", "Generating solution...");
    const answer = await runArchitect(question, codeContext, previousChat);

    return answer;

  } catch (error) {
    console.error(error);
    return "The agent team encountered an error.";
  }
};

export const resetBrain = () => RepoMemory.reset();