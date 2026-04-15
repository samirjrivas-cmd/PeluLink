import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const VENEZUELA_LOCATIONS = {
  'Sucre': ['Mejía', 'Sucre', 'Ribero', 'Mariño', 'Cajigal', 'Benítez', 'Bermúdez', 'Arismendi', 'Andrés Eloy Blanco', 'Andrés Mata', 'Valdez', 'Libertador', 'Cruz Salmerón Acosta', 'Bolívar', 'Soublette'],
  'Anzoátegui': ['Sotillo', 'Bolívar', 'Urbaneja', 'Guanta', 'Anaco', 'Aragua', 'Peñalver'],
  'Monagas': ['Maturín', 'Caripe', 'Piar', 'Ezequiel Zamora', 'Bolívar'],
  'Nueva Esparta': ['Arismendi', 'Maneiro', 'Mariño', 'García', 'Díaz', 'Tubores', 'Macanao', 'Villalba', 'Antolín del Campo'],
  'Distrito Capital': ['Libertador'],
  'Miranda': ['Sucre', 'Baruta', 'Chacao', 'El Hatillo', 'Guaicaipuro', 'Plaza', 'Zamora']
};

export default function BusinessRegister() {
  const navigate = useNavigate();
  

  const cleanPhone = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (!cleaned.startsWith('58')) cleaned = '58' + cleaned;
    return cleaned;
  };

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Paso 1: Datos negocio
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    estado: 'Sucre',
    municipality: 'Mejía',
    address: '',
    whatsapp: '',
    services: ''
  });
  const [imageFile, setImageFile] = useState(null);

  // Paso 2: Datos barberos
  const [barbers, setBarbers] = useState([
    { id: 1, name: '', role: 'Barbero Principal', whatsapp: '', file: null }
  ]);

  const handleAddBarber = () => {
    setBarbers([...barbers, { id: Date.now(), name: '', role: '', whatsapp: '', file: null }]);
  };

  const handleUpdateBarber = (id, field, value) => {
    setBarbers(barbers.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleRemoveBarber = (id) => {
    if (barbers.length > 1) {
      setBarbers(barbers.filter(b => b.id !== id));
    }
  };

  const [vendedorCode, setVendedorCode] = useState('');
  const [validVendedorNombre, setValidVendedorNombre] = useState('');
  const [pinAcceso, setPinAcceso] = useState('');

  const handleSubmitStep1 = async (e) => {
    e.preventDefault();
    
    if (!vendedorCode.trim()) {
      alert('El código de vendedor es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .select('*')
        .eq('codigo', vendedorCode.trim())
        .single();
        
      if (error || !data) {
        alert('Código de vendedor no válido. Por favor, contacta al administrador.');
        setLoading(false);
        return;
      }
      
      setValidVendedorNombre(data.nombre || vendedorCode.trim());
      setStep(2);
      window.scrollTo(0, 0);
    } catch {
      alert('Código de vendedor no válido. Por favor, contacta al administrador.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFinal = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const servicesArray = formData.services.split(',').map(s => s.trim()).filter(s => s);
      const randomSuffix = Math.floor(Math.random() * 10000);
      const slug = formData.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + randomSuffix;

      // 1. Subir Foto Fachada
      let publicImageUrl = '';
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `fachadas/${Date.now()}_${slug}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('fotos-barberias').upload(filePath, imageFile);
        if (!uploadError) {
          const { data: publicData } = supabase.storage.from('fotos-barberias').getPublicUrl(filePath);
          publicImageUrl = publicData.publicUrl;
        }
      }

      // 2. Insertar Negocio (Añadiendo vendedor_nombre en tabla barbershops)
      const sanitizedShopPhone = cleanPhone(formData.whatsapp);
      const insertData = {
        vendedor_codigo: vendedorCode.trim(),
        vendedor_nombre: validVendedorNombre || 'Registro Orgánico (Auto-Gestionado)',
        business_name: formData.business_name,
        owner_name: formData.owner_name,
        estado: formData.estado,
        municipality: formData.municipality,
        address: formData.address || '',
        whatsapp: sanitizedShopPhone,
        services: servicesArray,
        slug: slug,
        foto_url: publicImageUrl,
        pin_acceso: pinAcceso || '1234'
      };

      const { data: shopData, error: shopError } = await supabase
        .from('barbershops')
        .insert([insertData]).select().single();

      if (shopError) {
        // En caso de que no hayan creado la columna vendedor_nombre aún, no crasheamos, simplemente la borramos y mandamos la info standard
        if (shopError.code === '42703') {
           console.warn('Faltan columnas de vendedor. Intentando envío básico...');
           const fallbackResp = await supabase.from('barbershops').insert([{
             business_name: formData.business_name,
             owner_name: formData.owner_name,
             estado: formData.estado,
             municipality: formData.municipality,
             address: formData.address || '',
             whatsapp: sanitizedShopPhone,
             services: servicesArray,
             slug: slug,
             foto_url: publicImageUrl
           }]).select().single();
           if (fallbackResp.error) throw fallbackResp.error;
           shopData.id = fallbackResp.data.id;
        } else {
           throw shopError;
        }
      }

      // 3. Subir e Insertar Barberos
      const barberInserts = [];
      for (const barb of barbers) {
        if (!barb.name) continue;
        
        let barbFotoUrl = '';
        if (barb.file) {
          const fileExt = barb.file.name.split('.').pop();
          const filePath = `profesionales/${Date.now()}_${barb.id}.${fileExt}`;
          const { error: barbUploadErr } = await supabase.storage.from('fotos-barberias').upload(filePath, barb.file);
          if (!barbUploadErr) {
             const { data: barbPublicData } = supabase.storage.from('fotos-barberias').getPublicUrl(filePath);
             barbFotoUrl = barbPublicData.publicUrl;
          }
        }
        
        barberInserts.push({
          barberia_id: shopData?.id || shopData, // Safe check fallback
          name: barb.name,
          role: barb.role || 'Especialista',
          whatsapp: cleanPhone(barb.whatsapp) || sanitizedShopPhone,
          foto_url: barbFotoUrl
        });
      }

      if (barberInserts.length > 0 && shopData?.id) {
        const { error: barbError } = await supabase.from('barberos').insert(barberInserts);
        if (barbError && barbError.code !== '42P01') { 
           // Si falla y NO es porque falta la tabla, alertamos.
           console.error('Barber Insert Err:', barbError);
        }
      }

      navigate(`/${slug}`);

    } catch {
      alert('Error: ' + (e.message || 'Inténtelo de nuevo.'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center p-4 font-sans text-white py-12">
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#1a1a1a] to-[#111] rounded-3xl p-8 shadow-2xl border border-gray-800 relative z-10 transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,175,55,0.05)]">
        
        <header className="mb-8 border-b border-gray-800 pb-6">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm mb-4 flex items-center gap-1 font-bold tracking-widest uppercase">
            <span>←</span> Volver al Catálogo
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-wide text-[#fcfcfc]">Suma tu Negocio</h2>
              <p className="text-[#D4AF37] font-light text-sm mt-1">
                {step === 1 ? 'Paso 1: Perfil de la Barbería' : 'Paso 2: Tus Profesionales'}
              </p>
            </div>
            <div className="text-4xl text-[#1a1a1a] font-black tracking-tighter" style={{ WebkitTextStroke: '1px #D4AF37', color: 'transparent' }}>
              0{step}
            </div>
          </div>
        </header>

        {step === 1 ? (
          <form onSubmit={handleSubmitStep1} className="flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out]">
            
            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/30 p-4 rounded-xl flex flex-col gap-2 mb-2">
              <label className="text-sm font-bold tracking-wider text-[#D4AF37] flex items-center gap-2">
                <span>🛡️</span> Código de Vendedor
              </label>
              <input 
                type="text" required placeholder="Ingresa tu código de promotor/vendedor"
                value={vendedorCode} onChange={e => setVendedorCode(e.target.value)}
                className="bg-[#0a0a0a] border border-[#D4AF37]/50 rounded-lg p-3.5 text-white font-bold tracking-widest uppercase focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
              />
              <p className="text-xs text-gray-500 font-medium">Requerido para el registro. Consulta con soporte si no lo tienes.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-gray-300">Nombre del Local</label>
              <input 
                type="text" required placeholder="Ej. Barbería Central"
                value={formData.business_name} onChange={e => setFormData({...formData, business_name: e.target.value})}
                className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-gray-300">Dueño o Gerente</label>
              <input 
                type="text" required placeholder="Ej. Carlos Martínez"
                value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})}
                className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold tracking-wide text-gray-300">Estado</label>
                <select 
                  value={formData.estado} onChange={e => {
                    const newState = e.target.value;
                    setFormData({...formData, estado: newState, municipality: VENEZUELA_LOCATIONS[newState][0]});
                  }}
                  className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3.5 text-gray-200 focus:outline-none focus:border-[#D4AF37] transition-all"
                >
                  {Object.keys(VENEZUELA_LOCATIONS).map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold tracking-wide text-gray-300">Municipio</label>
                <select 
                  value={formData.municipality} onChange={e => setFormData({...formData, municipality: e.target.value})}
                  className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3.5 text-gray-200 focus:outline-none focus:border-[#D4AF37] transition-all"
                >
                  {VENEZUELA_LOCATIONS[formData.estado].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold tracking-wide text-gray-300">Teléfono Local / WhatsApp</label>
                <input 
                  type="text" required placeholder="Ej. 0414 123 4567"
                  value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-gray-300">Dirección Exacta del Local</label>
              <textarea 
                required placeholder="Ej. Calle Independencia con Ayacucho, CC Empresarial..."
                value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3.5 text-white focus:outline-none focus:border-[#D4AF37] transition-all text-sm leading-relaxed min-h-[60px]"
              ></textarea>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-gray-300">Sube la foto de tu Fachada / Local</label>
              <input 
                type="file" accept="image/*"
                onChange={e => setImageFile(e.target.files[0])}
                className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-2.5 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#D4AF37]/20 file:text-[#D4AF37] hover:file:bg-[#D4AF37]/30 transition-all text-sm cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-gray-300">Lista tus Especialidades (Separadas por Comas)</label>
              <textarea 
                required placeholder="Ej. Corte Clásico, Barba Tradicional, Platinados, Perfilado, Keratina..."
                value={formData.services} onChange={e => setFormData({...formData, services: e.target.value})}
                className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3.5 min-h-[100px] text-white focus:outline-none focus:border-[#D4AF37] transition-all scrollbar-hide text-sm leading-relaxed"
              ></textarea>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold tracking-wide text-gray-300">🔒 Crea tu PIN de Acceso (4-6 dígitos)</label>
              <input 
                type="password" required maxLength={6} minLength={4} placeholder="Ej. 4821"
                value={pinAcceso} onChange={e => setPinAcceso(e.target.value.replace(/\D/g, ''))}
                className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3.5 text-white text-center text-2xl tracking-[0.8rem] font-bold focus:outline-none focus:border-[#D4AF37] transition-all"
              />
              <p className="text-[10px] text-gray-500">Este PIN será tu clave para entrar a tu panel de administración.</p>
            </div>

             <div className="flex gap-4 mt-4">
              <button 
                type="submit" disabled={loading}
                className={`w-full py-4 flex items-center justify-center gap-2 rounded-xl text-md font-bold tracking-widest uppercase transition-all shadow-lg ${
                  loading 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                }`}
              >
                {loading ? 'Validando Código...' : 'Continuar al Paso 2 →'}
              </button>
            </div>
          </form>

        ) : (
          <form onSubmit={handleSubmitFinal} className="flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out]">
            <p className="text-gray-400 text-sm mb-2">Agrega a tu equipo de trabajo. Estos serán los perfiles donde tus clientes agendarán sus reservas directamente.</p>
            
            <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
              {barbers.map((barb, index) => (
                <div key={barb.id} className="bg-[#111] border border-gray-800 p-5 rounded-2xl relative shadow-md">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
                    <h4 className="text-[#D4AF37] font-bold text-xs uppercase tracking-widest">Profesional #{index + 1}</h4>
                    {barbers.length > 1 && (
                      <button type="button" onClick={() => handleRemoveBarber(barb.id)} className="text-red-500 hover:text-red-400 text-xs font-bold transition">Eliminar ✕</button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-400 font-semibold tracking-wide">Nombre o Apodo</label>
                      <input 
                        type="text" required placeholder="Ej. Luis F."
                        value={barb.name} onChange={e => handleUpdateBarber(barb.id, 'name', e.target.value)}
                        className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-400 font-semibold tracking-wide">Puesto / Especialidad</label>
                      <input 
                        type="text" placeholder="Ej. Master Barber"
                        value={barb.role} onChange={e => handleUpdateBarber(barb.id, 'role', e.target.value)}
                        className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-400 font-semibold tracking-wide">WhatsApp Propio (Opcional)</label>
                      <input 
                        type="text" placeholder="Vacío = usa el del Local"
                        value={barb.whatsapp} onChange={e => handleUpdateBarber(barb.id, 'whatsapp', e.target.value)}
                        className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-400 font-semibold tracking-wide">Sube su Foto de Perfil</label>
                      <input 
                        type="file" accept="image/*"
                        onChange={e => handleUpdateBarber(barb.id, 'file', e.target.files[0])}
                        className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-1.5 text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-[#1a1a1a] file:text-white hover:file:bg-[#222] transition-all text-xs cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={handleAddBarber} className="py-3 border border-dashed border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors w-full flex items-center justify-center gap-2">
              <span>+</span> Agregar otro perfil
            </button>

            <div className="flex gap-4 mt-4 pt-6 border-t border-gray-800">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-4 rounded-xl text-gray-400 hover:text-white hover:bg-[#111] transition font-bold uppercase tracking-widest text-sm border border-gray-800 w-1/3">
                Atrás
              </button>
              
              <button 
                type="submit" disabled={loading}
                className={`flex-1 py-4 rounded-xl text-md font-bold tracking-widest uppercase transition-all shadow-lg ${
                  loading 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                    : 'bg-[#25D366] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(37,211,102,0.4)]'
                }`}
              >
                {loading ? 'Subiendo...' : 'PUBLICAR NEGOCIO ✓'}
              </button>
            </div>
          </form>
        )}
      </div>
      
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
    </div>
  );
}
