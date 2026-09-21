import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import AskSetuChat from "./components/AskSetuChat.jsx";
import HomePage from "./pages/HomePage.jsx";
import PreferencesPage from "./pages/PreferencesPage.jsx";
import GeneratingPage from "./pages/GeneratingPage.jsx";
import ItineraryPage from "./pages/ItineraryPage.jsx";
import StayDiscoveryPage from "./pages/StayDiscoveryPage.jsx";
import SplashScreen from "./components/SplashScreen.jsx";

export default function App() {
  const location = useLocation();
  const hideFooter = location.pathname === "/generating";

  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem("hasSeenSplash");
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  const handleSplashFinish = () => {
    sessionStorage.setItem("hasSeenSplash", "true");
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/stays" element={<StayDiscoveryPage />} />
            <Route path="/stays/:stayId" element={<StayDiscoveryPage />} />
            <Route path="/plan" element={<PreferencesPage />} />
            <Route path="/generating" element={<GeneratingPage />} />
            <Route path="/itinerary" element={<ItineraryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {!hideFooter && <Footer />}
        <AskSetuChat />
      </div>
    </>
  );
}