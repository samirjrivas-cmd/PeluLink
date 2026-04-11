import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const MESES_LABEL = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Admin() {
  const [shops, setShops] = useState([]);
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('negocios');
  const [processingId, setProcessingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { data } = await supabase
          .from('barbershops')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data) setShops(data);

        // Fetch pagos pendientes con info del negocio
        const { data: pagosData } = await supabase
          .from('pagos_suscripcion')
          .select('*, barbershops(business_name, owner_name, whatsapp, slug)')
          .eq('status', 'pendiente')
          .order('fecha_reporte', { ascending: false });

        if (pagosData) setPagosPendientes(pagosData);
      } catch {
        console.error('Fetch Admin Blocked');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleAprobar = async (pago) => {
    setProcessingId(pago.id);
    try {
      const { error } = await supabase
        .from('pagos_suscripcion')
        .update({
          status: 'aprobado',
          aprobado_por: 'Samir',
          aprobado_at: new Date().toISOString()
        })
        .eq('id', pago.id);

      if (error) {
        alert('Error al aprobar: ' + error.message);
        return;
      }

      // Remove from pending list
      setPagosPendientes(prev => prev.filter(p => p.id !== pago.id));

      // Parse month for the WhatsApp message
      const [anio, mesNum] = pago.mes_pagado.split('-');
      const mesLabel = MESES_LABEL[parseInt(mesNum)] || pago.mes_pagado;
      const nombreDueno = pago.barbershops?.owner_name || 'Estimado';
      const whatsapp = pago.barbershops?.whatsapp || '';

      const msg = `¡Hola ${nombreDueno}! 💈 Tu pago de PeluLink para el mes de ${mesLabel} ${anio} ha sido validado con éxito. ✅ Tu agenda sigue activa. ¡Gracias por confiar en nosotros! 🚀`;
      
      // Clean phone number
      let phone = whatsapp.replace(/\D/g, '');
      if (phone.startsWith('0')) phone = '58' + phone.substring(1);
      if (!phone.startsWith('58')) phone = '58' + phone;

      window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');

    } catch {
      alert('Error de conexión.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRechazar = async (pago) => {
    if (!window.confirm('¿Seguro que deseas rechazar este pago?')) return;
    setProcessingId(pago.id);
    try {
      await supabase
        .from('pagos_suscripcion')
        .update({ status: 'rechazado' })
        .eq('id', pago.id);

      setPagosPendientes(prev => prev.filter(p => p.id !== pago.id));
    } catch {
      alert('Error.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans p-6 md:p-12 relative overflow-hidden">
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-[#fcfcfc]">Panel de Ingresos Corporativos</h1>
            <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mt-1.5">Monitoreo de Fuerza de Ventas</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <button 
              onClick={() => navigate('/agenda')} 
              className="bg-[#D4AF37] text-black hover:bg-yellow-400 transition-colors px-6 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase shadow-md shadow-[#D4AF37]/20"
            >
              📅 Ver mi Agenda
            </button>
            <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-[#111] border border-gray-700/50 rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all text-xs font-bold uppercase tracking-wider text-gray-300">
              Volver al Inicio
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('negocios')}
            className={`px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-all ${
              activeTab === 'negocios'
                ? 'bg-[#D4AF37] text-black shadow-md'
                : 'bg-[#111] border border-gray-800 text-gray-400 hover:border-[#D4AF37]/50'
            }`}
          >
            🏪 Negocios ({shops.length})
          </button>
          <button
            onClick={() => setActiveTab('pagos')}
            className={`px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-all relative ${
              activeTab === 'pagos'
                ? 'bg-[#D4AF37] text-black shadow-md'
                : 'bg-[#111] border border-gray-800 text-gray-400 hover:border-[#D4AF37]/50'
            }`}
          >
            💰 Pagos Pendientes
            {pagosPendientes.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {pagosPendientes.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-20">
            <p className="text-[#D4AF37] font-medium tracking-widest uppercase text-sm animate-pulse">Sincronizando Registros...</p>
          </div>
        ) : activeTab === 'negocios' ? (
          /* ======= TAB: NEGOCIOS ======= */
          <div className="bg-[#111] border border-gray-800/80 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#161616] text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-800">
                    <th className="p-5 font-semibold w-24">ID Global</th>
                    <th className="p-5 font-semibold">Negocio</th>
                    <th className="p-5 font-semibold">Ubicación</th>
                    <th className="p-5 font-semibold">Administrador / WhatsApp</th>
                    <th className="p-5 font-semibold bg-[#D4AF37]/10 text-[#D4AF37]">Vendedor (Gestor)</th>
                    <th className="p-5 font-semibold w-40">Registro</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {shops.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <span className="text-3xl mb-2">📋</span>
                          <span className="font-semibold tracking-wide text-sm">Aún no hay negocios registrados</span>
                        </div>
                      </td>
                    </tr>
                  ) : shops.map((shop) => (
                    <tr key={shop.id} className="border-b border-gray-800/50 hover:bg-[#1a1a1a] transition-colors group">
                      <td className="p-5 text-gray-500 text-xs font-mono group-hover:text-gray-400">{shop.id?.substring(0, 8)}</td>
                      <td className="p-5 font-bold text-gray-200 tracking-wide">{shop.business_name}</td>
                      <td className="p-5 font-medium text-gray-400 text-xs tracking-wider uppercase">{shop.municipality}</td>
                      <td className="p-5">
                        <div className="font-medium text-gray-300">{shop.owner_name}</div>
                        <div className="text-[10px] text-[#25D366] font-mono mt-1">{shop.whatsapp}</div>
                      </td>
                      <td className="p-5">
                        {shop.vendedor_nombre && shop.vendedor_nombre !== 'Registro Orgánico (Auto-Gestionado)' ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                            <span className="text-xs font-bold text-[#D4AF37] uppercase">{shop.vendedor_nombre}</span>
                            <span className="text-[10px] text-gray-400">🔗 Link Ref</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600 font-semibold italic">Orgánico (Sin Referir)</span>
                        )}
                      </td>
                      <td className="p-5 text-gray-500 text-[10px] tracking-widest uppercase">
                        {new Date(shop.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ======= TAB: PAGOS PENDIENTES ======= */
          <div className="space-y-4">
            {pagosPendientes.length === 0 ? (
              <div className="bg-[#111] border border-gray-800 rounded-2xl p-12 text-center">
                <span className="text-4xl mb-3 block">✅</span>
                <p className="text-gray-400 font-semibold tracking-wide">No hay pagos pendientes de revisión</p>
              </div>
            ) : pagosPendientes.map(pago => {
              const [, mesNum] = pago.mes_pagado.split('-');
              const mesLabel = MESES_LABEL[parseInt(mesNum)] || pago.mes_pagado;
              const isProcessing = processingId === pago.id;

              return (
                <div key={pago.id} className="bg-[#111] border border-gray-800 rounded-2xl p-6 hover:border-[#D4AF37]/30 transition-all">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Comprobante Image */}
                    <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden border border-gray-700 flex-shrink-0 bg-[#0a0a0a]">
                      {pago.comprobante_url ? (
                        <a href={pago.comprobante_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={pago.comprobante_url}
                            alt="Comprobante"
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                        </a>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-600 text-xs">Sin imagen</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-white">{pago.barbershops?.business_name || 'Negocio'}</h3>
                          <p className="text-gray-400 text-xs">{pago.barbershops?.owner_name} • {pago.barbershops?.whatsapp}</p>
                        </div>
                        <span className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          ⏳ Pendiente
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Mes</p>
                          <p className="text-[#D4AF37] font-bold">{mesLabel}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Monto</p>
                          <p className="text-white font-bold">Bs. {pago.monto}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Referencia</p>
                          <p className="text-white font-mono font-bold tracking-widest">****{pago.referencia}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Fecha Reporte</p>
                          <p className="text-gray-300 text-xs">{new Date(pago.fecha_reporte).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          disabled={isProcessing}
                          onClick={() => handleAprobar(pago)}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                            isProcessing
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                              : 'bg-[#25D366] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(37,211,102,0.3)]'
                          }`}
                        >
                          {isProcessing ? 'Procesando...' : '✅ APROBAR'}
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleRechazar(pago)}
                          className="px-6 py-3 rounded-xl text-sm font-bold tracking-widest uppercase bg-transparent border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
