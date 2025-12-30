# Tough Crowd AddOn

<img src="src/logo.jpg" width="300" alt="Tough Crowd Logo">

**Tough Crowd** is an AI-powered video analysis tool for Adobe Express. It uses Google's Gemini models to simulate viewer reactions, helping creators verify their content's impact before publishing.

## Features
- **Fast Mode**: Quick frame-based analysis.
- **Deep Mode**: Comprehensive temporal video analysis.
- **Persona Simulation**: Get feedback from diverse AI personas (The Hater, The Fan, The Skeptic).
- **Virality Score**: Estimated potential impact metrics.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Build**:
    ```bash
    npm run build
    ```

3.  **Start Dev Server**:
    ```bash
    npm run start
    ```

4.  **Load in Adobe Express**:
    -   Go to [https://new.express.adobe.com/static/add-on-sdk/sdk.js](https://new.express.adobe.com/static/add-on-sdk/sdk.js) enabled environment.
    -   Enable "Developer Mode".
    -   Load from `https://localhost:5241`.

## Configuration
This Add-on follows a **BYOK (Bring Your Own Key)** model. You will need a Google Gemini API Key to use the analysis features.
