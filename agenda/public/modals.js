const Modals = {
    // Modal para asignar un turno
    createAssignModal: function(calendar, dateInfo) {
        const selectedDate = new Date(dateInfo.date); // Usar dateInfo.date para obtener la fecha
        const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear().toString().slice(-2)} ${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}hs`;
    
        const modalContent = `
            <div id="modal-overlay" class="modal-overlay"></div>
            <div id="assign-modal" class="assign-modal">
                <h3 class="modal-title">Asignar Turno</h3>
                <p class="modal-date">${formattedDate}</p> 
    
                <label for="service" class="label">Servicio:</label><br>
                <div class="service-options">
                    <input type="radio" name="service" value="Polarizado" checked id="service-polarizado">
                    <label for="service-polarizado" class="service-label">Polarizado</label>
    
                    <input type="radio" name="service" value="Grabado" id="service-grabado">
                    <label for="service-grabado" class="service-label">Grabado</label>
    
                    <input type="radio" name="service" value="Audio" id="service-audio">
                    <label for="service-audio" class="service-label">Audio</label>
                </div>
    
                <label for="duration" class="label">Duración:</label>
                <div class="duration-control">
                    <button id="decreaseDuration" class="btn-control"> &ndash; </button>
                    <span id="durationDisplay" class="duration-display">2.0hs</span>
                    <button id="increaseDuration" class="btn-control">+</button>
                </div>
    
                <label for="client" class="label">Cliente:</label>
                <input type="text" id="client" class="input-field">
    
                <label for="cell_number" class="label">Celular:</label>
                <input type="text" id="cell_number" class="input-field">
    
                <label for="car" class="label">Coche:</label>
                <input type="text" id="car" class="input-field">
    
                <div class="buttons">
                    <button id="saveAssignedEvent" class="btn-save">Guardar</button>
                    <button id="closeAssignModal" class="btn-close">Cerrar</button>
                </div>
            </div>
        `;
    
        document.body.insertAdjacentHTML('beforeend', modalContent);
        this.setupAssignModalListeners(calendar, dateInfo);
    },

    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modal-overlay');
        if (modal) {
            modal.parentNode.removeChild(modal);
        }
        if (overlay) {
            overlay.parentNode.removeChild(overlay);
        }
    },

    // Modal para actualizar o cancelar un turno
    createUpdateCancelModal: function(calendar, appointment) {
        const formattedDate = new Date(appointment.start).toLocaleString('es-AR', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', 
            hour12: false, timeZone: 'America/Argentina/Buenos_Aires' 
        }).replace(',', '')+ 'hs';

        const duration = ((new Date(appointment.end) - new Date(appointment.start)) / 3600000).toFixed(1);
        const formattedDuration = `${parseFloat(duration)}hs`;

        const modalContent = `
            <div id="modal-overlay" class="modal-overlay"></div>
            <div id="update-cancel-modal" class="assign-modal">
                <h3 class="modal-title">Actualizar o Cancelar Turno</h3>
                <p class="modal-date">${formattedDate}</p>
    
                <label for="service" class="label">Servicio:</label><br>
                <div class="service-options">
                    <input type="radio" name="service" value="Polarizado" ${appointment.service === 'Polarizado' ? 'checked' : ''} id="service-polarizado">
                    <label for="service-polarizado" class="service-label">Polarizado</label>
    
                    <input type="radio" name="service" value="Grabado" ${appointment.service === 'Grabado' ? 'checked' : ''} id="service-grabado">
                    <label for="service-grabado" class="service-label">Grabado</label>
    
                    <input type="radio" name="service" value="Audio" ${appointment.service === 'Audio' ? 'checked' : ''} id="service-audio">
                    <label for="service-audio" class="service-label">Audio</label>
                </div>

                <label for="duration" class="label">Duración:</label>
                <div class="duration-control">
                    <button id="decreaseDuration" class="btn-control"> &ndash; </button>
                    <span id="durationDisplay" class="duration-display">${formattedDuration}</span>
                    <button id="increaseDuration" class="btn-control">+</button>
                </div>
    
                <label for="client" class="label">Cliente:</label>
                <input type="text" id="client" class="input-field" value="${appointment.client || ''}">
    
                <label for="cell_number" class="label">Celular:</label>
                <input type="text" id="cell_number" class="input-field" value="${appointment.cell_number || ''}">
    
                <label for="car" class="label">Coche:</label>
                <input type="text" id="car" class="input-field" value="${appointment.car || ''}">
    
                <div class="buttons">
                    <button id="saveUpdatedEvent" class="btn-save">Actualizar</button>
                    <button id="cancelEvent" class="btn-cancel">Cancelar</button>
                    <button id="closeUpdateCancelModal" class="btn-close">Cerrar</button>
                </div>
            </div>
        `;
    
        document.body.insertAdjacentHTML('beforeend', modalContent);
        this.setupUpdateCancelModalListeners(calendar, appointment);
    },

    // Configurar los listeners del modal de asignación
    setupAssignModalListeners: function(calendar, dateInfo) {
        let durationMinutes = 120; // Initial duration in minutes (2 hours)
        const durationDisplay = document.getElementById('durationDisplay');

        // Update the displayed duration
        function updateDurationDisplay() {
            durationDisplay.textContent = `${(durationMinutes / 60).toFixed(1)}hs`;
        }

        // Increase duration by 30 minutes
        document.getElementById('increaseDuration').addEventListener('click', () => {
            durationMinutes += 30;
            updateDurationDisplay();
        });

        // Decrease duration by 30 minutes, but not less than 30 minutes
        document.getElementById('decreaseDuration').addEventListener('click', () => {
            if (durationMinutes > 30) {
                durationMinutes -= 30;
                updateDurationDisplay();
            }
        });

        document.getElementById('saveAssignedEvent').addEventListener('click', async function() {
            const service = document.querySelector('input[name="service"]:checked').value;
            const client = document.getElementById('client').value;
            const cell_number = document.getElementById('cell_number').value;
            const car = document.getElementById('car').value;
            const confirmed = false;
            const startDate = dateInfo.date;
            const endDate = new Date(startDate);
            endDate.setMinutes(startDate.getMinutes() + durationMinutes); // Adjust end date based on selected duration
            const startDateISO = startDate.toISOString();
            const endDateISO = endDate.toISOString();

            if (service && client) {
                try {
                    // Crear nuevo turno en la base de datos
                    const appointment = {
                        start: startDateISO,
                        end: endDateISO,
                        service: service,
                        client: client,
                        cell_number: cell_number,
                        car: car,
                        confirmation_send: false,
                        confirmed: false,
                        reminder_send: false,
                        confirmation_send_id: null,
                        reminder_send_id: null
                    };

                    let id;
                    try {
                        const response = await axios.post('/supabase', { action: 'create', appointment });
                        id = response.data.id;
                    } catch (error) {
                        alert('Hubo un error al guardar el turno. Por favor, intenta nuevamente.');                    
                    };
                    
                    // Añadir evento al calendario
                    const newEvent = {
                        id: id,
                        title: (durationMinutes <= 60) 
                        ? `<img src="./images/client.png" alt="Cliente:" class="icon" /> ${client}<br> 
                            <img src="./images/check.png" alt="Confirmado:" class="icon" /> ${confirmed ? 'Si' : 'No'}`
                        : `<img src="./images/service.png" alt="Servicio:" class="icon" /> ${service}<br> 
                           <img src="./images/client.png" alt="Cliente:" class="icon" /> ${client}<br> 
                           <img src="./images/car.png" alt="Coche:" class="icon" /> ${car}<br> 
                           <img src="./images/check.png" alt="Confirmado:" class="icon" /> ${confirmed ? 'Si' : 'No'}`,
                        start: startDateISO,
                        end: endDateISO,
                        allDay: false,
                        cell_number: cell_number,
                        client: client,
                        color: ServiceColor.getServiceColor(service)
                    };

                    calendar.addEvent(newEvent);
                    
                    const date = startDate.toLocaleDateString("es-AR"); // Formato de fecha: 30/10
                    const time = startDate.toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit', hour12: false }); // Formato de hora: 21.00hs
                    const address = 'Don Bosco 740 (Paraná)'

                    // Enviar solicitud para que el servidor mande el mensaje de WhatsApp
                    try {
                        const response = await axios.post('/send-whatsapp', {
                            action: 'confirmation',
                            cell_number: cell_number,
                            client: client,
                            service: service,
                            date: date,
                            time: time,
                            address: address
                        });

                        await axios.post('/supabase', {
                            action: 'update',
                            id: id,
                            appointment: {confirmation_send: true, confirmation_send_id: response.data.confirmation_send_id}
                        });

                        Modals.closeModal('assign-modal');
                    } catch (error) {
                        console.error('Error al enviar el mensaje de WhatsApp:', error);
                    }
                } catch (error) {
                    console.error('Error al crear el evento:', error);
                }
            } else {
                alert('Por favor, completa todos los campos requeridos.');
            }
        });

        document.getElementById('closeAssignModal').addEventListener('click', function() {
            Modals.closeModal('assign-modal');
        });
    },

    // Configurar los listeners del modal de actualización/cancelación
    setupUpdateCancelModalListeners: function(calendar, appointment) {
        let durationMinutes = 120; // Initial duration in minutes (2 hours)
        const durationDisplay = document.getElementById('durationDisplay');

        // Update the displayed duration
        function updateDurationDisplay() {
            durationDisplay.textContent = `${(durationMinutes / 60).toFixed(1)}hs`;
        }

        // Increase duration by 30 minutes
        document.getElementById('increaseDuration').addEventListener('click', () => {
            durationMinutes += 30;
            updateDurationDisplay();
        });

        // Decrease duration by 30 minutes, but not less than 30 minutes
        document.getElementById('decreaseDuration').addEventListener('click', () => {
            if (durationMinutes > 30) {
                durationMinutes -= 30;
                updateDurationDisplay();
            }
        });

        document.getElementById('saveUpdatedEvent').addEventListener('click', async function() {
            const service = document.querySelector('input[name="service"]:checked').value;
            const client = document.getElementById('client').value;
            const cell_number = document.getElementById('cell_number').value;
            const car = document.getElementById('car').value;
            const startDate = new Date(appointment.start);
            const endDate = new Date(startDate);
            endDate.setMinutes(startDate.getMinutes() + durationMinutes); // Adjust end date based on selected duration
            const startDateISO = startDate.toISOString();
            const endDateISO = endDate.toISOString();
        
            if (service && client) {
                try {        
                    // Si el número de teléfono no ha cambiado, solo actualizamos los campos permitidos
                    if (cell_number === appointment.cell_number) {
                         await axios.post('/supabase', { action: 'update', id: appointment.id, 
                            appointment: { 
                                service: service,
                                client: client,
                                cell_number: cell_number,
                                car: car,
                                end: endDateISO
                            }
                         });
                    } else {
                        // Si cell_number ha cambiado:
                        // 1) Actualizamos los campos `confirmation_send`, `confirmed`, `reminder_send` a false
                        await axios.post('/supabase', { action: 'update', id: appointment.id, 
                            appointment: {
                                service: service,
                                client: client,
                                cell_number: cell_number,
                                car: car,
                                end: endDateISO,
                                confirmation_send: false,
                                confirmed: false,
                                reminder_send: false
                            } 
                        });
        
                        // 3) Enviamos el mensaje de WhatsApp al nuevo número
                        const startDate = new Date(appointment.start);
                        const date = startDate.toLocaleDateString('es-AR');
                        const time = startDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

                        const response = await axios.post('/send-whatsapp', {
                            action: 'confirmation',
                            cell_number: cell_number,
                            client: client,
                            service: service,
                            date: date,
                            time: time,
                            address: 'Don Bosco 740 (Paraná)'
                        });
        
                        // 4) Actualizamos `confirmation_send` en la base de datos
                        await axios.post('/supabase', { action: 'update', id: appointment.id,
                            appointment: { 
                                confirmation_send: true, 
                                confirmation_send_id: response.data.confirmation_send_id 
                            }
                        });
                    }
        
                    // Cerrar el modal
                    Modals.closeModal('update-cancel-modal');
                } catch (error) {
                    alert('Error al actualizar el turno.');
                }
            } else {
                alert('Por favor, completa todos los campos requeridos.');
            }
        });
        

        document.getElementById('cancelEvent').addEventListener('click', async function() {
            try {
                await axios.post('/supabase', { action: 'delete', appointmentId: appointment.id });
                Modals.closeModal('update-cancel-modal');
            } catch (error) {
                alert('Error al cancelar el turno.');
            }
        });

        document.getElementById('closeUpdateCancelModal').addEventListener('click', function() {
            Modals.closeModal('update-cancel-modal');
        });
    }    

};
