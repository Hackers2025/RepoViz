import { Octokit } from "@octokit/rest";

// Initialize Octokit
const octokit = new Octokit({ 
  // Ensure your .env token is loaded. If not, this might be undefined (which is okay for public repos to a limit)
  auth: import.meta.env.VITE_GITHUB_TOKEN 
});

export const fetchRepoTree = async (owner, repo) => {
  try {
    // 1. Get the repository details to find the "default branch" (usually main or master)
    // We use .request() to avoid "undefined property" errors
    const repoResponse = await octokit.request('GET /repos/{owner}/{repo}', {
      owner,
      repo,
    });
    
    const defaultBranch = repoResponse.data.default_branch;

    // 2. Fetch the file tree recursively using that branch
    const treeResponse = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: 'true', // returns all files, deep inside folders
    });

    // Success! Return the array of files
    return treeResponse.data.tree;

  } catch (error) {
    console.error("GitHub API Error:", error);
    // If it fails, return empty array so the app doesn't crash
    return []; 
  }
};