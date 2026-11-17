/* Ingreso a planta – Jugos S.A. · página de registro (Vercel) */
(function () {
  'use strict';

  var API = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || '';
  var GUARDADO = 'ingresoPlanta.datos';
  var CON_GRUPO = ['Proveedor de servicio', 'Visita turística', 'Entidad educativa', 'Otro'];

  var $ = function (id) { return document.getElementById(id); };
  var estado = { tipo: '', cantidad: 1, muestra: '', contramuestra: '', salud: '', seguro: '' };

  // ---------- Pantallas ----------
  function mostrar(id) {
    ['paso1', 'paso2', 'resultado'].forEach(function (p) { $(p).hidden = p !== id; });
    window.scrollTo(0, 0);
  }

  // ---------- Botones de opción (tipo, sí/no) ----------
  function marcar(contenedor, valor, atributo) {
    Array.prototype.forEach.call(contenedor.querySelectorAll('button'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute(atributo) === valor));
    });
  }

  function elegirTipo(tipo) {
    estado.tipo = tipo;
    marcar($('tipos'), tipo, 'data-tipo');
    var grupo = CON_GRUPO.indexOf(tipo) >= 0;
    $('bloqueGrupo').hidden = !grupo;
    $('bloqueAuditoria').hidden = tipo !== 'Auditoría';
    $('avisoProveedor').hidden = tipo !== 'Proveedor de servicio';
    $('lblInstitucion').textContent = tipo === 'Entidad educativa' ? 'Institución educativa' :
      tipo === 'Proveedor de servicio' ? 'Empresa' : 'Institución o empresa';
  }

  $('tipos').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) elegirTipo(b.getAttribute('data-tipo'));
  });

  Array.prototype.forEach.call(document.querySelectorAll('.sino'), function (cont) {
    cont.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var grupo = cont.getAttribute('data-grupo'), valor = b.getAttribute('data-valor');
      estado[grupo] = valor;
      marcar(cont, valor, 'data-valor');
      if (grupo === 'muestra') $('bloqueMuestra').hidden = valor !== 'Sí';
      if (grupo === 'salud') {
        $('avisoSalud').hidden = valor !== 'Sí';
        $('bloqueSeguro').hidden = valor !== 'No';
      }
      if (grupo === 'seguro') $('bloqueDJ').hidden = valor !== 'No';
    });
  });

  // ---------- Cantidad de personas ----------
  // Se puede usar + / − o escribir el número directamente
  function setCantidad(n) {
    n = parseInt(n, 10);
    estado.cantidad = isNaN(n) ? 1 : Math.max(1, Math.min(500, n));
    $('cantidad').value = estado.cantidad;
  }
  $('menos').addEventListener('click', function () { setCantidad(estado.cantidad - 1); });
  $('mas').addEventListener('click', function () { setCantidad(estado.cantidad + 1); });
  $('cantidad').addEventListener('input', function () {
    var n = parseInt(this.value, 10);
    if (!isNaN(n)) estado.cantidad = Math.max(1, Math.min(500, n));
  });
  $('cantidad').addEventListener('blur', function () { setCantidad(this.value); });
  $('cantidad').addEventListener('focus', function () { this.select(); });

  // ---------- Datos recordados en este celular ----------
  function leerGuardado() {
    try { return JSON.parse(localStorage.getItem(GUARDADO) || 'null'); } catch (e) { return null; }
  }
  function guardar(d) {
    try { localStorage.setItem(GUARDADO, JSON.stringify(d)); } catch (e) { /* sin almacenamiento */ }
  }
  function olvidar() {
    try { localStorage.removeItem(GUARDADO); } catch (e) { /* sin almacenamiento */ }
  }
  function completarRecordado() {
    var g = leerGuardado();
    if (!g || !g.dni) return;
    $('dni').value = g.dni || '';
    $('nombre').value = g.nombre || '';
    if (g.tipo) elegirTipo(g.tipo);
    $('institucion').value = g.institucion || '';
    $('ente').value = g.ente || '';
    $('recordado').hidden = false;
  }
  $('noSoyYo').addEventListener('click', function () {
    olvidar();
    ['dni', 'nombre', 'institucion', 'ente'].forEach(function (id) { $(id).value = ''; });
    estado.tipo = '';
    marcar($('tipos'), '', 'data-tipo');
    $('bloqueGrupo').hidden = true; $('bloqueAuditoria').hidden = true; $('avisoProveedor').hidden = true;
    $('recordado').hidden = true;
    $('dni').focus();
  });

  // ---------- Paso 1 ----------
  function error(id, msg) {
    $(id).textContent = msg || '';
    $(id).hidden = !msg;
    if (msg) $(id).scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function validarPaso1() {
    var dni = $('dni').value.replace(/[.\s-]/g, '');
    if (!/^[A-Za-z0-9]{6,12}$/.test(dni)) return 'Revisá el DNI: solo números, sin puntos.';
    if ($('nombre').value.trim().length < 3) return 'Falta el nombre y apellido.';
    if (!estado.tipo) return 'Elegí el tipo de ingreso.';
    if (CON_GRUPO.indexOf(estado.tipo) >= 0 && !$('institucion').value.trim()) return 'Falta la institución o empresa.';
    if (estado.tipo === 'Auditoría') {
      if (!$('ente').value.trim()) return 'Falta el ente regulador o la empresa.';
      if (!$('motivo').value.trim()) return 'Falta el motivo de la auditoría o inspección.';
      if (!estado.muestra) return 'Indicá si requiere muestra.';
      if (estado.muestra === 'Sí' && !estado.contramuestra) return 'Indicá si requiere contramuestra.';
      if (estado.muestra === 'Sí' && !$('rotulo').value.trim()) return 'Falta el rótulo de la muestra.';
    }
    if (!$('mayor').checked) return 'Solo pueden completarlo mayores de 18 años.';
    return '';
  }

  $('continuar').addEventListener('click', function () {
    var msg = validarPaso1();
    error('error1', msg);
    if (msg) return;
    mostrar('paso2');
  });
  $('volver').addEventListener('click', function () { mostrar('paso1'); });

  // ---------- Envío ----------
  function validarPaso2() {
    if (!estado.salud) return 'Respondé la pregunta de salud.';
    if (estado.salud === 'No') {
      if (!estado.seguro) return 'Indicá si presentaste el seguro.';
      if (estado.seguro === 'No' && !$('dj').checked) return 'Para ingresar sin seguro tenés que aceptar la declaración jurada.';
    }
    return '';
  }

  function datosParaEnviar() {
    return {
      nombre: $('nombre').value.trim(),
      dni: $('dni').value.replace(/[.\s-]/g, ''),
      mayor: $('mayor').checked,
      tipo: estado.tipo,
      institucion: $('institucion').value.trim(),
      cantidad: CON_GRUPO.indexOf(estado.tipo) >= 0 ? estado.cantidad : '',
      ente: $('ente').value.trim(),
      credencial: $('credencial').value.trim(),
      motivo: $('motivo').value.trim(),
      muestra: estado.muestra,
      contramuestra: estado.contramuestra,
      rotulo: $('rotulo').value.trim(),
      salud: estado.salud,
      seguro: estado.salud === 'No' ? estado.seguro : '',
      dj: estado.salud === 'No' && estado.seguro === 'No' && $('dj').checked,
      web: $('web').value
    };
  }

  function enviarAlServidor(d) {
    if (API === 'DEMO') {
      return new Promise(function (ok) {
        setTimeout(function () {
          ok({ ok: true, habilitado: d.salud !== 'Sí', fecha: ahora(), nombre: d.nombre, dni: d.dni, tipo: d.tipo,
            institucion: d.institucion || d.ente, personas: d.cantidad || 1 });
        }, 600);
      });
    }
    if (!/^https:\/\/script\.google\.com\//.test(API)) {
      return Promise.reject(new Error('Falta configurar el link del sistema (config.js).'));
    }
    return fetch(API, { method: 'POST', body: JSON.stringify(d) }).then(function (r) { return r.json(); });
  }

  function ahora() {
    var f = new Date(), dos = function (n) { return ('0' + n).slice(-2); };
    return dos(f.getDate()) + '/' + dos(f.getMonth() + 1) + '/' + f.getFullYear() + ' ' + dos(f.getHours()) + ':' + dos(f.getMinutes());
  }

  $('enviar').addEventListener('click', function () {
    var msg = validarPaso2();
    error('error2', msg);
    if (msg) return;
    var d = datosParaEnviar();
    var boton = $('enviar');
    boton.disabled = true; boton.textContent = 'Enviando…';
    enviarAlServidor(d).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || 'No se pudo registrar.');
      guardar({ dni: d.dni, nombre: d.nombre, tipo: d.tipo, institucion: d.institucion, ente: d.ente });
      mostrarResultado(res, d);
    }).catch(function (e) {
      var m = String(e && e.message || e);
      if (/fetch|network|Failed|Load failed/i.test(m)) m = 'No hay conexión. Revisá la señal y tocá Enviar de nuevo.';
      error('error2', m);
    }).then(function () {
      boton.disabled = false; boton.textContent = 'Enviar';
    });
  });

  function formatoDni(dni) {
    return /^\d{7,8}$/.test(dni) ? dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : dni;
  }

  function mostrarResultado(res, d) {
    var ok = res.habilitado !== false;
    var pant = $('resultado');
    pant.className = 'pantalla final ' + (ok ? 'ok' : 'no');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', ok ? '#157A34' : '#C8161E');
    $('iconoOk').style.display = ok ? '' : 'none';   // en SVG la propiedad "hidden" no funciona
    $('iconoNo').style.display = ok ? 'none' : '';
    $('resTitulo').innerHTML = ok ? 'HABILITADO<br>PARA INGRESAR' : 'NO PUEDE<br>INGRESAR';
    $('resMotivo').hidden = ok;
    $('resFecha').textContent = (res.fecha || ahora()).replace(' ', ' · ');
    $('resNombre').textContent = res.nombre || d.nombre;
    $('resDni').textContent = 'DNI ' + formatoDni(res.dni || d.dni);
    var detalle = [res.tipo || d.tipo];
    if (res.institucion) detalle.push(res.institucion);
    if (CON_GRUPO.indexOf(d.tipo) >= 0) detalle.push((res.personas || d.cantidad) + ((res.personas || d.cantidad) === 1 ? ' persona' : ' personas'));
    $('resDetalle').textContent = detalle.join(' · ');
    var extra = !ok ? 'Aseguramiento de Calidad ya recibió el aviso.' :
      d.tipo === 'Proveedor de servicio' ? 'Si ingresás a planta LC o LPA: vestimenta blanca y EPP.' : '';
    $('resExtra').textContent = extra; $('resExtra').hidden = !extra;
    $('resPie').textContent = ok ? 'Mostrá esta pantalla en portería' : 'Mostrá esta pantalla al guardia';
    mostrar('resultado');
  }

  // "Nuevo registro" (por ejemplo, en un equipo de portería): borra los datos recordados de esta persona
  $('nuevo').addEventListener('click', function () {
    olvidar();
    window.location.reload();
  });

  // ---------- Inicio ----------
  completarRecordado();
})();
