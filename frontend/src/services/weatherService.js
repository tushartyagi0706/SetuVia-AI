/**
 * OpenWeatherMap API Service
 */

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const DEFAULT_CITY = "Goa";

export async function fetchCurrentWeather(city = DEFAULT_CITY) {
  if (!API_KEY) {
    return { status: "KEY_MISSING", data: null, error: "Weather API Key not configured" };
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      return { status: "ERROR", data: null, error: `HTTP ${response.status}` };
    }

    const json = await response.json();
    return {
      status: "SUCCESS",
      data: {
        temp: Math.round(json.main.temp),
        condition: json.weather[0]?.main || "Clear",
        icon: json.weather[0]?.icon
          ? `https://openweathermap.org/img/wn/${json.weather[0].icon}@2x.png`
          : null,
      },
      error: null,
    };
  } catch (err) {
    return { status: "ERROR", data: null, error: err.message };
  }
}
