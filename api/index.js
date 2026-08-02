var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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

// src/services/github.ts
var github_exports = {};
__export(github_exports, {
  fetchFileCommitCount: () => fetchFileCommitCount,
  fetchGitHubRepoDetails: () => fetchGitHubRepoDetails,
  parseRepoUrl: () => parseRepoUrl
});
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
async function fetchFileCommitCount(owner, repo, path2, githubToken) {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitVisualizer-App"
  };
  const token = githubToken || process.env.GITHUB_TOKEN;
  if (token && token !== "your_github_personal_access_token_here") {
    headers.Authorization = `token ${token}`;
  }
  try {
    let cleanPath = path2;
    if (cleanPath.startsWith(`${repo}/`)) {
      cleanPath = cleanPath.substring(repo.length + 1);
    }
    const encodedPath = cleanPath.split("/").map(encodeURIComponent).join("/");
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodedPath}&per_page=1`;
    const res = await import_axios.default.get(url, { headers });
    const linkHeader = res.headers["link"];
    if (linkHeader) {
      const match = linkHeader.match(/&page=(\d+)>; rel="last"/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
    return res.data.length || 0;
  } catch (error) {
    console.error(`[GitHub API] Failed to fetch commit count for ${path2}`, error);
    return 0;
  }
}
var import_axios, IGNORED_PATTERNS;
var init_github = __esm({
  "src/services/github.ts"() {
    import_axios = __toESM(require("axios"));
    IGNORED_PATTERNS = [
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
  }
});

// src/services/gemini.ts
var gemini_exports = {};
__export(gemini_exports, {
  chatWithRepoContext: () => chatWithRepoContext,
  explainNodeWithAI: () => explainNodeWithAI,
  generateFallbackGraphs: () => generateFallbackGraphs,
  generateRepoGraphsWithAI: () => generateRepoGraphsWithAI,
  generateSecurityAudit: () => generateSecurityAudit,
  generateTestCases: () => generateTestCases,
  refactorCodeFile: () => refactorCodeFile
});
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
async function refactorCodeFile(repoInfo, targetFilePath, fileContent, geminiToken) {
  const ai = getGeminiClient(geminiToken);
  if (!ai) {
    return "# Error\nAI Agent is offline. Cannot refactor code. Please configure GEMINI_API_KEY.";
  }
  try {
    const prompt = `You are a Principal Software Engineer and Code Optimizer.
Your task is to review a specific file from the following GitHub Repository and provide targeted refactoring suggestions:
Repository: ${repoInfo.owner}/${repoInfo.repo}
Target File: ${targetFilePath}
File Content:
\`\`\`
${fileContent}
\`\`\`

DO NOT output the full rewritten file. Only provide the specific parts that need improvement (e.g. code smells, performance issues, outdated patterns, security flaws).
Format your response entirely in Markdown. 
For each issue you find, create a section with:
1. **Issue Description:** A brief explanation of the problem.
2. **Old Code:** The exact lines or snippet that is problematic.
3. **New Code:** The exact replacement code snippet.
4. **Benefit:** A 1-sentence explanation of why this change is beneficial (e.g., better performance, cleaner code, modern syntax).

If the file is already perfect and follows best practices, simply state that no refactoring is needed.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });
    return response.text || "# Error\nNo refactoring suggestions generated.";
  } catch (error) {
    console.error("[Gemini] Refactor generation failed:", error);
    return `# Error generating refactor
