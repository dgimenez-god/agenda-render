const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://puhxfrzdgseuxegoledq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aHhmcnpkZ3NldXhlZ29sZWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjE2NDgsImV4cCI6MjA0ODE5NzY0OH0.OpYY-019B2Yw3GfwCHCrhFo7yCfkjhDHRTH9mhVhBhw';
const supabase = createClient(supabaseUrl, supabaseKey);

// Leo la tabla
(async () => {
    let { data, error } = await supabase.from('Agenda').select('*');
    if (error) console.error(error);
    else console.log(data);
    console.log("Fin");
  })();

// Creo una fila

  (async () => {
    // Inserta una fila en la tabla
    const { data, error } = await supabase
      .from('Agenda') // Cambia por el nombre exacto de tu tabla
      .insert([
        {
          idWA: 'WA1234567890', // Identificador de WhatsApp
          fecha: '2024-11-27', // Fecha en formato 'YYYY-MM-DD'
          hora: '21:00:00-03', // Hora en formato 'HH:MM:SS-TZ' (con zona horaria)
          servicio: 'audio', // Servicio que estás añadiendo
          confirmacion: false // Estado de confirmación
        }
      ]);
  
    if (error) {
      console.error('Error al insertar la fila:', error);
    } else {
      console.log('Fila insertada con éxito:', data);
    }
  })();

// actualizo una variable
(async () => {
    // Actualiza el valor de la columna 'confirmado' a FALSE donde id = 1
    const { data, error } = await supabase
      .from('Agenda') // El nombre de tu tabla
      .update({
        confirmacion: false, // Valor nuevo para 'confirmado'
      })
      .eq('id', 2); // Condición: solo filas donde id sea igual a 1
  
    if (error) {
      console.error('Error al actualizar la fila:', error);
    } else {
      console.log('Fila actualizada con éxito:', data);
    }
  })();