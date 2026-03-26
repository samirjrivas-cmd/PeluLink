import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Calendar() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(25);
  const [selectedTime, setSelectedTime] = useState(null);

  const times = [
    { time: "13:00", available: true },
    { time: "13:40", available: true },
    { time: "13:50", available: true },
    { time: "14:30", available: true },
    { time: "14:40", available: true },
    { time: "15:20", available: true },
    { time: "15:30", available: true },
    { time: "16:10", available: true },
    { time: "16:20", available: true },
    { time: "16:30", available: true },
    { time: "16:40", available: true },
    { time: "16:50", available: true },
    { time: "17:00", available: true },
    { time: "17:10", available: true },
    { time: "17:20", available: true },
    { time: "17:30", available: true },
    { time: "17:40", available: true },
    { time: "17:50", available: true },
    { time: "18:00", available: true }
  ];

  // March 2026 dates (1 to 31) plus placeholders to align Sunday properly
  const dates = Array.from({length: 31}, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center p-4 font-sans">
      {/* Modal Container */}
      <div className="w-full max-w-sm bg-gradient-to-b from-[#222] to-[#111] rounded-[2rem] p-6 shadow-2xl border border-gray-800 relative flex flex-col min-h-[600px] overflow-hidden">
        
        {/* Header with back button */}
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
            ← Volver
          </button>
        </div>

        {/* Top brand icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#1a1a1a] border-2 border-[#f2f2f2] rounded-xl flex items-center justify-center rotate-45">
            <div className="-rotate-45 text-center">
              <span className="block font-bold text-white text-lg leading-none tracking-widest mt-1">VIP</span>
              <div className="flex justify-center gap-1 mt-1 text-white text-[8px]">
                <span>★</span><span>★</span><span>★</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-white text-2xl font-bold text-center mb-4 tracking-wide">Fecha de Cita</h3>
        
        {/* Date Selector */}
        <div className="relative mb-6 z-20">
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="w-full bg-transparent border-2 border-gray-400 rounded-xl text-white font-bold text-xl py-3 flex justify-center tracking-widest transition-colors"
          >
            {selectedDate}/03/2026
          </button>
          
          {/* Popover Calendar */}
          {showCalendar && (
            <div className="absolute top-16 left-0 right-0 bg-white rounded-lg shadow-2xl p-4 text-black font-sans z-30">
              <div className="flex justify-between items-center mb-4 text-gray-700">
                <button className="text-gray-400 hover:text-black transition">&lt;</button>
                <span className="font-semibold text-sm">Marzo, <span className="text-gray-400">2026</span></span>
                <button className="text-gray-400 hover:text-black transition">&gt;</button>
              </div>
              <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-[11px] mb-2">
                <span className="text-orange-400 font-semibold mb-1">DO</span>
                <span className="text-orange-400 font-semibold mb-1">LU</span>
                <span className="text-orange-400 font-semibold mb-1">MA</span>
                <span className="text-orange-400 font-semibold mb-1">MI</span>
                <span className="text-orange-400 font-semibold mb-1">JU</span>
                <span className="text-orange-400 font-semibold mb-1">VI</span>
                <span className="text-orange-400 font-semibold mb-1">SA</span>
                
                {dates.map(d => {
                  const isEnabled = d >= 25 && d <= 28; // Only this week
                  const isSelected = selectedDate === d;
                  
                  return (
                    <div 
                      key={d}
                      onClick={() => {
                        if (isEnabled) {
                          setSelectedDate(d);
                          setShowCalendar(false);
                        }
                      }}
                      className={`h-8 flex flex-col justify-center rounded-md font-medium text-sm transition-all ${
                        isSelected ? 'bg-[#56c6ff] text-white' : 
                        isEnabled ? 'text-gray-800 cursor-pointer hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <h3 className="text-white text-2xl font-bold text-center mb-6 tracking-wide">Horarios</h3>

        {/* Times Grid */}
        <div className="flex flex-wrap gap-2.5 justify-center overflow-y-auto max-h-[190px] w-full scrollbar-hide pb-2">
          {times.map((t, i) => (
            <button
              key={i}
              disabled={!t.available}
              onClick={() => setSelectedTime(t.time)}
              className={`py-2 px-3 rounded-lg border font-medium text-sm flex items-center justify-center transition-all min-w-[70px] ${
                !t.available 
                  ? 'border-red-600/60 text-red-600/60 cursor-not-allowed bg-transparent' 
                  : selectedTime === t.time 
                    ? 'border-[#48baf7] bg-[#48baf7]/10 text-[#48baf7]' 
                    : 'border-gray-200 text-gray-200 hover:border-white'
              }`}
            >
              {t.time}
            </button>
          ))}
        </div>

        <div className="flex-1"></div>

        {/* Continue Button */}
        <button 
          disabled={!selectedTime}
          className={`w-full text-lg font-medium tracking-wider py-3 rounded-xl transition-all duration-300 mt-4 border-2 ${
            selectedTime
              ? 'border-[#5c6bc0] hover:bg-[#5c6bc0]/20 text-white cursor-pointer' 
              : 'border-[#333] bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
          }`}
          onClick={() => {
            const formattedDate = `${selectedDate.toString().padStart(2, '0')}/03/2026`;
            navigate('/details', { state: { ...state, date: formattedDate, time: selectedTime } });
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
