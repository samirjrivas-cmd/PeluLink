import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Admin() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Obtenemos los negocios y hacemos un JOIN silencioso con la tabla vendedores
        const { data, error } = await supabase
          .from('barbershops')
          .select(`
            *,
            vendedores(nombre, codigo_vendedor)
          `)
          .order('created_at', { ascending: false });
        
        if (data) setShops(data);
        if (error) console.error(error);
      } catch (err) {
        console.error('Fetch Admin Blocked:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans p-6 md:p-12 relative overflow-hidden">
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-[#fcfcfc]">Panel de Ingresos Corporativos</h1>
            <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mt-1.5">Monitoreo de Fuerza de Ventas</p>
          </div>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-[#111] border border-gray-700/50 rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all text-xs font-bold uppercase tracking-wider text-gray-300">
            Volver al Inicio
          </button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center p-20">
            <p className="text-[#D4AF37] font-medium tracking-widest uppercase text-sm animate-pulse">Sincronizando Registros...</p>
          </div>
        ) : (
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
                        {shop.vendedores ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                            <span className="text-xs font-bold text-[#D4AF37] uppercase">{shop.vendedores.nombre}</span>
                            <span className="text-[9px] font-mono text-gray-500">({shop.vendedores.codigo_vendedor})</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600 font-semibold italic">Auto-Gestionado (Sin Code)</span>
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
        )}
      </div>
    </div>
  );
}
