import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { useTrip } from "../context/TripContext.jsx";
import { LOADING_STEPS } from "../services/itineraryService.js";

export default function GeneratingPage() {
  const { preferences, createItinerary, generationError } = useTrip();
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const generationPromise = useRef(null);

  function startGeneration() {
    setStepIndex(0);
    generationPromise.current = createItinerary(preferences);
    generationPromise.current.then((nextItinerary) => {
      if (nextItinerary) navigate("/itinerary", { replace: true });
    });
  }

  useEffect(() => {
    if (!preferences?.destination) {
      navigate("/plan", { replace: true });
      return undefined;
    }

    const stepTimer = setInterval(() => {
      setStepIndex((current) =>
        current < LOADING_STEPS.length - 1 ? current + 1 : current
      );
    }, 1000);

    if (!generationPromise.current) startGeneration();

    return () => {
      clearInterval(stepTimer);
    };
  }, []);

  return (
    <LoadingScreen
      stepIndex={stepIndex}
      destination={preferences?.destination}
      error={generationError}
      onRetry={startGeneration}
      onBack={() => navigate("/plan", { replace: true })}
    />
  );
}
