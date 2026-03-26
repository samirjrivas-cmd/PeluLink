import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombreLocal: '',
    direccion: '',
    telefono: '',
    fachada: null,
    barberos: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const data = new FormData();
    data.append('nombreLocal', formData.nombreLocal);
    data.append('direccion', formData.direccion);
    data.append('telefono', formData.telefono);
    if (formData.fachada) data.append('fachada', formData.fachada);
    if (formData.barberos) data.append('barberos', formData.barberos);

    try {
      const response = await fetch('http://localhost:5000/api/salons/register', {
        method: 'POST',
        body: data,
      });

      if (response.ok) {
        setMessage('¡Barbería registrada exitosamente en la base de datos!');
        setFormData({
          nombreLocal: '', direccion: '', telefono: '', fachada: null, barberos: null
        });
        e.target.reset(); // Clear file inputs
      } else {
        setMessage('Error al registrar la barbería. Revisar logs del servidor.');
      }
    } catch (error) {
      setMessage('Error de red. Asegúrate de que el backend (Express) esté encendido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#222] to-[#111] rounded-[2rem] p-8 shadow-2xl border border-[#D4AF37]/20 relative flex flex-col">
        
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Volver
          </button>
        </div>

        <h2 className="text-3xl font-bold text-center tracking-wide mb-1 text-[#fcfcfc]">Administración</h2>
        <p className="text-center text-[#D4AF37] mb-8 font-light text-xs tracking-widest uppercase">Registro de Sucursales</p>

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] text-sm text-center border border-[#D4AF37]/30">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold tracking-wide text-gray-300">Nombre del Local</label>
            <input 
              type="text" name="nombreLocal" value={formData.nombreLocal} onChange={handleChange} required
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
              placeholder="Ej. Barbería Catania"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold tracking-wide text-gray-300">Dirección Exacta</label>
            <input 
              type="text" name="direccion" value={formData.direccion} onChange={handleChange} required
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-all"
              placeholder="Ej. Calle Las Flores..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold tracking-wide text-gray-300">Teléfono (WhatsApp)</label>
            <input 
              type="tel" name="telefono" value={formData.telefono} onChange={handleChange} required
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-all"
              placeholder="Ej. 0414 123 4567"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-[#D4AF37]">1. Foto Fachada</label>
              <input 
                type="file" name="fachada" accept="image/*" onChange={handleChange} required
                className="text-xs text-gray-400 file:mr-4 file:cursor-pointer file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1a1a1a] file:text-white file:border file:border-[#D4AF37]/50 hover:file:border-[#D4AF37]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-[#D4AF37]">2. Foto Barbero</label>
              <input 
                type="file" name="barberos" accept="image/*" onChange={handleChange} required
                className="text-xs text-gray-400 file:mr-4 file:cursor-pointer file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1a1a1a] file:text-white file:border file:border-[#D4AF37]/50 hover:file:border-[#D4AF37]"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={isSubmitting}
            className={`w-full mt-8 py-3.5 rounded-xl text-lg font-bold tracking-wider transition-all shadow-lg ${
              isSubmitting 
                ? 'bg-[#333] text-gray-500 cursor-not-allowed border border-gray-700' 
                : 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-[#0a0a0a] hover:from-[#e3be47] hover:to-[#9c7a26] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] cursor-pointer'
            }`}
          >
            {isSubmitting ? 'Guardando...' : 'Registrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
