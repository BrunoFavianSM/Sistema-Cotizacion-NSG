import { useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '../componentes/admin/AdminPageHeader';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import { useToast } from '../componentes/feedback/ToastProvider';
import Button from '../componentes/ui/Button';
import InputField from '../componentes/ui/InputField';
import { useAppContext } from '../contexto/AppContext';
import * as api from '../servicios/api';
import { formatearMoneda } from '../utilidades/moneda';

/**
 * Selector segmentado de modo de tipo de cambio (Manual / Automático).
 * Cumple WCAG AA: role="radiogroup", focus visible, contraste, touch targets 44px.
 */
function SelectorModoTipoCambio({ modo, onChange, disabled }) {
  const opciones = [
    { valor: 'manual', etiqueta: 'Manual' },
    { valor: 'automatico', etiqueta: 'Automático (API)' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Modo de tipo de cambio"
      className="inline-flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-0.5 gap-0.5"
    >
      {opciones.map(({ valor, etiqueta }) => {
        const activo = modo === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            disabled={disabled}
            onClick={() => onChange(valor)}
            className={[
              'min-h-[44px] min-w-[44px] px-4 py-2 rounded-[calc(var(--radius-sm)-2px)] text-sm font-medium transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              activo
                ? 'bg-[var(--color-accent)] text-white shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]',
            ].join(' ')}
          >
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Selector segmentado de modo IA.
 * Cumple WCAG AA: role="radiogroup", focus visible, contraste, touch targets 44px.
 */
function SelectorModoIA({ modo, onChange, disabled }) {
  const opciones = [
    { valor: 'nvidia', etiqueta: 'NVIDIA NIM' },
    { valor: 'gemini', etiqueta: 'Google Gemini' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Modo del asistente de IA"
      className="flex flex-wrap gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-0.5"
    >
      {opciones.map(({ valor, etiqueta }) => {
        const activo = modo === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            disabled={disabled}
            onClick={() => onChange(valor)}
            className={[
              'min-h-[44px] min-w-[44px] px-4 py-2 rounded-[calc(var(--radius-sm)-2px)] text-sm font-medium transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              activo
                ? 'bg-[var(--color-accent)] text-white shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]',
            ].join(' ')}
          >
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Tarjeta de estadística con tono visual configurable.
 * Cumple WCAG AA: contraste, semántica de article.
 */
function StatCard({ title, value, helper, tone = 'neutral' }) {
  const toneClass = {
    neutral: 'border-[var(--color-border)] bg-[var(--color-surface-soft)]',
    info: 'border-[color:rgba(10,132,255,0.35)] bg-[var(--color-accent-soft)]',
    success: 'border-[color:rgba(48,209,88,0.35)] bg-[color:rgba(48,209,88,0.10)]',
    warning: 'border-[color:rgba(255,214,10,0.45)] bg-[color:rgba(255,214,10,0.10)]',
  }[tone];

  return (
    <article className={`rounded-[var(--radius-md)] border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p>
    </article>
  );
}

export default function AdminConfiguracion() {
  const {
    autenticado,
    esAdmin,
    margenGanancia,
    tasaIgv,
    tipoCambioUsdPen,
    numeroWhatsAppVentas,
    actualizarConfiguracionFinanciera,
    // Tipo de cambio — modo y estados del hook (Requisitos 1.2–1.6, 11.1–11.4)
    modoTipoCambio: modoTipoCambioContexto,
    cargandoTipoCambio,
    advertenciaTipoCambio,
    ultimaActualizacionTC,
    forzarActualizacionTC,
  } = useAppContext();
  const toast = useToast();

  const [nuevoMargen, setNuevoMargen] = useState(String(margenGanancia));
  const [nuevaTasaIgv, setNuevaTasaIgv] = useState(String(tasaIgv));
  const [nuevoTipoCambio, setNuevoTipoCambio] = useState(String(tipoCambioUsdPen));
  const [numeroWhatsApp, setNumeroWhatsApp] = useState(String(numeroWhatsAppVentas || ''));
  const [guardando, setGuardando] = useState(false);

  // Estado local del modo sincronizado con el contexto (Requisito 1.2)
  const [modoTipoCambio, setModoTipoCambio] = useState(modoTipoCambioContexto);
  const [guardandoModo, setGuardandoModo] = useState(false);


  // ── Estado sección Asistente de IA (Requisitos 2.10–2.17) ──────────────────
  const [modoIA, setModoIA] = useState('nvidia');
  const [modelos, setModelos] = useState({
    gemini_model: '',
    nvidia_model: '',
  });
  const [erroresModelos, setErroresModelos] = useState({});
  const [cargandoModelosIA, setCargandoModelosIA] = useState(true);
  const [guardandoModelosIA, setGuardandoModelosIA] = useState(false);

  // ── Estado sección Claves API de IA (Requisitos 11.1–11.13) ───────────────
  const [apiKeys, setApiKeys] = useState({ gemini_api_key: '', nvidia_api_key: '' });
  const [mostrarApiKey, setMostrarApiKey] = useState({ gemini: false, nvidia: false });
  const [estadoApiKeys, setEstadoApiKeys] = useState({ gemini_configurada: false, nvidia_configurada: false });
  const [guardandoApiKeys, setGuardandoApiKeys] = useState(false);

  // ── Estado token de consulta de DNI (decolecta) ───────────────────────────
  const [tokenDni, setTokenDni] = useState('');
  const [tokenDniConfigurado, setTokenDniConfigurado] = useState(false);
  const [guardandoTokenDni, setGuardandoTokenDni] = useState(false);

  useEffect(() => {
    if (autenticado) {
      cargarModelosIA();
      cargarEstadoApiKeys();
      cargarEstadoTokenDni();
    }
  }, [autenticado]);

  const cargarEstadoTokenDni = async () => {
    try {
      const res = await api.obtenerEstadoTokenDni();
      setTokenDniConfigurado(!!res?.configurado);
    } catch {
      // Silencioso: el estado del token es complementario.
    }
  };

  const guardarTokenDni = async () => {
    if (!tokenDni.trim()) {
      toast.warning('Token vacío', 'Ingresa el token de decolecta para guardarlo.');
      return;
    }
    setGuardandoTokenDni(true);
    try {
      await api.actualizarTokenDni(tokenDni.trim());
      setTokenDni('');
      setTokenDniConfigurado(true);
      toast.success('Token guardado', 'El token de consulta de DNI se actualizó correctamente.');
    } catch (error) {
      toast.error('No se pudo guardar', error?.mensaje || error?.error || 'Intenta nuevamente.');
    } finally {
      setGuardandoTokenDni(false);
    }
  };

  useEffect(() => {
    setNuevoMargen(String(margenGanancia));
    setNuevaTasaIgv(String(tasaIgv));
    setNuevoTipoCambio(String(tipoCambioUsdPen));
    setNumeroWhatsApp(String(numeroWhatsAppVentas || ''));
  }, [margenGanancia, tasaIgv, tipoCambioUsdPen, numeroWhatsAppVentas]);

  // Sincronizar estado local de modo cuando cambia el contexto (Requisito 1.2)
  useEffect(() => {
    setModoTipoCambio(modoTipoCambioContexto);
  }, [modoTipoCambioContexto]);


  /** Carga la configuración de modo y modelos de IA desde el backend (Requisito 2.11). */
  const cargarModelosIA = async () => {
    setCargandoModelosIA(true);
    try {
      const config = await api.obtenerModelosIA();
      setModoIA(config.modo_activo || 'nvidia');
      setModelos({
        gemini_model: config.gemini_model || '',
        nvidia_model: config.nvidia_model || '',
      });
    } catch {
      // Silencioso: la sección mostrará campos vacíos con valores por defecto
    } finally {
      setCargandoModelosIA(false);
    }
  };

  /** Carga el estado de configuración de las claves API de IA (Requisito 11.8). */
  const cargarEstadoApiKeys = async () => {
    try {
      const estado = await api.obtenerApiKeysIA();
      setEstadoApiKeys({
        gemini_configurada: estado.gemini_configurada ?? false,
        nvidia_configurada: estado.nvidia_configurada ?? false,
      });
    } catch {
      // Silencioso: los indicadores mostrarán "No configurada"
    }
  };

  /** Guarda las claves API de IA (Requisito 11.9, 11.10, 11.11). */
  const guardarApiKeys = async () => {
    const payload = {};
    if (apiKeys.gemini_api_key.trim()) payload.gemini_api_key = apiKeys.gemini_api_key.trim();
    if (apiKeys.nvidia_api_key.trim()) payload.nvidia_api_key = apiKeys.nvidia_api_key.trim();

    if (Object.keys(payload).length === 0) {
      toast.warning('Sin cambios', 'Ingresa al menos una clave API para guardar.');
      return;
    }

    setGuardandoApiKeys(true);
    try {
      await api.actualizarApiKeysIA(payload);
      toast.success('Claves API guardadas correctamente.');
      // Limpiar campos y recargar estado
      setApiKeys({ gemini_api_key: '', nvidia_api_key: '' });
      setMostrarApiKey({ gemini: false, nvidia: false });
      await cargarEstadoApiKeys();
    } catch (error) {
      toast.error('No se pudieron guardar las claves', error?.mensaje || 'Intenta nuevamente en unos segundos.');
    } finally {
      setGuardandoApiKeys(false);
    }
  };

  /**
   * Valida los campos requeridos según el modo activo.
   * Retorna true si todo es válido, false si hay errores.
   */
  const validarCamposModelos = (modo, vals) => {
    const errores = {};
    if (modo === 'nvidia') {
      if (!vals.nvidia_model?.trim()) errores.nvidia_model = 'Campo requerido para el modo NVIDIA.';
    } else if (modo === 'gemini') {
      if (!vals.gemini_model?.trim()) errores.gemini_model = 'Campo requerido para el modo Gemini.';
    }
    setErroresModelos(errores);
    return Object.keys(errores).length === 0;
  };

  /** Guarda la configuración de modelos de IA (Requisito 2.14, 2.15). */
  const guardarModelosIA = async () => {
    if (!validarCamposModelos(modoIA, modelos)) return;

    setGuardandoModelosIA(true);
    try {
      await api.actualizarModelosIA({ modo_activo: modoIA, ...modelos });
      const etiquetaModo = {
        nvidia: 'NVIDIA NIM',
        gemini: 'Google Gemini',
      }[modoIA] || modoIA;
      toast.success('Configuración de IA guardada', `Modo activo: ${etiquetaModo}.`);
    } catch (error) {
      toast.error('No se pudo guardar', error?.mensaje || 'Intenta nuevamente en unos segundos.');
    } finally {
      setGuardandoModelosIA(false);
    }
  };

  const margenValido = useMemo(() => {
    const valor = Number(nuevoMargen);
    return !Number.isNaN(valor) && valor >= 0 && valor <= 100;
  }, [nuevoMargen]);
  const tasaIgvValida = useMemo(() => {
    const valor = Number(nuevaTasaIgv);
    return !Number.isNaN(valor) && valor >= 0 && valor <= 100;
  }, [nuevaTasaIgv]);
  const tipoCambioValido = useMemo(() => {
    const valor = Number(nuevoTipoCambio);
    return !Number.isNaN(valor) && valor > 0;
  }, [nuevoTipoCambio]);

  const precioEjemploUsd = (base) => {
    const margen = Number(nuevoMargen || 0);
    const igv = Number(nuevaTasaIgv || 0);
    const subtotal = base * (1 + margen / 100);
    return subtotal * (1 + igv / 100);
  };

  const precioEjemploPen = (base) => {
    return precioEjemploUsd(base) * Number(nuevoTipoCambio || 0);
  };

  const guardarMargen = async (event) => {
    event.preventDefault();

    // En modo manual el tipo de cambio es editable; en automático se ignora el campo
    const tipoCambioAGuardar = modoTipoCambio === 'manual' ? nuevoTipoCambio : String(tipoCambioUsdPen);
    const tipoCambioValidoParaGuardar = modoTipoCambio === 'automatico' || tipoCambioValido;

    const numeroWhatsAppLimpio = String(numeroWhatsApp || '').replace(/[^\d]/g, '');
    const numeroWhatsAppValido = numeroWhatsAppLimpio === '' || /^\d{8,15}$/.test(numeroWhatsAppLimpio);

    if (!margenValido || !tasaIgvValida || !tipoCambioValidoParaGuardar) {
      toast.warning('Configuracion invalida', 'Revisa margen, IGV y tipo de cambio antes de guardar.');
      return;
    }

    if (!numeroWhatsAppValido) {
      toast.warning('WhatsApp inválido', 'El número debe tener entre 8 y 15 dígitos (incluye código de país).');
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await actualizarConfiguracionFinanciera({
        margen_ganancia_default: Number(nuevoMargen),
        tasa_igv: Number(nuevaTasaIgv),
        tipo_cambio_usd_pen: Number(tipoCambioAGuardar),
        ...(numeroWhatsAppLimpio ? { whatsapp_numero_ventas: numeroWhatsAppLimpio } : {})
      });
      const margen = Number(respuesta?.margen_ganancia ?? nuevoMargen);
      toast.success('Configuracion guardada', `Margen ${margen.toFixed(1)}%, IGV ${Number(respuesta?.tasa_igv ?? nuevaTasaIgv).toFixed(2)}%.`);
    } catch (error) {
      toast.error('No se pudo guardar', error?.mensaje || 'Intenta nuevamente en unos segundos.');
    } finally {
      setGuardando(false);
    }
  };

  /**
   * Guarda el modo de tipo de cambio en el backend (Requisito 1.5).
   * No pierde valores ingresados si la petición falla (Requisito 1.6).
   */
  const guardarModo = async () => {
    setGuardandoModo(true);
    try {
      await api.actualizarModoTipoCambio(modoTipoCambio);
      toast.success(
        'Modo guardado',
        modoTipoCambio === 'manual'
          ? 'Tipo de cambio en modo manual.'
          : 'Tipo de cambio en modo automático (API).'
      );
    } catch (error) {
      // No revertir el estado local — el usuario puede reintentar (Requisito 1.6)
      toast.error('No se pudo guardar el modo', error?.mensaje || 'Intenta nuevamente en unos segundos.');
    } finally {
      setGuardandoModo(false);
    }
  };

  // Defensa en profundidad: la ruta ya exige admin, pero el componente
  // vuelve a verificar el rol antes de renderizar contenido administrativo.
  if (!autenticado || !esAdmin) {
    return (
      <div className="surface-card p-6 text-center">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Acceso restringido</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Debes iniciar sesión como administrador para gestionar la configuración.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Configuración del Sistema"
        description="Gestiona los parámetros globales del sistema y la configuración del asistente de IA."
      />

      <section className="surface-elevated p-6" data-tour="config-financieros">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Parámetros financieros</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Define margen por defecto, tasa de IGV y tipo de cambio USD/PEN.
          </p>
        </header>

        <form onSubmit={guardarMargen} className="space-y-4">
          {/* ── Selector de modo de tipo de cambio (Requisito 1.2) ── */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Modo de tipo de cambio
              </label>
              <SelectorModoTipoCambio
                modo={modoTipoCambio}
                onChange={setModoTipoCambio}
                disabled={guardandoModo}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={guardandoModo}
                disabled={guardandoModo || modoTipoCambio === modoTipoCambioContexto}
                onClick={guardarModo}
                className="min-h-[44px]"
              >
                Guardar modo
              </Button>
            </div>

            {/* ── Modo automático: valor en solo lectura + controles (Requisito 1.4) ── */}
            {modoTipoCambio === 'automatico' && (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Indicador de carga (Requisito 11.1) */}
                  {cargandoTipoCambio ? (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                      <LoadingSpinner size="sm" />
                      <span>Obteniendo tipo de cambio…</span>
                    </div>
                  ) : (
                    <div>
                      {/* Valor en solo lectura (Requisito 11.2) */}
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                        Tipo de cambio (API)
                      </p>
                      <p className="mt-0.5 text-2xl font-semibold text-[var(--color-text)]">
                        {formatearMoneda(tipoCambioUsdPen, 'PEN').replace('S/', '')} PEN/USD
                      </p>
                      {ultimaActualizacionTC && (
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                          Actualizado:{' '}
                          {new Intl.DateTimeFormat('es-PE', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(ultimaActualizacionTC)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Botón forzar actualización (Requisito 2.9) */}
                  <Button
                    type="button"
                    variant="secondary"
                    loading={cargandoTipoCambio}
                    disabled={cargandoTipoCambio}
                    onClick={forzarActualizacionTC}
                    className="min-h-[44px]"
                  >
                    Actualizar tipo de cambio
                  </Button>
                </div>

                {/* Advertencia de valor de respaldo (Requisito 11.3) */}
                {advertenciaTipoCambio && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-[color:rgba(255,214,10,0.45)] bg-[color:rgba(255,214,10,0.10)] px-3 py-2"
                  >
                    <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4m0 4h.01M10.29 3.86 2.11 18a1.5 1.5 0 0 0 1.3 2.25h17.18a1.5 1.5 0 0 0 1.3-2.25L13.71 3.86a1.5 1.5 0 0 0-2.42 0z" /></svg>
                    <p className="text-sm text-[var(--color-text)]">{advertenciaTipoCambio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[12rem_12rem_12rem_minmax(0,1fr)]">
            <InputField
              id="margen-ganancia"
              label="Margen (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={nuevoMargen}
              onChange={(event) => setNuevoMargen(event.target.value)}
              error={!margenValido ? 'El valor debe estar entre 0 y 100.' : ''}
            />
            <InputField
              id="tasa-igv"
              label="IGV (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={nuevaTasaIgv}
              onChange={(event) => setNuevaTasaIgv(event.target.value)}
              error={!tasaIgvValida ? 'El valor debe estar entre 0 y 100.' : ''}
            />
            {/* Campo manual: visible solo en modo manual (Requisito 1.3) */}
            {modoTipoCambio === 'manual' ? (
              <InputField
                id="tipo-cambio"
                label="Tipo cambio USD/PEN"
                type="number"
                min="0.0001"
                step="0.0001"
                value={nuevoTipoCambio}
                onChange={(event) => setNuevoTipoCambio(event.target.value)}
                error={!tipoCambioValido ? 'Debe ser mayor que 0.' : ''}
              />
            ) : (
              /* Placeholder vacío para mantener el grid en modo automático */
              <div aria-hidden="true" />
            )}
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3">
              <p className="text-sm text-[var(--color-text-muted)]">Configuración activa</p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-accent-text)]">Margen {Number(margenGanancia).toFixed(1)}%</p>
              <p className="text-sm text-[var(--color-text-muted)]">IGV {Number(tasaIgv).toFixed(2)}%</p>
              <p className="text-sm text-[var(--color-text-muted)]">TC {Number(tipoCambioUsdPen).toFixed(4)}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
            <InputField
              id="whatsapp-numero-ventas"
              label="WhatsApp de ventas"
              type="tel"
              inputMode="numeric"
              placeholder="51999999999"
              value={numeroWhatsApp}
              onChange={(event) => setNumeroWhatsApp(event.target.value)}
              hint="Código de país + número (solo dígitos). Lo usa el botón 'Confirmar por WhatsApp'."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard title="Base USD 1000" value={formatearMoneda(precioEjemploUsd(1000), 'USD')} helper={`Ref ${formatearMoneda(precioEjemploPen(1000), 'PEN')}`} />
            <StatCard title="Base USD 2500" value={formatearMoneda(precioEjemploUsd(2500), 'USD')} helper={`Ref ${formatearMoneda(precioEjemploPen(2500), 'PEN')}`} />
            <StatCard title="Base USD 5000" value={formatearMoneda(precioEjemploUsd(5000), 'USD')} helper={`Ref ${formatearMoneda(precioEjemploPen(5000), 'PEN')}`} />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={guardando}
              disabled={
                !margenValido
                || !tasaIgvValida
                || (modoTipoCambio === 'manual' && !tipoCambioValido)
                || (
                  Number(nuevoMargen) === Number(margenGanancia)
                  && Number(nuevaTasaIgv) === Number(tasaIgv)
                  && (modoTipoCambio === 'automatico' || Number(nuevoTipoCambio) === Number(tipoCambioUsdPen))
                  && String(numeroWhatsApp || '').replace(/[^\d]/g, '') === String(numeroWhatsAppVentas || '')
                )
              }
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      </section>

      <section className="surface-elevated p-6">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Consulta de DNI (RENIEC)</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Token de decolecta para autocompletar nombre y apellidos por DNI en el registro. Se guarda
            cifrado; no se muestra una vez guardado.
          </p>
        </header>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              tokenDniConfigurado
                ? 'bg-[color:rgba(48,209,88,0.15)] text-[var(--color-success)]'
                : 'bg-[color:rgba(255,159,10,0.15)] text-[var(--color-warning)]'
            }`}
          >
            {tokenDniConfigurado ? (
              <>
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Configurado
              </>
            ) : 'No configurado'}
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <InputField
            id="token-dni"
            label={tokenDniConfigurado ? 'Reemplazar token de decolecta' : 'Token de decolecta'}
            type="password"
            value={tokenDni}
            onChange={(e) => setTokenDni(e.target.value)}
            placeholder="Pega aquí el token (Bearer)"
            hint="Se obtiene en el panel de decolecta. Solo se envía para guardarlo cifrado."
            autoComplete="off"
          />
          <Button onClick={guardarTokenDni} loading={guardandoTokenDni} disabled={!tokenDni.trim()}>
            Guardar token
          </Button>
        </div>
      </section>

      <section className="surface-elevated p-6" data-tour="config-asistente">
        <header className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Asistente de IA</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Configura el modo de operación y los modelos del asistente de inteligencia artificial.
          </p>
        </header>

        {cargandoModelosIA ? (
          <div className="py-6">
            <LoadingSpinner label="Cargando configuración de IA..." />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Selector de modo ── */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--color-text)]">
                Modo de operación
              </label>
              <SelectorModoIA
                modo={modoIA}
                onChange={(nuevoModo) => {
                  setModoIA(nuevoModo);
                  setErroresModelos({});
                }}
                disabled={guardandoModelosIA}
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                {modoIA === 'nvidia' && 'Usa un único modelo NVIDIA NIM como asesor conversacional. El armado y la compatibilidad son determinísticos.'}
                {modoIA === 'gemini' && 'Usa un único modelo Google Gemini como asesor conversacional. El armado y la compatibilidad son determinísticos.'}
              </p>
            </div>

            {/* ── Campos condicionales según modo ── */}
            <div className="grid gap-4 sm:grid-cols-2">
              {modoIA === 'nvidia' && (
                <div className="space-y-1 sm:col-span-2">
                  <label
                    htmlFor="ia-nvidia-model"
                    className="block text-sm font-medium text-[var(--color-text)]"
                  >
                    Modelo NVIDIA
                  </label>
                  <input
                    id="ia-nvidia-model"
                    type="text"
                    aria-label="Modelo NVIDIA para el modo uni-modelo"
                    aria-describedby={erroresModelos.nvidia_model ? 'ia-nvidia-error' : undefined}
                    aria-invalid={!!erroresModelos.nvidia_model}
                    value={modelos.nvidia_model}
                    onChange={(e) => setModelos((prev) => ({ ...prev, nvidia_model: e.target.value }))}
                    disabled={guardandoModelosIA}
                    placeholder="mistralai/mistral-small-4-119b-2603"
                    className={[
                      'w-full min-h-[44px] rounded-[var(--radius-sm)] border px-3 py-2 text-sm',
                      'bg-[var(--color-surface)] text-[var(--color-text)]',
                      'placeholder:text-[var(--color-text-muted)]',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-colors',
                      erroresModelos.nvidia_model
                        ? 'border-[var(--color-danger)] focus-visible:outline-[var(--color-danger)]'
                        : 'border-[var(--color-border)]',
                    ].join(' ')}
                  />
                  {erroresModelos.nvidia_model && (
                    <p
                      id="ia-nvidia-error"
                      role="alert"
                      className="text-xs font-medium text-[var(--color-danger)]"
                    >
                      {erroresModelos.nvidia_model}
                    </p>
                  )}
                </div>
              )}

              {modoIA === 'gemini' && (
                <div className="space-y-1 sm:col-span-2">
                  <label
                    htmlFor="ia-gemini-model"
                    className="block text-sm font-medium text-[var(--color-text)]"
                  >
                    Modelo Gemini
                  </label>
                  <input
                    id="ia-gemini-model"
                    type="text"
                    aria-label="Modelo Gemini para el modo uni-modelo"
                    aria-describedby={erroresModelos.gemini_model ? 'ia-gemini-error' : undefined}
                    aria-invalid={!!erroresModelos.gemini_model}
                    value={modelos.gemini_model}
                    onChange={(e) => setModelos((prev) => ({ ...prev, gemini_model: e.target.value }))}
                    disabled={guardandoModelosIA}
                    placeholder="gemini-2.5-flash"
                    className={[
                      'w-full min-h-[44px] rounded-[var(--radius-sm)] border px-3 py-2 text-sm',
                      'bg-[var(--color-surface)] text-[var(--color-text)]',
                      'placeholder:text-[var(--color-text-muted)]',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-colors',
                      erroresModelos.gemini_model
                        ? 'border-[var(--color-danger)] focus-visible:outline-[var(--color-danger)]'
                        : 'border-[var(--color-border)]',
                    ].join(' ')}
                  />
                  {erroresModelos.gemini_model && (
                    <p
                      id="ia-gemini-error"
                      role="alert"
                      className="text-xs font-medium text-[var(--color-danger)]"
                    >
                      {erroresModelos.gemini_model}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Botón guardar ── */}
            <div className="flex justify-end">
              <Button
                type="button"
                loading={guardandoModelosIA}
                disabled={guardandoModelosIA}
                onClick={guardarModelosIA}
              >
                Guardar configuración de IA
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* ── Sección Claves API de IA (Requisitos 11.1–11.13) ── */}
      <section className="surface-elevated p-6" data-tour="config-claves">
        <header className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Claves API de IA</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Configura las claves API de Gemini y NVIDIA. Se almacenan encriptadas en la base de datos.
          </p>
        </header>

        <div className="space-y-5">
          {/* ── Gemini API Key ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label
                htmlFor="gemini-api-key"
                className="block text-sm font-medium text-[var(--color-text)]"
              >
                Clave API de Gemini
              </label>
              {estadoApiKeys.gemini_configurada ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Configurada
                </span>
              ) : (
                <span className="text-xs text-[var(--color-text-muted)]">No configurada</span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                id="gemini-api-key"
                type={mostrarApiKey.gemini ? 'text' : 'password'}
                aria-label="Clave API de Google Gemini"
                value={apiKeys.gemini_api_key}
                onChange={(e) => setApiKeys((prev) => ({ ...prev, gemini_api_key: e.target.value }))}
                disabled={guardandoApiKeys}
                placeholder={estadoApiKeys.gemini_configurada ? '••••••••••••••••••••' : 'AIza...'}
                autoComplete="off"
                className={[
                  'w-full min-h-[44px] rounded-[var(--radius-sm)] border px-3 py-2 pr-12 text-sm',
                  'bg-[var(--color-surface)] text-[var(--color-text)]',
                  'placeholder:text-[var(--color-text-muted)]',
                  'border-[var(--color-border)]',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors',
                ].join(' ')}
              />
              <button
                type="button"
                aria-label={mostrarApiKey.gemini ? 'Ocultar clave API de Gemini' : 'Mostrar clave API de Gemini'}
                onClick={() => setMostrarApiKey((prev) => ({ ...prev, gemini: !prev.gemini }))}
                disabled={guardandoApiKeys}
                className={[
                  'absolute right-0 flex items-center justify-center min-h-[44px] min-w-[44px]',
                  'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors rounded-r-[var(--radius-sm)]',
                ].join(' ')}
              >
                {mostrarApiKey.gemini ? (
                  /* Ojo cerrado */
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  /* Ojo abierto */
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* ── NVIDIA API Key ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label
                htmlFor="nvidia-api-key"
                className="block text-sm font-medium text-[var(--color-text)]"
              >
                Clave API de NVIDIA
              </label>
              {estadoApiKeys.nvidia_configurada ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Configurada
                </span>
              ) : (
                <span className="text-xs text-[var(--color-text-muted)]">No configurada</span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                id="nvidia-api-key"
                type={mostrarApiKey.nvidia ? 'text' : 'password'}
                aria-label="Clave API de NVIDIA"
                value={apiKeys.nvidia_api_key}
                onChange={(e) => setApiKeys((prev) => ({ ...prev, nvidia_api_key: e.target.value }))}
                disabled={guardandoApiKeys}
                placeholder={estadoApiKeys.nvidia_configurada ? '••••••••••••••••••••' : 'nvapi-...'}
                autoComplete="off"
                className={[
                  'w-full min-h-[44px] rounded-[var(--radius-sm)] border px-3 py-2 pr-12 text-sm',
                  'bg-[var(--color-surface)] text-[var(--color-text)]',
                  'placeholder:text-[var(--color-text-muted)]',
                  'border-[var(--color-border)]',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors',
                ].join(' ')}
              />
              <button
                type="button"
                aria-label={mostrarApiKey.nvidia ? 'Ocultar clave API de NVIDIA' : 'Mostrar clave API de NVIDIA'}
                onClick={() => setMostrarApiKey((prev) => ({ ...prev, nvidia: !prev.nvidia }))}
                disabled={guardandoApiKeys}
                className={[
                  'absolute right-0 flex items-center justify-center min-h-[44px] min-w-[44px]',
                  'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors rounded-r-[var(--radius-sm)]',
                ].join(' ')}
              >
                {mostrarApiKey.nvidia ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* ── Botón guardar ── */}
          <div className="flex justify-end">
            <Button
              type="button"
              loading={guardandoApiKeys}
              disabled={guardandoApiKeys || (!apiKeys.gemini_api_key.trim() && !apiKeys.nvidia_api_key.trim())}
              onClick={guardarApiKeys}
            >
              Guardar claves API
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
