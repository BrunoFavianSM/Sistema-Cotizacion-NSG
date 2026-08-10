import { useMemo } from 'react';
import Button from '../ui/Button';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import SwitchField from '../ui/SwitchField';
import TextAreaField from '../ui/TextAreaField';
import ImagenProducto from '../ui/ImagenProducto';
import { CATEGORIAS_PRODUCTO, formatearCategoria } from '../../dominio/categorias';
import FormSection from './FormSection';

export const CATEGORIAS = CATEGORIAS_PRODUCTO;

const RAM_TYPES = ['DDR4', 'DDR5', 'DDR3'];
const FORM_FACTORS_MB = ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'];
const FORM_FACTORS_CASE = ['ATX', 'Micro-ATX', 'Mini-ITX', 'Full-Tower'];
const FORM_FACTORS_STORAGE = ['2.5"', '3.5"', 'M.2'];
const FORM_FACTORS_PSU = ['ATX', 'SFX', 'SFX-L'];
const MODULAR_TYPES = ['Full Modular', 'Semi Modular', 'No Modular'];
const STORAGE_INTERFACES = ['SATA III', 'NVMe PCIe 3.0', 'NVMe PCIe 4.0', 'NVMe PCIe 5.0', 'USB'];
const NVME_GENS = ['Gen 3', 'Gen 4', 'Gen 5'];
const STORAGE_TYPES = ['SSD', 'HDD', 'NVMe'];
const VRAM_TYPES = ['GDDR6', 'GDDR6X', 'GDDR7', 'GDDR5'];
const CERT_PSU = ['80+ White', '80+ Bronze', '80+ Silver', '80+ Gold', '80+ Platinum', '80+ Titanium'];

export const PRODUCTO_INICIAL = {
  nombre: '',
  categoria: 'procesador',
  precio_base: '',
  stock: '',
  disponible_a_pedido: false,
  tiempo_entrega_dias: '',
  descripcion_tecnica: '',
  imagen_url: '',
  id_etiqueta: '',
  // Procesador
  socket: '',
  arquitectura: '',
  nucleos: '',
  hilos: '',
  frecuencia_base_ghz: '',
  frecuencia_boost_ghz: '',
  tdp: '',
  graficos_integrados: false,
  // Placa madre
  chipset: '',
  ram_type: '',
  form_factor: '',
  max_ram_gb: '',
  slots_ram: '',
  pcie_version: '',
  m2_slots: '',
  // RAM
  capacidad_gb: '',
  velocidad_mhz: '',
  latencia: '',
  modulos: '',
  cantidad_modulos: '',
  rgb: false,
  // Almacenamiento
  tipo_almacenamiento: '',
  interfaz: '',
  velocidad_lectura_mbps: '',
  velocidad_escritura_mbps: '',
  nvme_gen: '',
  // GPU
  vram_gb: '',
  vram_tipo: '',
  bus_bits: '',
  boost_mhz: '',
  longitud_mm: '',
  fuente_recomendada_w: '',
  // Fuente
  wattage: '',
  certificacion: '',
  modular: '',
  pcie_conectores: '',
  sata_conectores: '',
  // Case
  compatibilidad_placa: '',
  max_gpu_mm: '',
  max_cooler_mm: '',
  ventiladores_incluidos: '',
  color: '',
  panel_lateral: '',
};

function normalizarCampo(name, value) {
  if (name === 'disponible_a_pedido' || name === 'graficos_integrados' || name === 'rgb') {
    return Boolean(value);
  }
  return value;
}

