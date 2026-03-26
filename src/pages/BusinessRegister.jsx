import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

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
      const servicesArray = formData.services.split(',').map(s => s.trim()).filter(s => s);
      const slug = formData.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      // Inyección directa hacia Supabase en la Nube
      const { data, error } = await supabase
        .from('barbershops')
        .insert([
          {
            business_name: formData.business_name,
            owner_name: formData.owner_name,
            municipality: formData.municipality,
            whatsapp: formData.whatsapp,
            services: servicesArray,
            slug: slug
          }
        ]);

      if (error) {
        console.error('Supabase Error:', error);
        alert('Error en Base de Datos: ' + error.message);
      } else {
        setFinalLink(`pelulink-app.vercel.app/${slug}`);
      }
    } catch (err) {
      console.error(err);
      alert('Falla en la red o base de datos no configurada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#1a1a1a] to-[#111] rounded-3xl p-8 shadow-2xl border border-gray-800 relative z-10 transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,175,55,0.05)]">
        
        <header className="mb-8">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm mb-4 flex items-center gap-1">
            <span>←</span> Volver al inicio 
          </button>
          <h2 className="text-3xl font-bold tracking-wide text-[#fcfcfc]">Registra tu Negocio</h2>
          <p className="text-[#D4AF37] font-light text-sm mt-1">Únete a PeluLink y conecta tu estilo</p>
        </header>

        {finalLink ? (
          <div className="bg-[#00c853]/10 border border-[#00c853]/30 rounded-2xl p-6 text-center animate-[fadeInUp_0.4s_ease-out]">
            <h3 className="text-[#00c853] text-xl font-bold mb-3">¡Felicidades! 🎉</h3>
            <p className="text-gray-300 text-sm mb-4">Tu negocio ha sido registrado exitosamente en la plataforma. Este es tu enlace oficial directo:</p>
            <div className="bg-[#111] border border-[#00c853]/50 p-4 rounded-xl text-lg font-bold tracking-wide mb-6 select-all cursor-pointer text-white">
              {finalLink}
            </div>
            <button onClick={() => navigate('/')} className="text-[#D4AF37] hover:text-white transition-colors underline font-semibold text-sm">Regresar al catálogo</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-gray-300">Nombre del Negocio</label>
              <input 
                type="text" required placeholder="Ej. Barbería Vip"
                value={formData.business_name} onChange={e => setFormData({...formData, business_name: e.target.value})}
                className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-gray-300">Nombre del Dueño / Manager</label>
              <input 
                type="text" required placeholder="Ej. Carlos Martínez"
                value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})}
                className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold tracking-wide text-gray-300">Municipio (Sucre)</label>
                <select 
                  value={formData.municipality} onChange={e => setFormData({...formData, municipality: e.target.value})}
                  className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:border-[#D4AF37] transition-all"
                >
                  {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold tracking-wide text-gray-300">WhatsApp</label>
                <input 
                  type="text" required placeholder="Ej. 0414 123 4567"
                  value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-gray-300">Servicios que ofreces</label>
              <textarea 
                required placeholder="Ej. Corte Clásico, Barba Tradicional, Perfilado (Separados por coma)"
                value={formData.services} onChange={e => setFormData({...formData, services: e.target.value})}
                className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 min-h-[100px] text-white focus:outline-none focus:border-[#D4AF37] transition-all scrollbar-hide text-sm leading-relaxed"
              ></textarea>
            </div>

            <button 
              type="submit" disabled={loading}
              className={`w-full mt-4 py-4 rounded-xl text-md font-bold tracking-widest uppercase transition-all shadow-lg ${
                loading 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]'
              }`}
            >
              {loading ? 'Generando plataforma...' : 'Completar Registro'}
            </button>
          </form>
        )}
      </div>
      
      {/* Background glowing rings */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
    </div>
  );
}
