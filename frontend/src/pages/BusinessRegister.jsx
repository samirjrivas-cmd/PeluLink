import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MUNICIPALITIES = [
  'Mejía', 'Sucre', 'Ribero', 'Mariño', 'Cajigal', 'Benítez', 
  'Bermúdez', 'Arismendi', 'Andrés Eloy Blanco', 'Andrés Mata', 
  'Valdez', 'Libertador', 'Cruz Salmerón Acosta', 'Bolívar', 'Soublette'
];

export default function BusinessRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    municipality: 'Mejía',
    whatsapp: '',
    services: ''
  });

  const [loading, setLoading] = useState(false);
  const [finalLink, setFinalLink] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Formatear servicios como Array separándolos por coma
      const servicesArray = formData.services.split(',').map(s => s.trim()).filter(s => s);
      
      const payload = {
        ...formData,
        services: servicesArray
      };

      const res = await fetch('http://localhost:5000/api/barbershops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setFinalLink(`pelulink-app.vercel.app/${data.slug}`);
      } else {
        alert('Error al registrar negocio.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red. Verifica el backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#1a1a1a] to-[#111] rounded-3xl p-8 shadow-2xl border border-gray-800 relative z-10">
        
        <header className="mb-8">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm mb-4">
            ← Volver
          </button>
          <h2 className="text-3xl font-bold tracking-wide text-[#fcfcfc]">Registra tu Negocio</h2>
          <p className="text-[#D4AF37] font-light text-sm mt-1">Únete a PeluLink y conecta tu estilo</p>
        </header>

        {finalLink ? (
          <div className="bg-[#00c853]/10 border border-[#00c853]/30 rounded-2xl p-6 text-center animate-[fadeInUp_0.4s_ease-out]">
            <h3 className="text-[#00c853] text-xl font-bold mb-3">¡Felicidades! 🎉</h3>
            <p className="text-gray-300 text-sm mb-4">Tu negocio ha sido registrado exitosamente en la plataforma. Este es tu enlace oficial directo:</p>
            <div className="bg-[#111] border border-[#00c853]/50 p-4 rounded-xl text-lg font-bold tracking-wide mb-4 select-all cursor-pointer">
              {finalLink}
            </div>
            <button onClick={() => navigate('/')} className="text-[#D4AF37] underline font-semibold text-sm">Ir al Inicio</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-gray-300">Nombre del Negocio</label>
              <input 
                type="text" required placeholder="Ej. Barbería Vip"
                value={formData.business_name} onChange={e => setFormData({...formData, business_name: e.target.value})}
                className="bg-[#111] border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-gray-300">Nombre del Dueño / Manager</label>
              <input 
                type="text" required placeholder="Ej. Carlos Martínez"
                value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})}
                className="bg-[#111] border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold tracking-wide text-gray-300">Municipio (Sucre)</label>
                <select 
                  value={formData.municipality} onChange={e => setFormData({...formData, municipality: e.target.value})}
                  className="bg-[#111] border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-[#D4AF37] transition-all text-gray-300"
                >
                  {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold tracking-wide text-gray-300">WhatsApp</label>
                <input 
                  type="text" required placeholder="Ej. 0414 123 4567"
                  value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  className="bg-[#111] border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-gray-300">Servicios que ofreces</label>
              <textarea 
                required placeholder="Ej. Corte Clásico, Barba Tradicional, Perfilado (Separados por coma)"
                value={formData.services} onChange={e => setFormData({...formData, services: e.target.value})}
                className="bg-[#111] border border-gray-700 rounded-lg p-3 min-h-[100px] focus:outline-none focus:border-[#D4AF37] transition-all scrollbar-hide text-sm leading-relaxed"
              ></textarea>
            </div>

            <button 
              type="submit" disabled={loading}
              className={`w-full mt-4 py-4 rounded-xl text-lg font-bold tracking-wider transition-all shadow-lg ${
                loading 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
              }`}
            >
              {loading ? 'Generando plataforma...' : 'Completar Registro'}
            </button>
          </form>
        )}
      </div>
      
      {/* Subtle Background glowing orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] -z-10 mix-blend-screen pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] -z-10 mix-blend-screen pointer-events-none"></div>
    </div>
  );
}
