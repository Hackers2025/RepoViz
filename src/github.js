// src/github.js
import { Octokit } from "@octokit/core";

console.log("My Token is:", import.meta.env.VITE_GITHUB_TOKEN);

const octokit = new Octokit({
  auth: import.meta.env.VITE_GITHUB_TOKEN
});

export async function fetchRepoTree(owner, name) {
  const query = `
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: "HEAD:") {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Blob {
                  byteSize
                }
                ... on Tree {
                  entries {
                    name
                    type
                    object {
                      ... on Blob { byteSize }
                      ... on Tree {
                        entries {
                          name
                          type
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await octokit.graphql(query, {
      owner,
      name,
    });
    return response.repository.object.entries;
  } catch (error) {
    console.error("GitHub API Error:", error);
    return null;
  }
}