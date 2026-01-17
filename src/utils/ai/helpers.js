/**
 * Safely parses JSON from AI, stripping Markdown code blocks if present.
 * Prevents "Blue Screen" crashes in React.
 */
export const safeParseJSON = (content) => {
  try {
    // 1. Remove Markdown code blocks (e.g. ```json ... ```)
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanContent);

    // 2. Fallback logic if AI returns different fields
    return parsed;
  } catch (e) {
    console.error("JSON Parse Error:", e);
    // Return a safe fallback object so the UI doesn't crash
    return { 
      summary: "AI Response Error", 
      detail: content, // Show raw content so you can debug
      files: []        // For the Navigator agent
    };
  }
};