An error occurred: ${error.message}`;
  }
}
var import_genai, aiInstance;
var init_gemini = __esm({
  "src/services/gemini.ts"() {
    import_genai = require("@google/genai");
    aiInstance = null;
  }
});

// server.ts
var import_express = __toESM(require("express"));
var import_path = __toESM(require("path"));
var import_dotenv = __toESM(require("dotenv"));
init_github();
init_gemini();
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = process.env.PORT || 3e3;
app.use(import_express.default.json());
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "GitVisualizer API", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/analyze-repo", async (req, res) => {
  try {
    const { repo_url, github_token, gemini_token } = req.body;
    if (!repo_url) {
      return res.status(400).json({ error: "Repository URL is required." });
    }
    const { owner, repo } = parseRepoUrl(repo_url);
    console.log(`[API] Analyzing repository: ${owner}/${repo}`);
    const repoDetails = await fetchGitHubRepoDetails(owner, repo, github_token);
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
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    res.json(result);
  } catch (error) {
    console.error("[API Error /api/analyze-repo]:", error.message || error);
    res.status(500).json({
      error: error.message || "Failed to analyze repository. Please verify the URL and try again."
    });
  }
});
app.post("/api/explain-node", async (req, res) => {
  try {
    const { repoName, nodeName, nodePath, nodeType, contextSummary, gemini_token } = req.body;
    const explanation = await explainNodeWithAI(
      repoName || "Repository",
      nodeName || "Node",
      nodePath || "path",
      nodeType || "file",
      contextSummary || "",
      gemini_token
    );
    res.json(explanation);
  } catch (error) {
    console.error("[API Error /api/explain-node]:", error.message || error);
    res.status(500).json({ error: "Failed to generate node explanation." });
  }
});
app.post("/api/chat", async (req, res) => {
  try {
    const { repoName, repoData, chatHistory, message, gemini_token } = req.body;
    const { chatWithRepoContext: chatWithRepoContext2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
    const reply = await chatWithRepoContext2(
      repoName || "Repository",
      repoData || {},
      chatHistory || [],
      message || "",
      gemini_token
    );
    res.json({ reply });
  } catch (error) {
    console.error("[API Error /api/chat]:", error.message || error);
    res.status(500).json({ error: "Failed to process chat message." });
  }
});
app.post("/api/security-audit", async (req, res) => {
  try {
    const { repo_url, github_token, gemini_token } = req.body;
    if (!repo_url) {
      return res.status(400).json({ error: "Repository URL is required." });
    }
    const { parseRepoUrl: parseRepoUrl2, fetchGitHubRepoDetails: fetchGitHubRepoDetails2 } = await Promise.resolve().then(() => (init_github(), github_exports));
    const { generateSecurityAudit: generateSecurityAudit2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
    const { owner, repo } = parseRepoUrl2(repo_url);
    console.log(`[API] Running Security Audit for: ${owner}/${repo}`);
    const repoDetails = await fetchGitHubRepoDetails2(owner, repo, github_token);
    const auditResult = await generateSecurityAudit2(repoDetails, gemini_token);
    res.json(auditResult);
  } catch (error) {
    console.error("[API Error /api/security-audit]:", error.message || error);
    res.status(500).json({ error: "Failed to generate security audit." });
  }
});
app.post("/api/generate-tests", async (req, res) => {
  try {
    const { repo_url, github_token, gemini_token, target_file } = req.body;
    if (!repo_url || !target_file) {
      return res.status(400).json({ error: "Repository URL and Target File are required." });
    }
    const { parseRepoUrl: parseRepoUrl2, fetchGitHubRepoDetails: fetchGitHubRepoDetails2 } = await Promise.resolve().then(() => (init_github(), github_exports));
    const { generateTestCases: generateTestCases2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
    const { owner, repo } = parseRepoUrl2(repo_url);
    console.log(`[API] Generating Tests for: ${owner}/${repo} - ${target_file}`);
    const repoDetails = await fetchGitHubRepoDetails2(owner, repo, github_token);
    const headers = {
      Accept: "application/vnd.github.v3.raw",
      "User-Agent": "GitVisualizer-App"
    };
    if (github_token) {
      headers.Authorization = `token ${github_token}`;
    } else if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== "your_github_personal_access_token_here") {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }
    let fileContent = "";
    try {
      const { default: axios2 } = await import("axios");
      const encodedPath = target_file.split("/").map(encodeURIComponent).join("/");
      let fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
      try {
        const fileRes = await axios2.get(fileUrl, { headers });
        if (fileRes.data.content) {
          fileContent = Buffer.from(fileRes.data.content, "base64").toString("utf8");
        } else {
          fileContent = fileRes.data;
        }
      } catch (initialErr) {
        if (initialErr.response?.status === 404 && target_file.startsWith(`${repo}/`)) {
          const strippedPath = target_file.replace(`${repo}/`, "");
          const encodedStrippedPath = strippedPath.split("/").map(encodeURIComponent).join("/");
          fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedStrippedPath}`;
          const retryRes = await axios2.get(fileUrl, { headers });
          if (retryRes.data.content) {
            fileContent = Buffer.from(retryRes.data.content, "base64").toString("utf8");
          } else {
            fileContent = retryRes.data;
          }
        } else {
          throw initialErr;
        }
      }
    } catch (err) {
      console.error("[API] Failed to fetch target file for tests:", err.message);
      return res.status(404).json({ error: "Failed to fetch the target file content from GitHub." });
    }
    const testsMarkdown = await generateTestCases2(repoDetails, target_file, fileContent, gemini_token);
    res.json({ testsMarkdown });
  } catch (error) {
    console.error("[API Error /api/generate-tests]:", error.message || error);
    res.status(500).json({ error: "Failed to generate test cases." });
  }
});
app.post("/api/refactor-file", async (req, res) => {
  try {
    const { repo_url, github_token, gemini_token, target_file } = req.body;
    if (!repo_url || !target_file) {
      return res.status(400).json({ error: "Repository URL and target file are required." });
    }
    const { parseRepoUrl: parseRepoUrl2, fetchGitHubRepoDetails: fetchGitHubRepoDetails2 } = await Promise.resolve().then(() => (init_github(), github_exports));
    const { refactorCodeFile: refactorCodeFile2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
    const { owner, repo } = parseRepoUrl2(repo_url);
    console.log(`[API] Refactoring: ${owner}/${repo} - ${target_file}`);
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "GitVisualizer-App"
    };
    const token = github_token || process.env.GITHUB_TOKEN;
    if (token && token !== "your_github_personal_access_token_here") {
      headers.Authorization = `token ${token}`;
    }
    let fileContent = "";
    try {
      const { default: axios2 } = await import("axios");
      const encodedPath = target_file.split("/").map(encodeURIComponent).join("/");
      let fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
      try {
        const fileRes = await axios2.get(fileUrl, { headers });
        if (fileRes.data.content) {
          fileContent = Buffer.from(fileRes.data.content, "base64").toString("utf8");
        } else {
          fileContent = fileRes.data;
        }
      } catch (initialErr) {
        if (initialErr.response?.status === 404 && target_file.startsWith(`${repo}/`)) {
          const strippedPath = target_file.replace(`${repo}/`, "");
          const encodedStrippedPath = strippedPath.split("/").map(encodeURIComponent).join("/");
          fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedStrippedPath}`;
          const retryRes = await axios2.get(fileUrl, { headers });
          if (retryRes.data.content) {
            fileContent = Buffer.from(retryRes.data.content, "base64").toString("utf8");
          } else {
            fileContent = retryRes.data;
          }
        } else {
          throw initialErr;
        }
      }
    } catch (err) {
      console.error("[API] Failed to fetch target file for refactoring:", err.message);
      return res.status(404).json({ error: "Failed to fetch the target file content from GitHub." });
    }
    const mockRepoInfo = {
      owner,
      repo,
      defaultBranch: "main",
      description: "Target Repository",
      stars: 0,
      forks: 0,
      primaryLanguage: "Unknown",
      tree: [],
      filteredFiles: [target_file],
      keyConfigFiles: []
    };
    const refactorMarkdown = await refactorCodeFile2(mockRepoInfo, target_file, fileContent, gemini_token);
    res.json({ refactorMarkdown });
  } catch (error) {
    console.error("[API Error /api/refactor-file]:", error.message || error);
    res.status(500).json({ error: "Failed to generate refactoring suggestions." });
  }
});
app.post("/api/heatmap", async (req, res) => {
  try {
    const { repo_url, github_token, nodes } = req.body;
    if (!repo_url || !Array.isArray(nodes)) {
      return res.status(400).json({ error: "Repository URL and nodes array are required." });
    }
    const { parseRepoUrl: parseRepoUrl2, fetchFileCommitCount: fetchFileCommitCount2 } = await Promise.resolve().then(() => (init_github(), github_exports));
    const { owner, repo } = parseRepoUrl2(repo_url);
    console.log(`[API] Fetching Heatmap data for: ${owner}/${repo} (${nodes.length} files)`);
    const heatmapData = {};
    const promises = nodes.map(async (path2) => {
      const count = await fetchFileCommitCount2(owner, repo, path2, github_token);
      heatmapData[path2] = count;
    });
    await Promise.all(promises);
    res.json({ heatmapData });
  } catch (error) {
    console.error("[API Error /api/heatmap]:", error.message || error);
    res.status(500).json({ error: "Failed to fetch heatmap data." });
  }
});
if (process.env.NODE_ENV !== "production") {
  import("vite").then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    }).then((vite) => {
      app.use(vite.middlewares);
    });
  });
} else {
  const distPath = import_path.default.join(process.cwd(), "dist");
  app.use(import_express.default.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(import_path.default.join(distPath, "index.html"));
  });
}
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`GitVisualizer server running on http://0.0.0.0:${PORT}`);
  });
}
module.exports = app;
