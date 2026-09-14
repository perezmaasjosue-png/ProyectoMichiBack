async function enviarConfirmacionMensaje({ numeroTelefono, acceso, texto }) {
  if (!process.env.WHATSAPP_API_URL) {
    console.log('[whatsappService] WHATSAPP_API_URL no configurado, mensaje no enviado:', texto);
    return { enviado: false, motivo: 'WHATSAPP_API_URL no configurado' };
  }

  try {
    const respuesta = await fetch(`${process.env.WHATSAPP_API_URL.replace(/\/$/, '')}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeroTelefono, acceso, texto }),
    });

    if (!respuesta.ok) {
      throw new Error(`WhatsApp API respondió ${respuesta.status}`);
    }

    return { enviado: true };
  } catch (error) {
    console.error('[whatsappService] Error enviando mensaje WhatsApp:', error.message);
    return { enviado: false, motivo: error.message };
  }
}

module.exports = { enviarConfirmacionMensaje };