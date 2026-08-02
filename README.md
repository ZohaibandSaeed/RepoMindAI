<div align="center">
  <img width="120" height="120" src="./public/logo.png" alt="RepoMind AI Logo" />
  <h1>RepoMind AI </h1>
  <p><strong>Visualize Code Like Never Before</strong></p>
</div>

---

**RepoMind AI** is an advanced, AI-powered interactive architecture map and developer assistant for any GitHub repository. Enter a GitHub Repository URL to instantly generate a visual dependency grid, run security audits, and use AI to refactor code or generate tests automatically.

## ✨ Features

- ** Interactive Architecture Map:** Automatically generates a high-level visual structure of any codebase.
- ** Heatmap Tracking:** Visualizes the most active parts of the repository based on commit history.
- ** Security Audits:** Get a complete AI-driven security audit and deployment score for the repository.
- ** Auto-Generate Test Cases:** Select any file node and instantly generate comprehensive unit tests using AI.
- ** AI Code Refactoring:** Use the Refactoring Agent to analyze complex code, identify issues, and receive optimized, updated code in a clean diff.
- ** Repo Chat:** Chat directly with your repository's context. Ask the AI questions about the architecture or specific logic flows.

##  Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Set up Environment Variables:
   You can copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```
   > **Note:** You can also configure your **Gemini API Key** and **GitHub Personal Access Token** directly through the UI via the "Keys" menu without needing a `.env` file!

3. Run the Development Server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

##  Configuration

Through the in-app **Keys** menu, you can set:
- **Gemini API Key:** Required for all AI-powered features (Chat, Refactoring, Tests, Security Audit).
- **GitHub Personal Access Token:** (Optional) Useful for bypassing standard GitHub API rate limits (60/hr) on large repositories.

---

<div align="center">
  <i>Built with ❤️ using React, Vite, and Google Gemini AI</i>
</div>
