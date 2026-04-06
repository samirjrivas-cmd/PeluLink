import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Agenda() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAgendaData = async () => {
      try {
        const [{ data: shopsData }, { data: reservasData }] = await Promise.all([
          supabase.from('barbershops').select('id, business_name, slug, municipality'),
          supabase.from('reservas').select('*').order('fecha', { ascending: false }).order('hora', { ascending: true })
        ]);
        
        let shopsMap = {};
        if (shopsData) {
          shopsData.forEach(s => { shopsMap[s.id] = s });
        }
        
        if (reservasData) {
          const mapped = reservasData.map(r => ({
            ...r,
            barberia_name: shopsMap[r.barberia_id]?.business_name || 'Desconocida',
            barberia_slug: shopsMap[r.barberia_id]?.slug || '',
            barberia_municipality: shopsMap[r.barberia_id]?.municipality || 'Desconocida'
          }));

          const todayStr = new Date().toISOString().split('T')[0];
          mapped.sort((a, b) => {
            const aFuture = a.fecha >= todayStr;
            const bFuture = b.fecha >= todayStr;

            if (aFuture !== bFuture) {
              return aFuture ? -1 : 1; 
            }

            if (aFuture) {
              if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha); 
              return a.hora.localeCompare(b.hora); 
            } else {
              if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha); 
              return b.hora.localeCompare(a.hora); 
            }
          });

          setReservations(mapped);
        }
      } catch (err) {
        console.error('Fetch Agenda Blocked:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgendaData();
  }, []);

  const filtered = reservations.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      r.barberia_name?.toLowerCase().includes(term) ||
      r.barbero_name?.toLowerCase().includes(term) ||
      r.cliente_nombre?.toLowerCase().includes(term) ||
      r.fecha?.includes(term)
    );
  });

  const getWaMessage = (res) => {
    return `💈 ¡Hola, *${res.cliente_nombre}*! 
Tu cita en ${res.barberia_name} está confirmada ✅

📅 Fecha: ${res.fecha}
⏰ Horario: ${res.hora}
✂ Profesional: ${res.barbero_name}
💆‍♂️ Servicio: ${res.servicio}
📍 Dirección: ${res.barberia_municipality}

🔗 Consulta tu cita aquí:
👉 pelulink-app.vercel.app/${res.barberia_slug}

¡Agradecemos tu preferencia y estaremos listos para atenderte!
😃 ✂`;
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans p-4 md:p-12 relative overflow-hidden">
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-[#fcfcfc]">Mi Agenda</h1>
            <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mt-1.5">Gestión de Citas para Peluqueros</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text"
              placeholder="🔍 Filtrar por Barbería (Ej. Catania), Barbero o Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#111] border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#D4AF37] transition-all min-w-[300px]"
            />
            <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-[#111] border border-gray-700/50 rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all text-xs font-bold uppercase tracking-wider text-gray-300">
              Volver al Inicio
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center p-20">
            <p className="text-[#D4AF37] font-medium tracking-widest uppercase text-sm animate-pulse">Sincronizando Reservas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-[#111] rounded-2xl border border-gray-800">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <span className="text-3xl mb-2">📋</span>
              <span className="font-semibold tracking-wide text-sm">No hay reservas que coincidan con la búsqueda.</span>
            </div>
          </div>
        ) : (
          <>
            {/* VISTA MÓVIL: TARJETAS */}
            <div className="md:hidden flex flex-col gap-4">
              {filtered.map(res => (
                <div key={res.id} className="bg-[#111] p-5 rounded-2xl border border-gray-800 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 blur-2xl rounded-full"></div>
                  <div className="flex justify-between items-start mb-3 border-b border-gray-800/80 pb-3">
                     <div>
                        <h3 className="font-bold text-lg text-white">{res.cliente_nombre}</h3>
                        <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest mt-1">{res.barberia_name} • {res.barbero_name}</p>
                     </div>
                     <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider whitespace-nowrap ${res.status === 'Confirmada' ? 'bg-[#00c853]/10 text-[#00c853]' : 'bg-orange-500/10 text-orange-400'}`}>
                       {res.status || 'Pendiente'}
                     </span>
                  </div>
                  
                  <div className="text-gray-400 text-sm mb-5 grid grid-cols-2 gap-2">
                     <div className="bg-[#0a0a0a] p-2 rounded-lg border border-gray-800 text-center">
                       <span className="block text-xs uppercase tracking-widest opacity-60 mb-1">Fecha</span>
                       <span className="font-semibold text-white">{res.fecha}</span>
                     </div>
                     <div className="bg-[#0a0a0a] p-2 rounded-lg border border-gray-800 text-center">
                       <span className="block text-xs uppercase tracking-widest opacity-60 mb-1">Hora</span>
                       <span className="font-semibold text-[#D4AF37]">{res.hora}</span>
                     </div>
                     <div className="bg-[#0a0a0a] p-2 rounded-lg border border-gray-800 text-center col-span-2">
                       <span className="block text-xs uppercase tracking-widest opacity-60 mb-1">Servicio</span>
                       <span className="font-semibold text-gray-200">{res.servicio}</span>
                     </div>
                  </div>
                  
                  <a 
                    href={`https://wa.me/${res.cliente_telefono}?text=${encodeURIComponent(getWaMessage(res))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#25D366] to-[#1DA851] text-black font-black text-base uppercase tracking-wider py-4 mt-2 rounded-xl transition-all shadow-[0_0_15px_rgba(37,211,102,0.2)] hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-[1.02]"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12.002 2.012c-5.508 0-9.98 4.473-9.98 9.984 0 1.748.455 3.454 1.32 4.957L2 22l5.197-1.34c1.464.814 3.12 1.246 4.805 1.246 5.506 0 9.98-4.475 9.98-9.985 0-5.51-4.474-9.984-9.98-9.984zm.006 16.516c-1.472 0-2.905-.39-4.16-1.127l-.3-.178-3.09.813.826-3.013-.196-.31c-.812-1.284-1.24-2.766-1.24-4.295 0-4.575 3.72-8.293 8.297-8.293 4.57 0 8.292 3.718 8.292 8.293 0 4.576-3.722 8.294-8.293 8.294zm4.553-6.222c-.25-.124-1.476-.726-1.705-.81-.228-.083-.396-.124-.562.124-.166.25-.644.81-.79 9.77-.145.166-.29.187-.54.062-.25-.124-1.054-.388-2.005-1.238-.74-.662-1.24-1.48-1.385-1.73-.146-.25-.016-.385.11-.51.112-.11.25-.29.375-.436.126-.146.167-.25.25-.417.084-.167.042-.313-.02-.438-.064-.124-.563-1.354-.77-1.854-.203-.49-.41-424-.562-.432-.146-.008-.313-.01-.48-.01-.166 0-.436.062-.664.312-.228.25-.873.854-.873 2.083 0 1.23.894 2.42 1.02 2.585.124.167 1.764 2.69 4.27 3.776.596.258 1.062.41 1.425.526.598.19 1.14.163 1.57.1.48-.07 1.476-.603 1.684-1.186.208-.584.208-1.084.146-1.187-.06-.104-.228-.166-.478-.29z"/></svg>
                    Contactar Cliente
                  </a>
                </div>
              ))}
            </div>

            {/* VISTA ESCRITORIO: TABLA */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar bg-[#111] border border-gray-800/80 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#161616] text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-800">
                    <th className="p-5 font-semibold">Cliente / Teléfono</th>
                    <th className="p-5 font-semibold">Servicio</th>
                    <th className="p-5 font-semibold text-center">Fecha / Hora</th>
                    <th className="p-5 font-semibold">Barbería / Profesional</th>
                    <th className="p-5 font-semibold w-32">Estado</th>
                    <th className="p-5 font-semibold text-center w-44">Acción (Chat)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtered.map(res => (
                    <tr key={res.id} className="border-b border-gray-800/50 hover:bg-[#1a1a1a] transition-colors group">
                      <td className="p-5">
                        <div className="font-bold text-gray-200">{res.cliente_nombre}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-1 opacity-80">{res.cliente_telefono}</div>
                      </td>
                      <td className="p-5 text-gray-400 font-medium">{res.servicio}</td>
                      <td className="p-5 text-center">
                        <div className="text-gray-300 font-semibold">{res.fecha}</div>
                        <div className="text-[10px] text-[#D4AF37] font-black tracking-widest mt-1 bg-[#D4AF37]/10 inline-block px-2 py-0.5 rounded">{res.hora}</div>
                      </td>
                      <td className="p-5">
                        <div className="font-bold text-[#fcfcfc]">{res.barberia_name}</div>
                        <div className="text-[10px] text-gray-500 uppercase mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                          {res.barbero_name}
                        </div>
                      </td>
                      <td className="p-5 text-xs">
                        <span className={`px-2 py-1 rounded font-bold uppercase tracking-wider ${res.status === 'Confirmada' ? 'bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                          {res.status || 'Pendiente'}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <a 
                          href={`https://wa.me/${res.cliente_telefono}?text=${encodeURIComponent(getWaMessage(res))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366] hover:text-black font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12.002 2.012c-5.508 0-9.98 4.473-9.98 9.984 0 1.748.455 3.454 1.32 4.957L2 22l5.197-1.34c1.464.814 3.12 1.246 4.805 1.246 5.506 0 9.98-4.475 9.98-9.985 0-5.51-4.474-9.984-9.98-9.984zm.006 16.516c-1.472 0-2.905-.39-4.16-1.127l-.3-.178-3.09.813.826-3.013-.196-.31c-.812-1.284-1.24-2.766-1.24-4.295 0-4.575 3.72-8.293 8.297-8.293 4.57 0 8.292 3.718 8.292 8.293 0 4.576-3.722 8.294-8.293 8.294zm4.553-6.222c-.25-.124-1.476-.726-1.705-.81-.228-.083-.396-.124-.562.124-.166.25-.644.81-.79 9.77-.145.166-.29.187-.54.062-.25-.124-1.054-.388-2.005-1.238-.74-.662-1.24-1.48-1.385-1.73-.146-.25-.016-.385.11-.51.112-.11.25-.29.375-.436.126-.146.167-.25.25-.417.084-.167.042-.313-.02-.438-.064-.124-.563-1.354-.77-1.854-.203-.49-.41-424-.562-.432-.146-.008-.313-.01-.48-.01-.166 0-.436.062-.664.312-.228.25-.873.854-.873 2.083 0 1.23.894 2.42 1.02 2.585.124.167 1.764 2.69 4.27 3.776.596.258 1.062.41 1.425.526.598.19 1.14.163 1.57.1.48-.07 1.476-.603 1.684-1.186.208-.584.208-1.084.146-1.187-.06-.104-.228-.166-.478-.29z"/></svg>
                          Escribir
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
