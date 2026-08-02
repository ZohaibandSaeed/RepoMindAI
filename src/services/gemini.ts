import { GoogleGenAI, Type } from '@google/genai';
import { ParsedRepoInfo } from './github';
import { HighLevelGraph, FileGraph, RepoAnalysisResult } from '../types';

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(geminiToken?: string): GoogleGenAI | null {
  if (geminiToken) {
    return new GoogleGenAI({
      apiKey: geminiToken,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }

  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('[Gemini] GEMINI_API_KEY not configured. Will use fallback heuristic diagram engine.');
    return null;
  }

  aiInstance = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return aiInstance;
}

export async function generateRepoGraphsWithAI(
  repoInfo: ParsedRepoInfo,
  geminiToken?: string
): Promise<{
  highLevelGraph: HighLevelGraph;
  fileGraph: FileGraph;
}> {
  const ai = getGeminiClient(geminiToken);

  if (!ai) {
    return generateFallbackGraphs(repoInfo);
  }

  try {
    const fileListSample = repoInfo.filteredFiles.slice(0, 80).join('\n');
    const configsSnippet = repoInfo.keyConfigFiles
      .map((c) => `--- File: ${c.path} ---\n${c.content}`)
      .join('\n\n');

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
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            highLevelGraph: {
              type: Type.OBJECT,
              properties: {
                architectureOverview: { type: Type.STRING },
                primaryTechStack: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                nodes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      type: { type: Type.STRING },
                      description: { type: Type.STRING },
                      tech: { type: Type.STRING },
                      layer: { type: Type.STRING },
                    },
                    required: ['id', 'label', 'type', 'description'],
                  },
                },
                edges: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      source: { type: Type.STRING },
                      target: { type: Type.STRING },
                      label: { type: Type.STRING },
                      animated: { type: Type.BOOLEAN },
                    },
                    required: ['id', 'source', 'target'],
                  },
                },
              },
              required: ['nodes', 'edges', 'architectureOverview', 'primaryTechStack'],
            },
            fileGraph: {
              type: Type.OBJECT,
              properties: {
                directoryStructureSummary: { type: Type.STRING },
                totalFilesParsed: { type: Type.NUMBER },
                nodes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      path: { type: Type.STRING },
                      folder: { type: Type.STRING },
                      fileType: { type: Type.STRING },
                      summary: { type: Type.STRING },
                      githubUrl: { type: Type.STRING },
                      metrics: {
                        type: Type.OBJECT,
                        properties: {
                          linesEst: { type: Type.NUMBER },
                          complexity: { type: Type.STRING },
                          type: { type: Type.STRING },
                        },
                      },
                    },
                    required: ['id', 'label', 'path', 'folder', 'fileType', 'summary'],
                  },
                },
                edges: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      source: { type: Type.STRING },
                      target: { type: Type.STRING },
                      label: { type: Type.STRING },
                    },
                    required: ['id', 'source', 'target'],
                  },
                },
              },
              required: ['nodes', 'edges', 'directoryStructureSummary'],
            },
          },
          required: ['highLevelGraph', 'fileGraph'],
        },
      },
    });

    const jsonText = response.text || '';
    const parsed = JSON.parse(jsonText);

    // Format GitHub URLs for file graph nodes if missing
    parsed.fileGraph.nodes = parsed.fileGraph.nodes.map((node: any) => ({
      ...node,
      githubUrl:
        node.githubUrl ||
        `https://github.com/${repoInfo.owner}/${repoInfo.repo}/blob/${repoInfo.defaultBranch}/${node.path}`,
    }));

    return parsed;
  } catch (error) {
    console.error('[Gemini] AI Graph generation failed, falling back to heuristic graph:', error);
    return generateFallbackGraphs(repoInfo);
  }
}

