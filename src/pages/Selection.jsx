import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import luisImg from '../assets/luis.jpg';

export default function Selection() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [selectedPro, setSelectedPro] = useState(null);

  const services = [
    { id: 1, name: "Corte Clásico", price: "$2.00", img: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=200&auto=format&fit=crop" },
    { id: 2, name: "Estilo Degradado", price: "$3.00", img: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=200&auto=format&fit=crop" }
  ];

  const pros = [
    { id: 1, name: "Luis F.", img: luisImg }
  ];

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center p-4">
      {/* Container mimicking the modal in the screenshot */}
      <div className="w-full max-w-sm bg-gradient-to-b from-[#222] to-[#111] rounded-[2rem] p-6 shadow-2xl border border-white/5 relative flex flex-col min-h-[600px] overflow-hidden">
        
        {/* Header with back button */}
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Volver
          </button>
        </div>

        {/* Top VIP brand icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#1a1a1a] border-2 border-[#D4AF37] rounded-xl flex items-center justify-center rotate-45 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
            <div className="-rotate-45 text-center">
              <span className="block font-bold text-white text-lg leading-none tracking-widest mt-1">VIP</span>
              <div className="flex justify-center gap-1 mt-1 text-[#D4AF37] text-[8px]">
                <span>★</span><span>★</span><span>★</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <h3 className="text-white text-xl font-bold text-center mb-5 tracking-wide">Servicios Disponibles</h3>
        <div className="flex flex-col gap-3 mb-6">
          {services.map(srv => (
            <div 
              key={srv.id} 
              className={`flex items-center gap-4 py-3 px-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                selectedService === srv.id 
                  ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)] scale-[1.02]' 
                  : 'bg-transparent border-gray-700/50 hover:bg-white/5'
              }`}
              onClick={() => setSelectedService(srv.id)}
            >
              <img src={srv.img} alt={srv.name} className="w-14 h-14 rounded-full object-cover border border-gray-600" />
              <div>
                <h4 className="text-white font-bold text-base tracking-wide">{srv.name}</h4>
                <p className="text-[#D4AF37] font-semibold text-sm tracking-widest">{srv.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-full border-t border-gray-600/30 my-4"></div>

        {/* Professionals Section */}
        <h3 className="text-white text-xl font-bold text-center mb-5 tracking-wide">Profesionales Disponibles</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide shrink-0 snap-x justify-center mb-2 px-1 w-full relative">
          {pros.map(pro => (
            <div 
              key={pro.id} 
              className="flex flex-col items-center cursor-pointer group snap-start min-w-[70px]"
              onClick={() => setSelectedPro(pro.id)}
            >
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all p-0.5 mb-2 ${
                selectedPro === pro.id 
                  ? 'border-[#D4AF37] scale-110 shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                  : 'border-transparent group-hover:border-[#D4AF37]/50 border-gray-600'
              }`}>
                <img src={pro.img} alt={pro.name} className="w-full h-full rounded-full object-cover" />
              </div>
              <span className={`text-sm font-bold tracking-wide ${selectedPro === pro.id ? 'text-[#D4AF37]' : 'text-gray-300 group-hover:text-white'}`}>
                {pro.name}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1"></div>

        {/* Continue Button */}
        <button 
          disabled={!selectedService || !selectedPro}
          onClick={() => {
            const srv = services.find(s => s.id === selectedService).name;
            const profe = pros.find(p => p.id === selectedPro).name;
            navigate('/calendar', { state: { service: srv, pro: profe } });
          }}
          className={`w-full text-lg font-bold tracking-wider py-3.5 rounded-xl transition-all duration-300 mt-6 ${
            selectedService && selectedPro 
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
