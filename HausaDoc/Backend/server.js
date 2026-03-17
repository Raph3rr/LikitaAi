// SYMPTOMCHECKER.JSX BACKEND SERVER

/* eslint-disable no-undef */
import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import xml2js from "xml2js";
import axios from "axios";
import fs from "fs";
import csv from "csv-parser"; // for createReadStream
import fsPromises from "fs/promises";


dotenv.config();
console.log("Server is Running");

const app = express();
const PORT = process.env.PORT || 5000;

// ====== ENV VARIABLES ======
const DXGPT_URL = process.env.DXGPT_API_URL;
const DXGPT_KEY = process.env.DXGPT_API_KEY;
const TRANSLATOR_KEY = process.env.TRANSLATOR_API_KEY;
const TRANSLATOR_REGION = process.env.TRANSLATOR_REGION;
const TRANSLATOR_ENDPOINT = process.env.TRANSLATOR_ENDPOINT;


// ====== INITIALIZE GOOGLE GENERATIVE AI ======
const genAI1 = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_1);
const genAI2 = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_2);

const flashModel1 = genAI1.getGenerativeModel({model: "gemini-2.5-flash"});
const flashModel2 = genAI2.getGenerativeModel({model: "gemini-2.0-flash-lite"});


// ====== MIDDLEWARE ======
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://likitaai.vercel.app", "http://localhost:5174", "https://localhost:5175", "https://localhost:5176"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "10kb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get("/", (req, res) => res.send({ ok: true, name: "dxgpt-server" }));

// TRANSLATE USER INPUT FUNCTION USING AZURE AI TRANSLATOR

async function translateUserInput(text, fromLang, toLang) {
  try {
    if (!text || !text.trim()) return text;

    const url = `${TRANSLATOR_ENDPOINT}/translate?api-version=3.0&from=${fromLang}&to=${toLang}`;

    const response = await axios.post(
      url,
      [{ Text: text }],
      {
        headers: {
          "Ocp-Apim-Subscription-Key": TRANSLATOR_KEY,
          "Ocp-Apim-Subscription-Region": TRANSLATOR_REGION,
          "Content-Type": "application/json",
        },
      }
    );

    const translated =
      response.data?.[0]?.translations?.[0]?.text || null;

    if (!translated || !translated.trim()) {
      console.warn("Azure translator returned empty response");
      return text; // fallback
    }

    return translated.trim();
  } catch (err) {
    console.error("Azure translator error:", err);
    return text; // fallback
  }
}

// TRANSLATE DxGPT OUTPUT FUNCTION USING GEMINI
async function translateDxGPTOutput(text, fromLang, toLang) {
  try {
    if (!text || !text.trim()) return text;

    const prompt = `
    Translate the following text from English to Hausa. All english medical terms should be translated to their correct Hausa equivalents.
    Keep it simple, clear, and safe for patients. Do NOT add bullets, numbers, or extra formatting. Return only the translated text.

    Text:
    ${text}
    `;

    const result = await flashModel2.generateContent(prompt);
    const translated = result.response.text();
    if (translated && translated.trim()) return translated.trim();

    console.warn("Gemini translator returned empty response. Falling back to Azure...");

  } catch (err) {
    console.error("Gemini translator error:", err);
    console.warn("Falling back to Azure translator...");
  }
  // Fallback to Azure Translator
  return await translateUserInput(text, fromLang, toLang);
}



// TRANSLATE TREATMENT FUNCTION USING AZURE AI TRANSLATOR
async function translateTreatment(treatmentObj) {
  try {

    // Helper to translate a single section
    const translateSection = async (text) => {
      if (!text || !text.trim()) return "Bayani bai samu ba.";

      const url = `${TRANSLATOR_ENDPOINT}/translate?api-version=3.0&from=en&to=ha`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": TRANSLATOR_KEY,
          "Ocp-Apim-Subscription-Region": TRANSLATOR_REGION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ Text: text }]),
      });

      const data = await response.json();

      // Safety fallback
      const translated =
        data?.[0]?.translations?.[0]?.text || "Bayani bai samu ba.";

      return translated.trim();
    };

    return {
      firstLine: await translateSection(treatmentObj.firstLine),
      homeCare: await translateSection(treatmentObj.homeCare),
      seekMedical: await translateSection(treatmentObj.seekMedical),
    };
  } catch (err) {
    console.error("Azure treatment translation error:", err);
    return {
      firstLine: "Bayani bai samu ba.",
      homeCare: "Bayani bai samu ba.",
      seekMedical: "Bayani bai samu ba.",
    };
  }
}



