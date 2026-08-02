var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// api/index.ts
var import_express = __toESM(require("express"));
var import_dotenv = __toESM(require("dotenv"));

// src/services/github.ts
var import_axios = __toESM(require("axios"));
var IGNORED_PATTERNS = [
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
function parseRepoUrl(urlInput) {
  let clean = urlInput.trim();
  clean = clean.replace(/^https?:\/\/github\.com\//i, "");
  clean = clean.replace(/\.git$/i, "");
  clean = clean.replace(/\/$/, "");
  const parts = clean.split("/");
  if (parts.length >= 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  throw new Error("Invalid GitHub Repository URL. Expected format: https://github.com/owner/repository");
}
async function fetchGitHubRepoDetails(owner, repo, githubToken) {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitVisualizer-App"
  };
  const token = githubToken || process.env.GITHUB_TOKEN;
  if (token && token !== "your_github_personal_access_token_here") {
    headers.Authorization = `token ${token}`;
  }
  const repoRes = await import_axios.default.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  const repoData = repoRes.data;
  const defaultBranch = repoData.default_branch || "main";
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
  const treeRes = await import_axios.default.get(treeUrl, { headers });
  const rawTree = treeRes.data.tree || [];
  const filteredTree = rawTree.filter((item) => {
    if (item.type !== "blob") return false;
    return !IGNORED_PATTERNS.some((pattern) => pattern.test(item.path));
  });
  const filteredFiles = filteredTree.map((f) => f.path);
  const keyConfigPaths = filteredFiles.filter(
    (p) => /^(package\.json|requirements\.txt|tsconfig\.json|go\.mod|Cargo\.toml|pyproject\.toml|Dockerfile|docker-compose\.yml|server\.ts|src\/App\.tsx|main\.py|App\.js)$/i.test(p)
  );
  const keyConfigFiles = [];
  for (const p of keyConfigPaths.slice(0, 5)) {
    try {
      const fileRes = await import_axios.default.get(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${p}`, {
        headers,
        timeout: 4e3
      });
      if (typeof fileRes.data === "string" || typeof fileRes.data === "object") {
        const contentStr = typeof fileRes.data === "object" ? JSON.stringify(fileRes.data, null, 2) : fileRes.data;
        keyConfigFiles.push({
          path: p,
          content: contentStr.slice(0, 1500)
          // Limit snippet size
        });
      }
    } catch {
    }
  }
  return {
    owner,
    repo,
    defaultBranch,
    description: repoData.description || "Public GitHub Repository",
    stars: repoData.stargazers_count || 0,
    forks: repoData.forks_count || 0,
    primaryLanguage: repoData.language || "TypeScript/JavaScript",
    tree: filteredTree,
    filteredFiles,
    keyConfigFiles
  };
}

// src/services/gemini.ts
var import_genai = require("@google/genai");
var aiInstance = null;
function getGeminiClient(geminiToken) {
  if (geminiToken) {
    return new import_genai.GoogleGenAI({
      apiKey: geminiToken,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });
  }
  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("[Gemini] GEMINI_API_KEY not configured. Will use fallback heuristic diagram engine.");
    return null;
  }
  aiInstance = new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  return aiInstance;
}
async function generateRepoGraphsWithAI(repoInfo, geminiToken) {
  const ai = getGeminiClient(geminiToken);
  if (!ai) {
    return generateFallbackGraphs(repoInfo);
  }
  try {
    const fileListSample = repoInfo.filteredFiles.slice(0, 80).join("\n");
    const configsSnippet = repoInfo.keyConfigFiles.map((c) => `--- File: ${c.path} ---
${c.content}`).join("\n\n");
    const prompt = `You are a Principal Software Architect expert in analyzing repository structure, system architecture, and code dependency graphs.

Analyze this GitHub Repository: ${repoInfo.owner}/${repoInfo.repo}
Description: ${repoInfo.description}
Primary Language: ${repoInfo.primaryLanguage}

Top File Paths in Repository:
${fileListSample}

Key Configuration Snippets:
${configsSnippet}

Generate a structured JSON output representing TWO views:
1. "highLevelGraph": High-Level Architecture View. Include key architectural subsystems (e.g. Browser / Client UI, Router/Controller Layer, API Backend, Services/Business Logic, Database/Persistence, External Integrations, Configuration). Each node MUST have a 'type' from: ['frontend', 'backend', 'database', 'service', 'api', 'config', 'middleware', 'external'].
2. "fileGraph": Dependency & File View. Include up to 25 primary code files and their import/dependency relationships based on file structure. Each node represents a real file from the repository with a 2-3 sentence AI summary of what the file does.

Ensure valid, well-formed JSON matching the required schema.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            highLevelGraph: {
              type: import_genai.Type.OBJECT,
              properties: {
                architectureOverview: { type: import_genai.Type.STRING },
                primaryTechStack: {
                  type: import_genai.Type.ARRAY,
                  items: { type: import_genai.Type.STRING }
                },
                nodes: {
                  type: import_genai.Type.ARRAY,
                  items: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      id: { type: import_genai.Type.STRING },
                      label: { type: import_genai.Type.STRING },
                      type: { type: import_genai.Type.STRING },
                      description: { type: import_genai.Type.STRING },
                      tech: { type: import_genai.Type.STRING },
                      layer: { type: import_genai.Type.STRING }
                    },
                    required: ["id", "label", "type", "description"]
                  }
                },
                edges: {
                  type: import_genai.Type.ARRAY,
                  items: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      id: { type: import_genai.Type.STRING },
                      source: { type: import_genai.Type.STRING },
                      target: { type: import_genai.Type.STRING },
                      label: { type: import_genai.Type.STRING },
                      animated: { type: import_genai.Type.BOOLEAN }
                    },
                    required: ["id", "source", "target"]
                  }
                }
              },
              required: ["nodes", "edges", "architectureOverview", "primaryTechStack"]
            },
            fileGraph: {
              type: import_genai.Type.OBJECT,
              properties: {
                directoryStructureSummary: { type: import_genai.Type.STRING },
                totalFilesParsed: { type: import_genai.Type.NUMBER },
                nodes: {
                  type: import_genai.Type.ARRAY,
                  items: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      id: { type: import_genai.Type.STRING },
                      label: { type: import_genai.Type.STRING },
                      path: { type: import_genai.Type.STRING },
                      folder: { type: import_genai.Type.STRING },
                      fileType: { type: import_genai.Type.STRING },
                      summary: { type: import_genai.Type.STRING },
                      githubUrl: { type: import_genai.Type.STRING },
                      metrics: {
                        type: import_genai.Type.OBJECT,
                        properties: {
                          linesEst: { type: import_genai.Type.NUMBER },
                          complexity: { type: import_genai.Type.STRING },
                          type: { type: import_genai.Type.STRING }
                        }
                      }
                    },
                    required: ["id", "label", "path", "folder", "fileType", "summary"]
                  }
                },
                edges: {
                  type: import_genai.Type.ARRAY,
                  items: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      id: { type: import_genai.Type.STRING },
                      source: { type: import_genai.Type.STRING },
                      target: { type: import_genai.Type.STRING },
                      label: { type: import_genai.Type.STRING }
                    },
                    required: ["id", "source", "target"]
                  }
                }
              },
              required: ["nodes", "edges", "directoryStructureSummary"]
            }
          },
          required: ["highLevelGraph", "fileGraph"]
        }
      }
    });
    const jsonText = response.text || "";
    const parsed = JSON.parse(jsonText);
    parsed.fileGraph.nodes = parsed.fileGraph.nodes.map((node) => ({
      ...node,
      githubUrl: node.githubUrl || `https://github.com/${repoInfo.owner}/${repoInfo.repo}/blob/${repoInfo.defaultBranch}/${node.path}`
    }));
    return parsed;
  } catch (error) {
    console.error("[Gemini] AI Graph generation failed, falling back to heuristic graph:", error);
    return generateFallbackGraphs(repoInfo);
  }
}
function generateFallbackGraphs(repoInfo) {
  const { owner, repo, defaultBranch, filteredFiles, primaryLanguage } = repoInfo;
  const highLevelNodes = [
    {
      id: "client-ui",
      label: "Client User Interface",
      type: "frontend",
      description: "Web application frontend rendering views, user interactions, and state management.",
      tech: primaryLanguage.includes("TypeScript") || primaryLanguage.includes("JavaScript") ? "React / Next.js" : "Web UI",
      layer: "Presentation Layer"
    },
    {
      id: "api-gateway",
      label: "API Gateway / Router",
      type: "api",
      description: "Handles incoming client HTTP requests, route handling, and middleware authentication.",
      tech: "REST / GraphQL API",
      layer: "API Layer"
    },
    {
      id: "business-logic",
      label: "Core Business Logic / Services",
      type: "backend",
      description: "Processes data operations, controller handlers, domain rules, and workflow logic.",
      tech: primaryLanguage,
      layer: "Domain Layer"
    },
    {
      id: "data-store",
      label: "Data Persistence / Models",
      type: "database",
      description: "Manages database queries, ORM schema models, caching, or persistent storage.",
      tech: "Database / Storage",
      layer: "Data Layer"
    },
    {
      id: "configs-env",
      label: "Config & Build System",
      type: "config",
      description: "Environment settings, package manifests, build tools, and configuration scripts.",
      tech: "Build Tools / ENV",
      layer: "Infrastructure"
    }
  ];
  const highLevelEdges = [
    { id: "e1", source: "client-ui", target: "api-gateway", label: "HTTP / REST Requests", animated: true },
    { id: "e2", source: "api-gateway", target: "business-logic", label: "Routes & Controllers", animated: true },
    { id: "e3", source: "business-logic", target: "data-store", label: "ORM / Queries", animated: true },
    { id: "e4", source: "configs-env", target: "business-logic", label: "Injects Configs", animated: false }
  ];
  const topFiles = filteredFiles.slice(0, 20);
  const fileNodes = topFiles.map((filePath) => {
    const fileName = filePath.split("/").pop() || filePath;
    const folderParts = filePath.split("/");
    const folder = folderParts.length > 1 ? folderParts.slice(0, -1).join("/") : "root";
    const ext = fileName.includes(".") ? fileName.split(".").pop() || "txt" : "file";
    let summary = `Source code file in ${folder} handling modular logic and dependencies for the ${repo} codebase.`;
    if (fileName.includes("App") || fileName.includes("index") || fileName.includes("page")) {
      summary = `Primary entry point for ${repo}, initializing application components, routing, and main layout structure.`;
    } else if (fileName.includes("config") || fileName.includes("package") || fileName.includes("tsconfig")) {
      summary = `Configuration manifest establishing dependencies, build rules, and environment parameters.`;
    }
    return {
      id: filePath,
      label: fileName,
      path: filePath,
      folder,
      fileType: ext,
      summary,
      githubUrl: `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${filePath}`,
      metrics: {
        linesEst: Math.floor(Math.random() * 150) + 20,
        complexity: filePath.length > 20 ? "Medium" : "Low",
        type: ext.toUpperCase()
      }
    };
  });
  const fileEdges = [];
  for (let i = 0; i < fileNodes.length - 1; i++) {
    const current = fileNodes[i];
    const next = fileNodes[i + 1];
    if (current.folder === next.folder || i === 0) {
      fileEdges.push({
        id: `fe-${i}`,
        source: current.id,
        target: next.id,
        label: "imports / uses"
      });
    }
  }
  return {
    highLevelGraph: {
      architectureOverview: `System architecture for ${owner}/${repo} categorized into presentation, API, domain, and data persistence layers.`,
      primaryTechStack: [primaryLanguage, "REST API", "Node.js / Python", "Git"],
      nodes: highLevelNodes,
      edges: highLevelEdges
    },
    fileGraph: {
      directoryStructureSummary: `Analyzed ${filteredFiles.length} repository files across ${topFiles.length} primary modules.`,
      totalFilesParsed: filteredFiles.length,
      nodes: fileNodes,
      edges: fileEdges
    }
  };
}
async function explainNodeWithAI(repoName, nodeName, nodePath, nodeType, contextSummary, geminiToken) {
  const ai = getGeminiClient(geminiToken);
  if (!ai) {
    return {
      nodeId: nodePath,
      summary: contextSummary || `${nodeName} plays a key functional role in ${repoName}.`,
      detailedPurpose: `This ${nodeType} file (${nodePath}) defines modular logic, functions, or interface definitions used by connected components in the ${repoName} project.`,
      keyResponsibilities: [
        "Encapsulate domain specific state and utility methods",
        "Provide reusable exports for connected components",
        "Maintain system separation of concerns"
      ],
      simplifiedUrduExplanation: `Yeh file (${nodeName}) project ka ek aham hissa hai jo specific function ya UI component ko chalane ke liye kaam aati hai.`
    };
  }
  try {
    const prompt = `Provide a clear, detailed, developer-friendly explanation for the following file/node in repository "${repoName}":
File/Node Name: ${nodeName}
File Path: ${nodePath}
Node Type: ${nodeType}
Context: ${contextSummary}

Return JSON with:
1. "summary": 2-3 sentence overview of what this file/component does in plain English.
2. "detailedPurpose": Detailed 1-paragraph architectural breakdown.
3. "keyResponsibilities": Array of 3 key responsibilities.
4. "simplifiedUrduExplanation": 1-2 sentence simple explanation in Roman Urdu / Urdu-friendly text for easy learning.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            summary: { type: import_genai.Type.STRING },
            detailedPurpose: { type: import_genai.Type.STRING },
            keyResponsibilities: {
              type: import_genai.Type.ARRAY,
              items: { type: import_genai.Type.STRING }
            },
            simplifiedUrduExplanation: { type: import_genai.Type.STRING }
          },
          required: ["summary", "detailedPurpose", "keyResponsibilities", "simplifiedUrduExplanation"]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return {
      nodeId: nodePath,
      ...parsed
    };
  } catch (e) {
    return {
      nodeId: nodePath,
      summary: contextSummary,
      detailedPurpose: `Detailed explanation for ${nodeName} in ${repoName}.`,
      keyResponsibilities: ["Core component logic", "Interface definition", "Data handling"],
      simplifiedUrduExplanation: `Yeh component project ke flow me madad karta hai.`
    };
  }
}
async function chatWithRepoContext(repoName, repoContext, chatHistory, message, geminiToken) {
  const ai = getGeminiClient(geminiToken);
  if (!ai) {
    return "I'm currently in fallback mode (no Gemini API Key configured). I cannot chat about the repository, but you can explore the fallback graphs!";
  }
  try {
    const systemInstruction = `You are a Principal Software Architect expert in analyzing repository structure, system architecture, and code dependency graphs.
You are chatting with a developer about the repository "${repoName}".
Here is the context of the repository's architecture and file structure:
Architecture Overview: ${repoContext?.highLevelGraph?.architectureOverview || "N/A"}
Tech Stack: ${(repoContext?.highLevelGraph?.primaryTechStack || []).join(", ")}

File Structure:
${(repoContext?.fileGraph?.nodes || []).map((n) => `- ${n.path} (${n.summary})`).join("\n")}

Answer the developer's questions based on this structural information. If they ask about something not present in the summary, tell them you only have access to the high-level architecture and file names, not the full source code contents. Answer concisely in Markdown.`;
    const chat = ai.chats.create({
      model: "gemini-3.6-flash",
      config: {
        systemInstruction
      },
      history: chatHistory.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }))
    });
    const response = await chat.sendMessage({ message });
    return response.text || "";
  } catch (error) {
    console.error("[Gemini] Chat failed:", error);
    return `Sorry, I encountered an error while trying to process your message: ${error.message}`;
  }
}
async function generateSecurityAudit(repoInfo, geminiToken) {
  const ai = getGeminiClient(geminiToken);
  if (!ai) {
    return {
      deploymentScore: 50,
      securityConcerns: [
        { fileName: "N/A", severity: "Medium", description: "AI Agent is offline. Cannot perform security audit." }
      ],
      reviewSuggestions: ["Configure GEMINI_API_KEY to enable AI security auditing."]
    };
  }
  try {
    const fileListSample = repoInfo.filteredFiles.slice(0, 150).join("\n");
    const configsSnippet = repoInfo.keyConfigFiles.map((c) => `--- File: ${c.path} ---
${c.content}`).join("\n\n");
    const prompt = `You are an Expert AppSec Engineer and Senior Code Reviewer.
Analyze this GitHub Repository for security vulnerabilities, bad practices, and code quality issues:
Repository: ${repoInfo.owner}/${repoInfo.repo}
Description: ${repoInfo.description}
Primary Language: ${repoInfo.primaryLanguage}

Top File Paths in Repository:
${fileListSample}

Key Configuration / Source Snippets:
${configsSnippet}

Based on this limited structural and config context, perform a security and code review audit.
Return a JSON object with:
1. "deploymentScore": An integer from 0 to 100 representing production readiness (lower if major security headers or limits are missing).
2. "securityConcerns": An array of objects, each containing:
   - "fileName": The file or general area (e.g., 'server.ts', 'package.json')
   - "severity": "High", "Medium", or "Low"
   - "description": A concise explanation of the issue (e.g., "No rate limiting found", "Outdated dependencies").
3. "reviewSuggestions": An array of string suggestions to improve overall code quality and security.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            deploymentScore: { type: import_genai.Type.NUMBER },
            securityConcerns: {
              type: import_genai.Type.ARRAY,
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  fileName: { type: import_genai.Type.STRING },
                  severity: { type: import_genai.Type.STRING },
                  description: { type: import_genai.Type.STRING }
                },
                required: ["fileName", "severity", "description"]
              }
            },
            reviewSuggestions: {
              type: import_genai.Type.ARRAY,
              items: { type: import_genai.Type.STRING }
            }
          },
          required: ["deploymentScore", "securityConcerns", "reviewSuggestions"]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return parsed;
  } catch (error) {
    console.error("[Gemini] Security Audit generation failed:", error);
    return {
      deploymentScore: 0,
      securityConcerns: [
        { fileName: "System", severity: "High", description: "Failed to complete security audit." }
      ],
      reviewSuggestions: ["Check the server logs for API errors."]
    };
  }
}
async function generateTestCases(repoInfo, targetFilePath, fileContent, geminiToken) {
  const ai = getGeminiClient(geminiToken);
  if (!ai) {
    return "# Error\nAI Agent is offline. Cannot generate test cases. Please configure GEMINI_API_KEY.";
  }
  try {
    const prompt = `You are an Expert SDET (Software Development Engineer in Test).
Your task is to write comprehensive test cases for a specific file in the following GitHub Repository:
Repository: ${repoInfo.owner}/${repoInfo.repo}
Description: ${repoInfo.description}
Primary Language: ${repoInfo.primaryLanguage}

Target File: ${targetFilePath}
File Content:
\`\`\`
${fileContent}
\`\`\`

Generate a comprehensive test suite for this file. 
Include:
1. A brief summary of what is being tested.
2. The complete code for the test file (use the standard testing framework for the language, e.g., Jest for JS/TS, PyTest for Python, etc.). Include necessary mocks and edge cases.
3. Instructions on how to run these tests.

Format the output entirely in beautiful Markdown. Do NOT wrap the entire response in a JSON block, just return the raw markdown text. Use appropriate headings (H1, H2, H3) and code blocks.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });
    return response.text || "# Error\nNo test cases generated.";
  } catch (error) {
    console.error("[Gemini] Test Case generation failed:", error);
    return `# Error generating tests
An error occurred while generating test cases: ${error.message}`;
  }
}

// api/index.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
app.use(import_express.default.json());
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "GitVisualizer API" });
});
app.post("/api/analyze-repo", async (req, res) => {
  try {
    const { repo_url, github_token, gemini_token } = req.body;
    if (!repo_url) return res.status(400).json({ error: "Repository URL is required." });
    const { owner, repo } = parseRepoUrl(repo_url);
    const repoDetails = await fetchGitHubRepoDetails(owner, repo, github_token);
    const graphs = await generateRepoGraphsWithAI(repoDetails, gemini_token);
    res.json({
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
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to analyze repository." });
  }
});
app.post("/api/explain-node", async (req, res) => {
  try {
    const { repoName, nodeName, nodePath, nodeType, contextSummary, gemini_token } = req.body;
    const explanation = await explainNodeWithAI(repoName, nodeName, nodePath, nodeType, contextSummary, gemini_token);
    res.json(explanation);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate node explanation." });
  }
});
app.post("/api/chat", async (req, res) => {
  try {
    const { repoName, repoData, chatHistory, message, gemini_token } = req.body;
    const reply = await chatWithRepoContext(repoName, repoData, chatHistory, message, gemini_token);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: "Failed to process chat message." });
  }
});
app.post("/api/security-audit", async (req, res) => {
  try {
    const { repo_url, github_token, gemini_token } = req.body;
    const { owner, repo } = parseRepoUrl(repo_url);
    const repoDetails = await fetchGitHubRepoDetails(owner, repo, github_token);
    const result = await generateSecurityAudit(repoDetails, gemini_token);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to run security audit." });
  }
});
app.post("/api/generate-tests", async (req, res) => {
  try {
    const { repo_url, file_path, file_content, github_token, gemini_token } = req.body;
    const result = await generateTestCases(repo_url, file_path, file_content, gemini_token);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate test cases." });
  }
});
module.exports = app;
