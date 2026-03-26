import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const MUNICIPALITIES = [
  'Todos los Municipios', 'Mejía', 'Sucre', 'Ribero', 'Mariño', 'Cajigal', 
  'Benítez', 'Bermúdez', 'Arismendi', 'Andrés Eloy Blanco', 'Andrés Mata', 
  'Valdez', 'Libertador', 'Cruz Salmerón Acosta', 'Bolívar', 'Soublette'
];

export default function Explore() {
  const navigate = useNavigate();
  const [selectedMuni, setSelectedMuni] = useState('Todos los Municipios');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [barbershops, setBarbershops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data, error } = await supabase
          .from('barbershops')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data) setBarbershops(data);
        if (error) console.error('Supabase fetch error:', error);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const filteredShops = selectedMuni === 'Todos los Municipios'
    ? barbershops
    : barbershops.filter(s => s.municipality === selectedMuni);

  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans p-6 md:p-12 relative overflow-hidden">
      
      {/* Luces de Fondo */}
      <div className="fixed top-[-10%] left-[20%] w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      <header className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6 relative z-50">
        <div className="cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight italic text-[#fcfcfc]">PeluLink</h1>
          <p className="text-[#D4AF37] font-semibold tracking-widest uppercase mt-1 text-[10px] md:text-sm">La Plaza Mayor de Sucre</p>
        </div>
        
        {/* Custom Dropdown for Municipality */}
        <div className="relative w-full md:w-64 flex-shrink-0">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full bg-[#111] border border-[#D4AF37]/50 hover:border-[#D4AF37] text-gray-200 px-5 py-3 rounded-xl flex justify-between items-center transition-all shadow-lg"
          >
            <span className="font-bold text-sm md:text-base truncate tracking-wide">{selectedMuni}</span>
            <span className="text-[#D4AF37] text-[10px] ml-2 transition-transform duration-300 transform" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
          </button>
          
          {dropdownOpen && (
            <div className="absolute top-full mt-2 left-0 w-full bg-[#1a1a1a] border border-gray-700/80 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.9)] overflow-hidden z-[60]">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-5 py-3 border-b border-gray-800 bg-[#111]">
                Filtrar por Municipio:
              </div>
              <ul className="max-h-64 overflow-y-auto custom-scrollbar">
                {MUNICIPALITIES.map(muni => (
                  <li 
                    key={muni}
                    onClick={() => {
                      setSelectedMuni(muni);
                      setDropdownOpen(false);
                    }}
                    className={`px-5 py-3.5 cursor-pointer text-sm font-bold border-b border-gray-800/50 last:border-0 transition-colors tracking-wide ${
                      muni === selectedMuni 
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37]' 
                        : 'hover:bg-[#111] text-gray-300'
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

      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setDropdownOpen(false)}
        ></div>
      )}

      <section className="relative z-10 transition-all duration-500">
        <h2 className="text-xl md:text-3xl font-bold mb-10 text-gray-200 border-b border-[#D4AF37]/20 pb-4 inline-block">
          {selectedMuni === 'Todos los Municipios' ? 'Todas las Barberías' : `Explora en ${selectedMuni}`}
        </h2>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#D4AF37] font-bold tracking-widest text-xs uppercase animate-pulse">Cargando Catálogo de Supabase...</p>
          </div>
        ) : filteredShops.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredShops.map((shop) => (
              <div 
                key={shop.id} 
                onClick={() => navigate(`/${shop.slug}`)}
                className="group cursor-pointer rounded-3xl overflow-hidden bg-[#111] border border-gray-800 hover:border-[#D4AF37]/80 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)] flex flex-col hover:-translate-y-1 relative"
              >
                <div className="h-56 md:h-60 overflow-hidden relative border-b border-gray-800/50 group-hover:border-[#D4AF37]/30 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/30 to-transparent z-10 opacity-90"></div>
                  <img 
                    src={shop.foto_url || "/image_4f9222.jpg"} 
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=800&auto=format&fit=crop"; }}
                    alt={shop.business_name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  />
                  <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-[#D4AF37]/30 flex items-center gap-1 text-[#D4AF37]">
                    DESTACADO
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col relative z-20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#D4AF37] text-xs">📍</span>
                    <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">{shop.municipality}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-3 group-hover:text-[#D4AF37] transition-colors">{shop.business_name}</h3>
                  <p className="text-gray-400 text-xs mb-6 font-medium uppercase tracking-wider">Por {shop.owner_name}</p>
                  
                  <div className="mt-auto flex justify-between items-center pt-5 border-t border-gray-800/80">
                    <span className="text-gray-500 text-xs font-bold tracking-wider">VER BARBEROS</span>
                    <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-colors">
                      →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 bg-[#111] border border-gray-800 rounded-[2rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-[40px] rounded-full pointer-events-none"></div>
            <div className="mb-6"><span className="text-5xl text-[#D4AF37] opacity-90 drop-shadow-md">📍</span></div>
            <h3 className="text-gray-200 text-2xl md:text-3xl font-bold tracking-wide mb-4">Próximamente en {selectedMuni === 'Todos los Municipios' ? 'esta región' : selectedMuni}.</h3>
            <p className="text-gray-400 max-w-lg mx-auto leading-relaxed text-sm md:text-base font-medium">
              Aún nos estamos expandiendo en este territorio. Si eres dueño de una barbería excepcional, 
              o conoces la mejor de la zona, <span onClick={(e) => { e.stopPropagation(); navigate('/registro-negocio'); }} className="text-[#D4AF37] cursor-pointer hover:underline">registra el negocio gratis</span> en apenas un minuto.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