// GEMINI TREATMENT FETCHER
async function getTreatment(conditionName, retries = 2, delayMs = 1000) {

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Fetching treatment for: ${conditionName} (Attempt ${attempt})`);

      const prompt = `
You are a clinical assistant.

Disease: ${conditionName}

Provide structured treatment information for the disease below.
Respond in simple, plain, clear language.

FORMAT THE OUTPUT EXACTLY LIKE THIS (no bullets, no markdown):

First-line treatments:
<short paragraph>

Home care advice:
<short paragraph>

When to seek medical attention:
<short paragraph>



Rules (MANDATORY):
- Do NOT use *, -, •, or any bullet characters.
- Do NOT use numbering (1., 2., 3.).
- Do NOT use markdown.
- Do NOT create lists.
- Paragraphs ONLY.
- Do NOT use bullets, stars, dashes, or lists.
- Do NOT include diagnosis, risks, or causes.
- Do NOT include markdown formatting.
- Keep each section under 5 sentences.
- Do NOT add newlines inside paragraphs.
`;

      const result = await flashModel1.generateContent(prompt);
      const text = result.response.text();

      if (text && text.trim().length > 5) {
        // Parse Gemini output
        const treatmentObj = {
          firstLine: null,
          homeCare: null,
          seekMedical: null,
        };

        const firstLineMatch = text.match(/First[-\s]?line treatments[:\s]*([\s\S]*?)(?:\n\n|$)/i);
        const homeCareMatch = text.match(/Home care advice[:\s]*([\s\S]*?)(?:\n\n|$)/i);
        const seekMedicalMatch = text.match(/When to seek medical (attention|care)[:\s]*([\s\S]*?)(?:\n\n|$)/i);

        if (firstLineMatch) treatmentObj.firstLine = firstLineMatch[1].trim();
        if (homeCareMatch) treatmentObj.homeCare = homeCareMatch[1].trim();
        if (seekMedicalMatch) treatmentObj.seekMedical = seekMedicalMatch[2]?.trim();

        return treatmentObj;
      }

      console.warn(`Gemini returned empty response for: ${conditionName}`);
    } catch (err) {
      console.error(`Gemini attempt ${attempt} failed:`, err);
    }

    // Wait before next retry
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.warn(`All retry attempts failed for: ${conditionName}`);

  // Safe fallback
  return {
    firstLine: "Treatment information not available. Please consult a medical professional.",
    homeCare: "Treatment information not available. Please consult a medical professional.",
    seekMedical: "Treatment information not available. Please consult a medical professional.",
  };
}

// DXGPT ENDPOINT
app.post("/dxgpt", async (req, res) => {
  try {
    let { description, age, sex, lang } = req.body;

    if (!description || typeof description !== "string") {
      return res.status(400).json({ error: "description (string) is required" });
    }

    description = description.trim();
    if (description.length < 10) {
      return res.status(400).json({ error: "description too short" });
    }

    if (lang === "ha") {
      console.log("Translating Hausa to English before DXGPT...");
      description = await translateUserInput(description, "ha", "en");
    }

    const payload = {
      description,
      age,
      sex,
      myuuid: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex"),
      timezone: process.env.TIMEZONE || "Africa/Lagos",
      response_mode: "direct",
      model: "gpt4o",
    };

    const dxResp = await fetch(DXGPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": DXGPT_KEY,
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(payload),
    });

    if (!dxResp.ok) {
      const text = await dxResp.text();
      console.error("DxGPT error:", dxResp.status, text);
      return res.status(502).json({
        error: "Upstream DxGPT service returned an error",
        status: dxResp.status,
        details: text,
      });
    }

    let data = await dxResp.json();

    //GET TREATMENT USING GEMINI
if (data?.data && Array.isArray(data.data)) {
  console.log("Fetching treatments for diagnosed conditions and translating them if necessary...");
  
  const treatmentPromises = data.data.map(async (item) => {
    const conditionName = item?.diagnosis || item?.name;
    
    if(!conditionName) {
      return {
         firstLine: "Treatment information not available. Please consult a medical professional.",
         homeCare: "Treatment information not available. Please consult a medical professional.",
         seekMedical: "Treatment information not available. Please consult a medical professional.",
      };
    }

    let treatment = await getTreatment(conditionName);

    if (lang === "ha") {
      treatment = await translateTreatment(treatment);
    }

    return treatment
 });
    const treatments = await Promise.all(treatmentPromises);

    data.data.forEach((item, index) => {
      item.treatment = treatments[index];
    });
};

    //TRANSLATE DXGPT OUTPUT TO HAUSA 
  //   if (lang === "ha" && data?.data) {
  //     console.log("Translating DXGPT result to Hausa...");
  //     for (let item of data.data) {
  //       if (item.diagnosis)
  //         item.diagnosis = await translateDxGPTOutput(item.diagnosis, "en", "ha");
  //       if (item.description)
  //         item.description = await translateDxGPTOutput(item.description, "en", "ha");

  //        if (Array.isArray(item.symptoms_in_common)) {
  //   item.symptoms_in_common = await Promise.all(
  //     item.symptoms_in_common.map(symptom => translateDxGPTOutput(symptom, "en", "ha"))
  //   );
  // }

  // if (Array.isArray(item.symptoms_not_in_common)) {
  //   item.symptoms_not_in_common = await Promise.all(
  //     item.symptoms_not_in_common.map(symptom => translateDxGPTOutput(symptom, "en", "ha"))
  //   );
  // }
  //     }
  //   }

if (lang === "ha" && data?.data && Array.isArray(data.data)) {
  console.log("Translating DXGPT result to Hausa...");
  
  const translationPromises = data.data.map(async (item) => {
    const tasks = [];

    if (item.diagnosis) {
      tasks.push(translateUserInput(item.diagnosis, "en", "ha").then(translated => {
        item.diagnosis = translated;
      }));
    }
    if (item.description) {
      tasks.push(translateUserInput(item.description, "en", "ha").then(translated => {
        item.description = translated;
      }));
    }
    if (Array.isArray(item.symptoms_in_common)) {
      tasks.push(Promise.all(item.symptoms_in_common.map((s) => translateUserInput(s, "en", "ha"))).then(
        (translated) => (item.symptoms_in_common = translated)
      ));
    }
    if (Array.isArray(item.symptoms_not_in_common)) {
      tasks.push(Promise.all(item.symptoms_not_in_common.map((s) => translateUserInput(s, "en", "ha"))).then(
        (translated) => (item.symptoms_not_in_common = translated)
      ));
    }

    await Promise.all(tasks);
  });

  await Promise.all(translationPromises)
}



    const responsePayload = {
      disclaimer:
        "⚕️ DxGPT provides clinical decision support for qualified health professionals only. This is not a definitive diagnosis.",
      dxgpt: data,
    };

    return res.json(responsePayload);
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});




/// CONDITIONS.JSX-----------------------------


// Utility – remove HTML tags
function cleanHtml(str) {
  if (!str) return "";
  return str
    .replace(/<[^>]+>/g, " ") // strip tags
    .replace(/\s+/g, " ")     // collapse spaces
    .trim();
}
// List of verified ICD-10 codes for common conditions
const VERIFIED_ICD10 = [
  "A00", "A01.0", "A09", "A15.0", "A41.9", "B00.9", "B01.9", "B02.9", "B05",
  "B06.9", "B17.9", "B18.9", "B20", "C34.9", "C50.9", "E03.9", "E10.9", "E11.9",
  "E55.9", "G43.9", "I10", "J06.9", "J18.9", "J45.9", "K21.9", "K35", "L20.9",
  "N17.9", "N39.0", "R19.7"
];

// Map of ICD-10 codes to disease names
const ICD10_NAMES = {
  "A00": "Cholera",
  "A01.0": "Typhoid fever",
  "A09": "Infectious gastroenteritis",
  "A15.0": "Tuberculosis",
  "A41.9": "Sepsis",
  "B00.9": "Herpesviral infection",
  "B01.9": "Chickenpox",
  "B02.9": "Shingles",
  "B05": "Measles",
  "B06.9": "Rubella",
  "B17.9": "Acute hepatitis",
  "B18.9": "Chronic hepatitis",
  "B20": "HIV disease",
  "C34.9": "Lung cancer",
  "C50.9": "Breast cancer",
  "E03.9": "Hypothyroidism",
  "E10.9": "Type 1 diabetes",
  "E11.9": "Type 2 diabetes",
  "E55.9": "Vitamin D deficiency",
  "G43.9": "Migraine",
  "I10": "Hypertension",
  "J06.9": "Upper respiratory infection",
  "J18.9": "Pneumonia",
  "J45.9": "Asthma",
  "K21.9": "GERD",
  "K35": "Appendicitis",
  "L20.9": "Eczema",
  "N17.9": "Acute kidney failure",
  "N39.0": "UTI",
  "R19.7": "Diarrhea"
};

// Pick N random ICD-10 codes from verified list
function pickRandomVerified(count = 9) {
  const shuffled = [...VERIFIED_ICD10].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// -----------------------------
// MEDLINEPLUS CONDITIONS API
// -----------------------------
app.get("/medlineplus/conditions", async (req, res) => {
  try {
    const parser = new xml2js.Parser({ explicitArray: false });
    const results = [];

    const randomCodes = pickRandomVerified(10);
    console.log("Fetching verified ICD-10:", randomCodes);

    for (const code of randomCodes) {
      const url = `https://connect.medlineplus.gov/service?knowledgeResponseType=application/xml&mainSearchCriteria.v.cs=2.16.840.1.113883.6.90&mainSearchCriteria.v.c=${encodeURIComponent(
        code
      )}&informationRecipient.languageCode.c=en`;

      try {
        const response = await fetch(url);
        const xmlText = await response.text();
        const parsed = await parser.parseStringPromise(xmlText);

        const entry = parsed?.feed?.entry;

        // Use disease name if title or summary is missing
        const name = entry?.title?._ ?? entry?.title ?? ICD10_NAMES[code] ?? "Unknown condition";

        let rawSummary =
          entry?.fullSummary ||
          entry?.summary?._ ||
          entry?.summary ||
          entry?.content?._ ||
          entry?.content ||
          "";

        const summary =
          cleanHtml(rawSummary) ||
          `Summary for ${ICD10_NAMES[code] || "this condition"} is not available at the moment.`;

        // Extract URL
        const urlLink = entry?.link?.$?.href || entry?.link?.href || null;

        results.push({ name, summary, url: urlLink });
      } catch (err) {
        console.error("Error fetching ICD-10", code, err);
        results.push({
          name: ICD10_NAMES[code] || "Unknown condition",
          summary: `Summary for ${ICD10_NAMES[code] || "this condition"} is not available at the moment.`,
          url: null
        });
      }
    }

    res.json({ conditions: results });
  } catch (err) {
    console.error("MedlinePlus endpoint error:", err);
    res.status(500).json({ error: "Failed to fetch MedlinePlus conditions" });
  }
});


// Dashboard ENDPOINT

// Array to hold facilities data
let facilities = [];

// Read CSV on server startup
fs.createReadStream("./data/health-facilities-in-nigeria.csv")
  .pipe(csv())
  .on("data", (row) => {
    facilities.push(row);
  })
  .on("end", () => {
    console.log("Health facilities CSV loaded. Total facilities:", facilities.length);
  });

  // API endpoint to serve all facilities as JSON
app.get("/api/facilities", (req, res) => {
  res.json(facilities);
});

// Example: get facilities by state (optional)
app.get("/api/facilities/:state", (req, res) => {
  const state = req.params.state.toLowerCase();
  const filtered = facilities.filter(f => f.state && f.state.toLowerCase() === state);
  res.json(filtered);
});


// Serve local preventive tips
app.get("/api/health-tips", async (req, res) => {
  try {
    const data = await fsPromises.readFile("../preventive-tips.json", "utf-8");
    const tips = JSON.parse(data);
    res.json({ tips });
  } catch (err) {
    console.error("Failed to load tips:", err);
    res.status(500).json({ error: "Failed to load tips" });
  }
});



// Fetch top conditions from MedlinePlus
// Utility to clean HTML tags

// Optional: fetch with retries for transient network errors
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// -----------------------------
// Fetch top conditions from MedlinePlus
// -----------------------------
app.get("/medlineplus/conditions", async (req, res) => {
  try {
    const results = [];

    for (const code of VERIFIED_ICD10) {
      try {
        const url = `https://connect.medlineplus.gov/service?knowledgeResponseType=application/xml&mainSearchCriteria.v.cs=2.16.840.1.113883.6.90&mainSearchCriteria.v.c=${encodeURIComponent(code)}&informationRecipient.languageCode.c=en`;
        const xmlText = await fetchWithRetry(url);

        // Parse XML for title and summary
        const titleMatch = xmlText.match(/<title>(.*?)<\/title>/);
        const summaryMatch = xmlText.match(/<fullSummary>(.*?)<\/fullSummary>/);

        results.push({
          name: titleMatch ? titleMatch[1] : code,
          summary: summaryMatch ? cleanHtml(summaryMatch[1]) : "No summary available."
        });
      } catch (err) {
        console.error(`Failed to fetch ICD-10 ${code}:`, err.message);
        results.push({ name: code, summary: "Failed to fetch summary." });
      }
    }

    res.json({ conditions: results });
  } catch (err) {
    console.error("Error fetching MedlinePlus conditions:", err);
    res.status(500).json({ error: "Failed to fetch conditions" });
  }
});



