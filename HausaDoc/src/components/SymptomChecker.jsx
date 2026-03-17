import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../components/Navbar";
import i18n from "../i18n";

// Define the steps for the symptom checker
const steps = [
  { label: "info", key: 1 },       // Step 1: User information
  { label: "symptoms", key: 2 },   // Step 2: Enter symptoms
  { label: "condition", key: 3 }, // Step 3: Show possible medical conditions
  { label: "treatment", key: 4 },  // Step 4: Show treatment recommendations
];

function SymptomChecker() {
  const { t } = useTranslation(); // Translation hook
  // State variables
  const [step, setStep] = useState(1); // Current step
  const [info, setInfo] = useState({ age: "", sex: "" }); // User info
  const [symptoms, setSymptoms] = useState(""); // Symptom description
  const [diagnoses, setDiagnoses] = useState([]); // List of diagnoses from backend
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null); // Selected diagnosis for treatment view
  const [expandedDiagnosis, setExpandedDiagnosis] = useState(null); // Currently expanded condition card
  const [loading, setLoading] = useState(false); // Loading state
  const [symptomError, setSymptomError] = useState(""); // Validation error for symptoms
  const [showDisclaimer, setShowDisclaimer] = useState(true); // Disclaimer modal visibility

  // Function to call backend API and fetch diagnoses
  const generateResponses = async () => {
    setLoading(true);
    setSymptomError("");

    try {
      const response = await fetch("http://localhost:5000/dxgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: info.age,
          sex: info.sex,
          description: symptoms,
          lang: i18n.language,
        }),
      });

      const data = await response.json();

      // If error or no data, reset diagnoses
      if (data.error || !data.dxgpt?.data) {
        setDiagnoses([]);
        setExpandedDiagnosis(null);
      } else {
        setDiagnoses(data.dxgpt.data);
        setExpandedDiagnosis(null);
      }
    } catch (err) {
      console.error(err);
      setDiagnoses([]);
      setExpandedDiagnosis(null);
    }

    setLoading(false);
  };

  // Handle form submit for Step 1 (Info)
  const handleInfoSubmit = (e) => {
    e.preventDefault();
    if (info.age && info.sex) setStep(2); // Move to next step only if info filled
  };

  // Handle form submit for Step 2 (Symptoms)
  const handleSymptomsSubmit = async (e) => {
    e.preventDefault();
    if (symptoms.trim().length < 10) {
      setSymptomError(t("minSymptomChars")); // Validate minimum symptom length
      return;
    }
    await generateResponses(); // Fetch diagnoses
    setStep(3); // Move to conditions step
  };

  // Toggle the expanded/collapsed state of a diagnosis card
  const toggleDiagnosis = (d) => {
    setExpandedDiagnosis(expandedDiagnosis === d ? null : d);
  };

  // Handle finish: reset all states
  const handleFinish = () => {
    alert(`${t("thankYou")}\n\n${t("finishDisclaimer")}`);
    setStep(1);
    setInfo({ age: "", sex: "" });
    setSymptoms("");
    setDiagnoses([]);
    setExpandedDiagnosis(null);
    setSymptomError("");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />

      {/* Disclaimer modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="disclaimer bg-white rounded-xl p-6 md:p-10 max-w-lg w-full shadow-lg relative text-gray-900">
            <button
              onClick={() => setShowDisclaimer(false)}
              className="absolute bottom-2 right-3 hover:cursor-pointer"
            >
              {t("continue")}
            </button>
            <h3 className="text-xl md:text-2xl font-bold mb-4">{t("disclaimerTitle")}</h3>
            <p className="text-sm md:text-base">{t("disclaimerText")}</p>
          </div>
        </div>
      )}  

      <main className="flex-1 px-4 pt-20 md:pt-24">
        <div className="checker flex flex-col  py-12 md:py-20">
          {/* Checker header */}
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              LikitaAI {t("checker")}
            </h2>
          <div className="checkers w-full max-w-2xl mx-auto p-6 md:p-10 rounded-2xl relative z-10">
            {/* Step navigation buttons */}
            <div className="ccc w-full">
              <div className="step-buttons flex flex-wrap justify-center mb-8 md:mb-12">
                {steps.map((s) => (
                  <button
                    key={s.key}
                    className={`step-btn px-3 py-2 md:px-4 md:py-2 rounded-full text-sm md:text-base ${
                      step === s.key ? "active-link" : ""
                    } ${s.key > step ? "disabled" : ""}`}
                    onClick={() => s.key < step && setStep(s.key)}
                    disabled={s.key > step}
                  >
                    {t(s.label)}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1 - User Info */}
            {step === 1 && (
              <form className="checker-form space-y-6" onSubmit={handleInfoSubmit}>
                <div className="checks">
                  <input
                id="user-input"
                  type="number"
                  placeholder={t("age")}
                  value={info.age}
                  onChange={(e) => setInfo({ ...info, age: e.target.value })}
                  required
                  className="w-full checker-input"
                />
                <br /><br />
                <select
                id="user-select"
                  value={info.sex}
                  onChange={(e) => setInfo({ ...info, sex: e.target.value })}
                  required
                  className="w-full checker-input"
                >
                  <option value="">{t("selectSex")}</option>
                  <option value="male">{t("male")}</option>
                  <option value="female">{t("female")}</option>
                </select>
                </div>

                {/* Navigation buttons */}
                <div className="checker-box pt-4" >
                  <button type="submit" className="checker-btn">
                    {t("continue")}  →
                  </button>
                </div>
              </form>
            )}

            {/* Step 2 - Symptoms Input */}
            {step === 2 && (
              <form className="checker-form space-y-6" onSubmit={handleSymptomsSubmit}>
                <div className="checks">
                  <textarea 
                  name=""
                  id="symptoms-text"
                  placeholder={t("describeSymptoms")}
                  onChange={(e) => setSymptoms(e.target.value)}
                  required
                  className="w-full checker-input"
                  >

                  </textarea>
                  {/* <input
                id="symptoms-text"
                  type="text"
                  placeholder={t("describeSymptoms")}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  required
                  className="w-full checker-input"
                /> */}
                {symptomError && <p className="text-red-500 text-sm">{symptomError}</p>}

                </div>
                <div className="checker-box1 flex justify-between pt-4">
                  <button type="button" className="checker-btn1" onClick={() => setStep(1)}>
                    ←  {t("back")}
                  </button>
                  <button type="submit" className="checker-btn1">
                    {loading ? t("diagnosing") : t("diagnose")}  →
                  </button>
                </div>
              </form>
            )}

            {/* Step 3 - Conditions */}
            {step === 3 && (
              <div className="checker-form space-y-6 ">
               <div className="checks">
                <p className="p3">{t("conditions-text")}</p>
                 {loading ? (
                  <p className="checker-p">{t("loading")}</p>
                ) : diagnoses.length === 0 ? (
                  <p className="checker-p">{t("noDiagnosisFound")}.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {diagnoses.map((d, idx) => (
                      <div
                        key={idx}
                        className=" cond-tab rounded-xl shadow-lg overflow-hidden"
                        style={{
                          backgroundColor: "rgba(182, 211, 240, 0.3)",
                          backdropFilter: "blur(10px)",
                          color: "black",
                        }}
                      >
                        {/* Card header with diagnosis title and expand arrow */}
                        <div
                           className=" pp p-4 flex justify-between items-center cursor-pointer"
                              onClick={() => toggleDiagnosis(d)}
                               >
                            <h3 className="font-bold text-lg">{d.diagnosis}</h3>
                           <span className="text-sm font-medium text-blue-600">
                          {expandedDiagnosis === d ? t("hideDetails") : t("details")}
                           </span>
                            </div>
 

                        {/* Expandable content */}
                        <div
                          className={` ppp px-4 overflow-hidden transition-all duration-500 ease-in-out ${
                            expandedDiagnosis === d ? "max-h-[2000px] py-2" : "max-h-0"
                          }`}
                        >
                          <div className="space-y-2 text-[black]">
                            {/* Description and symptoms */}
                            {d.description && <p>{d.description}</p>}
                            {d.symptoms_in_common?.length > 0 && (
                              <p>
                                <br />
                                <strong>{t("symptomsInCommon")}:</strong>{" "}
                                {d.symptoms_in_common.join(", ")}
                              </p>
                            )}
                            {d.symptoms_not_in_common?.length > 0 && (
                              <p>
                                <br />
                                <strong>{t("otherSymptoms")}:</strong>{" "}
                                {d.symptoms_not_in_common.join(", ")}
                              </p>
                            )}
                            <button
                            type="button"
                              className=" pp mt-4 text-sm font-medium text-blue-600 underline flex justify-end items-end cursor-pointer"
                                 onClick={() => {
                          setSelectedDiagnosis(d); // ✅ ISOLATION
                          setStep(4);
                        }}
                                       >
                                     {t("viewTreatment")} →
                                      </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

               </div>
                {/* Navigation buttons */}
                <div className="checker-box1 flex justify-between pt-4">
                  <button type="button" className="checker-btn1" onClick={() => setStep(2)}>
                    ←  {t("back")}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4 - Treatment */}
             {step === 4 && selectedDiagnosis && (
              <div className="checker-form space-y-6">
                <div className="checks">
                  <div
                  className="cond-tab rounded-xl shadow-lg p-4"
                  style={{
                    backgroundColor: "rgba(182, 211, 240, 0.3)",
                    backdropFilter: "blur(10px)",
                    color: "black",
                  }}
                >
                  <h3 className=" pp font-bold text-lg mb-3">
                    {selectedDiagnosis.diagnosis}
                  </h3>

                  {typeof selectedDiagnosis.treatment === "string" && (
                    <p>{selectedDiagnosis.treatment}</p>
                  )}

                  {typeof selectedDiagnosis.treatment === "object" && (
                    <>
                      {selectedDiagnosis.treatment.firstLine && (
                        <p className="ppp1">
                          <strong>{t("firstlinetreatment")}:</strong>{" "}
                          <br />
                          {selectedDiagnosis.treatment.firstLine}
                        </p>
                      )}
                      {selectedDiagnosis.treatment.homeCare && (
                        <p className="ppp1">
                          <strong>{t("homecareadvice")}:</strong>{" "}
                          <br />
                          {selectedDiagnosis.treatment.homeCare}
                        </p>
                      )}
                      {selectedDiagnosis.treatment.seekMedical && (
                        <p className="ppp1">
                          <strong>{t("seekmedicalcare")}:</strong>{" "}
                          <br />
                          {selectedDiagnosis.treatment.seekMedical}
                        </p>
                      )}
                    </>
                  )}
                </div>
                </div>

                <div className="checker-box1 flex justify-between pt-4">
                  <button
                    className="checker-btn1"
                    onClick={() => {
                      setSelectedDiagnosis(null);
                      setStep(3);
                    }}
                  >
                    ← {t("back")}
                  </button>
                  <button className="checker-btn1" onClick={handleFinish}>
                    {t("finish")} →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
           
      </main>
      <br /><br /><br /><br /><br />
      <div className="disclaimer2">
        <p className="p1">{t("disclaimerText2")}</p>



             <p className="p2">© 2026 LikitaAI, LLC. All rights reserved.</p>

      </div>
    </div>
  
  );
}

export default SymptomChecker;


