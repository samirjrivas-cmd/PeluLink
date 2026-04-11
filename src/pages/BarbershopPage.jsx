import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

/* =====================================================
   FUNCIÓN UNIVERSAL DE NORMALIZACIÓN DE HORARIOS
   Convierte CUALQUIER formato de hora a una forma canónica.
   
   Maneja DOS formatos de entrada:
   1) Formato UI (12h):  "09:00 AM" → "9:00 AM"
   2) Formato DB (24h):  "09:00:00" → "9:00 AM", "13:00:00" → "1:00 PM"
   
   Siempre devuelve: "H:MM AM/PM" (sin cero inicial)
   ===================================================== */
function normalizeHora(raw) {
  if (!raw) return '';
  let t = String(raw).trim();

  // CASO 1: Formato 24h de Supabase (ej: "09:00:00", "13:00:00", "09:00")
  // Detectar si NO tiene AM/PM → es formato 24h
  if (!/am|pm/i.test(t)) {
    const parts = t.split(':');
    let hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10) || 0;
    
    if (isNaN(hours)) return '';
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    if (hours === 0) hours = 12;        // medianoche → 12 AM
    else if (hours > 12) hours -= 12;   // 13→1, 14→2, etc.
    
    return `${hours}:${String(mins).padStart(2, '0')} ${ampm}`;
  }
  
  // CASO 2: Ya tiene AM/PM (viene del UI, ej: "09:00 AM")
  t = t.toUpperCase().replace(/\s+/g, ' ');
  // Quitar cero inicial: "09:00 AM" → "9:00 AM"
  if (/^0\d:/.test(t)) t = t.substring(1);
  return t;
}