export default function ProductForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
  error = '',
  categorias = CATEGORIAS,
  etiquetas = [],
}) {
  const categoriasDisponibles = useMemo(
    () => Array.from(new Set([...(categorias || []), ...(value.categoria ? [value.categoria] : [])])),
    [categorias, value.categoria]
  );

  const setCampo = (name, fieldValue) => {
    onChange((prev) => ({
      ...prev,
      [name]: normalizarCampo(name, fieldValue),
    }));
  };

  const cat = value.categoria;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-[var(--radius-sm)] border border-[color:rgba(255,69,58,0.4)] bg-[color:rgba(255,69,58,0.10)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      {/* ── Información base ── */}
      <FormSection
        title="Información base"
        description="Define los datos principales del producto que verá el usuario."
      >
        <InputField
          id="producto-nombre"
          label="Nombre"
          required
          data-autofocus="true"
          data-tour="modal-producto-basicos"
          value={value.nombre}
          onChange={(e) => setCampo('nombre', e.target.value)}
          placeholder="Ejemplo: AMD Ryzen 7 7700X"
          className="sm:col-span-2"
        />

        <SelectField
          id="producto-categoria"
          label="Categoría"
          required
          value={value.categoria}
          onChange={(e) => setCampo('categoria', e.target.value)}
          options={categoriasDisponibles.map((c) => ({ value: c, label: formatearCategoria(c) }))}
        />

        <InputField
          id="producto-precio"
          type="number"
          step="0.01"
          min="0"
          data-tour="modal-producto-comercial"
          label="Precio base (USD)"
          required
          value={value.precio_base}
          onChange={(e) => setCampo('precio_base', e.target.value)}
          placeholder="0.00"
        />

        <InputField
          id="producto-stock"
          type="number"
          min="0"
          label="Stock"
          required
          value={value.stock}
          onChange={(e) => setCampo('stock', e.target.value)}
          placeholder="0"
        />

        <InputField
          id="producto-url"
          label="URL de imagen"
          value={value.imagen_url}
          onChange={(e) => setCampo('imagen_url', e.target.value)}
          placeholder="https://..."
        />

        {value.imagen_url ? (
          <div className="sm:col-span-2">
            <ImagenProducto
              src={value.imagen_url}
              alt="Vista previa de la imagen del producto"
              imgClassName="max-h-32"
            />
          </div>
        ) : null}

        <SelectField
          id="producto-etiqueta"
          label="Etiqueta de perfil"
          value={value.id_etiqueta ?? ''}
          onChange={(e) => setCampo('id_etiqueta', e.target.value)}
          options={[
            { value: '', label: 'Sin etiqueta' },
            ...etiquetas.map((et) => ({ value: String(et.id), label: et.nombre })),
          ]}
        />

        {value.codigo_proveedor ? (
          <div className="sm:col-span-2">
            <a
              href={`https://www.deltron.com.pe/modulos/productos/items/producto.php?item_number=${encodeURIComponent(value.codigo_proveedor)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm text-[var(--color-accent)] transition-colors hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Ver en Deltron ({value.codigo_proveedor})
            </a>
          </div>
        ) : null}
      </FormSection>

      <SwitchField
        id="producto-pedido"
        label="Disponible a pedido"
        description="Activa esta opción cuando no exista stock inmediato."
        checked={value.disponible_a_pedido}
        onChange={(checked) => setCampo('disponible_a_pedido', checked)}
      />

      {value.disponible_a_pedido ? (
        <InputField
          id="producto-entrega"
          type="number"
          min="1"
          label="Tiempo de entrega (días)"
          value={value.tiempo_entrega_dias}
          onChange={(e) => setCampo('tiempo_entrega_dias', e.target.value)}
          placeholder="7"
        />
      ) : null}

      {/* ── Especificaciones técnicas ── */}
      <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4" open>
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          Especificaciones técnicas
        </summary>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">

          {/* ── PROCESADOR ── */}
          {cat === 'procesador' ? (
            <>
              <InputField id="spec-socket" label="Socket" value={value.socket}
                onChange={(e) => setCampo('socket', e.target.value)} placeholder="AM5, LGA1700..." />
              <InputField id="spec-arquitectura" label="Arquitectura" value={value.arquitectura}
                onChange={(e) => setCampo('arquitectura', e.target.value)} placeholder="Zen 4, Raptor Lake..." />
              <InputField id="spec-nucleos" type="number" min="1" label="Núcleos" value={value.nucleos}
                onChange={(e) => setCampo('nucleos', e.target.value)} placeholder="8" />
              <InputField id="spec-hilos" type="number" min="1" label="Hilos" value={value.hilos}
                onChange={(e) => setCampo('hilos', e.target.value)} placeholder="16" />
              <InputField id="spec-frec-base" type="number" step="0.01" min="0" label="Frecuencia base (GHz)"
                value={value.frecuencia_base_ghz} onChange={(e) => setCampo('frecuencia_base_ghz', e.target.value)} placeholder="3.8" />
              <InputField id="spec-frec-boost" type="number" step="0.01" min="0" label="Frecuencia boost (GHz)"
                value={value.frecuencia_boost_ghz} onChange={(e) => setCampo('frecuencia_boost_ghz', e.target.value)} placeholder="5.4" />
              <InputField id="spec-tdp" type="number" min="0" label="TDP (W)" value={value.tdp}
                onChange={(e) => setCampo('tdp', e.target.value)} placeholder="65" />
              <SwitchField id="spec-graficos" label="Gráficos integrados"
                checked={value.graficos_integrados} onChange={(v) => setCampo('graficos_integrados', v)} />
            </>
          ) : null}

          {/* ── PLACA MADRE ── */}
          {cat === 'placa_madre' ? (
            <>
              <InputField id="spec-socket" label="Socket" value={value.socket}
                onChange={(e) => setCampo('socket', e.target.value)} placeholder="AM5, LGA1700..." />
              <InputField id="spec-chipset" label="Chipset" value={value.chipset}
                onChange={(e) => setCampo('chipset', e.target.value)} placeholder="X670E, Z790..." />
              <SelectField id="spec-form-factor" label="Form factor" value={value.form_factor}
                onChange={(e) => setCampo('form_factor', e.target.value)}
                options={[{ value: '', label: 'Seleccionar...' }, ...FORM_FACTORS_MB.map((v) => ({ value: v, label: v }))]} />
              <SelectField id="spec-ram-type" label="Tipo de RAM" value={value.ram_type}
                onChange={(e) => setCampo('ram_type', e.target.value)}
                options={[{ value: '', label: 'Seleccionar...' }, ...RAM_TYPES.map((v) => ({ value: v, label: v }))]} />
              <InputField id="spec-max-ram" type="number" min="0" label="RAM máxima (GB)" value={value.max_ram_gb}
                onChange={(e) => setCampo('max_ram_gb', e.target.value)} placeholder="128" />
              <InputField id="spec-slots-ram" type="number" min="0" label="Slots RAM" value={value.slots_ram}
                onChange={(e) => setCampo('slots_ram', e.target.value)} placeholder="4" />
              <InputField id="spec-pcie" label="Versión PCIe" value={value.pcie_version}
                onChange={(e) => setCampo('pcie_version', e.target.value)} placeholder="PCIe 5.0" />
              <InputField id="spec-m2" type="number" min="0" label="Slots M.2" value={value.m2_slots}
                onChange={(e) => setCampo('m2_slots', e.target.value)} placeholder="3" />
            </>
          ) : null}

          {/* ── RAM ── */}
          {cat === 'ram' ? (
            <>
              <SelectField id="spec-ram-type" label="Tipo de RAM" value={value.ram_type}
                onChange={(e) => setCampo('ram_type', e.target.value)}
                options={[{ value: '', label: 'Seleccionar...' }, ...RAM_TYPES.map((v) => ({ value: v, label: v }))]} />
              <InputField id="spec-capacidad" type="number" min="0" label="Capacidad (GB)" value={value.capacidad_gb}
                onChange={(e) => setCampo('capacidad_gb', e.target.value)} placeholder="16" />
              <InputField id="spec-velocidad" type="number" min="0" label="Velocidad (MHz)" value={value.velocidad_mhz}
                onChange={(e) => setCampo('velocidad_mhz', e.target.value)} placeholder="6000" />
              <InputField id="spec-latencia" label="Latencia (CL)" value={value.latencia}
                onChange={(e) => setCampo('latencia', e.target.value)} placeholder="CL30" />
              <InputField id="spec-modulos" label="Módulos (ej: 2x8GB)" value={value.modulos}
                onChange={(e) => setCampo('modulos', e.target.value)} placeholder="2x8GB" />
              <InputField id="spec-cant-modulos" type="number" min="1" label="Cantidad de módulos" value={value.cantidad_modulos}
                onChange={(e) => setCampo('cantidad_modulos', e.target.value)} placeholder="2" />
              <SwitchField id="spec-rgb" label="RGB" checked={value.rgb} onChange={(v) => setCampo('rgb', v)} />
            </>
          ) : null}

          {/* ── ALMACENAMIENTO ── */}
          {cat === 'almacenamiento' ? (
            <>
              <SelectField id="spec-tipo-storage" label="Tipo" value={value.tipo_almacenamiento}
                onChange={(e) => setCampo('tipo_almacenamiento', e.target.value)}
                options={[{ value: '', label: 'Seleccionar...' }, ...STORAGE_TYPES.map((v) => ({ value: v, label: v }))]} />
              <InputField id="spec-capacidad" type="number" min="0" label="Capacidad (GB)" value={value.capacidad_gb}
                onChange={(e) => setCampo('capacidad_gb', e.target.value)} placeholder="1000" />
              <SelectField id="spec-interfaz" label="Interfaz" value={value.interfaz}
                onChange={(e) => setCampo('interfaz', e.target.value)}
                options={[{ value: '', label: 'Seleccionar...' }, ...STORAGE_INTERFACES.map((v) => ({ value: v, label: v }))]} />
              <SelectField id="spec-form-factor" label="Form factor" value={value.form_factor}
                onChange={(e) => setCampo('form_factor', e.target.value)}
                options={[{ value: '', label: 'Seleccionar...' }, ...FORM_FACTORS_STORAGE.map((v) => ({ value: v, label: v }))]} />
              <InputField id="spec-lect" type="number" min="0" label="Velocidad lectura (MB/s)" value={value.velocidad_lectura_mbps}
                onChange={(e) => setCampo('velocidad_lectura_mbps', e.target.value)} placeholder="7000" />
              <InputField id="spec-escr" type="number" min="0" label="Velocidad escritura (MB/s)" value={value.velocidad_escritura_mbps}
                onChange={(e) => setCampo('velocidad_escritura_mbps', e.target.value)} placeholder="6500" />
              <SelectField id="spec-nvme" label="Generación NVMe" value={value.nvme_gen}
                onChange={(e) => setCampo('nvme_gen', e.target.value)}
                options={[{ value: '', label: 'N/A' }, ...NVME_GENS.map((v) => ({ value: v, label: v }))]} />
            </>
          ) : null}

          {/* ── GPU ── */}
          {cat === 'gpu' ? (
            <>
              <InputField id="spec-chipset" label="Chipset" value={value.chipset}
                onChange={(e) => setCampo('chipset', e.target.value)} placeholder="RTX 4070, RX 7800 XT..." />
              <InputField id="spec-vram" type="number" min="0" label="VRAM (GB)" value={value.vram_gb}
                onChange={(e) => setCampo('vram_gb', e.target.value)} placeholder="12" />
              <SelectField id="spec-vram-tipo" label="Tipo VRAM" value={value.vram_tipo}
                onChange={(e) => setCampo('vram_tipo', e.target.value)}
                options={[{ value: '', label: 'Seleccionar...' }, ...VRAM_TYPES.map((v) => ({ value: v, label: v }))]} />
              <InputField id="spec-bus" type="number" min="0" label="Bus (bits)" value={value.bus_bits}
                onChange={(e) => setCampo('bus_bits', e.target.value)} placeholder="192" />
              <InputField id="spec-boost" type="number" min="0" label="Boost clock (MHz)" value={value.boost_mhz}
                onChange={(e) => setCampo('boost_mhz', e.target.value)} placeholder="2610" />
              <InputField id="spec-tdp" type="number" min="0" label="TDP (W)" value={value.tdp}
                onChange={(e) => setCampo('tdp', e.target.value)} placeholder="200" />
              <InputField id="spec-longitud" type="number" min="0" label="Longitud (mm)" value={value.longitud_mm}
                onChange={(e) => setCampo('longitud_mm', e.target.value)} placeholder="336" />
              <InputField id="spec-fuente-rec" type="number" min="0" label="Fuente recomendada (W)" value={value.fuente_recomendada_w}
                onChange={(e) => setCampo('fuente_recomendada_w', e.target.value)} placeholder="650" />
            </>
          ) : null}

          {/* ── FUENTE ── */}
          {cat === 'fuente' ? (
            <>
              <InputField id="spec-wattage" type="number" min="0" label="Potencia (W)" value={value.wattage}
                onChange={(e) => setCampo('wattage', e.target.value)} placeholder="750" />
              <SelectField id="spec-cert" label="Certificación" value={value.certificacion}
                onChange={(e) => setCampo('certificacion', e.target.value)}
                options={[{ value: '', label: 'Seleccionar...' }, ...CERT_PSU.map((v) => ({ value: v, label: v }))]} />
              <SelectField id="spec-modular" label="Modularidad" value={value.modular}
                onChange={(e) => setCampo('modular', e.target.value)}
                options={[{ value: '', label: 'Seleccionar...' }, ...MODULAR_TYPES.map((v) => ({ value: v, label: v }))]} />
              <SelectField id="spec-form-factor" label="Form factor" value={value.form_factor}
                onChange={(e) => setCampo('form_factor', e.target.value)}
                options={[{ value: '', label: 'Seleccionar...' }, ...FORM_FACTORS_PSU.map((v) => ({ value: v, label: v }))]} />
              <InputField id="spec-pcie-con" type="number" min="0" label="Conectores PCIe" value={value.pcie_conectores}
                onChange={(e) => setCampo('pcie_conectores', e.target.value)} placeholder="2" />
              <InputField id="spec-sata-con" type="number" min="0" label="Conectores SATA" value={value.sata_conectores}
                onChange={(e) => setCampo('sata_conectores', e.target.value)} placeholder="6" />
            </>
          ) : null}

          {/* ── CASE ── */}
          {cat === 'case' ? (
            <>
              <SelectField id="spec-form-factor" label="Form factor" value={value.form_factor}
                onChange={(e) => setCampo('form_factor', e.target.value)}
                options={[{ value: '', label: 'Seleccionar...' }, ...FORM_FACTORS_CASE.map((v) => ({ value: v, label: v }))]} />
              <InputField id="spec-compat-placa" label="Compatibilidad placa" value={value.compatibilidad_placa}
                onChange={(e) => setCampo('compatibilidad_placa', e.target.value)} placeholder="ATX, Micro-ATX, Mini-ITX" />
              <InputField id="spec-max-gpu" type="number" min="0" label="GPU máxima (mm)" value={value.max_gpu_mm}
                onChange={(e) => setCampo('max_gpu_mm', e.target.value)} placeholder="380" />
              <InputField id="spec-max-cooler" type="number" min="0" label="Cooler máximo (mm)" value={value.max_cooler_mm}
                onChange={(e) => setCampo('max_cooler_mm', e.target.value)} placeholder="165" />
              <InputField id="spec-ventiladores" type="number" min="0" label="Ventiladores incluidos" value={value.ventiladores_incluidos}
                onChange={(e) => setCampo('ventiladores_incluidos', e.target.value)} placeholder="3" />
              <InputField id="spec-color" label="Color" value={value.color}
                onChange={(e) => setCampo('color', e.target.value)} placeholder="Negro, Blanco..." />
              <InputField id="spec-panel" label="Panel lateral" value={value.panel_lateral}
                onChange={(e) => setCampo('panel_lateral', e.target.value)} placeholder="Vidrio templado, Acrílico..." />
            </>
          ) : null}

          <TextAreaField
            id="producto-descripcion"
            label="Descripción técnica"
            value={value.descripcion_tecnica}
            onChange={(e) => setCampo('descripcion_tecnica', e.target.value)}
            className="sm:col-span-2"
            rows={4}
          />
        </div>
      </details>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {mode === 'edit' ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  );
}
