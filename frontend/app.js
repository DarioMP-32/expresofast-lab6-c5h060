const API_BASE = 'http://localhost:8080/api/envios';

let enviosCache = [];
let filtroActivo = 'TODOS';

const gridEnvios = document.getElementById('gridEnvios');
const boardSubtitulo = document.getElementById('boardSubtitulo');
const formEnvio = document.getElementById('formEnvio');
const formFeedback = document.getElementById('formFeedback');

const PILL_CLASE = {
    ENTREGADO: 'pill-status--entregado',
    EN_TRANSITO: 'pill-status--en-transito',
    PENDIENTE: 'pill-status--pendiente',
    CANCELADO: 'pill-status--cancelado',
};

const PILL_TEXTO = {
    ENTREGADO: 'Entregado',
    EN_TRANSITO: 'En tránsito',
    PENDIENTE: 'Pendiente',
    CANCELADO: 'Cancelado',
};


async function cargarEnvios() {
    boardSubtitulo.textContent = 'Cargando manifiesto de envíos…';
    try {
        const respuesta = await fetch(`${API_BASE}/optimizados`);
        if (!respuesta.ok) {
            throw new Error(`El servidor respondió con estado ${respuesta.status}`);
        }
        enviosCache = await respuesta.json();
        actualizarResumen();
        renderizarGrid();
    } catch (error) {
        boardSubtitulo.textContent =
            'No se pudo conectar con el backend. Verifique que Spring Boot esté corriendo en el puerto 8080.';
        console.error('Error al cargar envios:', error);
    }
}


function renderizarGrid() {
    const enviosFiltrados =
        filtroActivo === 'TODOS'
            ? enviosCache
            : enviosCache.filter((e) => e.estadoEnvio === filtroActivo);

    boardSubtitulo.textContent = `${enviosFiltrados.length} envío(s) en el filtro actual`;

    gridEnvios.innerHTML = '';

    if (enviosFiltrados.length === 0) {
        gridEnvios.innerHTML = '<p class="board__empty">No hay envíos que coincidan con este filtro.</p>';
        return;
    }

    enviosFiltrados.forEach((envio) => {
        gridEnvios.appendChild(crearTarjetaEnvio(envio));
    });
}

function crearTarjetaEnvio(envio) {
    const articulo = document.createElement('article');
    articulo.className = 'waybill';

    const pillClase = PILL_CLASE[envio.estadoEnvio] || 'pill-status--pendiente';
    const pillTexto = PILL_TEXTO[envio.estadoEnvio] || envio.estadoEnvio;

    const placa = envio.vehiculo ? envio.vehiculo.placa : '—';
    const conductorNombre = envio.conductor
        ? `${envio.conductor.nombre} ${envio.conductor.apellidos}`
        : '—';

    articulo.innerHTML = `
    <div class="waybill__head">
      <span class="waybill__codigo">${envio.codigoRastreo}</span>
      <span class="pill-status ${pillClase}">${pillTexto}</span>
    </div>
    <p class="waybill__destino">${envio.direccionDestino}</p>
    <div class="waybill__datos">
      <span>${Number(envio.pesoKg).toFixed(2)} kg</span>
      <span>₡${Number(envio.costo).toFixed(2)}</span>
    </div>
    <p class="waybill__asignacion">veh: ${placa} · conductor: ${conductorNombre}</p>
    <div class="waybill__acciones" data-envio-id="${envio.id}"></div>
  `;

    const acciones = articulo.querySelector('.waybill__acciones');
    acciones.appendChild(crearBotonesAccion(envio));

    return articulo;
}

function crearBotonesAccion(envio) {
    const contenedor = document.createElement('div');
    contenedor.className = 'waybill__acciones-inner';
    contenedor.style.display = 'flex';
    contenedor.style.gap = '0.5rem';
    contenedor.style.flexWrap = 'wrap';

    if (envio.estadoEnvio === 'PENDIENTE') {
        contenedor.appendChild(
            crearBoton('Marcar en tránsito', () => cambiarEstado(envio.id, 'EN_TRANSITO'))
        );
    }

    if (envio.estadoEnvio === 'EN_TRANSITO') {
        contenedor.appendChild(
            crearBoton('Marcar entregado', () => cambiarEstado(envio.id, 'ENTREGADO'))
        );
    }

    return contenedor;
}

function crearBoton(texto, onClick) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn-accion';
    boton.textContent = texto;
    boton.addEventListener('click', onClick);
    return boton;
}

function actualizarResumen() {
    const conteo = { PENDIENTE: 0, EN_TRANSITO: 0, ENTREGADO: 0 };
    enviosCache.forEach((e) => {
        if (conteo[e.estadoEnvio] !== undefined) conteo[e.estadoEnvio]++;
    });
    document.getElementById('countPendiente').textContent = conteo.PENDIENTE;
    document.getElementById('countTransito').textContent = conteo.EN_TRANSITO;
    document.getElementById('countEntregado').textContent = conteo.ENTREGADO;
}


document.querySelectorAll('.filtro-tab').forEach((boton) => {
    boton.addEventListener('click', () => {
        document.querySelectorAll('.filtro-tab').forEach((b) => b.classList.remove('is-active'));
        boton.classList.add('is-active');
        filtroActivo = boton.dataset.filtro;
        renderizarGrid();
    });
});


formEnvio.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    formFeedback.textContent = '';
    formFeedback.className = 'form-feedback';

    const payload = {
        codigoRastreo: document.getElementById('codigoRastreo').value.trim(),
        direccionDestino: document.getElementById('direccionDestino').value.trim(),
        pesoKg: parseFloat(document.getElementById('pesoKg').value),
        costo: parseFloat(document.getElementById('costo').value),
        vehiculo: { id: parseInt(document.getElementById('vehiculoId').value, 10) },
        conductor: { id: parseInt(document.getElementById('conductorId').value, 10) },
    };

    try {
        const respuesta = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!respuesta.ok) {
            const detalle = await respuesta.text();
            throw new Error(detalle || `El servidor respondió con estado ${respuesta.status}`);
        }

        formFeedback.textContent = 'Envío registrado correctamente.';
        formFeedback.classList.add('ok');
        formEnvio.reset();
        await cargarEnvios();
    } catch (error) {
        formFeedback.textContent = `No se pudo registrar el envío: ${error.message}`;
        formFeedback.classList.add('error');
        console.error('Error al registrar envio:', error);
    }
});


async function cambiarEstado(envioId, nuevoEstado) {
    try {
        const respuesta = await fetch(`${API_BASE}/${envioId}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado }),
        });

        if (!respuesta.ok) {
            const detalle = await respuesta.text();
            throw new Error(detalle || `El servidor respondió con estado ${respuesta.status}`);
        }

        await cargarEnvios();
    } catch (error) {
        alert(`No se pudo actualizar el estado del envío: ${error.message}`);
        console.error('Error al actualizar estado:', error);
    }
}

cargarEnvios();