export default function BarbershopPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [step, setStep] = useState(1);
  const [confirmedBookingId, setConfirmedBookingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [reservasOcupadas, setReservasOcupadas] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!selectedBarber || !selectedDate || !shop) {
      setReservasOcupadas([]);
      return;
    }

    const fetchReservasOcupadas = async () => {
      setLoadingSlots(true);
      try {
        const { data, error } = await supabase
          .from('reservas')
          .select('hora, status')
          .eq('barberia_id', shop.id)
          .eq('barbero_name', selectedBarber.name)
          .eq('fecha', selectedDate);

        if (error) {
          console.error('[PeluLink] Error al buscar reservas:', error);
          setReservasOcupadas([]);
          setLoadingSlots(false);
          return;
        }

        if (data && data.length > 0) {
          // Log raw data from DB for debugging
          console.log('[PeluLink] Reservas RAW de Supabase:', data);

          // Filter only active reservations (not cancelled/rejected)
          const activasRaw = data.filter(r => {
            if (!r.status) return true; // sin status = activa
            const s = String(r.status).toLowerCase().trim();
            // Excluir SOLO las canceladas y rechazadas
            if (s === 'cancelada' || s === 'rechazada') return false;
            return true;
          });

          // Normalize each hora using the universal function
          const horasOcupadas = activasRaw
            .map(r => normalizeHora(r.hora))
            .filter(h => h !== '');

          console.log('[PeluLink] ✅ HORAS OCUPADAS para', selectedBarber.name, 'el', selectedDate, ':', horasOcupadas);

          setReservasOcupadas(horasOcupadas);

          // If user previously selected a time that is now booked, clear it
          if (selectedTime && horasOcupadas.some(h => h === normalizeHora(selectedTime))) {
            console.log('[PeluLink] ⚠️ Limpiando selectedTime porque', selectedTime, 'ya está ocupado');
            setSelectedTime('');
          }
        } else {
          console.log('[PeluLink] No hay reservas para', selectedBarber.name, 'el', selectedDate);
          setReservasOcupadas([]);
        }
      } catch (err) {
        console.error('[PeluLink] Error inesperado:', err);
        setReservasOcupadas([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchReservasOcupadas();

    // Real-time listener
    const channel = supabase
      .channel(`reservas-${shop.id}-${selectedBarber.name}-${selectedDate}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas', filter: `barberia_id=eq.${shop.id}` }, (payload) => {
         const resData = payload.new || payload.old;
         if (resData && resData.barbero_name === selectedBarber.name && resData.fecha === selectedDate) {
            console.log('[PeluLink] 🔄 Cambio en tiempo real detectado, re-fetching...');
            fetchReservasOcupadas();
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBarber, selectedDate, shop]);

  useEffect(() => {
    const fetchShopAndStaff = async () => {
      try {
        const { data: shopData } = await supabase
          .from('barbershops')
          .select('*')
          .eq('slug', slug)
          .single();
          
        if (shopData) {
          setShop(shopData);

          // Fetch Staff (Profesionales)
          const { data: staffData } = await supabase
            .from('barberos')
            .select('*')
            .eq('barberia_id', shopData.id);
            
          if (staffData && staffData.length > 0) {
            setStaff(staffData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShopAndStaff();
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

  // Helper arrays for the calendar
  const nextDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 9; h <= 20; h++) {
      for (let m = 0; m < 60; m += 20) {
        if (h === 20 && m > 0) break;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        slots.push(`${String(displayHour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`);
      }
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  const getDayName = (dateStr) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const d = new Date(dateStr + 'T12:00:00');
    return days[d.getDay()];
  };

  const isTimeSlotPast = (slotStr, selectedDateStr) => {
    if (!selectedDateStr) return false;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Si es un día del futuro, no bloqueamos nada
    if (selectedDateStr > todayStr) return false;
    // Si es un día del pasado, lo bloqueamos todo
    if (selectedDateStr < todayStr) return true;

    // Es HOY, procedemos a comparar hora por hora
    const match = slotStr.match(/(\d+):(\d+)\s(AM|PM)/);
    if (!match) return false;

    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const ampm = match[3];

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const nowHours = today.getHours();
    const nowMins = today.getMinutes();

    const slotTotalMins = hours * 60 + mins;
    const nowTotalMins = nowHours * 60 + nowMins;

    // Margen de cortesía: 30 minutos
    return slotTotalMins <= (nowTotalMins + 30);
  };

  const handleOpenModal = (barber) => {
    setSelectedBarber(barber);
    setStep(1);
    setSelectedDate('');
    setSelectedTime('');
    setClientName('');
    setClientPhone('');
  };

  const cleanPhone = (phone) => {
    if (!phone) return '';
    let cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (!cleaned.startsWith('58')) cleaned = '58' + cleaned;
    return cleaned;
  };

  const handleBookAppointment = async () => {
    if (!clientName || !clientPhone) return;
    setBookingLoading(true);

    try {
      const sanitizedClientPhone = cleanPhone(clientPhone);

      // Double-booking check: ensure the slot is still free for this barber
      const { data: existingSlot, error: checkError } = await supabase
        .from('reservas')
        .select('id, status')
        .eq('barbero_name', selectedBarber.name)
        .eq('fecha', selectedDate)
        .eq('hora', selectedTime)
        .eq('barberia_id', shop.id)
        .neq('status', 'Cancelada')
        .neq('status', 'Rechazada');

      if (checkError) {
        console.error("Error during double-booking check:", checkError);
      }

      if (existingSlot && existingSlot.length > 0) {
        alert('¡Lo sentimos! Este horario ya no está disponible, otro cliente lo acaba de reservar.');
        // Re-fetch booked slots so UI updates
        setStep(1); 
        setBookingLoading(false);
        return;
      }

      // 1. Guardar en Supabase
      const { data: insertedData, error } = await supabase
        .from('reservas')
        .insert([
          {
            barberia_id: shop.id,
            barbero_name: selectedBarber.name,
            fecha: selectedDate,
            hora: selectedTime,
            cliente_nombre: clientName,
            cliente_telefono: sanitizedClientPhone,
            servicio: selectedService,
            status: 'Confirmada'
          }
        ]).select();

      if (error) {
        alert('Hubo un error al guardar tu reserva: ' + error.message);
        setBookingLoading(false);
        return;
      }

      // 2. Transición a Pantalla de Confirmación
      if (insertedData && insertedData.length > 0) {
        setConfirmedBookingId(insertedData[0].id);
        setStep(3);
      } else {
        alert('Reserva guardada, pero no pudimos recuperar el ID');
        setSelectedBarber(null);
      }

    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans pb-20 relative">
      <div className="relative h-[40vh] md:h-[50vh] w-full bg-[#111] overflow-hidden">
        <img 
          src={shop.foto_url || "/image_4f9222.jpg"} 
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2000&auto=format&fit=crop"; }}
          alt={`Fachada de ${shop.business_name}`} 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/60 to-transparent"></div>
        
        <button onClick={() => navigate('/explore')} className="absolute top-6 left-6 bg-black/60 border border-white/10 backdrop-blur-md p-3 px-5 rounded-full text-gray-200 hover:text-white hover:border-white/30 transition-all font-semibold text-sm z-50">
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
        <section className="mb-12 bg-[#111] border border-gray-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-[50px] rounded-full pointer-events-none"></div>
          <h2 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-800/80 pb-4">Detalles del Negocio</h2>
          <p className="text-gray-400 leading-relaxed text-sm md:text-base max-w-3xl">
            Bienvenidos  a nuestro local en <strong>{shop.municipality}</strong>. 
            Directamente administrado por <strong>{shop.owner_name}</strong>.
          </p>
          {shop.services && shop.services.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold mb-3">Especialidades</h3>
              <div className="flex flex-wrap gap-2">
                {shop.services.map((srv, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedService(srv)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed ${
                      selectedService === srv 
                        ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-105' 
                        : 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#e0b93a] hover:bg-[#D4AF37]/20 hover:scale-105'
                    }`}
                  >
                    {srv}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800/50">
            <h2 className="text-2xl md:text-4xl font-bold text-[#fcfcfc] tracking-wide">Nuestro Equipo</h2>
            <span className="text-gray-500 font-semibold text-sm hidden sm:inline-block">Escoge a tu profesional</span>
          </div>
          
          {staff.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-gray-800 rounded-3xl text-gray-500">
               El negocio aún no ha añadido profesionales a su catálogo online.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {staff.map((barber) => (
                <div key={barber.id} className="bg-[#0a0a0a] border border-gray-800 hover:border-[#D4AF37]/50 transition-all duration-300 rounded-[2rem] p-8 flex flex-col items-center text-center group shadow-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] relative overflow-hidden">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-[5px] border-[#161616] group-hover:border-[#D4AF37]/80 transition-all duration-500 mb-6 relative shadow-[0_10px_20px_rgba(0,0,0,0.8)] z-10">
                    <img 
                      src={barber.foto_url || "/image_4f9260.jpg"} 
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop"; }}
                      alt={barber.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-1.5 drop-shadow-md relative z-10">{barber.name}</h3>
                  <p className="text-[#D4AF37] text-xs font-bold mb-8 uppercase tracking-widest relative z-10">{barber.role}</p>
                  
                  <button 
                    disabled={!selectedService}
                    onClick={() => handleOpenModal(barber)}
                    className={`w-full py-3.5 border font-bold uppercase tracking-wider text-sm rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${
                      selectedService
                        ? 'bg-[#111] border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366] hover:text-black shadow-[0_0_15px_rgba(37,211,102,0.05)] hover:shadow-[0_0_20px_rgba(37,211,102,0.3)]'
                        : 'bg-[#1a1a1a] border-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12.002 2.012c-5.508 0-9.98 4.473-9.98 9.984 0 1.748.455 3.454 1.32 4.957L2 22l5.197-1.34c1.464.814 3.12 1.246 4.805 1.246 5.506 0 9.98-4.475 9.98-9.985 0-5.51-4.474-9.984-9.98-9.984zm.006 16.516c-1.472 0-2.905-.39-4.16-1.127l-.3-.178-3.09.813.826-3.013-.196-.31c-.812-1.284-1.24-2.766-1.24-4.295 0-4.575 3.72-8.293 8.297-8.293 4.57 0 8.292 3.718 8.292 8.293 0 4.576-3.722 8.294-8.293 8.294zm4.553-6.222c-.25-.124-1.476-.726-1.705-.81-.228-.083-.396-.124-.562.124-.166.25-.644.81-.79 9.77-.145.166-.29.187-.54.062-.25-.124-1.054-.388-2.005-1.238-.74-.662-1.24-1.48-1.385-1.73-.146-.25-.016-.385.11-.51.112-.11.25-.29.375-.436.126-.146.167-.25.25-.417.084-.167.042-.313-.02-.438-.064-.124-.563-1.354-.77-1.854-.203-.49-.41-424-.562-.432-.146-.008-.313-.01-.48-.01-.166 0-.436.062-.664.312-.228.25-.873.854-.873 2.083 0 1.23.894 2.42 1.02 2.585.124.167 1.764 2.69 4.27 3.776.596.258 1.062.41 1.425.526.598.19 1.14.163 1.57.1.48-.07 1.476-.603 1.684-1.186.208-.584.208-1.084.146-1.187-.06-.104-.228-.166-.478-.29z"/></svg>
                    <span className="truncate">{selectedService ? 'Reservar Ahora' : 'Elige un servicio'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODAL DE RESERVA */}
      {selectedBarber && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-0 animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-[#111] border border-gray-700 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {step !== 3 && (
              <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#151515]">
                <div>
                  <h3 className="text-xl font-bold text-white">Reserva con {selectedBarber.name}</h3>
                  <p className="text-[#D4AF37] text-xs font-semibold tracking-wider uppercase mt-1">Paso {step} de 2</p>
                </div>
                <button onClick={() => setSelectedBarber(null)} className="text-gray-500 hover:text-white p-2">✕</button>
              </div>
            )}

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {step === 1 && (
                <div className="animate-[slideIn_0.3s_ease-out]">
                  <h4 className="text-sm text-gray-400 font-bold tracking-widest uppercase mb-4">Elige tu Día</h4>
                  <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar mb-8">
                    {nextDays.map(date => (
                      <button 
                        key={date}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime('');
                        }}
                        className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl border transition-all ${
                          selectedDate === date ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-[#1a1a1a] border-gray-700 text-gray-300 hover:border-[#D4AF37]/50'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{getDayName(date)}</span>
                        <span className="text-xl font-black mt-1">{date.split('-')[2]}</span>
                      </button>
                    ))}
                  </div>

                  <h4 className="text-sm text-gray-400 font-bold tracking-widest uppercase mb-4">
                    Horarios Disponibles
                  </h4>
                  {loadingSlots ? (
                    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-800 rounded-xl">
                      <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-sm text-[#D4AF37] font-bold tracking-widest uppercase animate-pulse">Sincronizando Agenda...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {timeSlots.map(time => {
                        const horaBtn = normalizeHora(time);
                        const isPast = isTimeSlotPast(time, selectedDate);
                        const isOcupado = reservasOcupadas.some(h => h === horaBtn);
                        const isDisabled = isOcupado || isPast;
                        
                        return (
                          <button 
                            key={time}
                            disabled={isDisabled}
                            onClick={() => {
                              if (isDisabled) return; // extra safety
                              setSelectedTime(time);
                            }}
                            style={isDisabled ? {
                              backgroundColor: '#222',
                              color: '#666',
                              opacity: 0.5,
                              pointerEvents: 'none',
                              cursor: 'not-allowed',
                              borderColor: '#333'
                            } : undefined}
                            className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                              isDisabled 
                                ? ''
                                : selectedTime === time 
                                  ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                                  : 'bg-[#1a1a1a] border-gray-700 text-gray-300 hover:border-[#D4AF37]/50 hover:bg-[#222]'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="animate-[slideIn_0.3s_ease-out] flex flex-col gap-5">
                  <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-400">
                      Cita el <strong className="text-white">{selectedDate}</strong> a las <strong className="text-[#D4AF37]">{selectedTime}</strong>
                    </div>
                    <button onClick={() => setStep(1)} className="text-[#D4AF37] text-xs underline font-bold">Cambiar</button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold tracking-wide text-gray-400">Tu Nombre Completo</label>
                    <input 
                      type="text" required placeholder="Ej. Juan Pérez"
                      value={clientName} onChange={e => setClientName(e.target.value)}
                      className="bg-[#0a0a0a] border border-gray-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold tracking-wide text-gray-400">Tu Número de WhatsApp</label>
                    <input 
                      type="tel" required placeholder="Ej. +584265822230"
                      value={clientPhone} onChange={e => {
                        let val = e.target.value;
                        if (val.startsWith('0')) {
                          val = '+58' + val.substring(1);
                        }
                        setClientPhone(val);
                      }}
                      className="bg-[#0a0a0a] border border-gray-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all font-medium"
                    />
                    {clientPhone && !clientPhone.startsWith('+58') && (
                      <p className="text-xs text-orange-400 font-medium">Usa formato internacional (ej. +58)</p>
                    )}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="animate-[fadeIn_0.5s_ease-out] flex flex-col items-center justify-center py-6 text-center gap-5">
                  <div className="w-20 h-20 bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] flex items-center justify-center rounded-full text-4xl mb-2 animate-bounce">
                    ✅
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black text-white px-2 tracking-tight">¡Reserva Confirmada!</h3>
                  <p className="text-gray-400 font-medium px-4 max-w-[280px] leading-relaxed">
                    Gracias por reservar con <strong className="text-white">{shop.business_name}</strong> a través de PeluLink.
                  </p>
                  
                  <div className="w-full mt-4 px-2">
                    <button 
                      onClick={() => navigate(`/my-bookings?id=${confirmedBookingId}`)}
                      className="w-full py-4 rounded-xl text-sm font-black tracking-widest uppercase transition-all shadow-lg bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
                    >
                      VER MI RESERVA
                    </button>
                  </div>
                </div>
              )}
            </div>

            {step !== 3 && (
              <div className="p-6 border-t border-gray-800 bg-[#151515]">
              {step === 1 ? (
                <button 
                  disabled={!selectedDate || !selectedTime || loadingSlots || reservasOcupadas.some(h => h === normalizeHora(selectedTime))}
                  onClick={() => setStep(2)}
                  className={`w-full py-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all shadow-lg ${
                    (!loadingSlots && selectedDate && selectedTime && !reservasOcupadas.some(h => h === normalizeHora(selectedTime)))
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                  }`}
                >
                  Continuar
                </button>
              ) : (
                <button 
                  disabled={!clientName || !clientPhone || bookingLoading}
                  onClick={handleBookAppointment}
                  className={`w-full py-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all shadow-lg flex justify-center items-center gap-2 ${
                    clientName && clientPhone && !bookingLoading
                      ? 'bg-[#25D366] text-black hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(37,211,102,0.4)]'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                  }`}
                >
                  {bookingLoading ? 'PROCESANDO...' : 'CONFIRMAR RESERVA'}
                </button>
              )}
            </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
