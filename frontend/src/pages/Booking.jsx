import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import cataniaImg from '../assets/catania.jpg';

export default function Booking() {
  const navigate = useNavigate();
  // State starts at null so the 'Continuar' button stays disabled initially
  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center p-4">
      {/* Modal Container */}
      <div className="w-full max-w-sm bg-gradient-to-b from-[#222] to-[#111] rounded-[2rem] p-6 shadow-2xl border border-white/5 relative flex flex-col min-h-[600px]">
        
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Volver
          </button>
        </div>

        <h2 className="text-white text-2xl font-bold text-center mb-8 tracking-wide">
          Elige la sucursal
        </h2>

        {/* Local 1 */}
        <div 
          className={`flex flex-col items-center mb-6 cursor-pointer p-5 rounded-2xl transition-all duration-300 border-2 ${
            selected === 1 
              ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.4)] scale-105' 
              : 'bg-transparent border-transparent hover:bg-white/5'
          }`}
          onClick={() => setSelected(1)}
        >
          <img 
            src={cataniaImg} 
            alt="Barbería Catania" 
            className={`w-32 h-32 object-cover rounded-full border-4 transition-all duration-300 shadow-xl mb-4 ${
              selected === 1 ? 'border-[#D4AF37]' : 'border-[#333]'
            }`}
          />
          <h3 className="text-white text-xl font-bold tracking-wide mt-2 text-center">Barbería Catania</h3>
          <p className="text-gray-400 text-xs md:text-sm text-center leading-relaxed font-light mt-3">
            Calle Las Flores al Frente de la Casa de la Cultura, <br />
            San Antonio del golfo - Municipio Mejía.
          </p>
        </div>

        {/* Divider as seen in screenshot */}
        <div className="w-full border-t border-gray-600/30 my-2"></div>

        <div className="flex-1"></div>

        {/* Dynamic Continuar Button */}
        <button 
          disabled={!selected}
          onClick={() => navigate('/selection')}
          className={`w-full text-lg font-bold tracking-wider py-3.5 rounded-xl transition-all duration-300 mt-8 ${
            selected 
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-[#0a0a0a] shadow-[0_0_20px_rgba(212,175,55,0.5)] cursor-pointer hover:from-[#e3be47] hover:to-[#9c7a26]' 
              : 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed border border-gray-700'
          }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
