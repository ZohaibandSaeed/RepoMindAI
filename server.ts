import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { parseRepoUrl, fetchGitHubRepoDetails } from './src/services/github';
import { generateRepoGraphsWithAI, explainNodeWithAI } from './src/services/gemini';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'GitVisualizer API', timestamp: new Date().toISOString() });
  });

  // POST /api/analyze-repo
  app.post('/api/analyze-repo', async (req, res) => {
    try {
      const { repo_url, github_token, gemini_token } = req.body;

      if (!repo_url) {
        return res.status(400).json({ error: 'Repository URL is required.' });
      }

      const { owner, repo } = parseRepoUrl(repo_url);
      console.log(`[API] Analyzing repository: ${owner}/${repo}`);

      // 1. Fetch details & file tree from GitHub API
      const repoDetails = await fetchGitHubRepoDetails(owner, repo, github_token);

      // 2. Generate High-Level and File Graphs via Gemini AI or fallback engine
      const graphs = await generateRepoGraphsWithAI(repoDetails, gemini_token);

      const result = {
        repoUrl: `https://github.com/${owner}/${repo}`,
        owner,
        repo,
        defaultBranch: repoDetails.defaultBranch,
        stars: repoDetails.stars,
        forks: repoDetails.forks,
        description: repoDetails.description,
        language: repoDetails.primaryLanguage,
        highLevelGraph: graphs.highLevelGraph,
        fileGraph: graphs.fileGraph,
        analyzedAt: new Date().toISOString(),
      };

      res.json(result);
    } catch (error: any) {
      console.error('[API Error /api/analyze-repo]:', error.message || error);
      res.status(500).json({
        error: error.message || 'Failed to analyze repository. Please verify the URL and try again.',
      });
    }
  });

  // POST /api/explain-node
  app.post('/api/explain-node', async (req, res) => {
    try {
      const { repoName, nodeName, nodePath, nodeType, contextSummary, gemini_token } = req.body;
      const explanation = await explainNodeWithAI(
        repoName || 'Repository',
        nodeName || 'Node',
        nodePath || 'path',
        nodeType || 'file',
        contextSummary || '',
        gemini_token
      );
      res.json(explanation);
    } catch (error: any) {
      console.error('[API Error /api/explain-node]:', error.message || error);
      res.status(500).json({ error: 'Failed to generate node explanation.' });
    }
  });

  // POST /api/chat
  app.post('/api/chat', async (req, res) => {
    try {
      const { repoName, repoData, chatHistory, message, gemini_token } = req.body;
      // chatWithRepoContext requires repoName, repoData, chatHistory, message
      const { chatWithRepoContext } = await import('./src/services/gemini');
      const reply = await chatWithRepoContext(
        repoName || 'Repository',
        repoData || {},
        chatHistory || [],
        message || '',
        gemini_token
      );
      res.json({ reply });
    } catch (error: any) {
      console.error('[API Error /api/chat]:', error.message || error);
      res.status(500).json({ error: 'Failed to process chat message.' });
    }
  });

  // POST /api/security-audit
  app.post('/api/security-audit', async (req, res) => {
    try {
      const { repo_url, github_token, gemini_token } = req.body;
      if (!repo_url) {
        return res.status(400).json({ error: 'Repository URL is required.' });
      }

      const { parseRepoUrl, fetchGitHubRepoDetails } = await import('./src/services/github');
      const { generateSecurityAudit } = await import('./src/services/gemini');

      const { owner, repo } = parseRepoUrl(repo_url);
      console.log(`[API] Running Security Audit for: ${owner}/${repo}`);

      const repoDetails = await fetchGitHubRepoDetails(owner, repo, github_token);
      const auditResult = await generateSecurityAudit(repoDetails, gemini_token);

      res.json(auditResult);
    } catch (error: any) {
      console.error('[API Error /api/security-audit]:', error.message || error);
      res.status(500).json({ error: 'Failed to generate security audit.' });
    }
  });

  // POST /api/generate-tests
  app.post('/api/generate-tests', async (req, res) => {
    try {
      const { repo_url, github_token, gemini_token, target_file } = req.body;
      if (!repo_url || !target_file) {
        return res.status(400).json({ error: 'Repository URL and Target File are required.' });
      }

      const { parseRepoUrl, fetchGitHubRepoDetails } = await import('./src/services/github');
      const { generateTestCases } = await import('./src/services/gemini');

      const { owner, repo } = parseRepoUrl(repo_url);
      console.log(`[API] Generating Tests for: ${owner}/${repo} - ${target_file}`);

      const repoDetails = await fetchGitHubRepoDetails(owner, repo, github_token);
      
      // Fetch the target file content
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'GitVisualizer-App',
      };
      if (github_token) {
        headers.Authorization = `token ${github_token}`;
      } else if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_personal_access_token_here') {
        headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
      }

      let fileContent = '';
      try {
        const { default: axios } = await import('axios');
        const encodedPath = target_file.split('/').map(encodeURIComponent).join('/');
        let fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
        
        try {
          const fileRes = await axios.get(fileUrl, { headers });
          if (fileRes.data.content) {
            fileContent = Buffer.from(fileRes.data.content, 'base64').toString('utf8');
          } else {
            fileContent = fileRes.data;
          }
        } catch (initialErr: any) {
          if (initialErr.response?.status === 404 && target_file.startsWith(`${repo}/`)) {
            // Try stripping the repo name from the path, which happens in some mock/local data
            const strippedPath = target_file.replace(`${repo}/`, '');
            const encodedStrippedPath = strippedPath.split('/').map(encodeURIComponent).join('/');
            fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedStrippedPath}`;
            const retryRes = await axios.get(fileUrl, { headers });
            if (retryRes.data.content) {
              fileContent = Buffer.from(retryRes.data.content, 'base64').toString('utf8');
            } else {
              fileContent = retryRes.data;
            }
          } else {
            throw initialErr;
          }
        }
      } catch (err: any) {
        console.error('[API] Failed to fetch target file for tests:', err.message);
        return res.status(404).json({ error: 'Failed to fetch the target file content from GitHub.' });
      }

      const testsMarkdown = await generateTestCases(repoDetails, target_file, fileContent, gemini_token);

      res.json({ testsMarkdown });
    } catch (error: any) {
      console.error('[API Error /api/generate-tests]:', error.message || error);
      res.status(500).json({ error: 'Failed to generate test cases.' });
    }
  });

  // POST /api/refactor-file
  app.post('/api/refactor-file', async (req, res) => {
    try {
      const { repo_url, github_token, gemini_token, target_file } = req.body;
      if (!repo_url || !target_file) {
        return res.status(400).json({ error: 'Repository URL and target file are required.' });
      }

      const { parseRepoUrl, fetchGitHubRepoDetails } = await import('./src/services/github');
      const { refactorCodeFile } = await import('./src/services/gemini');

      const { owner, repo } = parseRepoUrl(repo_url);
      console.log(`[API] Refactoring: ${owner}/${repo} - ${target_file}`);

      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GitVisualizer-App',
      };
      const token = github_token || process.env.GITHUB_TOKEN;
      if (token && token !== 'your_github_personal_access_token_here') {
        headers.Authorization = `token ${token}`;
      }

      let fileContent = '';
      try {
        const { default: axios } = await import('axios');
        const encodedPath = target_file.split('/').map(encodeURIComponent).join('/');
        let fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
        
        try {
          const fileRes = await axios.get(fileUrl, { headers });
          if (fileRes.data.content) {
            fileContent = Buffer.from(fileRes.data.content, 'base64').toString('utf8');
          } else {
            fileContent = fileRes.data;
          }
        } catch (initialErr: any) {
          if (initialErr.response?.status === 404 && target_file.startsWith(`${repo}/`)) {
            const strippedPath = target_file.replace(`${repo}/`, '');
            const encodedStrippedPath = strippedPath.split('/').map(encodeURIComponent).join('/');
            fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedStrippedPath}`;
            const retryRes = await axios.get(fileUrl, { headers });
            if (retryRes.data.content) {
              fileContent = Buffer.from(retryRes.data.content, 'base64').toString('utf8');
            } else {
              fileContent = retryRes.data;
            }
          } else {
            throw initialErr;
          }
        }
      } catch (err: any) {
        console.error('[API] Failed to fetch target file for refactoring:', err.message);
        return res.status(404).json({ error: 'Failed to fetch the target file content from GitHub.' });
      }

      // We still need ParsedRepoInfo for the prompt context, but we can mock most of it to save API calls
      const mockRepoInfo = {
        owner,
        repo,
        defaultBranch: 'main',
        description: 'Target Repository',
        stars: 0,
        forks: 0,
        primaryLanguage: 'Unknown',
        tree: [],
        filteredFiles: [target_file],
        keyConfigFiles: [],
      };

      const refactorMarkdown = await refactorCodeFile(mockRepoInfo, target_file, fileContent, gemini_token);
      res.json({ refactorMarkdown });
    } catch (error: any) {
      console.error('[API Error /api/refactor-file]:', error.message || error);
      res.status(500).json({ error: 'Failed to generate refactoring suggestions.' });
    }
  });

  // POST /api/heatmap
  app.post('/api/heatmap', async (req, res) => {
    try {
      const { repo_url, github_token, nodes } = req.body;
      if (!repo_url || !Array.isArray(nodes)) {
        return res.status(400).json({ error: 'Repository URL and nodes array are required.' });
      }

      const { parseRepoUrl, fetchFileCommitCount } = await import('./src/services/github');
      const { owner, repo } = parseRepoUrl(repo_url);
      console.log(`[API] Fetching Heatmap data for: ${owner}/${repo} (${nodes.length} files)`);

      const heatmapData: Record<string, number> = {};
      
      // Fetch in parallel but with small batches if needed.
      // Since it's usually <30 files, Promise.all is fine.
      const promises = nodes.map(async (path: string) => {
        const count = await fetchFileCommitCount(owner, repo, path, github_token);
        heatmapData[path] = count;
      });

      await Promise.all(promises);

      res.json({ heatmapData });
    } catch (error: any) {
      console.error('[API Error /api/heatmap]:', error.message || error);
      res.status(500).json({ error: 'Failed to fetch heatmap data.' });
    }
  });

  // Vite Middleware in Development mode
  if (process.env.NODE_ENV !== 'production') {
    createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    }).then((vite) => {
      app.use(vite.middlewares);
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`GitVisualizer server running on http://0.0.0.0:${PORT}`);
    });
  }

export default app;
