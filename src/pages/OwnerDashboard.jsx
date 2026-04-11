import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function OwnerDashboard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // PIN Security
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Stats
  const [totalReservas, setTotalReservas] = useState(0);
  const [reservasHoy, setReservasHoy] = useState(0);
  const [totalBarberos, setTotalBarberos] = useState(0);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const { data: shopData } = await supabase
          .from('barbershops')
          .select('*')
          .eq('slug', slug)
          .single();

        if (shopData) {
          setShop(shopData);

          // Check if already authenticated via sessionStorage
          const storedAuth = sessionStorage.getItem(`pelulink_owner_${shopData.id}`);
          if (storedAuth === shopData.pin_acceso) {
            setIsAuthenticated(true);
            fetchStats(shopData.id);
          }
        }
      } catch {
        console.error('Error loading dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [slug]);

  const fetchStats = async (shopId) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const [{ count: totalCount }, { count: todayCount }, { count: barberCount }] = await Promise.all([
      supabase.from('reservas').select('*', { count: 'exact', head: true }).eq('barberia_id', shopId),
      supabase.from('reservas').select('*', { count: 'exact', head: true }).eq('barberia_id', shopId).eq('fecha', todayStr).neq('status', 'Cancelada'),
      supabase.from('barberos').select('*', { count: 'exact', head: true }).eq('barberia_id', shopId)
    ]);

    setTotalReservas(totalCount || 0);
    setReservasHoy(todayCount || 0);
    setTotalBarberos(barberCount || 0);
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (!shop) return;

    // Validate PIN against DB
    if (pinInput === shop.pin_acceso) {
      setIsAuthenticated(true);
      sessionStorage.setItem(`pelulink_owner_${shop.id}`, pinInput);
      setPinError('');
      fetchStats(shop.id);
    } else {
      setPinError('PIN incorrecto. Verifica tu clave de acceso.');
      setPinInput('');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center text-[#D4AF37] font-semibold tracking-widest uppercase animate-pulse">
      Cargando Dashboard...
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center gap-4">
      <h2 className="text-3xl font-bold">Negocio no encontrado</h2>
      <button onClick={() => navigate('/')} className="text-[#D4AF37] hover:underline">← Inicio</button>
    </div>
  );

  // ==========================================
  // PANTALLA DE PIN (si no está autenticado)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

        <div className="w-full max-w-sm bg-gradient-to-b from-[#1a1a1a] to-[#111] rounded-3xl p-8 shadow-2xl border border-gray-800 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#D4AF37]/10 border-2 border-[#D4AF37]/30 flex items-center justify-center">
            <span className="text-4xl">🔒</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{shop.business_name}</h2>
          <p className="text-gray-400 text-sm mb-8">Ingresa tu PIN de dueño para acceder al panel de administración</p>

          <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              maxLength={6}
              placeholder="• • • • • •"
              value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
              className="bg-[#0a0a0a] border border-gray-700 rounded-xl p-4 text-white text-center text-3xl tracking-[1rem] font-bold focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all"
              autoFocus
            />

            {pinError && (
              <p className="text-red-400 text-xs font-bold animate-pulse">{pinError}</p>
            )}

            <button
              type="submit"
              className="w-full py-4 rounded-xl text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all shadow-lg"
            >
              Acceder a mi Panel
            </button>
          </form>

          <p className="text-gray-600 text-[10px] mt-6 uppercase tracking-widest">
            ¿Olvidaste tu PIN? Contacta a soporte PeluLink
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // DASHBOARD PRINCIPAL (autenticado)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans pb-20 relative overflow-hidden">
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      <div className="max-w-3xl mx-auto px-6 pt-10">
        {/* Header */}
        <header className="mb-10 border-b border-gray-800 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mb-1">Panel de Administración</p>
              <h1 className="text-3xl font-bold tracking-wide text-[#fcfcfc]">{shop.business_name}</h1>
              <p className="text-gray-500 text-xs mt-1">📍 {shop.municipality} • Dueño: {shop.owner_name}</p>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem(`pelulink_owner_${shop.id}`);
                setIsAuthenticated(false);
                setPinInput('');
              }}
              className="p-3 bg-[#111] border border-gray-800 rounded-xl text-gray-500 hover:text-red-400 hover:border-red-500/30 transition-all text-xs font-bold"
              title="Cerrar Sesión"
            >
              🔓
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-5 text-center hover:border-[#D4AF37]/30 transition-all">
            <p className="text-3xl font-black text-[#D4AF37]">{reservasHoy}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Citas Hoy</p>
          </div>
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-5 text-center hover:border-[#25D366]/30 transition-all">
            <p className="text-3xl font-black text-[#25D366]">{totalReservas}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Total Reservas</p>
          </div>
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-5 text-center hover:border-blue-400/30 transition-all">
            <p className="text-3xl font-black text-blue-400">{totalBarberos}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Profesionales</p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate(`/agenda?barberia=${shop.id}`)}
            className="w-full bg-[#111] border border-gray-800 hover:border-[#D4AF37]/50 rounded-2xl p-6 flex items-center gap-5 transition-all group hover:shadow-[0_0_30px_rgba(212,175,55,0.05)]"
          >
            <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📅
            </div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors">Mi Agenda</h3>
              <p className="text-gray-500 text-xs">Ver todas las citas, filtrar por fecha y barbero</p>
            </div>
            <span className="text-gray-600 text-xl group-hover:text-[#D4AF37] transition-colors">→</span>
          </button>

          <button
            onClick={() => navigate(`/mi-plan?negocio=${shop.slug}`)}
            className="w-full bg-[#111] border border-gray-800 hover:border-[#25D366]/50 rounded-2xl p-6 flex items-center gap-5 transition-all group hover:shadow-[0_0_30px_rgba(37,211,102,0.05)]"
          >
            <div className="w-14 h-14 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              💰
            </div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-bold text-white group-hover:text-[#25D366] transition-colors">Mi Plan y Pagos</h3>
              <p className="text-gray-500 text-xs">Reportar pago, ver calendario de fidelidad</p>
            </div>
            <span className="text-gray-600 text-xl group-hover:text-[#25D366] transition-colors">→</span>
          </button>

          <button
            onClick={() => navigate(`/${shop.slug}`)}
            className="w-full bg-[#111] border border-gray-800 hover:border-blue-400/50 rounded-2xl p-6 flex items-center gap-5 transition-all group hover:shadow-[0_0_30px_rgba(96,165,250,0.05)]"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              👥
            </div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Mi Página Pública</h3>
              <p className="text-gray-500 text-xs">Ver cómo ven los clientes tu perfil y equipo</p>
            </div>
            <span className="text-gray-600 text-xl group-hover:text-blue-400 transition-colors">→</span>
          </button>
        </div>

        {/* Quick Link */}
        <div className="mt-10 bg-[#111] border border-dashed border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-2">Link directo para tus clientes</p>
          <p className="text-[#D4AF37] font-mono text-sm font-bold break-all select-all">
            pelulink-app.vercel.app/{shop.slug}
          </p>
        </div>
      </div>
    </div>
  );
}
