import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useTranslation } from "react-i18next";

const Conditions = () => {
  const { t } = useTranslation();
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Toggle expanded card
  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Fetch conditions from backend
  useEffect(() => {
    const fetchConditions = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("https://likitaaibackend.onrender.com/medlineplus/conditions");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setConditions(data.conditions || []);
      } catch (err) {
        console.error(err);
        setError(t("conditions.failedLoad"));
      }
      setLoading(false);
    };

    fetchConditions();
  }, [t]);

  return (
    <>
      <Navbar />
      <div className="condition min-h-screen flex flex-col items-center px-4 py-12 md:py-20 bg-gradient-to-b from-blue-50 to-blue-100">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
          {t("conditions.title")}
        </h2>

        {loading && (
          <div className="flex flex-col items-center mt-8">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="mt-4 text-blue-900 font-semibold">{t("conditions.loading")}</span>
          </div>
        )}

        {error && <p className="text-red-500 mt-4">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mt-6">
            {conditions.map((cond, idx) => (
              <div
                key={idx}
                className="con p-5 rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 flex flex-col shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <h3 className="font-semibold text-lg text-blue-900 mb-2">{cond.name}</h3>

                <div className={`text-sm text-gray-700 mb-3 transition-all duration-300 ${expandedIndex === idx ? "line-clamp-none" : "line-clamp-4"}`}>
                  {cond.summary.split(". ").map((line, i) => (
                    <p key={i} className="mb-1">
                      • {line.trim()}
                    </p>
                  ))}
                </div>
                <br />
                <div className="mt-auto flex justify-between items-center">
                  {cond.url && (
                    <a
                      href={cond.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 font-medium hover:underline"
                    >
                      {t("conditions.readMore")}
                    </a>
                  )}
                  <button
                    onClick={() => toggleExpand(idx)}
                    className="text-blue-600 font-semibold hover:text-blue-900"
                  >
                    {expandedIndex === idx ? t("conditions.showLess") : t("conditions.showMore")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Conditions;
