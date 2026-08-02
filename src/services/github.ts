import axios from 'axios';

export interface RepoTreeItem {
  path: string;
  mode: string;
  type: 'tree' | 'blob';
  sha: string;
  size?: number;
  url: string;
}

export interface ParsedRepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
  description: string;
  stars: number;
  forks: number;
  primaryLanguage: string;
  tree: RepoTreeItem[];
  filteredFiles: string[];
  keyConfigFiles: { path: string; content?: string }[];
}

// Noise patterns to ignore
const IGNORED_PATTERNS = [
  /^\.git/,
  /^node_modules/,
  /^dist/,
  /^build/,
  /^\.next/,
  /^\.nuxt/,
  /^coverage/,
  /^\.venv/,
  /^venv/,
  /^__pycache__/,
  /package-lock\.json$/,
  /pnpm-lock\.yaml$/,
  /yarn\.lock$/,
  /Cargo\.lock$/,
  /poetry\.lock$/,
  /\.DS_Store$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.ico$/,
  /\.svg$/,
  /\.woff/,
  /\.ttf/,
  /\.mp4$/,
  /\.zip$/,
  /\.pdf$/
];

export function parseRepoUrl(urlInput: string): { owner: string; repo: string } {
  let clean = urlInput.trim();
  clean = clean.replace(/^https?:\/\/github\.com\//i, '');
  clean = clean.replace(/\.git$/i, '');
  clean = clean.replace(/\/$/, '');

  const parts = clean.split('/');
  if (parts.length >= 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  
  throw new Error('Invalid GitHub Repository URL. Expected format: https://github.com/owner/repository');
}

export async function fetchGitHubRepoDetails(owner: string, repo: string, githubToken?: string): Promise<ParsedRepoInfo> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitVisualizer-App',
  };

  const token = githubToken || process.env.GITHUB_TOKEN;
  if (token && token !== 'your_github_personal_access_token_here') {
    headers.Authorization = `token ${token}`;
  }

  // 1. Fetch Repository Metadata
  const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  const repoData = repoRes.data;
  const defaultBranch = repoData.default_branch || 'main';

  // 2. Fetch Recursive Git Tree
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
  const treeRes = await axios.get(treeUrl, { headers });
  const rawTree: RepoTreeItem[] = treeRes.data.tree || [];

  // Filter out noise
  const filteredTree = rawTree.filter((item) => {
    if (item.type !== 'blob') return false;
    return !IGNORED_PATTERNS.some((pattern) => pattern.test(item.path));
  });

  const filteredFiles = filteredTree.map((f) => f.path);

  // Identify key configuration / package files to inspect
  const keyConfigPaths = filteredFiles.filter((p) =>
    /^(package\.json|requirements\.txt|tsconfig\.json|go\.mod|Cargo\.toml|pyproject\.toml|Dockerfile|docker-compose\.yml|server\.ts|src\/App\.tsx|main\.py|App\.js)$/i.test(p)
  );

  const keyConfigFiles: { path: string; content?: string }[] = [];

  // Fetch content for up to 5 key config files to help Gemini analyze accurately
  for (const p of keyConfigPaths.slice(0, 5)) {
    try {
      const fileRes = await axios.get(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${p}`, {
        headers,
        timeout: 4000,
      });
      if (typeof fileRes.data === 'string' || typeof fileRes.data === 'object') {
        const contentStr = typeof fileRes.data === 'object' ? JSON.stringify(fileRes.data, null, 2) : fileRes.data;
        keyConfigFiles.push({
          path: p,
          content: contentStr.slice(0, 1500), // Limit snippet size
        });
      }
    } catch {
      // Ignore individual file snippet errors
    }
  }

  return {
    owner,
    repo,
    defaultBranch,
    description: repoData.description || 'Public GitHub Repository',
    stars: repoData.stargazers_count || 0,
    forks: repoData.forks_count || 0,
    primaryLanguage: repoData.language || 'TypeScript/JavaScript',
    tree: filteredTree,
    filteredFiles,
    keyConfigFiles,
  };
}

export async function fetchFileCommitCount(
  owner: string,
  repo: string,
  path: string,
  githubToken?: string
): Promise<number> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitVisualizer-App',
  };

  const token = githubToken || process.env.GITHUB_TOKEN;
  if (token && token !== 'your_github_personal_access_token_here') {
    headers.Authorization = `token ${token}`;
  }

  try {
    let cleanPath = path;
    if (cleanPath.startsWith(`${repo}/`)) {
      cleanPath = cleanPath.substring(repo.length + 1);
    }
    
    // Do not encode slashes in the path query parameter
    const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodedPath}&per_page=1`;
    const res = await axios.get(url, { headers });
    
    // Check for the "Link" header to extract the last page number
    const linkHeader = res.headers['link'];
    if (linkHeader) {
      // e.g. <https://api.github.com/...&page=45>; rel="last"
      const match = linkHeader.match(/&page=(\d+)>; rel="last"/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
    
    // If there is no link header, the total commits is just the length of the current response
    return res.data.length || 0;
  } catch (error) {
    console.error(`[GitHub API] Failed to fetch commit count for ${path}`, error);
    return 0; // fallback to 0 instead of breaking the entire heatmap
  }
}
