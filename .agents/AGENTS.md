# Project Rules and Guidelines

Welcome to the **Potasio Games Web** project. As an AI coding assistant, you must strictly follow these rules and guidelines to ensure the security, privacy, and integrity of the project.

## 1. Security and Privacy Guidelines

To protect the project owners and users from malicious actors (such as web scrapers, spambots, and credential harvesters), adhere to the following constraints:

### A. Strict Protection of Personal and Contact Information
*   **No Plaintext Email Addresses:** NEVER write contact email addresses in plaintext in HTML files (e.g., `<a href="mailto:email@domain.com">` or `Contact: email@domain.com`). This makes them easily harvestable by web crawler bots.
*   **Mandatory Obfuscation:** Always obfuscate email addresses using JavaScript-based decoding (e.g., dynamically constructing the address on click) or direct users to a secure contact form.
*   **Privacy by Design:** Avoid hardcoding other personal data such as phone numbers, physical addresses, or private developer names in public-facing source files.

### B. Credential and Secret Management
*   **No Hardcoded Secrets:** Under no circumstances should you write API keys, database credentials, authentication tokens, passwords, private keys, or client secrets directly in the code.
*   **Environment Variables:** Always use environment variables (`.env`, Vite-configured `import.meta.env`, etc.) to inject configuration parameters.
*   **Safe Git Tracking:** Double-check that configuration files containing credentials (like `.env`, `*.local`) are properly listed in the .gitignore file before committing any changes.

### C. Secure Data Handling
*   Ensure all external API requests utilize secure protocols (HTTPS).
*   Follow the principle of least privilege and data minimization when collecting, processing, or transmitting user actions or telemetry.

## 2. Git and Version Control Guidelines

### A. Explicit User Confirmation for Git Operations
*   **No Proactive Commits or Pushes:** NEVER run `git commit`, `git push`, create branches, or perform other version control writing operations proactively. Only execute git commits or pushes when the user explicitly requests it.
