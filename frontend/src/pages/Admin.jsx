import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all unified appointments across DBs
    const fetchApps = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/appointments');
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
    <div className="min-h-screen bg-[#070707] text-white font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-8 flex justify-between items-center border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-[#fcfcfc]">Panel de Administrador</h1>
            <p className="text-[#D4AF37] text-sm uppercase tracking-widest mt-1">Visión General del Sistema</p>
          </div>
          <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-[#111] border border-gray-700 rounded-lg hover:border-[#D4AF37] transition-all text-sm font-semibold">
            Volver al Inicio
          </button>
        </header>

        {loading ? (
          <p className="text-gray-400">Cargando la base de datos de PeluLink...</p>
        ) : (
          <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1a1a1a] text-gray-400 text-xs uppercase tracking-widest border-b border-gray-800">
                    <th className="p-4 font-semibold">ID</th>
                    <th className="p-4 font-semibold">Cliente</th>
                    <th className="p-4 font-semibold">WhatsApp</th>
                    <th className="p-4 font-semibold">Servicio</th>
                    <th className="p-4 font-semibold">Fecha y Hora</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-gray-500">Aún no hay citas registradas en tu Supabase / JSON Storage.</td>
                    </tr>
                  ) : appointments.map((app) => (
                    <tr key={app.id} className="border-b border-gray-800 hover:bg-[#151515] transition-colors">
                      <td className="p-4 text-gray-500 text-xs">{app.id?.substring(0, 8) || 'Supabase'}</td>
                      <td className="p-4 font-bold text-gray-200">{app.client_name || app.nombreCliente}</td>
                      <td className="p-4 text-[#D4AF37]">{app.whatsapp || app.telefonoCliente}</td>
                      <td className="p-4 text-gray-300">{app.service || app.servicio}</td>
                      <td className="p-4 text-gray-400">
                        {app.appointment_date 
                          ? new Date(app.appointment_date).toLocaleString() 
                          : `${app.fecha} a las ${app.hora}`}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${app.status === 'Cancelada' ? 'bg-red-500/10 text-red-500' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}`}>
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
