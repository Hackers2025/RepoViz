const fileCache = new Map();

export const RepoMemory = {
  get: (path) => fileCache.get(path),
  set: (path, content) => fileCache.set(path, content),
  has: (path) => fileCache.has(path),
  reset: () => {
    fileCache.clear();
    console.log("Brain memory wiped.");
  }
};