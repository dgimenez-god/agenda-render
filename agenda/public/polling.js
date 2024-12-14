let pollingInterval;
let failedAttempts = 0;
const MAX_FAILED_ATTEMPTS = 4; // Límite de intentos fallidos
const POLL_INTERVAL = 5 * 1000; // Intervalo de polling en milisegundos (5 segundos)
const RETRY_INTERVAL = 2 * 60 * 1000; // Intervalo para intentar reiniciar el polling después de fallos (2 minutos)
let retryTimeout; // Temporizador para reintentos

function startPolling() {
    pollingInterval = setInterval(async function() {
        try {
            const response = await axios.post('/supabase', { action: 'readAll' });
            const appointments = response.data;

            // Asegúrate de que `calendar` es accesible globalmente
            if (window.calendar) {
                updateCalendarEvents(appointments);
            }

            failedAttempts = 0; // Resetear contador de intentos fallidos después de un éxito
        } catch (error) {
            console.log('Error al hacer polling de los turnos:', error);
            failedAttempts++;

            if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                console.log(`Se alcanzó el límite de intentos fallidos (${MAX_FAILED_ATTEMPTS}). Deteniendo el polling.`);
                stopPolling();

                // Intentar reactivar el polling después de RETRY_INTERVAL
                clearTimeout(retryTimeout); // Cancelar cualquier intento previo de reintentar
                retryTimeout = setTimeout(tryReconnect, RETRY_INTERVAL); // Reintentar después del intervalo de reintento
            }
        }
    }, POLL_INTERVAL); // 5000ms = 5 segundos
}

function stopPolling() {
    clearInterval(pollingInterval);
}

function tryReconnect() {
    console.log('Intentando reconectar...');

    // Intenta hacer una llamada simple para verificar si el servidor está disponible
    axios.post('/supabase', { action: 'readAll' })
        .then(response => {
            console.log('Conexión restablecida, reiniciando el polling.');
            failedAttempts = 0; // Resetear el contador de intentos fallidos
            startPolling(); // Reiniciar el polling
        })
        .catch(error => {
            console.error('No se pudo restablecer la conexión, reintentando en breve.', error);
            retryTimeout = setTimeout(tryReconnect, RETRY_INTERVAL); // Volver a intentar después del mismo intervalo
        });
}

function updateCalendarEvents(appointments) {
    const events = appointments.map(appointment => {
        const durationMinutes = (new Date(appointment.end) - new Date(appointment.start)) / (1000 * 60);

        let eventTitle;
        if (durationMinutes <= 60) {
            eventTitle = `
                <img src="./images/client.png" alt="Cliente:" class="icon" /> ${appointment.client}<br> 
                <img src="./images/check.png" alt="Confirmado:" class="icon" /> ${appointment.confirmed ? 'Si' : 'No'}
            `;
        } else {
            eventTitle = `
                <img src="./images/service.png" alt="Servicio:" class="icon" /> ${appointment.service}<br> 
                <img src="./images/client.png" alt="Cliente:" class="icon" /> ${appointment.client}<br> 
                <img src="./images/car.png" alt="Coche:" class="icon" /> ${appointment.car}<br> 
                <img src="./images/check.png" alt="Confirmado:" class="icon" /> ${appointment.confirmed ? 'Si' : 'No'}
            `;
        }

        return {
            id: appointment.id,
            title: eventTitle,
            start: appointment.start,
            end: appointment.end,
            cell_number: appointment.cell_number,
            color: ServiceColor.getServiceColor(appointment.service)
        };
    });

    // Actualiza los eventos en el calendario
    window.calendar.removeAllEvents(); // Limpiar los eventos actuales
    window.calendar.addEventSource(events); // Añadir los nuevos eventos
}

export { startPolling, stopPolling };