// Fallback heuristic generator
export function generateFallbackGraphs(repoInfo: ParsedRepoInfo): {
  highLevelGraph: HighLevelGraph;
  fileGraph: FileGraph;
} {
  const { owner, repo, defaultBranch, filteredFiles, primaryLanguage } = repoInfo;

  // 1. High-Level Architecture Fallback Nodes
  const highLevelNodes: HighLevelGraph['nodes'] = [
    {
      id: 'client-ui',
      label: 'Client User Interface',
      type: 'frontend',
      description: 'Web application frontend rendering views, user interactions, and state management.',
      tech: primaryLanguage.includes('TypeScript') || primaryLanguage.includes('JavaScript') ? 'React / Next.js' : 'Web UI',
      layer: 'Presentation Layer',
    },
    {
      id: 'api-gateway',
      label: 'API Gateway / Router',
      type: 'api',
      description: 'Handles incoming client HTTP requests, route handling, and middleware authentication.',
      tech: 'REST / GraphQL API',
      layer: 'API Layer',
    },
    {
      id: 'business-logic',
      label: 'Core Business Logic / Services',
      type: 'backend',
      description: 'Processes data operations, controller handlers, domain rules, and workflow logic.',
      tech: primaryLanguage,
      layer: 'Domain Layer',
    },
    {
      id: 'data-store',
      label: 'Data Persistence / Models',
      type: 'database',
      description: 'Manages database queries, ORM schema models, caching, or persistent storage.',
      tech: 'Database / Storage',
      layer: 'Data Layer',
    },
    {
      id: 'configs-env',
      label: 'Config & Build System',
      type: 'config',
      description: 'Environment settings, package manifests, build tools, and configuration scripts.',
      tech: 'Build Tools / ENV',
      layer: 'Infrastructure',
    },
  ];

  const highLevelEdges: HighLevelGraph['edges'] = [
    { id: 'e1', source: 'client-ui', target: 'api-gateway', label: 'HTTP / REST Requests', animated: true },
    { id: 'e2', source: 'api-gateway', target: 'business-logic', label: 'Routes & Controllers', animated: true },
    { id: 'e3', source: 'business-logic', target: 'data-store', label: 'ORM / Queries', animated: true },
    { id: 'e4', source: 'configs-env', target: 'business-logic', label: 'Injects Configs', animated: false },
  ];

  // 2. File Graph Fallback Nodes
  const topFiles = filteredFiles.slice(0, 20);
  const fileNodes: FileGraph['nodes'] = topFiles.map((filePath) => {
    const fileName = filePath.split('/').pop() || filePath;
    const folderParts = filePath.split('/');
    const folder = folderParts.length > 1 ? folderParts.slice(0, -1).join('/') : 'root';
    const ext = fileName.includes('.') ? fileName.split('.').pop() || 'txt' : 'file';

    let summary = `Source code file in ${folder} handling modular logic and dependencies for the ${repo} codebase.`;
    if (fileName.includes('App') || fileName.includes('index') || fileName.includes('page')) {
      summary = `Primary entry point for ${repo}, initializing application components, routing, and main layout structure.`;
    } else if (fileName.includes('config') || fileName.includes('package') || fileName.includes('tsconfig')) {
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
        complexity: filePath.length > 20 ? 'Medium' : 'Low',
        type: ext.toUpperCase(),
      },
    };
  });

  // Create edges between files based on folder hierarchy
  const fileEdges: FileGraph['edges'] = [];
  for (let i = 0; i < fileNodes.length - 1; i++) {
    const current = fileNodes[i];
    const next = fileNodes[i + 1];

    if (current.folder === next.folder || i === 0) {
      fileEdges.push({
        id: `fe-${i}`,
        source: current.id,
        target: next.id,
        label: 'imports / uses',
      });
    }
  }

  return {
    highLevelGraph: {
      architectureOverview: `System architecture for ${owner}/${repo} categorized into presentation, API, domain, and data persistence layers.`,
      primaryTechStack: [primaryLanguage, 'REST API', 'Node.js / Python', 'Git'],
      nodes: highLevelNodes,
      edges: highLevelEdges,
    },
    fileGraph: {
      directoryStructureSummary: `Analyzed ${filteredFiles.length} repository files across ${topFiles.length} primary modules.`,
      totalFilesParsed: filteredFiles.length,
      nodes: fileNodes,
      edges: fileEdges,
    },
  };
}

export async function explainNodeWithAI(
  repoName: string,
  nodeName: string,
  nodePath: string,
  nodeType: string,
  contextSummary: string,
  geminiToken?: string
) {
  const ai = getGeminiClient(geminiToken);

  if (!ai) {
    return {
      nodeId: nodePath,
      summary: contextSummary || `${nodeName} plays a key functional role in ${repoName}.`,
      detailedPurpose: `This ${nodeType} file (${nodePath}) defines modular logic, functions, or interface definitions used by connected components in the ${repoName} project.`,
      keyResponsibilities: [
        'Encapsulate domain specific state and utility methods',
        'Provide reusable exports for connected components',
        'Maintain system separation of concerns',
      ],
      simplifiedUrduExplanation: `Yeh file (${nodeName}) project ka ek aham hissa hai jo specific function ya UI component ko chalane ke liye kaam aati hai.`,
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
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            detailedPurpose: { type: Type.STRING },
            keyResponsibilities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            simplifiedUrduExplanation: { type: Type.STRING },
          },
          required: ['summary', 'detailedPurpose', 'keyResponsibilities', 'simplifiedUrduExplanation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      nodeId: nodePath,
      ...parsed,
    };
  } catch (e) {
    return {
      nodeId: nodePath,
      summary: contextSummary,
      detailedPurpose: `Detailed explanation for ${nodeName} in ${repoName}.`,
      keyResponsibilities: ['Core component logic', 'Interface definition', 'Data handling'],
      simplifiedUrduExplanation: `Yeh component project ke flow me madad karta hai.`,
    };
  }
}

