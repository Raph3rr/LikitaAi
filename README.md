LikitaAI

Overview

LikitaAI is an AI-powered symptom checker designed to help users understand possible medical conditions based on symptoms they provide. It also offers general treatment advice and supports both English and Hausa languages.


Requirements

To run this project, ensure the following are installed:
	•	Node.js
	•	npm (comes with Node.js)
	•	A web browser



Setup Instructions
	1.	Download or clone the project from GitHub.
	2.	Open the project folder in a code editor (e.g., VS Code).
	3.	Start the backend server:
	•	Open a terminal
	•	Navigate to the backend folder:
cd backend
	•	Install dependencies:
npm install
	•	Start the backend server:
node server.js
	4.	Start the frontend application:
	•	Open a new terminal (keep the backend running)
	•	Navigate to the frontend folder:
cd frontend
	•	Install dependencies:
npm install
	•	Start the frontend:
npm run dev
	5.	Open your browser and access the application (the URL will be shown in the terminal, usually something like http://localhost:5173 or similar).


Environment Variables

This project requires environment variables to run properly. For security reasons, the .env file is not included.

To run the project:
	•	Create a .env file in the appropriate directory (backend and/or frontend if needed)
	•	Add the required variables such as API keys and base URLs

Example:
API_KEY=your_api_key_here
BASE_URL=your_api_url_here

You may need to obtain your own API keys from the respective service providers.


Important Notes
	•	Ensure both backend and frontend are running at the same time
	•	Do not close the backend terminal while using the application
	•	If a port is already in use, follow the prompt to use another port



Troubleshooting
	•	If dependencies fail to install, run:
npm cache clean –force
npm install
	•	Ensure you are in the correct directory before running commands



Author

Olaseigbe Raphael Oluwatobi



Additional Information

This project was developed as part of an academic submission.