// -----------------------------
// ✅✅✅ FIXED MEDLINEPLUS DRUGS API
// -----------------------------
const VERIFIED_RXCUI = [
  { code: "387013", name: "Paracetamol" },
  { code: "849383", name: "Amoxicillin" },
  { code: "310325", name: "Ibuprofen" },
  { code: "372196", name: "Azithromycin" },
  { code: "199119", name: "Metformin" }
];

function pickRandomMedications(count = 5) {
  const shuffled = [...VERIFIED_RXCUI].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

app.get("/medlineplus/drugs", async (req, res) => {
  try {
    const parser = new xml2js.Parser({ explicitArray: false });
    const results = [];

    const randomMeds = pickRandomMedications(5);
    console.log("Fetching verified RXCUI drugs:", randomMeds);

    for (const med of randomMeds) {
      const url = `https://connect.medlineplus.gov/service?knowledgeResponseType=application/xml&mainSearchCriteria.v.cs=2.16.840.1.113883.6.88&mainSearchCriteria.v.c=${encodeURIComponent(
        med.code
      )}&informationRecipient.languageCode.c=en`;

      try {
  const response = await fetch(url);
  const xmlText = await response.text();
  const parsed = await parser.parseStringPromise(xmlText);

  let entry = parsed?.feed?.entry;
  if (Array.isArray(entry)) entry = entry[0];

  if (!entry) {
    results.push({
      name: med.name,
      summary: `We’re sorry, detailed information about ${med.name} is currently unavailable.`,
      url: null
    });
    continue;
  }

  let rawSummary = "";

  // ✅ CORRECT MedlinePlus drug summary location
  if (typeof entry.content === "object" && entry.content._) {
    rawSummary = entry.content._;
  } else if (typeof entry.content === "string") {
    rawSummary = entry.content;
  } else if (entry.summary && entry.summary._) {
    rawSummary = entry.summary._;
  }

  const summary =
    cleanHtml(rawSummary) ||
    `We’re sorry, detailed information about ${med.name} is currently unavailable.`;

  const link = entry?.link?.$?.href || entry?.link?.href || null;

  results.push({
    name: entry.title?._ ?? entry.title ?? med.name,
    summary,
    url: link
  });

} catch (err) {
  console.error("RXCUI fetch failed:", med.code);

  results.push({
    name: med.name,
    summary: `We’re sorry, detailed information about ${med.name} is currently unavailable.`,
    url: null
  });
}

    }

    res.json({ drugs: results });

  } catch (err) {
    console.error("MedlinePlus drugs endpoint error:", err);
    res.status(500).json({ error: "Failed to fetch medications" });
  }
});




//START SERVER
app.listen(PORT, () => {
  console.log(`Back-end server listening on port ${PORT}`);
});
