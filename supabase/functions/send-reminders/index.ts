import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// IMPORTANTE: Asegúrate de configurar los secretos de entorno en Supabase:
// supabase secrets set TWILIO_ACCOUNT_SID=tu_sid TWILIO_AUTH_TOKEN=tu_token TWILIO_PHONE_NUMBER=tu_numero

serve(async (req) => {
  try {
    // 1. Iniciar cliente Supabase usando la clave Service Role para tener permisos plenos (bypassing RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("🔔 Iniciando tarea de recordatorios...")

    // 2. Determinar la fecha de HOY en formato YYYY-MM-DD
    const now = new Date()
    // Nota: Dependiendo de tu ubicación, tal vez necesites ajustar el timezone,
    // pero por defecto usar Date() en el servidor suele acercarse al UTC.
    // Para no complicarlo, traemos las reservas de "hoy" (o próximas 24h).
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`

    // 3. Obtener reservas confirmadas de hoy que NO tengan recordatorio_enviado en true
    const { data: reservas, error: fetchErr } = await supabase
      .from('reservas')
      .select('*, barbershops(business_name)')
      .eq('fecha', todayStr)
      .eq('status', 'Confirmada')
      .or('recordatorio_enviado.is.null,recordatorio_enviado.eq.false')

    if (fetchErr) throw fetchErr

    if (!reservas || reservas.length === 0) {
      console.log("✅ No hay citas pendientes de procesar hoy.")
      return new Response(JSON.stringify({ message: "No pending reminders." }), { 
        headers: { "Content-Type": "application/json" } 
      })
    }

    // Convertir la "hora" (ej. "02:30 PM") a minutos desde la medianoche
    const timeToMinutes = (timeStr: string) => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (!match) return -1
      let h = parseInt(match[1], 10)
      const m = parseInt(match[2], 10)
      const ap = match[3].toUpperCase()
      if (ap === 'PM' && h < 12) h += 12
      if (ap === 'AM' && h === 12) h = 0
      return h * 60 + m
    }

    const nowMins = now.getHours() * 60 + now.getMinutes()
    const remindersToUpdate = []
    const notificationPromises = []

    // Constantes de Twilio (Opción A - Sugerida por el usuario)
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER')

    for (const res of reservas) {
      const slotMins = timeToMinutes(res.hora)
      if (slotMins < 0) continue

      // Calcular diferencia en minutos (Cita - Ahora)
      const diff = slotMins - nowMins

      // Si la cita es dentro de los próximos 30-45 minutos (margen por si el cron corre cada 15)
      // Ajusta este rango si decides que el cron corra con otra frecuencia.
      if (diff > 0 && diff <= 45) {
        
        const clientName = res.cliente_nombre || 'Cliente'
        const shopName = res.barbershops?.business_name || 'la barbería'
        const phone = res.cliente_telefono

        const msgText = `¡Hola ${clientName}! 💈 Te recordamos que tu cita en ${shopName} es en 30 minutos. ¡Ya nos estamos preparando para recibirte! 🚀`
        
        console.log(`📩 Preparando SMS/WS para: ${phone}...`)

        // Enviar vía Twilio
        if (twilioSid && twilioToken && twilioPhone && phone) {
           const toPhone = phone.startsWith('+') ? phone : '+' + phone

           const twilioParams = new URLSearchParams({
               To: toPhone,
               From: twilioPhone,
               Body: msgText,
           })

           const twilioProm = fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/x-www-form-urlencoded',
                 'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`)
               },
               body: twilioParams.toString()
           })
           .then(resp => resp.json())
           .then(data => {
               if (data.error_message) console.error("❌ Twilio Error:", data.error_message)
               else console.log("✅ Twilio SMS/WS Enviado:", data.sid)
           })
           .catch(e => console.error('Error de red al llamar a Twilio:', e))
           
           notificationPromises.push(twilioProm)
        } else {
           console.warn(`⚠️ Variables de entorno TWILIO faltantes, simulando mensaje a [${phone}]: ${msgText}`)
        }

        remindersToUpdate.push(res.id)
      }
    }

    // Esperar a que terminen los llamados a Twilio
    await Promise.all(notificationPromises)

    // Marcar como 'enviado' para que no se reenvíen
    if (remindersToUpdate.length > 0) {
       console.log(`Guardando cambios de estado en DB para ${remindersToUpdate.length} cita(s)...`)
       const { error: updateErr } = await supabase
         .from('reservas')
         .update({ recordatorio_enviado: true })
         .in('id', remindersToUpdate)
       
       if (updateErr) throw updateErr
    }

    return new Response(JSON.stringify({ success: true, processed: remindersToUpdate.length }), { 
       headers: { "Content-Type": "application/json" } 
    })
  } catch (err) {
    console.error("🚨 Error crítico en función:", err)
    return new Response(JSON.stringify({ error: err.message }), { 
       status: 500, 
       headers: { "Content-Type": "application/json" } 
    })
  }
})
