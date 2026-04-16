import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

//Verbind met API
const socket = io('http://localhost:3000');

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<any>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
  // Initiële data ophalen
  fetch('http://localhost:3000/api/weather/51.05/3.72')
    .then(res => res.json())
    .then(data => {
    
      if (data.weather) {
        setWeather(data.weather);
      } else {
        setWeather(data); //Fallback
      }
    });

  // Socket luisteren
socket.on('weather_update', (data) => {
  console.log("Socket update ontvangen!", data);
  
  fetch('http://localhost:3000/api/weather/51.05/3.72')
    .then(res => res.json())
    .then(json => {
      if (json.weather) {
        setWeather(json.weather); //Update de weer-data
        setPulse(true); //Start de animatie
        setTimeout(() => setPulse(false), 2000); // Stop de animatie
      }
    })
    .catch(err => console.error("Fetch na socket faalt:", err));
});

  return () => { socket.off('weather_update'); };
}, []);

  if (!weather) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-64 p-4 rounded-2xl shadow-2xl border transition-all duration-500 ${
      pulse ? 'bg-yellow-100 border-yellow-400 scale-105' : 'bg-white/90 backdrop-blur-sm border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-800">Live Weer Gent</h4>
        {}
        <span className={`h-2 w-2 rounded-full bg-green-500 ${pulse ? 'animate-ping' : ''}`}></span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">UV Index</span>
          <span className="font-semibold text-lg"> {weather.uvIndex?.toFixed(1) || '0.0'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Temp</span>
          <span className="font-semibold text-lg"> {weather.temperature || '15'}°C</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Wind</span>
          <span className="font-semibold text-sm"> {weather.windspeed || '0'} km/h</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Wolken</span>
          <span className="font-semibold text-sm"> {weather.cloudCover || '0'}%</span>
        </div>
      </div>
    </div>
  );
};