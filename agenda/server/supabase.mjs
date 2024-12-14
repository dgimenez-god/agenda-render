import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://puhxfrzdgseuxegoledq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aHhmcnpkZ3NldXhlZ29sZWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjE2NDgsImV4cCI6MjA0ODE5NzY0OH0.OpYY-019B2Yw3GfwCHCrhFo7yCfkjhDHRTH9mhVhBhw';
const supabase = createClient(supabaseUrl, supabaseKey);
const DB = "appointmentsDB"

//************************************************************************/
// Funciones para manipular la base de datos
//************************************************************************/

//Leer todos los turnos
export const readAllAppointments = async () => {
  const { data, error } = await supabase.from(DB).select('*');
  if (error) {
    console.error('Error al leer todos los turnos:', error);
    return null;
  }
  return data;
};

//Inicializar un turno
export const createAppointment = async (appointment) => {
  const { data, error } = await supabase.from(DB).insert([appointment]).select('id').single();
  if (error) {
    return null; // Error se maneja en el servidor, sin log aquí
  }
  return data.id; // Solo se devuelve el id si la inserción fue exitosa
};

//Actualizar uno o varios parametros
export const updateAppointment = async (id, updatedFields) => {
  const { error } = await supabase.from(DB).update(updatedFields).eq('id', id); 
  if (error) {
    console.error('Error al actualizar el turno:', error); // Solo se logea el error si ocurre
  }
};

//Eliminar un turno
export const deleteAppointment = async (id) => {
  const { error } = await supabase.from(DB).delete().eq('id', id);
  if (error) {
    console.error('Error al eliminar el turno:', error);
  }
};

export async function getAppointmentIdByConfirmationSendId(confirmation_send_id) {
  try {
      const { data, error } = await supabase.from('appointmentsDB').select('id')
          .eq('confirmation_send_id', confirmation_send_id).single(); 
      if (error || !data) { throw new Error('Turno no encontrado o error en la consulta'); }
      return data.id;
  } catch (err) {
      console.error('Error:', err.message); 
      throw err; 
  }
}

export async function getAppointmentIdByReminderSendId(reminder_send_id) {
  try {
      const { data, error } = await supabase.from('appointmentsDB').select('id')
          .eq('reminder_send_id', reminder_send_id).single(); 
      if (error || !data) { throw new Error('Turno no encontrado o error en la consulta'); }
      return data.id;
  } catch (err) {
      console.error('Error:', err.message); 
      throw err; 
  }
}

export async function getAppointmentById(appointmentId) {
  try {
      const { data, error } = await supabase.from('appointmentsDB').select('*')
          .eq('id', appointmentId).single(); 
      if (error || !data) { throw new Error('Turno no encontrado o error en la consulta'); }
      return data;
  } catch (err) {
      console.error('Error:', err.message); 
      throw err; 
  }
}
