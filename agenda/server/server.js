/////////////
// IMPORTS //
/////////////

import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import axios from 'axios';
import { GRAPH_API_TOKEN, sendWhatsAppConfirmation, sendWhatsAppReminder, sendWhatsAppMessageText } from './whatsapp.js';  // Cambiado a import
import { createAppointment, updateAppointment, readAllAppointments, deleteAppointment, 
         getAppointmentIdByConfirmationSendId, getAppointmentIdByReminderSendId, getAppointmentById } from './supabase.mjs';

///////////////////////////
// GENERAL CONFIGURATION //
///////////////////////////

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const app = express();
const port = 5500;
// Configuración para poder leer JSON en el cuerpo de la solicitud
app.use(bodyParser.json());
// Configuración para servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public/')));
// Ruta para servir el archivo index.html
app.get('/agenda', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

//////////////////////
// GLOBAL VARIABLES //
//////////////////////

const WEBHOOK_VERIFY_TOKEN = 'mytoken';
const business_cell_number_id = '521753024347254'; // 521753024347254   -- 474399345752131
const manager_cell_number = '5493426141300'
const version = 'v21.0'; //opcional 'v21.0'

//////////////////////
// START THE SERVER //
//////////////////////

app.listen(port, () => {
  console.log(`Server is running at  port ${port}`);
});

///////////////////
//  POST-RELATED //
// J-BOX CRUD DB //
///////////////////

app.post('/supabase', async (req, res) => {
  try {
    if (req.body.action === 'create') {
      const result = await createAppointment(req.body.appointment);
      if (result) {
        console.log('Turno creado con éxito, ID:', result); // Único log de éxito
        return res.status(201).json({ id: result });
      }
      console.error('Error al guardar el turno en la base de datos'); // Único log de error
      return res.status(400).json({ success: false });
    }

    if (req.body.action === 'update') {
      // Si la acción es 'update', se actualiza el turno
      const updatedFields = req.body.appointment; // Los campos a actualizar
      const appointmentId = req.body.id; // ID del turno a actualizar

      await updateAppointment(appointmentId, updatedFields);

      console.log(`Turno con ID ${appointmentId} actualizado con éxito`); // Log de éxito
      return res.status(200).json({ success: true });
    }

    if (req.body.action === 'readAll') {
      const appointments = await readAllAppointments();
      if (appointments) {
        return res.status(200).json(appointments);
      }
      console.error('Error al obtener los turnos');
      return res.status(400).json({ success: false });
    }
    
    if (req.body.action === 'readAppointment') {
      const appointmentId = req.body.appointmentId;  // ID del turno que se quiere leer
      const appointment = await getAppointmentById(appointmentId);
      if (appointment) {
        console.log('Turno obtenido con éxito');
        return res.status(200).json(appointment);  // Devuelve los datos del turno
      }
      console.error('Error al obtener el turno');
      return res.status(400).json({ success: false });
    }

    if (req.body.action === 'delete') {
      const appointmentId = req.body.appointmentId;// ID del turno a eliminar
      await deleteAppointment(appointmentId);
    
      console.log(`Turno con ID ${appointmentId} eliminado con éxito`); // Log de éxito
      return res.status(200).json({ success: true });
    }    

    return res.status(400).json({ success: false });
  } catch (error) {
    console.error('Error al procesar la solicitud en el servidor:', error); // Log de error general
    res.status(500).json({ success: false });
  }
});

////////////////////////////////
//         POST-RELATED       //
// J-BOX TRIGGER CONVERSATION //
////////////////////////////////

// Ruta para manejar la solicitud de envío de WhatsApp
app.post('/send-whatsapp', async (req, res) => {
  const { action, cell_number, client, service, date, time, address } = req.body;

  if (action === 'confirmation'){
    try {
      // Enviar el turno por WhatsApp al cliente para que confirme o reprograme
      const confirmation_send_id = await sendWhatsAppConfirmation(cell_number, client, service, date, time, address);
      console.log('Mensaje de WhatsApp enviado con sendWhatsAppConfirmation ID:', confirmation_send_id);
      
      // Responder con un estado de éxito
      res.status(200).send({ message: 'Mensaje de WhatsApp enviado correctamente.',
                             confirmation_send_id: confirmation_send_id
      });
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
      res.status(500).send({ error: 'Error al enviar el mensaje de WhatsApp.' });
    }
  }

  if (action === 'reminder'){
    try {
      // Enviar el mensaje de WhatsApp usando la función sendWhatsAppConfirmation
      const reminder_send_id = await sendWhatsAppReminder(cell_number, client, time);
      console.log('Mensaje de WhatsApp enviado con sendWhatsAppReminder ID:', reminder_send_id);
      
      // Responder con un estado de éxito
      res.status(200).send({ message: 'Mensaje de WhatsApp enviado correctamente.' });
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
      res.status(500).send({ error: 'Error al enviar el mensaje de WhatsApp.' });
    }
  }
});

//////////////////////////////
//         GET-RELATED      //
// J-BOX RESPONDS TO CLIENT //
//////////////////////////////

// accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
app.get('/webhook', (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // check the mode and token sent are correct
  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      console.log("Webhook verified successfully!");
  } else {
      res.sendStatus(403);
  }
});
  
