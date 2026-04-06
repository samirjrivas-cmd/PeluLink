import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function MyBookings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [latestApp, setLatestApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAppointments = async () => {
      try {
        const idFromUrl = searchParams.get('id');
        let foundApp = null;
        
        if (idFromUrl) {
          const { data, error } = await supabase
            .from('reservas')
            .select('*')
            .eq('id', idFromUrl)
            .single();
            
          if (data) {
            foundApp = {
               id: data.id,
               status: data.status === 'pendiente' ? 'Pendiente' : (data.status === 'Cancelada' ? 'Cancelada' : 'Confirmada'),
               servicio: data.servicio,
               fecha: data.fecha,
               hora: data.hora,
               profesional: data.barbero_name
            };
            localStorage.setItem('my_latest_booking', JSON.stringify(foundApp));
          }
        }

        if (!foundApp) {
          const saved = localStorage.getItem('my_latest_booking');
          if (saved) {
            foundApp = JSON.parse(saved);
          }
        }

        setLatestApp(foundApp);

      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getAppointments();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#222] to-[#111] rounded-[2rem] p-6 shadow-2xl border border-white/5 relative flex flex-col min-h-[600px] overflow-hidden">
        
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
            ← Volver
          </button>
        </div>

        {/* Top Icon Area */}
        <div className="flex justify-center mb-6">
          <svg className="w-24 h-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            
            <rect x="6" y="13" width="2.5" height="2.5" fill="none"></rect>
            <rect x="10.5" y="13" width="2.5" height="2.5" fill="none"></rect>
            <rect x="6" y="17" width="2.5" height="2.5" fill="none"></rect>
            <rect x="10.5" y="17" width="2.5" height="2.5" fill="none"></rect>

            <circle cx="16" cy="16" r="4" fill="#111" strokeWidth="1.5"></circle>
            <line x1="18.5" y1="18.5" x2="22" y2="22" strokeWidth="2"></line>
          </svg>
        </div>

        <h2 className="text-white text-2xl font-bold text-center mb-6 tracking-wide">Mis Agendas</h2>

        {loading ? (
          <p className="text-gray-400 text-center">Buscando citas...</p>
        ) : !latestApp ? (
          <p className="text-gray-500 text-center mt-6">Aún no tienes citas agendadas.</p>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* Cancelled Alert Box */}
            {latestApp.status === 'Cancelada' && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 flex items-start gap-3 shadow-[0_0_15px_rgba(220,38,38,0.2)] animate-[fadeInUp_0.5s_ease-out]">
                <div className="text-red-500 mt-0.5">⚠️</div>
                <div>
                  <h4 className="text-red-500 font-bold mb-1">Cita Cancelada</h4>
                  <p className="text-red-300 text-sm">Tu cita ha sido cancelada por el barbero. Sentimos los inconvenientes.</p>
                </div>
              </div>
            )}

            {/* Booking Card */}
            <div className={`bg-white rounded-xl p-4 flex gap-4 items-start shadow-xl transition-all ${latestApp.status === 'Cancelada' ? 'opacity-60 grayscale' : 'hover:scale-[1.02] cursor-pointer'}`}>
              <div className="text-gray-500 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="3"></line>
                  <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="3"></line>
                  <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="3"></line>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className={`font-bold text-sm mb-1 tracking-wide uppercase ${latestApp.status === 'Cancelada' ? 'text-red-600' : 'text-[#00c853]'}`}>
                  {latestApp.status}
                </span>
                <span className="text-[#0f172a] font-bold mb-1">{latestApp.servicio}</span>
                <span className="text-[#334155] text-sm">
                  {latestApp.fecha} - {latestApp.hora} <br/> con {latestApp.profesional}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
