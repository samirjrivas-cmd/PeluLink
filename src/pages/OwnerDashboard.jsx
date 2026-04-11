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

  // Modals
  const [modalCitas, setModalCitas] = useState(false);
  const [modalProfesionales, setModalProfesionales] = useState(false);
  const [citasList, setCitasList] = useState([]);
  const [profesionalesList, setProfesionalesList] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // Edit Professional
  const [editingPro, setEditingPro] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      console.log('[Dashboard] Buscando negocio con slug:', slug);
      try {
        const { data: shopData, error: shopError } = await supabase
          .from('barbershops')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        console.log('[Dashboard] Respuesta Supabase:', { shopData, shopError });
        if (shopError) console.error('[Dashboard] Error:', shopError);

        if (shopData) {
          if (!shopData.pin_acceso) shopData.pin_acceso = '1234';
          setShop(shopData);
          console.log('[Dashboard] ✅ Negocio encontrado:', shopData.business_name);

          const storedAuth = sessionStorage.getItem(`pelulink_owner_${shopData.id}`);
          if (storedAuth === shopData.pin_acceso) {
            setIsAuthenticated(true);
            fetchStats(shopData.id);
          }
        } else {
          console.warn('[Dashboard] ⚠️ No se encontró negocio con slug:', slug);
        }
      } catch (err) {
        console.error('[Dashboard] Error inesperado:', err);
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

  // ==========================================
  // MODAL: CITAS
  // ==========================================
  const openModalCitas = async () => {
    if (!shop) return;
    setModalCitas(true);
    setLoadingModal(true);
    const { data } = await supabase
      .from('reservas')
      .select('*')
      .eq('barberia_id', shop.id)
      .neq('status', 'Cancelada')
      .order('fecha', { ascending: false })
      .order('hora', { ascending: true })
      .limit(100);
    setCitasList(data || []);
    setLoadingModal(false);
  };

  // ==========================================
  // MODAL: PROFESIONALES
  // ==========================================
  const openModalProfesionales = async () => {
    if (!shop) return;
    setModalProfesionales(true);
    setLoadingModal(true);
    const { data } = await supabase
      .from('barberos')
      .select('*')
      .eq('barberia_id', shop.id)
      .order('name', { ascending: true });
    setProfesionalesList(data || []);
    setLoadingModal(false);
  };

  const startEditPro = (pro) => {
    setEditingPro(pro);
    setEditName(pro.name || '');
    setEditRole(pro.role || '');
    setEditFile(null);
  };

  const handleSaveEdit = async () => {
    if (!editingPro) return;
    setSavingEdit(true);

    try {
      let newFotoUrl = editingPro.foto_url;

      // Upload new photo if provided
      if (editFile) {
        const fileExt = editFile.name.split('.').pop();
        const filePath = `profesionales/${editingPro.id}_${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('fotos-barberias').upload(filePath, editFile);
        if (!uploadErr) {
          const { data: pubData } = supabase.storage.from('fotos-barberias').getPublicUrl(filePath);
          newFotoUrl = pubData.publicUrl;
        }
      }

      const { error } = await supabase
        .from('barberos')
        .update({
          name: editName.trim(),
          role: editRole.trim(),
          foto_url: newFotoUrl
        })
        .eq('id', editingPro.id);

      if (error) {
        alert('Error al guardar: ' + error.message);
      } else {
        // Update local list
        setProfesionalesList(prev => prev.map(p =>
          p.id === editingPro.id ? { ...p, name: editName.trim(), role: editRole.trim(), foto_url: newFotoUrl } : p
        ));
        setEditingPro(null);
        // Refresh stats
        fetchStats(shop.id);
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (!shop) return;
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

  // ==========================================
  // RENDER: LOADING
  // ==========================================
  if (loading) return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center text-[#D4AF37] font-semibold tracking-widest uppercase animate-pulse">
      Cargando Dashboard...
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center gap-4 p-6">
      <span className="text-5xl mb-2">🔍</span>
      <h2 className="text-2xl font-bold">Negocio no encontrado</h2>
      <p className="text-gray-400 text-sm text-center max-w-md">
        No existe un negocio con el identificador: <code className="bg-[#111] px-2 py-1 rounded text-[#D4AF37] font-mono">{slug}</code>
      </p>
      <button onClick={() => navigate('/explore')} className="text-[#D4AF37] hover:underline mt-4 font-bold text-sm">← Ver negocios disponibles</button>
    </div>
  );

  // ==========================================
  // RENDER: PANTALLA DE PIN
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
            <input type="password" maxLength={6} placeholder="• • • • • •" value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
              className="bg-[#0a0a0a] border border-gray-700 rounded-xl p-4 text-white text-center text-3xl tracking-[1rem] font-bold focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all" autoFocus />
            {pinError && <p className="text-red-400 text-xs font-bold animate-pulse">{pinError}</p>}
            <button type="submit" className="w-full py-4 rounded-xl text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all shadow-lg">
              Acceder a mi Panel
            </button>
          </form>
          <p className="text-gray-600 text-[10px] mt-6 uppercase tracking-widest">¿Olvidaste tu PIN? Contacta a soporte PeluLink</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: DASHBOARD PRINCIPAL
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
              onClick={() => { sessionStorage.removeItem(`pelulink_owner_${shop.id}`); setIsAuthenticated(false); setPinInput(''); }}
              className="p-3 bg-[#111] border border-gray-800 rounded-xl text-gray-500 hover:text-red-400 hover:border-red-500/30 transition-all text-xs font-bold" title="Cerrar Sesión">
              🔓
            </button>
          </div>
        </header>

        {/* Stats Cards - CLICKABLE */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <button onClick={openModalCitas} className="bg-[#111] border border-gray-800 rounded-2xl p-5 text-center hover:border-[#D4AF37]/50 transition-all cursor-pointer group active:scale-95">
            <p className="text-3xl font-black text-[#D4AF37] group-hover:scale-110 transition-transform">{reservasHoy}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Citas Hoy</p>
            <p className="text-[8px] text-gray-700 mt-1 group-hover:text-gray-400 transition-colors">Toca para ver</p>
          </button>
          <button onClick={openModalCitas} className="bg-[#111] border border-gray-800 rounded-2xl p-5 text-center hover:border-[#25D366]/50 transition-all cursor-pointer group active:scale-95">
            <p className="text-3xl font-black text-[#25D366] group-hover:scale-110 transition-transform">{totalReservas}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Total Reservas</p>
            <p className="text-[8px] text-gray-700 mt-1 group-hover:text-gray-400 transition-colors">Toca para ver</p>
          </button>
          <button onClick={openModalProfesionales} className="bg-[#111] border border-gray-800 rounded-2xl p-5 text-center hover:border-blue-400/50 transition-all cursor-pointer group active:scale-95">
            <p className="text-3xl font-black text-blue-400 group-hover:scale-110 transition-transform">{totalBarberos}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Profesionales</p>
            <p className="text-[8px] text-gray-700 mt-1 group-hover:text-gray-400 transition-colors">Toca para editar</p>
          </button>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-4">
          <button onClick={() => navigate(`/agenda?barberia=${shop.id}`)} className="w-full bg-[#111] border border-gray-800 hover:border-[#D4AF37]/50 rounded-2xl p-6 flex items-center gap-5 transition-all group hover:shadow-[0_0_30px_rgba(212,175,55,0.05)]">
            <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📅</div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors">Mi Agenda</h3>
              <p className="text-gray-500 text-xs">Ver todas las citas, filtrar por fecha y barbero</p>
            </div>
            <span className="text-gray-600 text-xl group-hover:text-[#D4AF37] transition-colors">→</span>
          </button>

          <button onClick={() => navigate(`/mi-plan?negocio=${shop.slug}`)} className="w-full bg-[#111] border border-gray-800 hover:border-[#25D366]/50 rounded-2xl p-6 flex items-center gap-5 transition-all group hover:shadow-[0_0_30px_rgba(37,211,102,0.05)]">
            <div className="w-14 h-14 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">💰</div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-bold text-white group-hover:text-[#25D366] transition-colors">Mi Plan y Pagos</h3>
              <p className="text-gray-500 text-xs">Reportar pago, ver calendario de fidelidad</p>
            </div>
            <span className="text-gray-600 text-xl group-hover:text-[#25D366] transition-colors">→</span>
          </button>

          <button onClick={() => navigate(`/${shop.slug}`)} className="w-full bg-[#111] border border-gray-800 hover:border-blue-400/50 rounded-2xl p-6 flex items-center gap-5 transition-all group hover:shadow-[0_0_30px_rgba(96,165,250,0.05)]">
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">👥</div>
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

      {/* ==========================================
          MODAL: LISTA DE CITAS
          ========================================== */}
      {modalCitas && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-0 animate-[fadeIn_0.2s_ease-out]" onClick={() => setModalCitas(false)}>
          <div className="bg-[#111] border border-gray-700 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#151515]">
              <div>
                <h3 className="text-xl font-bold text-white">📋 Citas Agendadas</h3>
                <p className="text-[#D4AF37] text-xs font-semibold tracking-wider uppercase mt-1">{citasList.length} reservas encontradas</p>
              </div>
              <button onClick={() => setModalCitas(false)} className="text-gray-500 hover:text-white p-2 text-lg">✕</button>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center p-10">
                  <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-[#D4AF37] font-bold tracking-widest uppercase animate-pulse">Cargando citas...</p>
                </div>
              ) : citasList.length === 0 ? (
                <div className="text-center p-10 text-gray-500">
                  <span className="text-3xl block mb-2">📭</span>
                  <p className="font-semibold">Aún no hay citas agendadas</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {citasList.map(cita => (
                    <div key={cita.id} className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold text-sm">{cita.cliente_nombre || 'Sin nombre'}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                          cita.status === 'Confirmada' ? 'bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20' :
                          cita.status === 'Cancelada' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>{cita.status || 'Pendiente'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">📅 {cita.fecha}</span>
                        <span className="flex items-center gap-1">⏰ {cita.hora}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs">
                        <span className="text-[#D4AF37] font-semibold">{cita.servicio || 'Sin servicio'}</span>
                        <span className="text-gray-600">• {cita.barbero_name}</span>
                      </div>
                      {cita.cliente_telefono && (
                        <div className="mt-2">
                          <a href={`https://api.whatsapp.com/send?phone=${cita.cliente_telefono}`} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-[#25D366] font-bold hover:underline">📞 {cita.cliente_telefono}</a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: PROFESIONALES
          ========================================== */}
      {modalProfesionales && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-0 animate-[fadeIn_0.2s_ease-out]" onClick={() => { setModalProfesionales(false); setEditingPro(null); }}>
          <div className="bg-[#111] border border-gray-700 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#151515]">
              <div>
                <h3 className="text-xl font-bold text-white">{editingPro ? '✏️ Editar Profesional' : '👥 Mi Equipo'}</h3>
                <p className="text-[#D4AF37] text-xs font-semibold tracking-wider uppercase mt-1">
                  {editingPro ? editingPro.name : `${profesionalesList.length} profesionales`}
                </p>
              </div>
              <button onClick={() => { if (editingPro) { setEditingPro(null); } else { setModalProfesionales(false); } }} className="text-gray-500 hover:text-white p-2 text-lg">
                {editingPro ? '←' : '✕'}
              </button>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center p-10">
                  <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-blue-400 font-bold tracking-widest uppercase animate-pulse">Cargando equipo...</p>
                </div>
              ) : editingPro ? (
                /* ===== FORMULARIO DE EDICIÓN ===== */
                <div className="flex flex-col gap-5 animate-[fadeIn_0.3s_ease-out]">
                  {/* Current Photo */}
                  <div className="flex justify-center">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#D4AF37]/30 shadow-lg">
                      <img
                        src={editFile ? URL.createObjectURL(editFile) : (editingPro.foto_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400')}
                        alt={editName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400 font-bold tracking-wide">Nombre o Apodo</label>
                    <input
                      type="text" value={editName} onChange={e => setEditName(e.target.value)}
                      className="bg-[#0a0a0a] border border-gray-700 rounded-xl p-3.5 text-white font-medium focus:outline-none focus:border-[#D4AF37] transition-all"
                      placeholder="Ej. Luis F."
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400 font-bold tracking-wide">Especialidad / Rol</label>
                    <input
                      type="text" value={editRole} onChange={e => setEditRole(e.target.value)}
                      className="bg-[#0a0a0a] border border-gray-700 rounded-xl p-3.5 text-white font-medium focus:outline-none focus:border-[#D4AF37] transition-all"
                      placeholder="Ej. Master Barber"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400 font-bold tracking-wide">📸 Cambiar Foto de Perfil</label>
                    <input
                      type="file" accept="image/*"
                      onChange={e => setEditFile(e.target.files[0])}
                      className="bg-[#0a0a0a] border border-gray-700 rounded-xl p-2.5 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#D4AF37]/20 file:text-[#D4AF37] hover:file:bg-[#D4AF37]/30 transition-all text-sm cursor-pointer"
                    />
                  </div>

                  <button
                    disabled={savingEdit || !editName.trim()}
                    onClick={handleSaveEdit}
                    className={`w-full py-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all shadow-lg mt-2 ${
                      savingEdit
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                        : 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                    }`}
                  >
                    {savingEdit ? 'GUARDANDO...' : '💾 GUARDAR CAMBIOS'}
                  </button>
                </div>
              ) : profesionalesList.length === 0 ? (
                <div className="text-center p-10 text-gray-500">
                  <span className="text-3xl block mb-2">👤</span>
                  <p className="font-semibold">No hay profesionales registrados</p>
                </div>
              ) : (
                /* ===== LISTA DE PROFESIONALES ===== */
                <div className="flex flex-col gap-3">
                  {profesionalesList.map(pro => (
                    <div key={pro.id} className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-gray-700 transition-all group">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-[#D4AF37]/50 transition-all flex-shrink-0">
                        <img
                          src={pro.foto_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400'}
                          alt={pro.name}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm truncate">{pro.name}</h4>
                        <p className="text-[#D4AF37] text-xs font-semibold truncate">{pro.role || 'Profesional'}</p>
                        {pro.whatsapp && <p className="text-gray-600 text-[10px] mt-0.5">{pro.whatsapp}</p>}
                      </div>
                      <button
                        onClick={() => startEditPro(pro)}
                        className="px-4 py-2 bg-[#111] border border-gray-700 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 text-gray-400 hover:text-[#D4AF37] rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0"
                      >
                        ✏️ Editar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
