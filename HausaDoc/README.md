<!-- VITE_DXGPT_API_KEY=750c74735b1a40ab942f06ad72369d38 -->

<!-- dxgpt.js inside an api folder inside the src folder
import axios from "axios";

export const assessSymptoms = async ({ age, sex, symptoms }) => {
  try {
    const response = await axios.post(
      "https://dxgpt.app/api/diagnose", // replace with actual DxGPT endpoint
      { age, sex, symptoms },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_DXGPT_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("DxGPT API error:", error.response?.data || error.message);
    return {
      condition: "Unknown Condition",
      details: "Error connecting to DxGPT.",
      treatment: "Please try again later.",
    };
  }
}; -->