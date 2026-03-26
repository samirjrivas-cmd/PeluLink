import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpg';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-[fadeInUp_1s_ease-out]">
        <div 
          className="relative group cursor-pointer" 
          onClick={() => navigate('/explore')}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] rounded-full blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
          <img 
            src={logo} 
            alt="PeluLink Logo" 
            className="relative w-64 h-64 md:w-80 md:h-80 object-contain mx-auto mb-10 transition-transform duration-700 ease-in-out hover:scale-110 rounded-full shadow-2xl"
          />
          {/* Subtle instruction on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="bg-black/60 text-[#D4AF37] px-6 py-3 rounded-full font-semibold tracking-wide border border-[#D4AF37]/50 backdrop-blur-sm shadow-xl">
              Entrar
            </span>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold italic tracking-wider text-[#fcfcfc] mt-6">
          Conectando tu estilo
        </h1>
      </div>
    </div>
  );
}