app.post("/webhook", async (req, res) => {
  // log incoming messages
  //console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));
  const messages = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
  console.log("Datos recibidos:", messages);
      
  // Recibo mensaje directo del cliente
  if (messages?.type === "text") {
    // extract the business number and mesage to send the reply from it
    const cell_number = messages.from
          
    // interaction business with customer
    sendWhatsAppMessageText(business_cell_number_id, cell_number, 
      "Hola! Disculpa, no manejo conversaciones directamente. " +
      "Solo puedo interactuar a través de los botones. " + 
      "Reenviaré tu mensaje al encargado, quien te contactará pronto.")
            
    // Marcar mensaje como leído
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/${version}/${business_cell_number_id}/messages`,
      headers: { Authorization: `Bearer ${GRAPH_API_TOKEN}`},
      data: { messaging_product: "whatsapp", status: "read", message_id: messages.id},
    });

    const forwardedMessage = `El nro. +${cell_number} envió el siguiente mensaje a J-Box:\n"${messages.text.body}"\nResponder al cliente por favor.`;

    await sendWhatsAppMessageText(business_cell_number_id, manager_cell_number, forwardedMessage);
  }
  
  // Bloque para mensajes de tipo botón
  if (messages?.type === "button") {
    const buttonResponse = messages.button?.text?.toUpperCase();
    const cell_number = messages.from

    if (buttonResponse === "GENIAL!") {
      const appointmentID = await getAppointmentIdByConfirmationSendId(messages.context?.id);
      await updateAppointment(appointmentID, { confirmed: true });      
      console.log(`Turno con ID ${appointmentID} actualizado con éxito en la DB`); 
      await sendWhatsAppMessageText(business_cell_number_id, cell_number, "Genial! Nos vemos...", messages.id);
    }

    if (buttonResponse === "REPROGRAMEMOS") {      
      const appointmentID = await getAppointmentIdByConfirmationSendId(messages.context?.id);
      await deleteAppointment(appointmentID);
      await sendWhatsAppMessageText(business_cell_number_id, cell_number, 
        "Ok. Reenviaré tu mensaje al encargado, quien te contactará pronto.", messages.id);
      const forwardedMessage = `El nro. +${cell_number} pide reprogramar su turno. Asignar nuevo turno al cliente por favor.`;
      await sendWhatsAppMessageText(business_cell_number_id, manager_cell_number, forwardedMessage);
    }

    if (buttonResponse === "CANCELAR TURNO") {
      const appointmentID = await getAppointmentIdByReminderSendId(messages.context?.id);
      await deleteAppointment(appointmentID);
      await sendWhatsAppMessageText(business_cell_number_id, cell_number, 
        "Ok. Su turno se ha cancelado.", messages.id);
      const forwardedMessage = `El nro. +${cell_number} canceló su turno. El turno se eliminó de la agenda.`;
      await sendWhatsAppMessageText(business_cell_number_id, manager_cell_number, forwardedMessage);
    }

    // Marcar mensaje como leído
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/${version}/${business_cell_number_id}/messages`,
      headers: { Authorization: `Bearer ${GRAPH_API_TOKEN}`},
      data: { messaging_product: "whatsapp", status: "read", message_id: messages.id},
    });
  }
  res.sendStatus(200);
});

