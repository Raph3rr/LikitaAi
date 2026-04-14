LikitaAi Backend Service

Overview

This is the backend service for the project. It handles API requests, business logic, and communication with external services.


Requirements
	•	Node.js
	•	npm


Setup Instructions
	1.	Open a terminal
	2.	Navigate to the backend folder:
cd backend
	3.	Install dependencies:
npm install
	4.	Start the server:
node server.js


Environment Variables

This backend requires environment variables to function properly.

Create a .env file in the backend folder and add the required variables.

Example:
Dxgpt_API_Key=your_dxgpt_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
AZURE_TRANSLATOR_KEY=your_azure_translator_key_here
AZURE_TRANSLATOR_ENDPOINT=your_endpoint_here


How to Obtain API Keys
	•	Dxgpt Api Key
Get your API key from: 
https://pricing.dxgpt.app
	•	Google Gemini API
Get your API key from: https://ai.google.dev/
	•	Microsoft Azure Translator API
Get your API key and endpoint from: https://portal.azure.com/
(Navigate to “Azure AI Translator” or “Cognitive Services” after signing in)


Do not expose your real API keys publicly.


Notes
	•	Ensure the backend is running before starting the frontend
	•	Default server runs on a specified port (e.g., 5000)


Troubleshooting
	•	Run npm install if dependencies are missing
	•	Ensure correct directory before running commands



Author

Olaseigbe Raphael Oluwatobi
