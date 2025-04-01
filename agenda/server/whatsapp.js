///////////////////////////
// GENERAL CONFIGURATION //
///////////////////////////

import axios from 'axios'; // Esto es necesario para que axios funcione

//Configura las credenciales
export const GRAPH_API_TOKEN = 'EAASPsZAWiVcwBO1nSlyNabCpN6ZAzAm7v2TB7NAIttxzD1fZBIaiyZBJZBZASWkrRGZBHJoHAUH7HzPkqajM2mzLjbMEq5oEJo4UZAhboZCBjRXdilF0XUS1gvT05IhPWTkh2aZCZA6RQTXO4diRYGSTkeY70Ldwjg261SP5r1jxs8Ti6w0iJYKWTE5QIsE4ZAd0pnDX9hsZCrbXRkNud9nz2';
const token = 'EAASPsZAWiVcwBO1nSlyNabCpN6ZAzAm7v2TB7NAIttxzD1fZBIaiyZBJZBZASWkrRGZBHJoHAUH7HzPkqajM2mzLjbMEq5oEJo4UZAhboZCBjRXdilF0XUS1gvT05IhPWTkh2aZCZA6RQTXO4diRYGSTkeY70Ldwjg261SP5r1jxs8Ti6w0iJYKWTE5QIsE4ZAd0pnDX9hsZCrbXRkNud9nz2';
const business_cell_number_id = '521753024347254'; // 521753024347254 JBOX  -- 474399345752131
const version = 'v21.0';

////////////////////////
// WHATSAPP FUNCTIONS //
//  TO SEND MESSAGES  //
////////////////////////

//Función para enviar un turno
export async function sendWhatsAppConfirmation(cell_number,client,service,date,time,address) {
  try {
      const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/${version}/${business_cell_number_id}/messages`,
      headers: {'Authorization': `Bearer ${token}`,'Content-Type': 'application/json'},
      data:{messaging_product:"whatsapp", to:cell_number, type:"template",
            template: {name:"confirmacion_turno", language:{code:"es"},
                       components: [{type:"header", parameters: [{type:"image", image: {link:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFoO0ZzhE1zBTQuPwpRLxfdHyYvMpVktCuAQ&s"}}]},
                                    {type:"body", parameters: [{type:"text", text:client}, {type:"text", text:service},{type:"text", text:date}, {type:"text", text:time}, {type:"text", text:address}]}]
            }
      }
    });
    console.log('Mensaje enviado con éxito:', response.data);
    const confirmation_id = response.data.messages[0].id;
    return confirmation_id;
  } catch (error) {
      console.error('Error al enviar el mensaje:', error.response ? error.response.data : error.message);
      return null;
  }
}

//Función para enviar recordatorio
export async function sendWhatsAppReminder(cell_number, client, time) {
  try {
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/${version}/${business_cell_number_id}/messages`,
      headers: {'Authorization': `Bearer ${token}`,'Content-Type': 'application/json'},
      data:{messaging_product: "whatsapp",to: cell_number, type: "template", 
            template: {name: "recordatorio",language: {code: "es_AR"},
                       components: [{type: "body",parameters: [{type: "text",text: client},{type: "text",text: time}]}]
            }
      }
    });
    console.log('Mensaje enviado con éxito:', response.data);
    const reminder_id = response.data.messages[0].id;
    return reminder_id;
  } catch (error) {
    console.error('Error al enviar el mensaje:', error.response ? error.response.data : error.message);
    return null;
  }
}

//Función para enviar un mensaje de whatsapp con texto 
export async function sendWhatsAppMessageText(from, cell_number, message, replyToMessageId = null) {
  try {
    console.log(replyToMessageId)
        // Preparamos los datos para la solicitud
    const data = {messaging_product:'whatsapp', to:cell_number, type:'text',text: { body:message }};
    
    // Si se proporciona un ID de mensaje, lo añadimos para hacer una respuesta
    if (replyToMessageId) { data.context = { message_id: replyToMessageId }; }

    // Realizamos la solicitud POST a la API de WhatsApp
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/${version}/${from}/messages`,
      headers: {
        'Authorization': `Bearer ${GRAPH_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: data
    });

    // Obtener el ID del mensaje enviado
    const messageId = response.data.messages[0].id;
    return messageId;
  } catch (error) {
    console.error('Error al enviar el mensaje:', error.response ? error.response.data : error.message);
  }
}  
