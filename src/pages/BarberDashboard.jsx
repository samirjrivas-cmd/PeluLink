import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BarberDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const BARBER_NAME = "Luis F.";
  const SALON_NAME = "Barbería Catania";

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments?profesional=${encodeURIComponent(BARBER_NAME)}`);
      const data = await res.json();
      setAppointments(data);
    } catch {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (app) => {
    const confirmCancel = window.confirm(`¿Seguro que deseas cancelar la cita de ${app.nombreCliente}?`);
    if (!confirmCancel) return;

    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${app.id}/cancel`, { method: 'PATCH' });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === app.id ? { ...a, status: 'Cancelada' } : a));
        
        const cleanPhone = app.telefonoCliente.replace(/\D/g, '');
        const finalPhone = cleanPhone.length <= 11 ? `58${cleanPhone.replace(/^0+/, '')}` : cleanPhone;
        
        const msg = `Hola, soy ${BARBER_NAME} de ${SALON_NAME}. Por un inconveniente, debo cancelar tu cita de las ${app.hora}. Por favor, agenda de nuevo en PeluLink o escríbeme por aquí.`;
        window.open(`https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch {
      alert('Error cancelando cita');
    }
  };

  const handleEmergencyClose = async () => {
    const confirmClose = window.confirm("CUIDADO: Esto cancelará todas las citas confirmadas de hoy y te marcará como No Disponible. ¿Proceder?");
    if (!confirmClose) return;

    setIsClosing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/cancel-all/today`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        alert(`Éxito: ${data.message}`);
        fetchAppointments(); // refresh agenda
      } else {
        alert('Hubo un error cerrando la agenda.');
      }
    } catch {
      alert('Falla al conectar con el servidor.');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center p-4 md:p-8 font-sans text-white">
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#1a1a1a] to-[#111] rounded-3xl p-6 shadow-2xl border border-white/5 relative flex flex-col">
        
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">
            ← Volver al Home
          </button>
          <div className="text-right">
            <h2 className="text-xl md:text-2xl font-bold tracking-wide text-[#fcfcfc]">Dashboard</h2>
            <p className="text-[#D4AF37] font-light text-xs tracking-widest uppercase">Hola, {BARBER_NAME}</p>
          </div>
        </div>

        {/* Emergency Button */}
        <button 
          onClick={handleEmergencyClose}
          disabled={isClosing}
          className="mb-8 w-full py-3 bg-red-600/10 border border-red-600/40 text-red-500 font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-red-600/30 hover:border-red-500 transition-all shadow-[0_0_10px_rgba(220,38,38,0.2)]"
        >
          {isClosing ? 'Cerrando Agenda...' : '🚨 Cerrar Agenda Hoy (Día Libre)'}
        </button>

        <h3 className="text-xl font-bold mb-6 tracking-wide text-gray-200">Mis Próximas Citas</h3>

        {loading ? (
          <p className="text-center text-gray-400">Cargando tu agenda...</p>
        ) : appointments.length === 0 ? (
          <p className="text-center text-gray-500 py-10">Aún no tienes citas agendadas.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {appointments.map(app => (
              <div key={app.id} className="bg-[#111] border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-4 shadow-lg hover:border-[#D4AF37]/30 transition-all">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-gray-100">{app.nombreCliente}</span>
                    <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                      app.status === 'Confirmada' ? 'bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/20' : 
                      app.status === 'Cancelada' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                      'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    }`}>
                      {app.status || 'Pendiente'}
                    </span>
                  </div>
                  <span className="text-[#D4AF37] text-sm mb-1 font-semibold">{app.servicio}</span>
                  <span className="text-gray-400 text-sm">📅 {app.fecha} • ⏰ {app.hora}</span>
                  <span className="text-gray-500 text-xs mt-1">📞 {app.telefonoCliente}</span>
                </div>
                
                <div className="flex items-center">
                  {app.status !== 'Cancelada' && (
                    <button 
                      onClick={() => handleCancel(app)}
                      className="w-full md:w-auto px-5 py-2.5 bg-transparent border border-red-500/50 hover:bg-red-500/10 text-red-400 font-bold text-xs uppercase tracking-widest rounded-lg transition-all"
                    >
                      Cancelar Cita
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
