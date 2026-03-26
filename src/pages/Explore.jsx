import React, { useState } from 'react';
import cataniaImg from '../assets/catania.jpg';
import { useNavigate } from 'react-router-dom';

const MUNICIPALITIES = [
  'Mejía', 'Sucre', 'Ribero', 'Mariño', 'Cajigal', 'Benítez', 
  'Bermúdez', 'Arismendi', 'Andrés Eloy Blanco', 'Andrés Mata', 
  'Valdez', 'Libertador', 'Cruz Salmerón Acosta', 'Bolívar', 'Soublette'
];

export default function Explore() {
  const navigate = useNavigate();
  const [selectedMuni, setSelectedMuni] = useState('Mejía');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ client_name: '', whatsapp: '', service: 'Corte Clásico', appointment_date: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barbershops = [
    {
      id: 1,
      name: "Barbería Catania",
      image: cataniaImg,
      location: "San Antonio del Golfo, Municipio Mejía",
      municipio: "Mejía",
      rating: "5.0",
      type: "Premium",
    },
    {
      id: 2,
      name: "Estudio Barber Mejía",
      image: "https://images.unsplash.com/photo-1593702275687-f8b402bf1ef5?q=80&w=800&auto=format&fit=crop",
      location: "Centro, Municipio Mejía",
      municipio: "Mejía",
      rating: "4.8",
      type: "Clásico",
    },
    {
      id: 3,
      name: "El Barbero de Oro",
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop",
      location: "San Antonio del Golfo, Municipio Mejía",
      municipio: "Mejía",
      rating: "4.9",
      type: "Moderno",
    }
  ];

  const filteredShops = barbershops.filter(s => s.municipio === selectedMuni);

  const handleQuickBook = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalData)
      });
      alert('¡Cita Rápidamente Agendada y guardada en la Base de Datos!');
      setModalOpen(false);
      navigate('/admin'); // Enviar a ver la lista del barbero para verificar
    } catch (err) {
      alert('Error contactando al servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans p-6 md:p-12 relative overflow-hidden">
      <header className="mb-10 flex flex-row items-center justify-between gap-4 relative z-50">
        <div className="cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-wide italic text-[#fcfcfc]">PeluLink</h1>
          <p className="text-[#D4AF37] font-light mt-0.5 text-xs md:text-sm">Conectando tu estilo</p>
        </div>
        
        <div className="relative w-44 md:w-56 flex-shrink-0">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full bg-[#111] border border-[#D4AF37]/50 hover:border-[#D4AF37] text-gray-200 px-4 py-2 rounded-lg flex justify-between items-center transition-colors shadow-lg"
          >
            <span className="font-medium text-sm md:text-base truncate">{selectedMuni}</span>
            <span className="text-[#D4AF37] text-[10px] ml-2 transition-transform duration-300 transform" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
          </button>
          
          {dropdownOpen && (
            <div className="absolute top-full mt-2 left-0 w-full bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden z-[60]">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest px-4 py-2.5 border-b border-gray-700/50 bg-[#111]">
                Municipios Sucre:
              </div>
              <ul className="max-h-64 overflow-y-auto scrollbar-hide">
                {MUNICIPALITIES.map(muni => (
                  <li 
                    key={muni}
                    onClick={() => {
                      setSelectedMuni(muni);
                      setDropdownOpen(false);
                    }}
                    className={`px-4 py-3 cursor-pointer text-sm font-medium border-b border-gray-800 last:border-0 transition-colors ${
                      muni === selectedMuni ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    {muni}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </header>

      {dropdownOpen && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => setDropdownOpen(false)}></div>}

      <section className="relative z-10 transition-all duration-300">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl md:text-3xl font-semibold text-gray-200">Explora en el Municipio {selectedMuni}</h2>
        </div>
        
        {filteredShops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredShops.map((shop) => (
              <div key={shop.id} className="group cursor-pointer rounded-2xl overflow-hidden bg-[#111] border border-gray-800 hover:border-[#D4AF37]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] flex flex-col">
                <div className="h-56 md:h-64 overflow-hidden relative" onClick={() => navigate('/booking')}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent z-10 opacity-80"></div>
                  <img src={shop.image} alt={shop.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 text-[#D4AF37]">
                    ★ {shop.rating}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl md:text-2xl font-bold tracking-wide text-gray-100 mb-2">{shop.name}</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed flex items-start gap-1">
                    <span className="text-[#D4AF37]">📍</span> {shop.location}
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-800/50 flex gap-3">
                    <button 
                      onClick={() => setModalOpen(true)} 
                      className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:from-[#e3be47] hover:to-[#9c7a26] text-[#0a0a0a] text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition-all duration-300 shadow-md group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                    >
                      Agendar (Rápido)
                    </button>
                    <button 
                      onClick={() => navigate('/my-bookings')}
                      className="flex-1 bg-[#1a1a1a] border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 text-[#fcfcfc] text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition-all duration-300"
                    >
                      Mis agendas
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 bg-[#111] border border-gray-800 rounded-2xl p-8 md:p-12 text-center shadow-md animate-[fadeInUp_0.3s_ease-out]">
            <div className="mb-4"><span className="text-4xl text-[#D4AF37] opacity-80">📍</span></div>
            <h3 className="text-gray-200 text-xl font-bold tracking-wide mb-3">Próximamente en este municipio.</h3>
            <p className="text-gray-400 max-w-md mx-auto leading-relaxed text-sm md:text-base">
              Aún nos estamos expandiendo. ¿Conoces alguna peluquería excepcional aquí? <br/>
              <span className="text-[#D4AF37] font-semibold cursor-pointer border-b border-[#D4AF37]/50 ml-1 hover:border-[#D4AF37] transition-colors mt-2 inline-block">Contáctanos</span>
            </p>
          </div>
        )}
      </section>

      {/* Quick Booking Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#111] border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-5 text-gray-500 hover:text-white text-xl">✕</button>
            <h3 className="text-2xl font-bold text-[#fcfcfc] mb-1">Agendamiento Rápido</h3>
            <p className="text-[#D4AF37] text-xs uppercase tracking-widest mb-6">Barbería Catania</p>

            <form onSubmit={handleQuickBook} className="flex flex-col gap-4">
              <input 
                type="text" placeholder="Nombre completo" required
                value={modalData.client_name} onChange={e => setModalData({...modalData, client_name: e.target.value})}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-all"
              />
              <input 
                type="tel" placeholder="Tu número de WhatsApp" required
                value={modalData.whatsapp} onChange={e => setModalData({...modalData, whatsapp: e.target.value})}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-all"
              />
              <select 
                value={modalData.service} onChange={e => setModalData({...modalData, service: e.target.value})}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-gray-300 focus:outline-none focus:border-[#D4AF37] transition-all"
              >
                <option>Corte Clásico</option>
                <option>Corte + Barba</option>
                <option>Diseño Premium</option>
              </select>
              <input 
                type="datetime-local" required
                value={modalData.appointment_date} onChange={e => setModalData({...modalData, appointment_date: e.target.value})}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-gray-400 focus:outline-none focus:border-[#D4AF37] transition-all"
              />
              <button 
                type="submit" disabled={isSubmitting}
                className="w-full mt-2 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-[1.02]"
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar Cita'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
