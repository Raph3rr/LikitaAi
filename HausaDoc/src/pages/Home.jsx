import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useTranslation } from "react-i18next";
import homeCareTips from "../homecaretips";

function Home() {
  const { t } = useTranslation();

  const [loadingTips, setLoadingTips] = useState(false);
  const [loadingDrugs, setLoadingDrugs] = useState(false);
  const [loadingFacilities, setLoadingFacilities] = useState(false);

  const [tips, setTips] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [homeTips, setHomeTips] = useState([]);
  
  const [tipsError, setTipsError] = useState("");
  const [drugsError, setDrugsError] = useState("");
  const [facilitiesError, setFacilitiesError] = useState("");
  const [expandedDrugIndex, setExpandedDrugIndex] = useState(null);

  // Northern Nigerian states
  const northernStates = [
    "kaduna","kano","katsina","sokoto","jigawa","bauchi",
    "borno","yobe","zamfara","kebbi","niger","gombe","adamawa"
  ];

  useEffect(() => {
    setHomeTips(homeCareTips.slice(0, 10)); // first 10 home care tips
    fetchTips();
    fetchDrugs();
    fetchFacilities();
  }, []);

  // Shuffle & pick n items
  const getRandomTips = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

  // Fetch Preventive Tips
  const fetchTips = async () => {
    setLoadingTips(true);
    setTipsError("");
    try {
      const res = await fetch("http://localhost:5000/api/health-tips");
      const data = await res.json();
      setTips(getRandomTips(data.tips || [], 5));
    } catch (err) {
      console.error(err);
      setTipsError(t("home.failedTips"));
    }
    setLoadingTips(false);
  };

  // Fetch Medications
  const fetchDrugs = async () => {
    setLoadingDrugs(true);
    setDrugsError("");
    try {
      const res = await fetch("http://localhost:5000/medlineplus/drugs");
      const data = await res.json();
      setDrugs((data.drugs || []).slice(0, 9));
    } catch (err) {
      console.error(err);
      setDrugsError(t("home.failedMedications"));
    }
    setLoadingDrugs(false);
  };

  // Fetch Health Facilities
  const fetchFacilities = async () => {
    setLoadingFacilities(true);
    setFacilitiesError("");
    try {
      const res = await fetch("http://localhost:5000/api/facilities");
      const data = await res.json();

      // Filter only Northern Nigeria
      const northernFacilities = (data || []).filter(f =>
        northernStates.includes(f.state?.toLowerCase())
      );

      setFacilities(northernFacilities);
      setFilteredFacilities(northernFacilities);
    } catch (err) {
      console.error(err);
      setFacilitiesError("Failed to load health facilities.");
    }
    setLoadingFacilities(false);
  };

  // Filter facilities by state on search
  const handleFacilitySearch = (query) => {
    const q = query.toLowerCase();
    setFilteredFacilities(
      facilities.filter(f =>
        f.state?.toLowerCase().includes(q) ||
        f.lga?.toLowerCase().includes(q) ||
        f.facility_name?.toLowerCase().includes(q)
      )
    );
  };

  return (
    <>
      <Navbar />

      <div className="home min-h-screen bg-gray-50 p-6 lg:p-12">
        <h2 className="text-4xl font-bold mb-10 text-center text-gray-800">
          {t("home.dashboardTitle")}
        </h2>

        {/* Tips Section */}
<div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6">
  
  {/* Home Care Tips */}
  <div className=" tip bg-white p-6 rounded-lg shadow-lg">
    <h2 className="text-2xl font-bold mb-6 text-blue-700">
      🏠 {t("home.homeCareTips")}
    </h2>

    {homeTips.length > 0 && (
      <ul className="list-disc list-inside space-y-2 text-gray-700">
        {homeTips.map((tip, idx) => (
          <li key={idx}>{tip.tip}</li>
        ))}
      </ul>
    )}
  </div>

  {/* Preventive Health Tips */}
  <div className=" tip bg-white p-6 rounded-lg shadow-lg">
    <h2 className="text-2xl font-bold mb-4 text-green-700">
      🛡 {t("home.preventiveTips")}
    </h2>

    {loadingTips && <p className="text-blue-600">{t("home.loadingTips")}</p>}
    {tipsError && <p className="text-red-500">{tipsError}</p>}

    {!loadingTips && tips.length > 0 && (
      <ul className="list-disc list-inside space-y-4 text-gray-700">
        {tips.map((tip, idx) => (
          <li key={idx}>
            <p className="font-medium">{tip.tip}</p>
            {tip.source && (
              <span className="text-xs text-gray-400 block mt-1">
                {t("home.source")}: {tip.source}
              </span>
            )}
          </li>
        ))}
      </ul>
    )}

    <br />
    <button
      onClick={() => {
        // Refresh both lists
        setHomeTips(homeCareTips.sort(() => 0.5 - Math.random()).slice(0, 10));
        fetchTips();
      }}
      className="tipBtn mt-5 w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
    >
      {t("home.refreshTips")}
    </button>
  </div>

</div>


         {/* Health Facilities */}
        <div className="mt-14 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-green-800">
            🏥 {t("home.healthFacilities")}
          </h2>

          <input
            type="text"
            placeholder={t("home.searchByState")}
            className="search border p-2 rounded mb-4 w-full"
            onChange={(e) => handleFacilitySearch(e.target.value)}
          />

          {loadingFacilities && <p className="text-blue-600">{t("home.loadingFacilities")}</p>}
          {facilitiesError && <p className="text-red-500">{facilitiesError}</p>}

          {!loadingFacilities && filteredFacilities.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-2 text-left">Facility Name</th>
                    <th className="border px-3 py-2 text-left">Type</th>
                    <th className="border px-3 py-2 text-left">Maternity Care</th>
                    <th className="border px-3 py-2 text-left">Measles Immunization</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.slice(0, 50).map((f, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">{f.facility_name}</td>
                      <td className="border px-3 py-2">{f.facility_type_display}</td>
                      <td className="border px-3 py-2">{f.maternal_health_delivery_services || "N/A"}</td>
                      <td className="border px-3 py-2">{f.child_health_measles_immun_calc || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Medications */}
        <div className="mt-14 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-purple-800">
            💊 {t("home.topMedications")}
          </h2>

          {loadingDrugs && <p className="text-blue-600">{t("home.loadingMedications")}</p>}
          {drugsError && <p className="text-red-500">{drugsError}</p>}

          {!loadingDrugs && drugs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {drugs.map((drug, idx) => {
                const isExpanded = expandedDrugIndex === idx;
                const summaryText =
                  drug.summary && drug.summary.length > 30
                    ? drug.summary
                    : t("home.noDrugInfo");

                return (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg shadow">
                    <h4 className="font-semibold text-purple-700">{drug.name}</h4>
                    <p className={`text-sm text-gray-700 mt-1 ${!isExpanded && "line-clamp-3"}`}>
                      {summaryText}
                    </p>

                    {summaryText.length > 120 && (
                      <button
                        onClick={() => setExpandedDrugIndex(isExpanded ? null : idx)}
                        className="mt-2 text-sm text-purple-600 hover:underline font-medium"
                      >
                        {isExpanded ? t("home.showLess") : t("home.showMore")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Home;
