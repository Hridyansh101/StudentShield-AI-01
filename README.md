# 🛡️ StudentShield AI

### Cybersecurity & Fine-Print Auditor for Students

StudentShield AI is an AI-powered student safety tool designed to help students identify suspicious internship offers, phishing messages, financial traps, deceptive clauses, and manipulative wording.

🌐 **Live Demo:** https://studentshield-ai.ai.studio  
📦 **GitHub Repository:** https://github.com/Hridyansh101/StudentShield-AI

## ✨ Features

- **Risk Score:** Assesses submitted content on a scale of 0–100.
- **Red-Flag Detection:** Highlights suspicious phrases and explains why they may be concerning.
- **Financial Trap Detection:** Flags potential upfront fees and suspicious payment demands.
- **Phishing & Identity Warnings:** Identifies suspicious domains and potentially deceptive identity claims.
- **Dark Pattern Detection:** Highlights artificial urgency and psychological pressure tactics.
- **Plain-English Summary:** Explains the main concerns in simple language.
- **Student Action Checklist:** Provides practical safety recommendations.
- **Student Rights Guide:** Offers guidance on student rights and protections.
- **Preset Cases:** Enables quick demonstrations with predefined scenarios.
- **Audit History:** Lets users revisit previously analyzed cases stored in the browser.
- **Copyable Safety Guidance:** Helps users reuse suggested responses and reporting information.

## 🧠 AI Model

The project is intended to use **Gemma 4** for AI-assisted analysis.

- **Selected model ID:** `gemma-4-26b-a4b-it`
- **SDK:** Google Gen AI SDK (`@google/genai`)
- **Model documentation:** https://ai.google.dev/gemma

The exact model ID and its use in the live analysis pipeline should be verified against the source code before claiming that this model powers all detection features.

## ⚙️ Technology Stack

- TypeScript
- React
- Express.js
- Vite
- Google Gen AI SDK (`@google/genai`)

## 🔍 How It Works

1. **Input:** The user submits a suspicious message or document excerpt.
2. **Analysis:** The application examines potential financial, phishing, identity, legal, and psychological warning signs.
3. **Risk Assessment:** A risk score and classification are displayed.
4. **Explanation:** Potential red flags are grouped by category, with explanations.
5. **Safety Guidance:** The application suggests practical next steps to help students protect themselves.

## 🚀 Run Locally

### Prerequisites

- Node.js and npm
- Required API access and environment variables, if applicable

### Installation

Clone the repository:

```bash
git clone https://github.com/Hridyansh101/StudentShield-AI.git
cd StudentShield-AI
npm install
```

Configure the environment variables using `.env.example` as a reference. Never publish API keys or secrets.

**Start the application:** Check the `scripts` section of `package.json` for the correct command. If a `dev` script is defined, use:

```bash
npm run dev
```

The run command and environment variable names should be verified against the actual source code.

## 🔐 Privacy & Security

- Do not enter passwords, authentication codes, or unnecessary sensitive personal information.
- Avoid opening suspicious links to investigate them.
- Verify internship offers and organizations through independently located official sources.
- Never commit API keys or credentials to GitHub.
- Review the AI provider's data-handling terms before submitting sensitive information.

The interface indicates that audit history is stored locally in the browser. This does not establish that all AI processing occurs locally.

## ⚠️ Limitations

- A high risk score is not definitive proof of fraud.
- A low score does not guarantee that a message or offer is safe.
- Automated analysis may produce incorrect or incomplete findings.
- Risk scores are indicators, not calibrated probabilities of fraud.
- Users should independently verify important claims before making payments or sharing sensitive information.

StudentShield AI is intended for awareness and decision support, not as a substitute for professional cybersecurity or legal advice.

## 🎯 Project Goal

Our goal is to make cybersecurity and fine-print awareness more accessible to students by turning potentially confusing warning signs into understandable explanations and actionable safety guidance.

## 🤖 AI Credits & References

- **Selected AI model:** Gemma 4 — `gemma-4-26b-a4b-it` (verify against the running application).
- **SDK:** Google Gen AI SDK (`@google/genai`).
- **Gemma documentation:** https://ai.google.dev/gemma
- **Google Gen AI SDK documentation:** https://ai.google.dev/gemini-api/docs/quickstart

Please consult the applicable model terms and licensing conditions for the exact model used.

## 📄 License

This project is intended to be released under the MIT License. See the `LICENSE` file once it has been added to the repository.
