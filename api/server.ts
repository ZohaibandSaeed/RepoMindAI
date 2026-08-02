import express from 'express';
import dotenv from 'dotenv';
import { parseRepoUrl, fetchGitHubRepoDetails } from '../src/services/github';
import { generateRepoGraphsWithAI, explainNodeWithAI, chatWithRepoContext, generateSecurityAudit, generateTestCases } from '../src/services/gemini';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GitVisualizer API' });
});

app.post('/api/analyze-repo', async (req, res) => {
  try {
    const { repo_url, github_token, gemini_token } = req.body;
    if (!repo_url) return res.status(400).json({ error: 'Repository URL is required.' });
    const { owner, repo } = parseRepoUrl(repo_url);
    const repoDetails = await fetchGitHubRepoDetails(owner, repo, github_token);
    const graphs = await generateRepoGraphsWithAI(repoDetails, gemini_token);
    res.json({
      repoUrl: `https://github.com/${owner}/${repo}`,
      owner, repo,
      defaultBranch: repoDetails.defaultBranch,
      stars: repoDetails.stars, forks: repoDetails.forks,
      description: repoDetails.description, language: repoDetails.primaryLanguage,
      highLevelGraph: graphs.highLevelGraph, fileGraph: graphs.fileGraph,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to analyze repository.' });
  }
});

app.post('/api/explain-node', async (req, res) => {
  try {
    const { repoName, nodeName, nodePath, nodeType, contextSummary, gemini_token } = req.body;
    const explanation = await explainNodeWithAI(repoName, nodeName, nodePath, nodeType, contextSummary, gemini_token);
    res.json(explanation);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate node explanation.' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { repoName, repoData, chatHistory, message, gemini_token } = req.body;
    const reply = await chatWithRepoContext(repoName, repoData, chatHistory, message, gemini_token);
    res.json({ reply });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to process chat message.' });
  }
});

app.post('/api/security-audit', async (req, res) => {
  try {
    const { repo_url, github_token, gemini_token } = req.body;
    const { owner, repo } = parseRepoUrl(repo_url);
    const repoDetails = await fetchGitHubRepoDetails(owner, repo, github_token);
    const result = await generateSecurityAudit(repoDetails, gemini_token);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to run security audit.' });
  }
});

app.post('/api/generate-tests', async (req, res) => {
  try {
    const { repo_url, file_path, file_content, github_token, gemini_token } = req.body;
    const result = await generateTestCases(repo_url, file_path, file_content, gemini_token);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate test cases.' });
  }
});

export default app;