/////////////////////////////
// DELETE OLD APPOINTMENTS //
/////////////////////////////
const CLEANUP_INTERVAL = 12 * 60 * 60 * 1000; // Cada 12 horas (en milisegundos)
const DATE_LIMIT_DAYS = 7; // Turnos con más de 7 días serán eliminados

const cleanOldAppointments = async () => {
  try {
    console.log('Iniciando limpieza de turnos antiguos...');

    // Fecha límite: Hoy menos `DATE_LIMIT_DAYS`
    const now = new Date();
    const dateLimit = new Date();
    dateLimit.setDate(now.getDate() - DATE_LIMIT_DAYS);

    // Obtener todos los turnos
    const appointments = await readAllAppointments();

    if (!appointments) {
      console.error('Error al obtener los turnos.');
      return;
    }

    // Filtrar turnos anteriores a la fecha límite
    const appointmentsToDelete = appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.start); // Asegúrate de que appointment.date sea válido
      return appointmentDate < dateLimit;
    });

    // Eliminar cada turno filtrado
    for (const appointment of appointmentsToDelete) {
      await deleteAppointment(appointment.id);
      console.log(`Turno con ID ${appointment.id} eliminado.`);
    }

    console.log(`${appointmentsToDelete.length} turnos antiguos eliminados.`);
  } catch (error) {
    console.error('Error durante la limpieza de turnos antiguos:', error);
  }
};

// Ejecutar limpieza periódica
setInterval(cleanOldAppointments, CLEANUP_INTERVAL);

//////////////////////////////
// SEND REMINDER TO CLIENTS //
//////////////////////////////

const REMINDER_INTERVAL = 30 * 60 * 1000; // Cada 30 minutos
const REMINDER_WINDOW_HOURS = 4; // En las próximas 4 horas

const sendReminders = async () => {
  try {
    console.log('Iniciando proceso de envío de recordatorios... ');

    // Fecha y hora actuales
    const now = new Date();

    // Fecha y hora límite: Dentro de las próximas 4 horas
    const reminderLimit = new Date();
    reminderLimit.setHours(now.getHours() + REMINDER_WINDOW_HOURS);

    // Obtener todos los turnos
    const appointments = await readAllAppointments();

    if (!appointments) {
      console.error('Error al obtener los turnos.');
      return;
    }

    // Filtrar turnos dentro de la ventana de las próximas 4 horas y que no hayan recibido recordatorio
    const appointmentsToRemind = appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.start); // Asegúrate de que appointment.start sea válido
      return (
        appointmentDate >= now &&
        appointmentDate <= reminderLimit &&
        appointment.reminder_send === false &&
        appointment.confirmed === true
      );
    });

    // Enviar recordatorio para cada turno filtrado
    for (const appointment of appointmentsToRemind) {
      const { id, cell_number, client, service, start } = appointment;

      // Obtener fecha y hora del turno
      const appointmentDate = new Date(start);
      const time = appointmentDate.toLocaleTimeString('es-AR', {
        hour: '2-digit', minute: '2-digit', hour12: false, 
        timeZone: 'America/Argentina/Buenos_Aires',
      });
      const date = appointmentDate.toLocaleDateString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
      });

      
      try {
        // Enviar mensaje de WhatsApp
        const reminder_send_id = await sendWhatsAppReminder(cell_number, client, time);

        console.log(`Recordatorio enviado al cliente ${client} para el turno ${id}. Mensaje ID: ${reminder_send_id}`);

        // Actualizar el parámetro `reminder_send` a true en la base de datos
        await updateAppointment(id, { reminder_send: true , reminder_send_id: reminder_send_id });
      } catch (error) {
        console.error(`Error al enviar recordatorio para el turno ${id}:`, error);
      }
    }

    console.log(`${appointmentsToRemind.length} recordatorios enviados.`);
  } catch (error) {
    console.error('Error durante el envío de recordatorios:', error);
  }
};

// Ejecutar proceso de envío de recordatorios periódicamente
setInterval(sendReminders, REMINDER_INTERVAL);
