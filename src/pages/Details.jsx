import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Details() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const fallbackState = { service: 'Servicio Reservado', pro: 'Barbero', date: '25/03/2026', time: '15:30' };
  const { service, pro, date, time } = state || fallbackState;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim().length > 2 && phone.trim().length > 7 && !isSubmitting;

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#222] to-[#111] rounded-[2rem] p-6 shadow-2xl border border-white/5 relative flex flex-col min-h-[600px] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
            ← Volver
          </button>
        </div>

        {/* Top VIP brand icon */}
        <div className="flex justify-center mt-2 mb-10">
          <div className="w-20 h-20 bg-[#1a1a1a] border-2 border-[#f2f2f2] rounded-xl flex items-center justify-center rotate-45">
            <div className="-rotate-45 text-center">
              <span className="block font-bold text-white text-2xl leading-none tracking-widest mt-1">VIP</span>
              <div className="flex justify-center gap-1 mt-1 text-white text-[10px]">
                <span>★</span><span>★</span><span>★</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Display info (optional to show what they are booking) */}
        <p className="text-[#D4AF37] text-center text-xs font-bold uppercase tracking-widest mb-6">
          {service} | {date} - {time}
        </p>

        {/* Form Fields */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <label className="text-white text-2xl font-bold tracking-wide">Nombre</label>
            <input 
              type="text" 
              placeholder="Ingresa tu Nombre" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border border-gray-400 rounded-lg py-3 px-4 text-white placeholder-white font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <label className="text-white text-2xl font-bold tracking-wide">Teléfono</label>
            <input 
              type="tel" 
              placeholder="Ingresa tu Teléfono" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-transparent border border-gray-400 rounded-lg py-3 px-4 text-white placeholder-white font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
            />
          </div>
        </div>

        <div className="flex-1"></div>

        {/* Book Button */}
        <button 
          disabled={!isValid}
          className={`w-full text-lg font-medium tracking-wider py-3.5 rounded-xl transition-all duration-300 mt-10 border-2 ${
            isValid
              ? 'border-[#5c6bc0] bg-transparent hover:bg-[#5c6bc0]/20 text-white cursor-pointer shadow-[0_0_15px_rgba(92,107,192,0.4)]' 
              : 'border-[#333] bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
          }`}
          onClick={async () => {
            setIsSubmitting(true);
            
            // 1. Guardar en Base de Datos
            try {
              await fetch('http://localhost:5000/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  nombreCliente: name,
                  telefonoCliente: phone,
                  fecha: date,
                  hora: time,
                  servicio: service,
                  profesional: pro
                })
              });
            } catch (err) {
              console.error("Error guardando en BD:", err);
            }

            // 2. Redirección a WhatsApp del Barbero
            const barberoPhone = "584141234567"; // Número del local configurado por defecto
            const message = `Hola! Agendé un servicio por PeluLink. Detalles: ${service} para el día ${date} a las ${time}.`;
            const whatsappUrl = `https://wa.me/${barberoPhone}?text=${encodeURIComponent(message)}`;
            
            setIsSubmitting(false);
            window.open(whatsappUrl, '_blank');
            navigate('/');
          }}
        >
          {isSubmitting ? 'Procesando...' : 'Agendar'}
        </button>

      </div>
    </div>
  );
}