export async function chatWithRepoContext(
  repoName: string,
  repoContext: any,
  chatHistory: { role: 'user' | 'model'; text: string }[],
  message: string,
  geminiToken?: string
) {
  const ai = getGeminiClient(geminiToken);

  if (!ai) {
    return "I'm currently in fallback mode (no Gemini API Key configured). I cannot chat about the repository, but you can explore the fallback graphs!";
  }

  try {
    const systemInstruction = `You are a Principal Software Architect expert in analyzing repository structure, system architecture, and code dependency graphs.
You are chatting with a developer about the repository "${repoName}".
Here is the context of the repository's architecture and file structure:
Architecture Overview: ${repoContext?.highLevelGraph?.architectureOverview || 'N/A'}
Tech Stack: ${(repoContext?.highLevelGraph?.primaryTechStack || []).join(', ')}

File Structure:
${(repoContext?.fileGraph?.nodes || []).map((n: any) => `- ${n.path} (${n.summary})`).join('\n')}

Answer the developer's questions based on this structural information. If they ask about something not present in the summary, tell them you only have access to the high-level architecture and file names, not the full source code contents. Answer concisely in Markdown.`;

    const chat = ai.chats.create({
      model: 'gemini-3.6-flash',
      config: {
        systemInstruction,
      },
      history: chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }))
    });

    const response = await chat.sendMessage({ message });
    return response.text || '';
  } catch (error: any) {
    console.error('[Gemini] Chat failed:', error);
    return `Sorry, I encountered an error while trying to process your message: ${error.message}`;
  }
}

export async function generateSecurityAudit(
  repoInfo: ParsedRepoInfo,
  geminiToken?: string
) {
  const ai = getGeminiClient(geminiToken);

  if (!ai) {
    return {
      deploymentScore: 50,
      securityConcerns: [
        { fileName: 'N/A', severity: 'Medium', description: 'AI Agent is offline. Cannot perform security audit.' }
      ],
      reviewSuggestions: ['Configure GEMINI_API_KEY to enable AI security auditing.']
    };
  }

  try {
    const fileListSample = repoInfo.filteredFiles.slice(0, 150).join('\n');
    const configsSnippet = repoInfo.keyConfigFiles
      .map((c) => `--- File: ${c.path} ---\n${c.content}`)
      .join('\n\n');

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
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deploymentScore: { type: Type.NUMBER },
            securityConcerns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fileName: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ['fileName', 'severity', 'description']
              }
            },
            reviewSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['deploymentScore', 'securityConcerns', 'reviewSuggestions']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (error) {
    console.error('[Gemini] Security Audit generation failed:', error);
    return {
      deploymentScore: 0,
      securityConcerns: [
        { fileName: 'System', severity: 'High', description: 'Failed to complete security audit.' }
      ],
      reviewSuggestions: ['Check the server logs for API errors.']
    };
  }
}

export async function generateTestCases(
  repoInfo: ParsedRepoInfo,
  targetFilePath: string,
  fileContent: string,
  geminiToken?: string
): Promise<string> {
  const ai = getGeminiClient(geminiToken);

  if (!ai) {
    return '# Error\nAI Agent is offline. Cannot generate test cases. Please configure GEMINI_API_KEY.';
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
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    return response.text || '# Error\nNo test cases generated.';
  } catch (error: any) {
    console.error('[Gemini] Test Case generation failed:', error);
    return `# Error generating tests\nAn error occurred while generating test cases: ${error.message}`;
  }
}

export async function refactorCodeFile(
  repoInfo: ParsedRepoInfo,
  targetFilePath: string,
  fileContent: string,
  geminiToken?: string
): Promise<string> {
  const ai = getGeminiClient(geminiToken);

  if (!ai) {
    return '# Error\nAI Agent is offline. Cannot refactor code. Please configure GEMINI_API_KEY.';
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
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    return response.text || '# Error\nNo refactoring suggestions generated.';
  } catch (error: any) {
    console.error('[Gemini] Refactor generation failed:', error);
    return `# Error generating refactor\nAn error occurred: ${error.message}`;
  }
}
