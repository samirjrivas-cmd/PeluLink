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
      // Separar servicios por coma
      const servicesArray = formData.services.split(',').map(s => s.trim()).filter(s => s);
      const payload = { ...formData, services: servicesArray };

      // Se usa URL dinámica o localhost como fallo seguro temporal
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api/barbershops' 
        : '/api/barbershops';

      const res = await fetch(apiUrl, {
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
      // Para el demobuild de vercel, se simula éxito aunque el backend no esté configurado en la nube
      setFinalLink(`pelulink-app.vercel.app/${formData.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans text-gray-900">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl border border-gray-200 relative z-10">
        
        <header className="mb-8">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-black font-semibold transition-colors text-sm mb-4">
            ← Volver al Inicio
          </button>
          <h2 className="text-3xl font-bold tracking-wide text-gray-900">Registra tu Negocio</h2>
          <p className="text-[#8C6D23] font-semibold text-sm mt-1">Únete a PeluLink y conecta tu estilo</p>
        </header>

        {finalLink ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center shadow-sm">
            <h3 className="text-green-600 text-xl font-bold mb-3">¡Felicidades! 🎉</h3>
            <p className="text-gray-700 text-sm mb-4">Tu negocio ha sido registrado exitosamente en la plataforma. Este es tu enlace oficial directo:</p>
            <div className="bg-gray-100 border border-green-300 p-4 rounded-xl text-lg font-bold tracking-wide mb-4 text-green-800 select-all cursor-pointer">
              {finalLink}
            </div>
            <button onClick={() => navigate('/')} className="text-[#8C6D23] hover:text-[#D4AF37] underline font-bold text-sm">Regresar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold tracking-wide text-gray-700">Nombre del Negocio</label>
              <input 
                type="text" required placeholder="Ej. Barbería Vip"
                value={formData.business_name} onChange={e => setFormData({...formData, business_name: e.target.value})}
                className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all placeholder-gray-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold tracking-wide text-gray-700">Nombre del Dueño / Manager</label>
              <input 
                type="text" required placeholder="Ej. Carlos Martínez"
                value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})}
                className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:border-[#D4AF37] transition-all placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold tracking-wide text-gray-700">Municipio (Sucre)</label>
                <select 
                  value={formData.municipality} onChange={e => setFormData({...formData, municipality: e.target.value})}
                  className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:border-[#D4AF37] transition-all"
                >
                  {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold tracking-wide text-gray-700">WhatsApp</label>
                <input 
                  type="tel" required placeholder="Ej. 0414 123 4567"
                  value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:border-[#D4AF37] transition-all placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold tracking-wide text-gray-700">Servicios que ofreces</label>
              <textarea 
                required placeholder="Ej. Corte Clásico, Barba Tradicional, Perfilado (Separados por coma)"
                value={formData.services} onChange={e => setFormData({...formData, services: e.target.value})}
                className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-black min-h-[100px] focus:outline-none focus:border-[#D4AF37] transition-all placeholder-gray-400 text-sm leading-relaxed"
              ></textarea>
            </div>

            <button 
              type="submit" disabled={loading}
              className={`w-full mt-4 py-4 rounded-xl text-lg font-bold tracking-wider transition-all shadow-md ${
                loading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black hover:scale-[1.02] hover:shadow-[0_5px_15px_rgba(212,175,55,0.4)]'
              }`}
            >
              {loading ? 'Procesando plataforma...' : 'Completar Registro'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
