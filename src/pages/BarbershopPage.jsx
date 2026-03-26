import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function BarbershopPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const { data, error } = await supabase
          .from('barbershops')
          .select('*')
          .eq('slug', slug)
          .single();
          
        if (data) setShop(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center text-[#D4AF37] font-semibold tracking-widest uppercase animate-pulse">
      Cargando experiencia...
    </div>
  );
  
  if (!shop) return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center">
      <h2 className="text-3xl font-bold mb-4">Negocio no encontrado</h2>
      <button onClick={() => navigate(-1)} className="text-[#D4AF37] hover:underline">Volver atrás</button>
    </div>
  );

  // Mocked Staff based on user request referencing image_4f9260.jpg 
  const staff = [
    { name: "Luis F.", role: "Master Barber", image: "/image_4f9260.jpg" },
    { name: "Carlos M.", role: "Especialista en Barba", image: "/image_4f9260.jpg" },
    { name: "Kevin", role: "Tratamientos & Color", image: "/image_4f9260.jpg" }
  ];

  const handleWhatsApp = (barbName) => {
    const text = `Hola ${barbName}, quiero agendar mi cita en ${shop.business_name} (Mejía) por la app PeluLink!`;
    const phone = shop.whatsapp.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? '58' + phone.substring(1) : phone;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans pb-20">
      
      {/* Banner / Fachada */}
      <div className="relative h-[40vh] md:h-[50vh] w-full bg-[#111] overflow-hidden">
        <img 
          src={shop.foto_url || "/image_4f9222.jpg"} 
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2000&auto=format&fit=crop"; }}
          alt={`Fachada de ${shop.business_name}`} 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/60 to-transparent"></div>
        
        <button onClick={() => navigate('/')} className="absolute top-6 left-6 bg-black/60 border border-white/10 backdrop-blur-md p-3 px-5 rounded-full text-gray-200 hover:text-white hover:border-white/30 transition-all font-semibold text-sm">
           ← Catálogo
        </button>
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-20">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#fcfcfc] mb-2 drop-shadow-lg">{shop.business_name}</h1>
          <p className="text-[#D4AF37] font-bold text-sm md:text-lg flex items-center gap-2 uppercase tracking-widest drop-shadow-md">
            📍 {shop.municipality}, EDO SUCRE
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 mt-8">
        
        {/* Dirección y Detalle Corporativo */}
        <section className="mb-12 bg-[#111] border border-gray-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-[50px] rounded-full pointer-events-none"></div>
          
          <h2 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-800/80 pb-4">Detalles del Negocio</h2>
          <p className="text-gray-400 leading-relaxed text-sm md:text-base max-w-3xl">
            Bienvenidos a su lugar de confianza en el corazón de <strong>{shop.municipality}</strong>. 
            Representados magistralmente por <strong>{shop.owner_name}</strong>, nos comprometemos a entregarte 
            la mejor experiencia de estilismo adaptada a los estándares de Barbería premium y clásica de 
            San Antonio del Golfo.
          </p>
          
          {shop.services && shop.services.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold mb-3">Especialidades</h3>
              <div className="flex flex-wrap gap-2">
                {shop.services.map((srv, i) => (
                  <span key={i} className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#e0b93a] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">{srv}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* El Equipo */}
        <section>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800/50">
            <h2 className="text-2xl md:text-4xl font-bold text-[#fcfcfc] tracking-wide">Nuestro Equipo</h2>
            <span className="text-gray-500 font-semibold text-sm">Escoge a tu profesional</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {staff.map((barber, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-gray-800 hover:border-[#D4AF37]/50 transition-all duration-300 rounded-[2rem] p-8 flex flex-col items-center text-center group shadow-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] relative overflow-hidden">
                <div className="w-40 h-40 rounded-full overflow-hidden border-[5px] border-[#161616] group-hover:border-[#D4AF37]/80 transition-all duration-500 mb-6 relative shadow-[0_10px_20px_rgba(0,0,0,0.8)] z-10">
                  <img 
                    src={barber.image} 
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop"; }}
                    alt={barber.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-1.5 drop-shadow-md relative z-10">{barber.name}</h3>
                <p className="text-[#D4AF37] text-xs font-bold mb-8 uppercase tracking-widest relative z-10">{barber.role}</p>
                
                <button 
                  onClick={() => handleWhatsApp(barber.name)}
                  className="w-full py-3.5 bg-[#111] border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366] hover:text-black font-bold uppercase tracking-wider text-sm rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.05)] hover:shadow-[0_0_20px_rgba(37,211,102,0.3)] relative z-10"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.002 2.012c-5.508 0-9.98 4.473-9.98 9.984 0 1.748.455 3.454 1.32 4.957L2 22l5.197-1.34c1.464.814 3.12 1.246 4.805 1.246 5.506 0 9.98-4.475 9.98-9.985 0-5.51-4.474-9.984-9.98-9.984zm.006 16.516c-1.472 0-2.905-.39-4.16-1.127l-.3-.178-3.09.813.826-3.013-.196-.31c-.812-1.284-1.24-2.766-1.24-4.295 0-4.575 3.72-8.293 8.297-8.293 4.57 0 8.292 3.718 8.292 8.293 0 4.576-3.722 8.294-8.293 8.294zm4.553-6.222c-.25-.124-1.476-.726-1.705-.81-.228-.083-.396-.124-.562.124-.166.25-.644.81-.79 9.77-.145.166-.29.187-.54.062-.25-.124-1.054-.388-2.005-1.238-.74-.662-1.24-1.48-1.385-1.73-.146-.25-.016-.385.11-.51.112-.11.25-.29.375-.436.126-.146.167-.25.25-.417.084-.167.042-.313-.02-.438-.064-.124-.563-1.354-.77-1.854-.203-.49-.41-424-.562-.432-.146-.008-.313-.01-.48-.01-.166 0-.436.062-.664.312-.228.25-.873.854-.873 2.083 0 1.23.894 2.42 1.02 2.585.124.167 1.764 2.69 4.27 3.776.596.258 1.062.41 1.425.526.598.19 1.14.163 1.57.1.48-.07 1.476-.603 1.684-1.186.208-.584.208-1.084.146-1.187-.06-.104-.228-.166-.478-.29z"/></svg>
                  Reservar Ahora
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
