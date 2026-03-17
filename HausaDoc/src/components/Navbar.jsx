import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Navbar() {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  // explicit nav items with paths — keep in sync with your router
  const navItems = [
    { key: "homE", path: "/" },
    { key: "condition", path: "/conditions" },
    { key: "checker", path: "/symptom-checker" },
  ];
  
  // Load saved language
  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);
  
  // Toggle language
  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ha" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <>
      <nav
        className="
          w-full fixed top-0 left-0 z-50
          flex items-center justify-between
          px-8 py-4
          backdrop-blur-lg
          shadow-lg rounded-b-xl border-b border-white/20 h-20
        "
      >
        {/* Logo */}
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">
          LikitaAI
        </h1>

        {/* Center menu for desktop */}
        <ul className="hidden md:flex gap-10 font-semibold text-white justify-center flex-1">
          {navItems.map((item) => (
            <li key={item.key}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `px-3 py-2 transition duration-300 ${
                    isActive
                      ? "border-b-2 border-blue-300 text-blue-100"
                      : "hover:text-blue-200 hover:drop-shadow-[0_0_6px_rgba(173,216,230,0.6)]"
                  }`
                }
              >
                {t(item.key)}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Desktop language button */}
        <button
          onClick={toggleLanguage}
          className="
            lang-toggle
            hidden md:block
            px-5 py-2 rounded-lg
            bg-blue-100 text-blue-900 font-bold
            shadow hover:bg-blue-200 hover:text-blue-800
            transition mx-4
          "
        >
          {i18n.language === "en" ? "Hausa" : "English"}
        </button>

        {/* Mobile Hamburger */}
        <div className="md:hidden relative">
          <button
            onClick={toggleMenu}
            className="flex flex-col justify-between w-8 h-6 focus:outline-none"
          >
            <span
              className={`block h-1 w-full rounded bg-white transform transition duration-300 ${
                menuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            ></span>
            <span
              className={`block h-1 w-full rounded bg-white transition duration-300 ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            ></span>
            <span
              className={`block h-1 w-full rounded bg-white transform transition duration-300 ${
                menuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            ></span>
          </button>

          {/* Dropdown Menu */}
          <div
            className={`
              absolute right-0 mt-3 rounded-xl shadow-2xl overflow-hidden
              backdrop-blur-md bg-white/70 border border-white/30
              transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
              origin-top
              ${
                menuOpen
                  ? "max-h-96 opacity-100 translate-y-2 scale-y-100"
                  : "max-h-0 opacity-0 -translate-y-5 scale-y-75 pointer-events-none"
              }
            `}
            style={{ width: "200px" }}
          >
            <ul className="flex flex-col text-center font-semibold text-blue-900 divide-y divide-blue-100">
              {navItems.map((item, index) => (
                <li
                  key={item.key}
                  className={`
                    transition-all transform duration-500
                    ${
                      menuOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }
                  `}
                  style={{
                    transitionDelay: `${menuOpen ? index * 100 + 150 : 0}ms`,
                  }}
                >
                  <NavLink
                    to={item.path}
                    end={item.path === "/"}
                    className="block px-6 py-3 hover:bg-blue-100/40 transition hover:drop-shadow-[0_0_8px_rgba(173,216,230,0.6)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t(item.key)}
                  </NavLink>
                </li>
              ))}

              {/* Mobile language button */}
              <li
                className={`
                  transition-all transform duration-500
                  ${
                    menuOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }
                `}
                style={{ transitionDelay: `${menuOpen ? 400 : 0}ms` }}
              >
                <button
                  onClick={() => {
                    toggleLanguage();
                    setMenuOpen(false);
                  }}
                  className="
                    w-full text-center py-3 font-semibold
                    bg-blue-100 text-blue-900 hover:bg-blue-200 transition
                  "
                >
                  {i18n.language === "en" ? "Hausa" : "English"}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Background overlay for mobile menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-500"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
    </>
  );
}

export default Navbar;

