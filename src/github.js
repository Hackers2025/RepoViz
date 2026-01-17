// src/github.js
import { Octokit } from "@octokit/rest";

// Initialize Octokit
const octokit = new Octokit({ 
  auth: import.meta.env.VITE_GITHUB_TOKEN 
});

/**
 * 1. FETCH REPO TREE: Get the file structure
 */
export const fetchRepoTree = async (owner, repo) => {
  try {
    // 1. Get the default branch
    const repoResponse = await octokit.request('GET /repos/{owner}/{repo}', {
      owner,
      repo,
    });
    
    const defaultBranch = repoResponse.data.default_branch;

    // 2. Fetch the tree recursively
    const treeResponse = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: 'true', 
    });

    return treeResponse.data.tree;

  } catch (error) {
    console.error("GitHub API Error:", error);
    return []; 
  }
};

/**
 * 2. FETCH FILE CONTENT: Get the raw code for a single file
 * (This is the missing function causing your crash!)
 */
export const fetchFileContent = async (owner, repo, path) => {
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      mediaType: {
        format: 'raw' // Ask for raw text, not JSON
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching code:", error);
    return "// Error: Could not load code. It might be a binary file or rate limited.";
  }
};