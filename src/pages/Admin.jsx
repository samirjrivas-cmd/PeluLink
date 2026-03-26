import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const apiUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:5000/api/appointments' 
          : '/api/appointments';
          
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setAppointments(data);
        } else {
          setAppointments([]);
        }
      } catch (err) {
        console.error('Fetch Admin Blocked:', err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans p-6 md:p-12 relative overflow-hidden">
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-[#fcfcfc]">Panel de Administrador</h1>
            <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mt-1.5">Visión General del Sistema</p>
          </div>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-[#111] border border-gray-700/50 rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all text-xs font-bold uppercase tracking-wider text-gray-300">
            Volver al Inicio
          </button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center p-20">
            <p className="text-[#D4AF37] font-medium tracking-widest uppercase text-sm animate-pulse">Sincronizando Base de Datos...</p>
          </div>
        ) : (
          <div className="bg-[#111] border border-gray-800/80 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#161616] text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-800">
                    <th className="p-5 font-semibold w-24">ID</th>
                    <th className="p-5 font-semibold">Cliente</th>
                    <th className="p-5 font-semibold">WhatsApp</th>
                    <th className="p-5 font-semibold">Servicio</th>
                    <th className="p-5 font-semibold">Fecha y Hora</th>
                    <th className="p-5 font-semibold w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <span className="text-3xl mb-2">📋</span>
                          <span className="font-semibold tracking-wide text-sm">Aún no hay citas registradas</span>
                        </div>
                      </td>
                    </tr>
                  ) : appointments.map((app) => (
                    <tr key={app.id} className="border-b border-gray-800/50 hover:bg-[#1a1a1a] transition-colors group">
                      <td className="p-5 text-gray-500 text-xs font-mono group-hover:text-gray-400">{app.id?.substring(0, 8) || 'Supabase'}</td>
                      <td className="p-5 font-bold text-gray-200 tracking-wide">{app.client_name || app.nombreCliente}</td>
                      <td className="p-5 text-[#D4AF37] font-medium">{app.whatsapp || app.telefonoCliente}</td>
                      <td className="p-5 text-gray-400">{app.service || app.servicio}</td>
                      <td className="p-5 text-gray-400 text-xs tracking-wider">
                        {app.appointment_date 
                          ? new Date(app.appointment_date).toLocaleString() 
                          : `${app.fecha} • ${app.hora}`}
                      </td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest border transition-all ${
                          app.status === 'Cancelada' 
                            ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                            : 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                        }`}>
                          {app.status || 'Confirmada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
