import { startPolling, stopPolling } from './polling.js';

document.addEventListener('DOMContentLoaded', async function () {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridDay',
        allDaySlot: false,
        slotMinTime: '09:00:00',
        slotMaxTime: '17:00:00',
        slotDuration: '00:30:00',
        nowIndicator: true,
        locale: 'es',
        editable: true,
        selectable: true,
        slotLabelFormat: {
            hour: 'numeric',
            minute: '2-digit'
        },
        viewDidMount: function (info) {
            const minTime = calendar.getOption('slotMinTime');
            const maxTime = calendar.getOption('slotMaxTime');
            const slotDuration = calendar.getOption('slotDuration');

            const minutesMin = (parseInt(minTime.split(':')[0]) * 60) + parseInt(minTime.split(':')[1]);
            const minutesMax = (parseInt(maxTime.split(':')[0]) * 60) + parseInt(maxTime.split(':')[1]);
            const minutesDuration = (parseInt(slotDuration.split(':')[0]) * 60) + parseInt(slotDuration.split(':')[1]);

            const totalSlots = Math.ceil((minutesMax - minutesMin) / minutesDuration);

            document.documentElement.style.setProperty('--total-slots', totalSlots);
        },

        events: function (_fetchInfo, successCallback, failureCallback) {
            axios.post('/supabase', { action: 'readAll' })
                .then(response => {
                    const appointments = response.data
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
                    successCallback(events);
                })
                .catch(error => {
                    console.error('Error al cargar los turnos:', error);
                    failureCallback(error);
                });
        },

        eventContent: function (arg) {
            let customContent = document.createElement('div');
            const currentView = arg.view.type;
            if (currentView === 'timeGridWeek') {
                customContent.innerHTML = '';
            } else {
                customContent.innerHTML = arg.event.title;
            }
            return { domNodes: [customContent] };
        },

        businessHours: [
            {
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '09:00:00',
                endTime: '17:00:00',
            },
            {
                daysOfWeek: [6],
                startTime: '08:30:00',
                endTime: '13:00:00',
            },
        ],

        headerToolbar: {
            left: 'prev next today',
            center: 'title',
            right: 'timeGridDay timeGridWeek'
        },

        titleFormat: {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        },

        buttonText: {
            prev: '<',
            next: '>',
            today: 'Hoy',
            timeGridDay: 'Día',
            timeGridWeek: 'Semana'
        },

        views: {
            timeGridWeek: {
                hiddenDays: [0], // El domingo (0) se ocultará
            }
        },

        dateClick: function (info) {
            Modals.createAssignModal(calendar, info);
        },

        eventClick: async function (info) {
            const appointmentId = Number(info.event.id);

            try {
                // Lee los datos del appointment desde Supabase
                const response = await axios.post('/supabase', {
                    action: 'readAppointment',
                    appointmentId: appointmentId
                });

                const appointment = response.data;

                if (appointment) {
                    // Pasa los datos al modal para editar o cancelar
                    Modals.createUpdateCancelModal(calendar, appointment);
                } else {
                    console.error('No se encontró el turno con ID:', appointmentId);
                }
            } catch (error) {
                console.error('Error al obtener el turno por ID:', appointmentId, error);
            }
        },

        eventResize: function (info) {
            const newEndDate = info.event.end;
            axios.post('/supabase', { action: 'update', id: Number(info.event.id), appointment: { end: newEndDate.toISOString() } })
                .then(response => { console.log('Turno actualizado correctamente en la base de datos'); })
                .catch(error => { console.error('Error al actualizar el turno en la base de datos:', error); });
        },

        eventDrop: function (info) {
            const newStartDate = info.event.start;
            const newEndDate = info.event.end;

            axios.post('/supabase', {
                action: 'update', id: Number(info.event.id),
                appointment: {
                    start: newStartDate.toISOString(),
                    end: newEndDate.toISOString(),
                    confirmation_send: false,
                    confirmed: false,
                    confirmation_send_id: null
                }
            })
                .then(async () => {
                    console.log('Turno actualizado en la DB con nuevos horarios');
                    try {
                        const response = await axios.post('/supabase', {
                            action: 'readAppointment',
                            appointmentId: Number(info.event.id)
                        });
                        const updatedAppointment = response.data;

                        const date = newStartDate.toLocaleDateString("es-AR");
                        const time = newStartDate.toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit', hour12: false });
                        const address = 'Don Bosco 740 (Paraná)';

                        try {
                            const whatsappResponse = await axios.post('/send-whatsapp', {
                                action: 'confirmation',
                                cell_number: updatedAppointment.cell_number,
                                client: updatedAppointment.client,
                                service: updatedAppointment.service,
                                date: date,
                                time: time,
                                address: address
                            });
                            await axios.post('/supabase', {
                                action: 'update',
                                id: Number(info.event.id),
                                appointment: { confirmation_send: true, confirmation_send_id: whatsappResponse.data.confirmation_send_id }
                            });
                        } catch (error) {
                            console.error('Error al enviar el mensaje de WhatsApp:', error);
                        }
                    } catch (error) {
                        console.error('Error al obtener el turno por ID:', Number(info.event.id));
                    }
                })
                .catch((error) => {
                    console.error('Error al actualizar el turno en la DB', error);
                });
        }
    });

    window.calendar = calendar;
    calendar.render();

    // Inicia el polling después de que el calendario se ha renderizado
    startPolling();
});
