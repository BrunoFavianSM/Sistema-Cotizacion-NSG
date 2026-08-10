-- ─────────────────────────────────────────────────────────────
-- Seed de catalogo para produccion (Neon)
-- Solo datos de REFERENCIA necesarios para que el sistema funcione.
-- NO incluye datos transaccionales (productos, cotizaciones, cuentas).
-- NO incluye claves de API cifradas: esas se reingresan desde el
-- panel de administracion en produccion (se cifran con la ENCRYPTION_KEY
-- de produccion). Ver nota al pie.
-- Idempotente: se puede correr varias veces sin duplicar.
-- ─────────────────────────────────────────────────────────────

BEGIN;

-- ── Categorias (estructural: mapeo de productos y motor de compatibilidad)
INSERT INTO categorias (id, nombre, es_componente_principal) VALUES
  (1,  'procesador',            true),
  (2,  'placa_madre',           true),
  (3,  'ram',                   true),
  (4,  'almacenamiento',        true),
  (5,  'gpu',                   true),
  (6,  'fuente',                true),
  (7,  'case',                  true),
  (8,  'perifericos',           false),
  (9,  'audio',                 false),
  (10, 'software',              false),
  (11, 'almacenamiento_externo',false),
  (12, 'energia',               false),
  (13, 'monitor',               false),
  (14, 'refrigeracion',         false),
  (15, 'conectividad',          false)
ON CONFLICT (id) DO NOTHING;

-- ── Etiquetas (niveles de armado del asistente)
INSERT INTO etiquetas (id, nombre, orden) VALUES
  (1, 'Basico',    1),
  (2, 'Medio',     2),
  (3, 'Avanzado',  3),
  (4, 'Gamer Full',4)
ON CONFLICT (id) DO NOTHING;

-- ── Configuracion de negocio (NO claves cifradas)
INSERT INTO configuracion (id, clave, valor, descripcion) VALUES
  (1,  'margen_ganancia',            '19',                                   'Porcentaje de margen de ganancia'),
  (2,  'margen_ganancia_default',    '19',                                   'Porcentaje de margen por defecto para cotizaciones'),
  (3,  'tasa_igv',                   '18',                                   'Porcentaje de IGV aplicado al precio neto'),
  (4,  'tipo_cambio_usd_pen',        '3.414',                                'Tipo de cambio referencial USD a PEN'),
  (8,  'modo_tipo_cambio',           'automatico',                           'Modo de obtencion del tipo de cambio USD/PEN: manual o automatico'),
  (9,  'ia_modo_activo',             'nvidia',                               NULL),
  (10, 'ia_gemini_model',            'gemini-2.5-flash',                     NULL),
  (11, 'ia_nvidia_model',            'mistralai/mistral-small-4-119b-2603',  NULL),
  (12, 'ia_nvidia_classifier_model', 'meta/llama-3.2-3b-instruct',           NULL),
  (13, 'ia_nvidia_embedding_model',  'nvidia/nv-embed-v1',                   NULL),
  (14, 'ia_nvidia_reranker_model',   'nvidia/rerank-qa-mistral-4b',          NULL),
  (39, 'whatsapp_numero_ventas',     '51993230740',                          'Numero de WhatsApp del asesor de ventas (codigo pais + numero, solo digitos). Editable desde el panel de configuracion.')
ON CONFLICT (id) DO NOTHING;

-- ── Reajustar las sequences para que los proximos INSERT no colisionen
SELECT setval(pg_get_serial_sequence('categorias', 'id'),   (SELECT MAX(id) FROM categorias));
SELECT setval(pg_get_serial_sequence('etiquetas', 'id'),    (SELECT MAX(id) FROM etiquetas));
SELECT setval(pg_get_serial_sequence('configuracion', 'id'),(SELECT MAX(id) FROM configuracion));

COMMIT;

-- ─────────────────────────────────────────────────────────────
-- NOTA sobre las claves de API (NVIDIA, Gemini, Decolecta):
-- En desarrollo estaban cifradas en la tabla `configuracion`
-- (ia_nvidia_api_key_enc, ia_gemini_api_key_enc, decolecta_api_token_enc).
-- NO se incluyen aqui a proposito: fueron cifradas con la ENCRYPTION_KEY
-- de desarrollo. En produccion se reingresan desde el panel de
-- administracion, quedando cifradas con la ENCRYPTION_KEY de produccion.
-- ─────────────────────────────────────────────────────────────
