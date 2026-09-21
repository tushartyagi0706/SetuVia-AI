import React, { useEffect, useState } from 'react';
import { CloudSun, RefreshCw } from 'lucide-react';
import { fetchCurrentWeather } from '../services/weatherService';

export default function WeatherBadge({ city = "Goa" }) {
  const [weatherState, setWeatherState] = useState({
    loading: true,
    temp: null,
    condition: null,
    icon: null,
    unavailable: false,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      const res = await fetchCurrentWeather(city);
      if (!isMounted) return;

      if (res.status === "SUCCESS" && res.data) {
        setWeatherState({
          loading: false,
          temp: res.data.temp,
          condition: res.data.condition,
          icon: res.data.icon,
          unavailable: false,
        });
      } else {
        setWeatherState({
          loading: false,
          temp: null,
          condition: null,
          icon: null,
          unavailable: true,
        });
      }
    }

    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [city]);

  if (weatherState.loading) {
    return (
      <div className="inline-flex items-center gap-2 bg-[#031b18]/10 text-[#031b18] text-xs font-medium px-3.5 py-1.5 rounded-full border border-[#031b18]/20">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#031b18]" />
        <span>Loading weather...</span>
      </div>
    );
  }

  if (weatherState.unavailable || weatherState.temp === null) {
    return (
      <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 text-xs font-medium px-3.5 py-1.5 rounded-full border border-gray-200">
        <CloudSun className="w-3.5 h-3.5 text-gray-500" />
        <span>Weather unavailable</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 bg-[#031b18] text-white text-xs font-medium px-3.5 py-1.5 rounded-full shadow-sm">
      {weatherState.icon ? (
        <img src={weatherState.icon} alt={weatherState.condition} className="w-5 h-5 -my-1" />
      ) : (
        <CloudSun className="w-3.5 h-3.5 text-amber-300" />
      )}
      <span>{weatherState.condition} · {weatherState.temp}°C</span>
    </div>
  );
}
