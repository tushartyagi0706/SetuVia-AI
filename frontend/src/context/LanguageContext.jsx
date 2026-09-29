import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext(null);
const STORAGE_KEY = "setuvia_language";

export const TRANSLATIONS = {
  en: {
    // Navigation
    nav_home: "Home",
    nav_stays: "Discover Stays",
    nav_plan: "Plan Trip",
    nav_itinerary: "My Itinerary",
    nav_for_hosts: "For Hosts",
    
    // Hero & Home
    hero_title: "Connecting WHERE YOU STAY with HOW YOU TRAVEL",
    hero_subtitle: "AI-powered personalized travel concierge for Goa anchored to your accommodation.",
    cta_plan: "Plan My Trip 🚀",
    cta_hosts: "For Hosts 🏠",
    
    // Stays
    stays_title: "GTDC & Heritage Stays in Goa",
    stays_subtitle: "Select your stay base anchor for localized, minimal-travel itinerary recommendations.",
    select_stay: "Select Stay",
    selected_stay: "Selected Stay Anchor",
    trust_evidence: "Trust Evidence Panel",

    // Preferences
    pref_title: "Personalise Your Trip",
    pref_destination: "Destination",
    pref_days: "Number of Days",
    pref_budget: "Total Budget (INR)",
    pref_pace: "Travel Pace",
    pref_food: "Food Preference",
    pref_interests: "Interests",
    btn_generate: "Generate Stay-Anchored Trip 🪄",

    // Itinerary & Tools
    itin_headline: "Your Stay-Anchored Journey",
    why_recommended: "Why Recommended?",
    stay_map: "Stay Anchor Visual Map",
    transparent_budget: "Transparent Trip Budget",
    regenerate_day: "Regenerate Day",
    simulate_rain: "Simulate Rain (DEMO)",
    ask_setu: "Ask Setu 🤖",

    // Host Toolkit
    host_dashboard: "Host Dashboard",
    host_property: "Property Management",
    host_pricing: "Pricing Insights",
    host_listing: "AI Listing Studio",
    host_assistant: "Host Assistant",
  },
  hi: {
    // Navigation
    nav_home: "होम",
    nav_stays: "स्टे खोजें",
    nav_plan: "ट्रिप प्लान करें",
    nav_itinerary: "मेरी यात्रा",
    nav_for_hosts: "होस्ट्स के लिए",

    // Hero & Home
    hero_title: "जहाँ आप ठहरते हैं, वहाँ से अपनी यात्रा जोड़ें",
    hero_subtitle: "गोवा के लिए आपकी स्टे से जुड़ी AI संचालित व्यक्तिगत यात्रा सेवा।",
    cta_plan: "मेरी ट्रिप बनाएँ 🚀",
    cta_hosts: "होस्ट पोर्टल 🏠",

    // Stays
    stays_title: "गोवा में GTDC और हेरिटेज स्टे",
    stays_subtitle: "कम से कम यात्रा समय के लिए अपना स्टे एंकर चुनें।",
    select_stay: "स्टे चुनें",
    selected_stay: "चयनित स्टे एंकर",
    trust_evidence: "ट्रस्ट एविडेंस पैनल",

    // Preferences
    pref_title: "अपनी यात्रा अनुकूलित करें",
    pref_destination: "गंतव्य",
    pref_days: "दिनों की संख्या",
    pref_budget: "कुल बजट (₹)",
    pref_pace: "यात्रा की गति",
    pref_food: "भोजन प्राथमिकता",
    pref_interests: "रुचियां",
    btn_generate: "ट्रिप जनरेट करें 🪄",

    // Itinerary & Tools
    itin_headline: "आपकी स्टे-आधारित यात्रा",
    why_recommended: "क्यों अनुशंसित?",
    stay_map: "स्टे एंकर मैप",
    transparent_budget: "पारदर्शी ट्रिप बजट",
    regenerate_day: "दिन पुनर्जीवित करें",
    simulate_rain: "बारिश सिमुलेट करें (DEMO)",
    ask_setu: "सेतु से पूछें 🤖",

    // Host Toolkit
    host_dashboard: "होस्ट डैशबोर्ड",
    host_property: "संपत्ति प्रबंधन",
    host_pricing: "मूल्य निर्धारण अंतर्दृष्टि",
    host_listing: "AI लिस्टिंग स्टूडियो",
    host_assistant: "होस्ट सहायक",
  },
  kok: {
    // Navigation
    nav_home: "घर",
    nav_stays: "रावपाची सुवात",
    nav_plan: "ट्रिप येवजण",
    nav_itinerary: "म्हजी भोंवडी",
    nav_for_hosts: "होस्ट खातीर",

    // Hero & Home
    hero_title: "तुम्ही खंय रावतात ताचे कडेन भोंवडी जोडात",
    hero_subtitle: "गोयां खातीर तुमच्या रावपाच्या सुवातेचेर आदारिल्ली AI भोंवडी सेवा।",
    cta_plan: "म्हजी ट्रिप तयार करात 🚀",
    cta_hosts: "होस्ट खातीर 🏠",

    // Stays
    stays_title: "गोयांत GTDC आनी हेरिटेज हॉटेलां",
    stays_subtitle: "कमी भोंवडी वेळ खातीर तुमची सुवात बांदात।",
    select_stay: "सुवात निवडात",
    selected_stay: "निवडिल्ली सुवात",
    trust_evidence: "विस्वास पुरावा पॅनल",

    // Preferences
    pref_title: "तुमची भोंवडी बदलून घेयात",
    pref_destination: "सुवात",
    pref_days: "दिसांची संख्या",
    pref_budget: "एकूण बजेट (₹)",
    pref_pace: "भोंवडेचो वेग",
    pref_food: "जेवणाची पसंती",
    pref_interests: "आवड",
    btn_generate: "ट्रिप तयार करात 🪄",

    // Itinerary & Tools
    itin_headline: "तुमची रावपाचेर आदारिल्ली भोंवडी",
    why_recommended: "कित्याक सुचयलां?",
    stay_map: "स्टे एंकर मॅप",
    transparent_budget: "पारदर्शक ट्रिप बजेट",
    regenerate_day: "दीस परतून तयार करात",
    simulate_rain: "पावस दाखयात (DEMO)",
    ask_setu: "सेतु कडेन विचारात 🤖",

    // Host Toolkit
    host_dashboard: "होस्ट डॅशबोर्ड",
    host_property: "मालमत्ता वेवस्थापन",
    host_pricing: "दर समज",
    host_listing: "AI लिस्टिंग स्टुडिओ",
    host_assistant: "होस्ट आदार",
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "en";
    } catch {
      return "en";
    }
  });

  function setLanguage(lang) {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch { /* noop */ }
  }

  function t(key) {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: "en",
      setLanguage: () => {},
      t: (key) => TRANSLATIONS.en[key] || key
    };
  }
  return context;
}
