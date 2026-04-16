import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Datos de pago fijo de PeluLink
const DATOS_PAGO = {
  banco: 'Banco de Venezuela',
  ci: 'V-16.486.647',
  telefono: '0424-802-7700',
  titular: 'PeluLink C.A.'
};

export default function MiPlan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const slugParam = searchParams.get('negocio');

  const [shop, setShop] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [referencia, setReferencia] = useState('');
  const [monto, setMonto] = useState('');
  const [comprobanteFile, setComprobanteFile] = useState(null);

  useEffect(() => {
    if (!slugParam) { setLoading(false); return; }
    const fetchData = async () => {
      try {
        const { data: shopData } = await supabase
          .from('barbershops')
          .select('*')
          .eq('slug', slugParam)
          .single();

        if (shopData) {
          setShop(shopData);

          const { data: pagosData } = await supabase
            .from('pagos_suscripcion')
            .select('*')
            .eq('barberia_id', shopData.id)
            .order('mes_pagado', { ascending: true });

          if (pagosData) setPagos(pagosData);
        }
      } catch {
        console.error('Error cargando plan');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slugParam]);

  const getMesActual = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getDiaActual = () => new Date().getDate();

  const getStatusMes = (yearMonth) => {
    const pago = pagos.find(p => p.mes_pagado === yearMonth);
    if (pago) return pago.status;

    // Check if it's after the 5th and no payment exists
    const mesActual = getMesActual();
    if (yearMonth === mesActual && getDiaActual() > 5) return 'vencido';
    if (yearMonth < mesActual) return 'vencido';

    return 'pendiente_futuro';
  };

  const handleSubmitPago = async (e) => {
    e.preventDefault();
    if (!shop || !comprobanteFile || !referencia) return;

    setUploading(true);
    try {
      // 1. Upload comprobante image
      const fileExt = comprobanteFile.name.split('.').pop();
      const filePath = `comprobantes/${shop.id}_${getMesActual()}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('fotos-barberias').upload(filePath, comprobanteFile);

      let comprobanteUrl = '';
      if (!uploadError) {
        const { data: publicData } = supabase.storage.from('fotos-barberias').getPublicUrl(filePath);
        comprobanteUrl = publicData.publicUrl;
      }

      // 2. Insert payment record
      const { data: pagoData, error: pagoError } = await supabase
        .from('pagos_suscripcion')
        .insert([{
          barberia_id: shop.id,
          comprobante_url: comprobanteUrl,
          monto: parseFloat(monto) || 0,
          referencia: referencia.trim(),
          mes_pagado: getMesActual(),
          status: 'pendiente'
        }])
        .select()
        .single();

      if (pagoError) {
        if (pagoError.code === '23505') {
          alert('Ya existe un reporte de pago para este mes.');
        } else {
          alert('Error al enviar: ' + pagoError.message);
        }
      } else if (pagoData) {
        setPagos([...pagos, pagoData]);
        setReferencia('');
        setMonto('');
        setComprobanteFile(null);
        alert('✅ ¡Comprobante enviado! Será validado por el equipo de PeluLink.');
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center text-[#D4AF37] font-semibold tracking-widest uppercase animate-pulse">
      Cargando tu plan...
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-2xl font-bold">Acceso al Plan</h2>
      <p className="text-gray-400 text-center max-w-md">Para ver tu plan, accede con el slug de tu negocio: <code className="bg-[#111] px-2 py-1 rounded text-[#D4AF37]">/mi-plan?negocio=tu-slug</code></p>
      <button onClick={() => navigate('/')} className="text-[#D4AF37] hover:underline mt-4">← Volver al Inicio</button>
    </div>
  );

  const mesActual = getMesActual();
  const yaReportoEsteMes = pagos.some(p => p.mes_pagado === mesActual);
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans pb-20 relative">
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      <div className="max-w-3xl mx-auto px-6 pt-10">
        {/* Header */}
        <header className="mb-10 border-b border-gray-800 pb-6">
          <button onClick={() => navigate(`/${shop.slug}`)} className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm mb-4 flex items-center gap-1 font-bold tracking-widest uppercase">
            <span>←</span> Volver a mi Negocio
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-wide text-[#fcfcfc]">Mi Plan PeluLink</h1>
              <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mt-1">
                💈 {shop.business_name}
              </p>
            </div>
            <div className="text-4xl text-[#1a1a1a] font-black tracking-tighter" style={{ WebkitTextStroke: '1px #D4AF37', color: 'transparent' }}>
              SaaS
            </div>
          </div>
        </header>

        {/* Datos de Pago Fijo */}
        <section className="bg-[#111] border border-gray-800 rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-[50px] rounded-full pointer-events-none"></div>
          <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>🏦</span> Datos para Pago Móvil
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Banco</p>
              <p className="text-white font-bold text-lg">{DATOS_PAGO.banco}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Cédula</p>
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-lg">{DATOS_PAGO.ci}</p>
                <button 
                  onClick={() => { navigator.clipboard.writeText(DATOS_PAGO.ci.replace(/\D/g, '')); alert('Cédula copiada al portapapeles'); }}
                  className="text-gray-500 hover:text-[#D4AF37] transition-colors" title="Copiar Cédula"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                </button>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Teléfono</p>
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-lg">{DATOS_PAGO.telefono}</p>
                <button 
                  onClick={() => { navigator.clipboard.writeText(DATOS_PAGO.telefono.replace(/\D/g, '')); alert('Teléfono copiado al portapapeles'); }}
                  className="text-gray-500 hover:text-[#D4AF37] transition-colors" title="Copiar Teléfono"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                </button>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Titular</p>
              <p className="text-white font-bold text-lg">{DATOS_PAGO.titular}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-800 pt-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Pagar directamente con 1 Clic (Formato BDV)</p>
            <button 
              onClick={() => { navigator.clipboard.writeText("0102 16486647 04248027700"); alert('Cadena de Pago Móvil copiada lista para importar'); }}
              className="w-full bg-[#1a1a1a] border border-gray-700 hover:border-[#D4AF37] rounded-lg p-3 text-white font-mono text-center flex items-center justify-center gap-3 transition-all group shadow-sm hover:shadow-[#D4AF37]/20"
            >
              <span>0102 16486647 04248027700</span>
              <svg className="w-5 h-5 text-gray-500 group-hover:text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
            </button>
          </div>
        </section>

        {/* Formulario de reporte de pago */}
        <section className="bg-[#111] border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>📤</span> Reportar Pago del Mes ({MESES[new Date().getMonth()]} {currentYear})
          </h2>

          {yaReportoEsteMes ? (
            <div className="bg-[#25D366]/10 border border-[#25D366]/30 p-4 rounded-xl flex items-center gap-3">
              <span className="text-green-400 text-2xl">✅</span>
              <div>
                <p className="text-green-300 font-bold text-sm">Ya reportaste tu pago para este mes</p>
                <p className="text-gray-400 text-xs mt-1">
                  Estado: <span className={`font-bold uppercase ${
                    pagos.find(p => p.mes_pagado === mesActual)?.status === 'aprobado' ? 'text-green-400' :
                    pagos.find(p => p.mes_pagado === mesActual)?.status === 'rechazado' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {pagos.find(p => p.mes_pagado === mesActual)?.status || 'pendiente'}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitPago} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-400 font-bold tracking-wide">Últimos 4 dígitos de referencia</label>
                  <input
                    type="text" required maxLength={4} placeholder="Ej. 7842"
                    value={referencia} onChange={e => setReferencia(e.target.value.replace(/\D/g, ''))}
                    className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white font-bold tracking-widest text-center text-xl focus:outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-400 font-bold tracking-wide">Monto en Bs</label>
                  <input
                    type="number" step="0.01" required placeholder="Ej. 150.00"
                    value={monto} onChange={e => setMonto(e.target.value)}
                    className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white font-bold focus:outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 font-bold tracking-wide">📸 Captura del Comprobante</label>
                <input
                  type="file" accept="image/*" required
                  onChange={e => setComprobanteFile(e.target.files[0])}
                  className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-2.5 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#D4AF37]/20 file:text-[#D4AF37] hover:file:bg-[#D4AF37]/30 transition-all text-sm cursor-pointer"
                />
              </div>

              <button
                type="submit" disabled={uploading}
                className={`w-full py-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all shadow-lg mt-2 ${
                  uploading
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                }`}
              >
                {uploading ? 'Subiendo Comprobante...' : 'ENVIAR REPORTE DE PAGO'}
              </button>
            </form>
          )}
        </section>

        {/* Calendario de Fidelidad - 12 meses */}
        <section className="bg-[#111] border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest mb-6 flex items-center gap-2">
            <span>📅</span> Calendario de Fidelidad {currentYear}
          </h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {MESES.map((mes, i) => {
              const yearMonth = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
              const statusMes = getStatusMes(yearMonth);
              const esMesActual = yearMonth === mesActual;

              let bgClass = 'bg-[#1a1a1a] border-gray-800 text-gray-500';
              let icon = '⬜';

              if (statusMes === 'aprobado') {
                bgClass = 'bg-[#25D366]/10 border-[#25D366]/50 text-[#25D366] shadow-[0_0_15px_rgba(37,211,102,0.15)]';
                icon = '✅';
              } else if (statusMes === 'pendiente' && pagos.some(p => p.mes_pagado === yearMonth)) {
                bgClass = 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400';
                icon = '⏳';
              } else if (statusMes === 'rechazado') {
                bgClass = 'bg-red-500/10 border-red-500/40 text-red-400';
                icon = '❌';
              } else if (statusMes === 'vencido') {
                bgClass = 'bg-red-600/10 border-red-600/40 text-red-500 animate-pulse';
                icon = '🔴';
              } else if (esMesActual) {
                bgClass = 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]';
                icon = '💰';
              }

              return (
                <div
                  key={yearMonth}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${bgClass} ${esMesActual ? 'ring-2 ring-[#D4AF37]/30' : ''}`}
                >
                  <span className="text-lg mb-1">{icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{mes.substring(0, 3)}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-800 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            <span className="flex items-center gap-1">✅ Aprobado</span>
            <span className="flex items-center gap-1">⏳ En Revisión</span>
            <span className="flex items-center gap-1">🔴 Vencido</span>
            <span className="flex items-center gap-1">💰 Mes Actual</span>
          </div>
        </section>
      </div>
    </div>
  );
}
