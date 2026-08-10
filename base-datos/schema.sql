--
-- PostgreSQL database dump
--

\restrict mZ3jntlTSs5CDP2uax6PTqTyQ5JiCDVgJTKu8GVH4S27TZAISsYHXefRrm0GZRr

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-07-04 22:09:23

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 256 (class 1255 OID 127638)
-- Name: actualizar_clientes_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_clientes_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_clientes_updated_at() OWNER TO postgres;

--
-- TOC entry 255 (class 1255 OID 24842)
-- Name: actualizar_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_updated_at() OWNER TO postgres;

--
-- TOC entry 257 (class 1255 OID 24845)
-- Name: generar_codigo_ticket(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generar_codigo_ticket() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  anio INTEGER;
  seq_name VARCHAR;
  nuevo_numero BIGINT;
  nuevo_codigo VARCHAR;
BEGIN
  anio := EXTRACT(YEAR FROM CURRENT_DATE);
  seq_name := 'seq_ticket_' || anio;

  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = seq_name) THEN
    EXECUTE format('CREATE SEQUENCE %I START 1', seq_name);
  END IF;

  -- Buscar un número libre (la secuencia podría estar desincronizada del MAX real).
  LOOP
    EXECUTE format('SELECT nextval(%L)', seq_name) INTO nuevo_numero;
    nuevo_codigo := 'NSG-' || anio || '-' || LPAD(nuevo_numero::TEXT, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM cotizaciones WHERE codigo_ticket = nuevo_codigo);
  END LOOP;

  RETURN nuevo_codigo;
END;
$$;


ALTER FUNCTION public.generar_codigo_ticket() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 243 (class 1259 OID 53890)
-- Name: asistente_configuraciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asistente_configuraciones (
    id integer NOT NULL,
    sesion_id uuid NOT NULL,
    configuracion jsonb NOT NULL,
    precio_total_usd numeric(10,2),
    validada boolean DEFAULT false NOT NULL,
    intentos_validacion integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.asistente_configuraciones OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 53889)
-- Name: asistente_configuraciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.asistente_configuraciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asistente_configuraciones_id_seq OWNER TO postgres;

--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 242
-- Name: asistente_configuraciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.asistente_configuraciones_id_seq OWNED BY public.asistente_configuraciones.id;


--
-- TOC entry 241 (class 1259 OID 53866)
-- Name: asistente_mensajes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asistente_mensajes (
    id integer NOT NULL,
    sesion_id uuid NOT NULL,
    rol character varying(10) NOT NULL,
    contenido text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT asistente_mensajes_rol_check CHECK (((rol)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[])))
);


ALTER TABLE public.asistente_mensajes OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 53865)
-- Name: asistente_mensajes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.asistente_mensajes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asistente_mensajes_id_seq OWNER TO postgres;

--
-- TOC entry 5344 (class 0 OID 0)
-- Dependencies: 240
-- Name: asistente_mensajes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.asistente_mensajes_id_seq OWNED BY public.asistente_mensajes.id;


--
-- TOC entry 239 (class 1259 OID 53839)
-- Name: asistente_sesiones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asistente_sesiones (
    id integer NOT NULL,
    sesion_id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id integer,
    perfil_usuario character varying(20),
    presupuesto_pen numeric(10,2),
    estado character varying(20) DEFAULT 'activa'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT asistente_sesiones_estado_check CHECK (((estado)::text = ANY ((ARRAY['activa'::character varying, 'completada'::character varying, 'abandonada'::character varying, 'cuestionario'::character varying, 'listo_para_cotizar'::character varying, 'cotizacion_generada'::character varying])::text[]))),
    CONSTRAINT asistente_sesiones_perfil_usuario_check CHECK (((perfil_usuario)::text = ANY ((ARRAY['basico'::character varying, 'intermedio'::character varying, 'avanzado'::character varying, 'gamer_full'::character varying])::text[])))
);


ALTER TABLE public.asistente_sesiones OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 53838)
-- Name: asistente_sesiones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.asistente_sesiones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asistente_sesiones_id_seq OWNER TO postgres;

--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 238
-- Name: asistente_sesiones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.asistente_sesiones_id_seq OWNED BY public.asistente_sesiones.id;


--
-- TOC entry 226 (class 1259 OID 45277)
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nombre character varying(60) NOT NULL,
    es_componente_principal boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categorias OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 45276)
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_id_seq OWNER TO postgres;

--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 225
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- TOC entry 220 (class 1259 OID 24721)
-- Name: configuracion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuracion (
    id integer NOT NULL,
    clave character varying(50) NOT NULL,
    valor character varying(255) NOT NULL,
    descripcion text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.configuracion OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 24720)
-- Name: configuracion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.configuracion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.configuracion_id_seq OWNER TO postgres;

--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 219
-- Name: configuracion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.configuracion_id_seq OWNED BY public.configuracion.id;


--
-- TOC entry 222 (class 1259 OID 24736)
-- Name: cotizaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cotizaciones (
    id integer NOT NULL,
    codigo_unico uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo_ticket character varying(20) NOT NULL,
    id_cliente integer,
    fecha_emision timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_validez timestamp without time zone NOT NULL,
    precio_total numeric(10,2) NOT NULL,
    margen_aplicado numeric(5,2) NOT NULL,
    estado character varying(20) DEFAULT 'Pendiente'::character varying NOT NULL,
    fecha_reclamacion timestamp without time zone,
    id_vendedor integer,
    moneda_base character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    subtotal_neto numeric(12,2) DEFAULT 0 NOT NULL,
    igv_porcentaje numeric(5,2) DEFAULT 18 NOT NULL,
    igv_monto numeric(12,2) DEFAULT 0 NOT NULL,
    total_con_igv numeric(12,2) DEFAULT 0 NOT NULL,
    tipo_cambio_referencia numeric(10,4) DEFAULT 3.75 NOT NULL,
    subtotal_neto_pen numeric(12,2) DEFAULT 0 NOT NULL,
    igv_monto_pen numeric(12,2) DEFAULT 0 NOT NULL,
    total_con_igv_pen numeric(12,2) DEFAULT 0 NOT NULL,
    cantidad_equipos integer DEFAULT 1 NOT NULL,
    fecha_solicitud_confirmacion timestamp without time zone,
    fecha_confirmacion timestamp without time zone,
    id_confirmador integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_estado_valido CHECK (((estado)::text = ANY (ARRAY[('Pendiente'::character varying)::text, ('Confirmada'::character varying)::text, ('Completada'::character varying)::text, ('Caducada'::character varying)::text, ('Reclamada'::character varying)::text]))),
    CONSTRAINT check_precio_total_positive CHECK ((precio_total > (0)::numeric)),
    CONSTRAINT cotizaciones_cantidad_equipos_check CHECK ((cantidad_equipos >= 1))
);


ALTER TABLE public.cotizaciones OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 24735)
-- Name: cotizaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cotizaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cotizaciones_id_seq OWNER TO postgres;

--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 221
-- Name: cotizaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cotizaciones_id_seq OWNED BY public.cotizaciones.id;


--
-- TOC entry 245 (class 1259 OID 78324)
-- Name: cuentas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cuentas (
    id integer NOT NULL,
    username character varying(50),
    password_hash character varying(255),
    correo_encrypted character varying(150),
    correo_hash character varying(64),
    nombre_completo character varying(100) NOT NULL,
    telefono_encrypted character varying(100),
    telefono_hash character varying(64),
    rol character varying(20) DEFAULT 'usuario'::character varying NOT NULL,
    intentos_fallidos integer DEFAULT 0 NOT NULL,
    bloqueado_hasta timestamp without time zone,
    token_recuperacion character varying(255),
    token_recuperacion_expira timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado character varying(30) DEFAULT 'activa'::character varying NOT NULL,
    dni character varying(15),
    nombre character varying(100),
    apellidos character varying(100),
    CONSTRAINT check_nombre_completo_largo CHECK (((length((nombre_completo)::text) >= 2) AND (length((nombre_completo)::text) <= 100))),
    CONSTRAINT check_password_hash_largo CHECK (((password_hash IS NULL) OR (length((password_hash)::text) >= 20))),
    CONSTRAINT check_username_formato CHECK (((username IS NULL) OR ((length((username)::text) >= 3) AND ((username)::text ~ '^[a-zA-Z0-9_]+$'::text)))),
    CONSTRAINT cuentas_dni_check CHECK (((dni IS NULL) OR ((dni)::text ~ '^[0-9]{8,15}$'::text))),
    CONSTRAINT cuentas_estado_check CHECK (((estado)::text = ANY (ARRAY[('activa'::character varying)::text, ('pendiente_activacion'::character varying)::text, ('desactivada'::character varying)::text]))),
    CONSTRAINT cuentas_intentos_fallidos_check CHECK ((intentos_fallidos >= 0)),
    CONSTRAINT cuentas_rol_check CHECK (((rol)::text = ANY ((ARRAY['admin'::character varying, 'vendedor'::character varying, 'usuario'::character varying])::text[])))
);


ALTER TABLE public.cuentas OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 78323)
-- Name: cuentas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cuentas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cuentas_id_seq OWNER TO postgres;

--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 244
-- Name: cuentas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cuentas_id_seq OWNED BY public.cuentas.id;


--
-- TOC entry 224 (class 1259 OID 24775)
-- Name: detalle_cotizacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_cotizacion (
    id integer NOT NULL,
    id_cotizacion integer NOT NULL,
    id_producto integer,
    nombre_producto character varying(200) NOT NULL,
    categoria character varying(50) NOT NULL,
    descripcion_tecnica text,
    precio_unitario numeric(10,2) NOT NULL,
    cantidad integer DEFAULT 1 NOT NULL,
    disponible_stock boolean NOT NULL,
    costo_unitario_neto_usd numeric(12,2) DEFAULT 0 NOT NULL,
    margen_aplicado numeric(5,2) DEFAULT 0 NOT NULL,
    precio_unitario_neto_usd numeric(12,2) DEFAULT 0 NOT NULL,
    igv_unitario_usd numeric(12,2) DEFAULT 0 NOT NULL,
    precio_unitario_total_usd numeric(12,2) DEFAULT 0 NOT NULL,
    tabla_producto character varying(50) DEFAULT 'productos_procesador'::character varying NOT NULL,
    CONSTRAINT check_cantidad_positive CHECK ((cantidad > 0)),
    CONSTRAINT check_precio_unitario_positive CHECK ((precio_unitario > (0)::numeric))
);


ALTER TABLE public.detalle_cotizacion OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 24774)
-- Name: detalle_cotizacion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_cotizacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_cotizacion_id_seq OWNER TO postgres;

--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 223
-- Name: detalle_cotizacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_cotizacion_id_seq OWNED BY public.detalle_cotizacion.id;


--
-- TOC entry 252 (class 1259 OID 136526)
-- Name: etiquetas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.etiquetas (
    id integer NOT NULL,
    nombre character varying(40) NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.etiquetas OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 136525)
-- Name: etiquetas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.etiquetas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.etiquetas_id_seq OWNER TO postgres;

--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 251
-- Name: etiquetas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.etiquetas_id_seq OWNED BY public.etiquetas.id;


--
-- TOC entry 247 (class 1259 OID 78454)
-- Name: historial_precios_producto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_precios_producto (
    id integer NOT NULL,
    id_producto integer NOT NULL,
    tabla_producto character varying(60) NOT NULL,
    precio_anterior numeric(12,2) NOT NULL,
    precio_nuevo numeric(12,2) NOT NULL,
    fecha_cambio timestamp with time zone DEFAULT now() NOT NULL,
    id_usuario_admin integer
);


ALTER TABLE public.historial_precios_producto OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 78453)
-- Name: historial_precios_producto_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historial_precios_producto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historial_precios_producto_id_seq OWNER TO postgres;

--
-- TOC entry 5352 (class 0 OID 0)
-- Dependencies: 246
-- Name: historial_precios_producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historial_precios_producto_id_seq OWNED BY public.historial_precios_producto.id;


--
-- TOC entry 228 (class 1259 OID 45292)
-- Name: marcas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marcas (
    id integer NOT NULL,
    nombre character varying(120) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.marcas OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 45291)
-- Name: marcas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.marcas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.marcas_id_seq OWNER TO postgres;

--
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 227
-- Name: marcas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.marcas_id_seq OWNED BY public.marcas.id;


--
-- TOC entry 254 (class 1259 OID 153185)
-- Name: notificaciones_cotizacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificaciones_cotizacion (
    id integer NOT NULL,
    id_cotizacion integer NOT NULL,
    tipo character varying(40) NOT NULL,
    email_destino character varying(255),
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    respuesta jsonb,
    mensaje_error text,
    fecha_intento timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_envio timestamp without time zone,
    CONSTRAINT notificaciones_cotizacion_estado_check CHECK (((estado)::text = ANY (ARRAY[('pendiente'::character varying)::text, ('enviada'::character varying)::text, ('fallida'::character varying)::text])))
);


ALTER TABLE public.notificaciones_cotizacion OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 153184)
-- Name: notificaciones_cotizacion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.notificaciones_cotizacion ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.notificaciones_cotizacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 249 (class 1259 OID 78496)
-- Name: notificaciones_usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificaciones_usuario (
    id integer NOT NULL,
    id_usuario integer NOT NULL,
    tipo character varying(50) NOT NULL,
    titulo character varying(200) NOT NULL,
    mensaje text NOT NULL,
    leida boolean DEFAULT false NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now() NOT NULL,
    datos_extra jsonb
);


ALTER TABLE public.notificaciones_usuario OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 78495)
-- Name: notificaciones_usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notificaciones_usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificaciones_usuario_id_seq OWNER TO postgres;

--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 248
-- Name: notificaciones_usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notificaciones_usuario_id_seq OWNED BY public.notificaciones_usuario.id;


--
-- TOC entry 230 (class 1259 OID 45305)
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    id_categoria integer NOT NULL,
    id_marca integer,
    subcategoria character varying(40),
    categoria_proveedor character varying(200),
    codigo_proveedor character varying(100) NOT NULL,
    nombre character varying(320) NOT NULL,
    descripcion_general text,
    precio_base numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    disponible_a_pedido boolean DEFAULT false NOT NULL,
    imagen_url character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado_enriquecimiento character varying(20) DEFAULT 'no_aplica'::character varying NOT NULL,
    id_etiqueta integer,
    CONSTRAINT productos_estado_enriquecimiento_check CHECK (((estado_enriquecimiento)::text = ANY ((ARRAY['pendiente'::character varying, 'enriquecido'::character varying, 'fallido'::character varying, 'csv'::character varying, 'no_aplica'::character varying])::text[]))),
    CONSTRAINT productos_precio_base_check CHECK (((precio_base > (0)::numeric) AND (precio_base <= (100000)::numeric))),
    CONSTRAINT productos_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 45304)
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO postgres;

--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 229
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- TOC entry 250 (class 1259 OID 135869)
-- Name: seq_ticket_2026; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_ticket_2026
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_ticket_2026 OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 45385)
-- Name: specs_almacenamiento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specs_almacenamiento (
    id_producto integer NOT NULL,
    tipo_almacenamiento character varying(40),
    capacidad_gb integer,
    interfaz character varying(40),
    form_factor character varying(30),
    velocidad_lectura_mbps integer,
    velocidad_escritura_mbps integer,
    nvme_gen character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ficha_tecnica jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.specs_almacenamiento OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 45430)
-- Name: specs_case; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specs_case (
    id_producto integer NOT NULL,
    form_factor character varying(30),
    compatibilidad_placa character varying(60),
    max_gpu_mm integer,
    max_cooler_mm integer,
    ventiladores_incluidos integer,
    color character varying(40),
    panel_lateral character varying(60),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ficha_tecnica jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.specs_case OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 45415)
-- Name: specs_fuente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specs_fuente (
    id_producto integer NOT NULL,
    wattage integer,
    certificacion character varying(30),
    modular character varying(30),
    form_factor character varying(30),
    pcie_conectores integer,
    sata_conectores integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ficha_tecnica jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.specs_fuente OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 45400)
-- Name: specs_gpu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specs_gpu (
    id_producto integer NOT NULL,
    chipset character varying(120),
    vram_gb integer,
    vram_tipo character varying(30),
    bus_bits integer,
    boost_mhz integer,
    tdp_w integer,
    longitud_mm integer,
    fuente_recomendada_w integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ficha_tecnica jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.specs_gpu OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 45355)
-- Name: specs_placa_madre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specs_placa_madre (
    id_producto integer NOT NULL,
    socket character varying(50),
    chipset character varying(80),
    form_factor character varying(30),
    ram_tipo character varying(30),
    max_ram_gb integer,
    slots_ram integer,
    pcie_version character varying(20),
    m2_slots integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ficha_tecnica jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.specs_placa_madre OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 45340)
-- Name: specs_procesador; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specs_procesador (
    id_producto integer NOT NULL,
    socket character varying(50),
    arquitectura character varying(80),
    nucleos integer,
    hilos integer,
    frecuencia_base_ghz numeric(4,2),
    frecuencia_boost_ghz numeric(4,2),
    tdp_w integer,
    graficos_integrados boolean,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ficha_tecnica jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.specs_procesador OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 45370)
-- Name: specs_ram; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specs_ram (
    id_producto integer NOT NULL,
    ram_tipo character varying(30),
    capacidad_gb integer,
    velocidad_mhz integer,
    latencia character varying(20),
    modulos character varying(30),
    cantidad_modulos integer,
    rgb boolean,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ficha_tecnica jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.specs_ram OWNER TO postgres;

--
-- TOC entry 5020 (class 2604 OID 53893)
-- Name: asistente_configuraciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistente_configuraciones ALTER COLUMN id SET DEFAULT nextval('public.asistente_configuraciones_id_seq'::regclass);


--
-- TOC entry 5017 (class 2604 OID 53869)
-- Name: asistente_mensajes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistente_mensajes ALTER COLUMN id SET DEFAULT nextval('public.asistente_mensajes_id_seq'::regclass);


--
-- TOC entry 5012 (class 2604 OID 53842)
-- Name: asistente_sesiones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistente_sesiones ALTER COLUMN id SET DEFAULT nextval('public.asistente_sesiones_id_seq'::regclass);


--
-- TOC entry 4978 (class 2604 OID 45280)
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- TOC entry 4953 (class 2604 OID 24724)
-- Name: configuracion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion ALTER COLUMN id SET DEFAULT nextval('public.configuracion_id_seq'::regclass);


--
-- TOC entry 4955 (class 2604 OID 24739)
-- Name: cotizaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones ALTER COLUMN id SET DEFAULT nextval('public.cotizaciones_id_seq'::regclass);


--
-- TOC entry 5024 (class 2604 OID 78327)
-- Name: cuentas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuentas ALTER COLUMN id SET DEFAULT nextval('public.cuentas_id_seq'::regclass);


--
-- TOC entry 4970 (class 2604 OID 24778)
-- Name: detalle_cotizacion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_cotizacion ALTER COLUMN id SET DEFAULT nextval('public.detalle_cotizacion_id_seq'::regclass);


--
-- TOC entry 5035 (class 2604 OID 136529)
-- Name: etiquetas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etiquetas ALTER COLUMN id SET DEFAULT nextval('public.etiquetas_id_seq'::regclass);


--
-- TOC entry 5030 (class 2604 OID 78457)
-- Name: historial_precios_producto id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_precios_producto ALTER COLUMN id SET DEFAULT nextval('public.historial_precios_producto_id_seq'::regclass);


--
-- TOC entry 4982 (class 2604 OID 45295)
-- Name: marcas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marcas ALTER COLUMN id SET DEFAULT nextval('public.marcas_id_seq'::regclass);


--
-- TOC entry 5032 (class 2604 OID 78499)
-- Name: notificaciones_usuario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones_usuario ALTER COLUMN id SET DEFAULT nextval('public.notificaciones_usuario_id_seq'::regclass);


--
-- TOC entry 4985 (class 2604 OID 45308)
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- TOC entry 5128 (class 2606 OID 53906)
-- Name: asistente_configuraciones asistente_configuraciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistente_configuraciones
    ADD CONSTRAINT asistente_configuraciones_pkey PRIMARY KEY (id);


--
-- TOC entry 5125 (class 2606 OID 53882)
-- Name: asistente_mensajes asistente_mensajes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistente_mensajes
    ADD CONSTRAINT asistente_mensajes_pkey PRIMARY KEY (id);


--
-- TOC entry 5119 (class 2606 OID 53855)
-- Name: asistente_sesiones asistente_sesiones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistente_sesiones
    ADD CONSTRAINT asistente_sesiones_pkey PRIMARY KEY (id);


--
-- TOC entry 5121 (class 2606 OID 53857)
-- Name: asistente_sesiones asistente_sesiones_sesion_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistente_sesiones
    ADD CONSTRAINT asistente_sesiones_sesion_id_key UNIQUE (sesion_id);


--
-- TOC entry 5078 (class 2606 OID 45290)
-- Name: categorias categorias_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_nombre_key UNIQUE (nombre);


--
-- TOC entry 5080 (class 2606 OID 45288)
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- TOC entry 5061 (class 2606 OID 24734)
-- Name: configuracion configuracion_clave_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_clave_key UNIQUE (clave);


--
-- TOC entry 5063 (class 2606 OID 24732)
-- Name: configuracion configuracion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_pkey PRIMARY KEY (id);


--
-- TOC entry 5065 (class 2606 OID 24760)
-- Name: cotizaciones cotizaciones_codigo_ticket_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_codigo_ticket_key UNIQUE (codigo_ticket);


--
-- TOC entry 5067 (class 2606 OID 24758)
-- Name: cotizaciones cotizaciones_codigo_unico_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_codigo_unico_key UNIQUE (codigo_unico);


--
-- TOC entry 5069 (class 2606 OID 24756)
-- Name: cotizaciones cotizaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 5131 (class 2606 OID 78349)
-- Name: cuentas cuentas_correo_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuentas
    ADD CONSTRAINT cuentas_correo_hash_key UNIQUE (correo_hash);


--
-- TOC entry 5133 (class 2606 OID 78345)
-- Name: cuentas cuentas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuentas
    ADD CONSTRAINT cuentas_pkey PRIMARY KEY (id);


--
-- TOC entry 5135 (class 2606 OID 78347)
-- Name: cuentas cuentas_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuentas
    ADD CONSTRAINT cuentas_username_key UNIQUE (username);


--
-- TOC entry 5074 (class 2606 OID 24793)
-- Name: detalle_cotizacion detalle_cotizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_cotizacion
    ADD CONSTRAINT detalle_cotizacion_pkey PRIMARY KEY (id);


--
-- TOC entry 5150 (class 2606 OID 136539)
-- Name: etiquetas etiquetas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etiquetas
    ADD CONSTRAINT etiquetas_nombre_key UNIQUE (nombre);


--
-- TOC entry 5152 (class 2606 OID 136537)
-- Name: etiquetas etiquetas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etiquetas
    ADD CONSTRAINT etiquetas_pkey PRIMARY KEY (id);


--
-- TOC entry 5142 (class 2606 OID 78466)
-- Name: historial_precios_producto historial_precios_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_precios_producto
    ADD CONSTRAINT historial_precios_producto_pkey PRIMARY KEY (id);


--
-- TOC entry 5082 (class 2606 OID 45303)
-- Name: marcas marcas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_nombre_key UNIQUE (nombre);


--
-- TOC entry 5084 (class 2606 OID 45301)
-- Name: marcas marcas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_pkey PRIMARY KEY (id);


--
-- TOC entry 5155 (class 2606 OID 153201)
-- Name: notificaciones_cotizacion notificaciones_cotizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones_cotizacion
    ADD CONSTRAINT notificaciones_cotizacion_pkey PRIMARY KEY (id);


--
-- TOC entry 5148 (class 2606 OID 78512)
-- Name: notificaciones_usuario notificaciones_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones_usuario
    ADD CONSTRAINT notificaciones_usuario_pkey PRIMARY KEY (id);


--
-- TOC entry 5095 (class 2606 OID 45329)
-- Name: productos productos_codigo_proveedor_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_codigo_proveedor_key UNIQUE (codigo_proveedor);


--
-- TOC entry 5097 (class 2606 OID 45327)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- TOC entry 5109 (class 2606 OID 45394)
-- Name: specs_almacenamiento specs_almacenamiento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_almacenamiento
    ADD CONSTRAINT specs_almacenamiento_pkey PRIMARY KEY (id_producto);


--
-- TOC entry 5117 (class 2606 OID 45439)
-- Name: specs_case specs_case_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_case
    ADD CONSTRAINT specs_case_pkey PRIMARY KEY (id_producto);


--
-- TOC entry 5115 (class 2606 OID 45424)
-- Name: specs_fuente specs_fuente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_fuente
    ADD CONSTRAINT specs_fuente_pkey PRIMARY KEY (id_producto);


--
-- TOC entry 5112 (class 2606 OID 45409)
-- Name: specs_gpu specs_gpu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_gpu
    ADD CONSTRAINT specs_gpu_pkey PRIMARY KEY (id_producto);


--
-- TOC entry 5104 (class 2606 OID 45364)
-- Name: specs_placa_madre specs_placa_madre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_placa_madre
    ADD CONSTRAINT specs_placa_madre_pkey PRIMARY KEY (id_producto);


--
-- TOC entry 5100 (class 2606 OID 45349)
-- Name: specs_procesador specs_procesador_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_procesador
    ADD CONSTRAINT specs_procesador_pkey PRIMARY KEY (id_producto);


--
-- TOC entry 5107 (class 2606 OID 45379)
-- Name: specs_ram specs_ram_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_ram
    ADD CONSTRAINT specs_ram_pkey PRIMARY KEY (id_producto);


--
-- TOC entry 5129 (class 1259 OID 53912)
-- Name: idx_asistente_config_sesion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asistente_config_sesion ON public.asistente_configuraciones USING btree (sesion_id);


--
-- TOC entry 5126 (class 1259 OID 53888)
-- Name: idx_asistente_mensajes_sesion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asistente_mensajes_sesion ON public.asistente_mensajes USING btree (sesion_id);


--
-- TOC entry 5122 (class 1259 OID 53864)
-- Name: idx_asistente_sesiones_sesion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asistente_sesiones_sesion ON public.asistente_sesiones USING btree (sesion_id);


--
-- TOC entry 5123 (class 1259 OID 53863)
-- Name: idx_asistente_sesiones_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asistente_sesiones_usuario ON public.asistente_sesiones USING btree (usuario_id);


--
-- TOC entry 5070 (class 1259 OID 24773)
-- Name: idx_cotizaciones_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cotizaciones_cliente ON public.cotizaciones USING btree (id_cliente);


--
-- TOC entry 5071 (class 1259 OID 24771)
-- Name: idx_cotizaciones_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cotizaciones_codigo ON public.cotizaciones USING btree (codigo_unico);


--
-- TOC entry 5072 (class 1259 OID 24772)
-- Name: idx_cotizaciones_ticket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cotizaciones_ticket ON public.cotizaciones USING btree (codigo_ticket);


--
-- TOC entry 5136 (class 1259 OID 78350)
-- Name: idx_cuentas_correo_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cuentas_correo_hash ON public.cuentas USING btree (correo_hash);


--
-- TOC entry 5137 (class 1259 OID 86559)
-- Name: idx_cuentas_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cuentas_estado ON public.cuentas USING btree (estado);


--
-- TOC entry 5138 (class 1259 OID 78351)
-- Name: idx_cuentas_rol; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cuentas_rol ON public.cuentas USING btree (rol);


--
-- TOC entry 5139 (class 1259 OID 78352)
-- Name: idx_cuentas_telefono_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cuentas_telefono_hash ON public.cuentas USING btree (telefono_hash);


--
-- TOC entry 5075 (class 1259 OID 24804)
-- Name: idx_detalle_cotizacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_detalle_cotizacion ON public.detalle_cotizacion USING btree (id_cotizacion);


--
-- TOC entry 5076 (class 1259 OID 136563)
-- Name: idx_detalle_id_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_detalle_id_producto ON public.detalle_cotizacion USING btree (id_producto);


--
-- TOC entry 5143 (class 1259 OID 136557)
-- Name: idx_historial_id_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_id_producto ON public.historial_precios_producto USING btree (id_producto);


--
-- TOC entry 5144 (class 1259 OID 78473)
-- Name: idx_historial_precios_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_precios_fecha ON public.historial_precios_producto USING btree (fecha_cambio DESC);


--
-- TOC entry 5145 (class 1259 OID 78472)
-- Name: idx_historial_precios_id_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_precios_id_producto ON public.historial_precios_producto USING btree (id_producto, tabla_producto);


--
-- TOC entry 5153 (class 1259 OID 153207)
-- Name: idx_notif_cotizacion_intento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_cotizacion_intento ON public.notificaciones_cotizacion USING btree (id_cotizacion, fecha_intento DESC);


--
-- TOC entry 5146 (class 1259 OID 78518)
-- Name: idx_notificaciones_usuario_pendientes; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificaciones_usuario_pendientes ON public.notificaciones_usuario USING btree (id_usuario, leida, fecha_creacion DESC) WHERE (leida = false);


--
-- TOC entry 5085 (class 1259 OID 45445)
-- Name: idx_productos_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_categoria ON public.productos USING btree (id_categoria);


--
-- TOC entry 5086 (class 1259 OID 45449)
-- Name: idx_productos_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_codigo ON public.productos USING btree (codigo_proveedor);


--
-- TOC entry 5087 (class 1259 OID 86585)
-- Name: idx_productos_estado_enriquecimiento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_estado_enriquecimiento ON public.productos USING btree (estado_enriquecimiento);


--
-- TOC entry 5088 (class 1259 OID 136545)
-- Name: idx_productos_id_etiqueta; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_id_etiqueta ON public.productos USING btree (id_etiqueta);


--
-- TOC entry 5089 (class 1259 OID 45446)
-- Name: idx_productos_marca; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_marca ON public.productos USING btree (id_marca);


--
-- TOC entry 5090 (class 1259 OID 45450)
-- Name: idx_productos_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_nombre ON public.productos USING btree (nombre);


--
-- TOC entry 5091 (class 1259 OID 45451)
-- Name: idx_productos_precio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_precio ON public.productos USING btree (precio_base);


--
-- TOC entry 5092 (class 1259 OID 45447)
-- Name: idx_productos_stock; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_stock ON public.productos USING btree (stock);


--
-- TOC entry 5093 (class 1259 OID 45448)
-- Name: idx_productos_subcategoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_subcategoria ON public.productos USING btree (subcategoria);


--
-- TOC entry 5113 (class 1259 OID 45456)
-- Name: idx_specs_fuente_wattage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_specs_fuente_wattage ON public.specs_fuente USING btree (wattage);


--
-- TOC entry 5110 (class 1259 OID 45457)
-- Name: idx_specs_gpu_chipset; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_specs_gpu_chipset ON public.specs_gpu USING btree (chipset);


--
-- TOC entry 5101 (class 1259 OID 45454)
-- Name: idx_specs_placa_ram; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_specs_placa_ram ON public.specs_placa_madre USING btree (ram_tipo);


--
-- TOC entry 5102 (class 1259 OID 45453)
-- Name: idx_specs_placa_socket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_specs_placa_socket ON public.specs_placa_madre USING btree (socket);


--
-- TOC entry 5098 (class 1259 OID 45452)
-- Name: idx_specs_procesador_socket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_specs_procesador_socket ON public.specs_procesador USING btree (socket);


--
-- TOC entry 5105 (class 1259 OID 45455)
-- Name: idx_specs_ram_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_specs_ram_tipo ON public.specs_ram USING btree (ram_tipo);


--
-- TOC entry 5140 (class 1259 OID 136547)
-- Name: uq_cuentas_dni; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_cuentas_dni ON public.cuentas USING btree (dni) WHERE (dni IS NOT NULL);


--
-- TOC entry 5180 (class 2620 OID 135842)
-- Name: categorias trigger_categorias_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- TOC entry 5178 (class 2620 OID 24844)
-- Name: configuracion trigger_configuracion_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_configuracion_updated_at BEFORE UPDATE ON public.configuracion FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- TOC entry 5179 (class 2620 OID 135837)
-- Name: cotizaciones trigger_cotizaciones_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_cotizaciones_updated_at BEFORE UPDATE ON public.cotizaciones FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- TOC entry 5190 (class 2620 OID 78363)
-- Name: cuentas trigger_cuentas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_cuentas_updated_at BEFORE UPDATE ON public.cuentas FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- TOC entry 5181 (class 2620 OID 135843)
-- Name: marcas trigger_marcas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_marcas_updated_at BEFORE UPDATE ON public.marcas FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- TOC entry 5182 (class 2620 OID 45458)
-- Name: productos trigger_productos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_productos_updated_at BEFORE UPDATE ON public.productos FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- TOC entry 5186 (class 2620 OID 45462)
-- Name: specs_almacenamiento trigger_specs_almacenamiento_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_specs_almacenamiento_updated_at BEFORE UPDATE ON public.specs_almacenamiento FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- TOC entry 5189 (class 2620 OID 45465)
-- Name: specs_case trigger_specs_case_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_specs_case_updated_at BEFORE UPDATE ON public.specs_case FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- TOC entry 5188 (class 2620 OID 45464)
-- Name: specs_fuente trigger_specs_fuente_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_specs_fuente_updated_at BEFORE UPDATE ON public.specs_fuente FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- TOC entry 5187 (class 2620 OID 45463)
-- Name: specs_gpu trigger_specs_gpu_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_specs_gpu_updated_at BEFORE UPDATE ON public.specs_gpu FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- TOC entry 5184 (class 2620 OID 45460)
-- Name: specs_placa_madre trigger_specs_placa_madre_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_specs_placa_madre_updated_at BEFORE UPDATE ON public.specs_placa_madre FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- TOC entry 5183 (class 2620 OID 45459)
-- Name: specs_procesador trigger_specs_procesador_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_specs_procesador_updated_at BEFORE UPDATE ON public.specs_procesador FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- TOC entry 5185 (class 2620 OID 45461)
-- Name: specs_ram trigger_specs_ram_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_specs_ram_updated_at BEFORE UPDATE ON public.specs_ram FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- TOC entry 5173 (class 2606 OID 53907)
-- Name: asistente_configuraciones asistente_configuraciones_sesion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistente_configuraciones
    ADD CONSTRAINT asistente_configuraciones_sesion_id_fkey FOREIGN KEY (sesion_id) REFERENCES public.asistente_sesiones(sesion_id) ON DELETE CASCADE;


--
-- TOC entry 5172 (class 2606 OID 53883)
-- Name: asistente_mensajes asistente_mensajes_sesion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistente_mensajes
    ADD CONSTRAINT asistente_mensajes_sesion_id_fkey FOREIGN KEY (sesion_id) REFERENCES public.asistente_sesiones(sesion_id) ON DELETE CASCADE;


--
-- TOC entry 5171 (class 2606 OID 135844)
-- Name: asistente_sesiones asistente_sesiones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistente_sesiones
    ADD CONSTRAINT asistente_sesiones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.cuentas(id) ON DELETE SET NULL;


--
-- TOC entry 5156 (class 2606 OID 86565)
-- Name: cotizaciones cotizaciones_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.cuentas(id) ON DELETE SET NULL;


--
-- TOC entry 5157 (class 2606 OID 153177)
-- Name: cotizaciones cotizaciones_id_confirmador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_id_confirmador_fkey FOREIGN KEY (id_confirmador) REFERENCES public.cuentas(id) ON DELETE SET NULL;


--
-- TOC entry 5158 (class 2606 OID 78353)
-- Name: cotizaciones cotizaciones_id_vendedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_id_vendedor_fkey FOREIGN KEY (id_vendedor) REFERENCES public.cuentas(id);


--
-- TOC entry 5159 (class 2606 OID 24794)
-- Name: detalle_cotizacion detalle_cotizacion_id_cotizacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_cotizacion
    ADD CONSTRAINT detalle_cotizacion_id_cotizacion_fkey FOREIGN KEY (id_cotizacion) REFERENCES public.cotizaciones(id) ON DELETE CASCADE;


--
-- TOC entry 5160 (class 2606 OID 136558)
-- Name: detalle_cotizacion fk_detalle_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_cotizacion
    ADD CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE SET NULL;


--
-- TOC entry 5174 (class 2606 OID 136552)
-- Name: historial_precios_producto fk_historial_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_precios_producto
    ADD CONSTRAINT fk_historial_producto FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 5175 (class 2606 OID 135849)
-- Name: historial_precios_producto historial_precios_producto_id_usuario_admin_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_precios_producto
    ADD CONSTRAINT historial_precios_producto_id_usuario_admin_fkey FOREIGN KEY (id_usuario_admin) REFERENCES public.cuentas(id) ON DELETE SET NULL;


--
-- TOC entry 5177 (class 2606 OID 153202)
-- Name: notificaciones_cotizacion notificaciones_cotizacion_id_cotizacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones_cotizacion
    ADD CONSTRAINT notificaciones_cotizacion_id_cotizacion_fkey FOREIGN KEY (id_cotizacion) REFERENCES public.cotizaciones(id) ON DELETE CASCADE;


--
-- TOC entry 5176 (class 2606 OID 86570)
-- Name: notificaciones_usuario notificaciones_usuario_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones_usuario
    ADD CONSTRAINT notificaciones_usuario_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.cuentas(id) ON DELETE CASCADE;


--
-- TOC entry 5161 (class 2606 OID 45330)
-- Name: productos productos_id_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categorias(id);


--
-- TOC entry 5162 (class 2606 OID 136540)
-- Name: productos productos_id_etiqueta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_id_etiqueta_fkey FOREIGN KEY (id_etiqueta) REFERENCES public.etiquetas(id) ON DELETE SET NULL;


--
-- TOC entry 5163 (class 2606 OID 45335)
-- Name: productos productos_id_marca_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_id_marca_fkey FOREIGN KEY (id_marca) REFERENCES public.marcas(id);


--
-- TOC entry 5167 (class 2606 OID 45395)
-- Name: specs_almacenamiento specs_almacenamiento_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_almacenamiento
    ADD CONSTRAINT specs_almacenamiento_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 5170 (class 2606 OID 45440)
-- Name: specs_case specs_case_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_case
    ADD CONSTRAINT specs_case_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 5169 (class 2606 OID 45425)
-- Name: specs_fuente specs_fuente_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_fuente
    ADD CONSTRAINT specs_fuente_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 5168 (class 2606 OID 45410)
-- Name: specs_gpu specs_gpu_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_gpu
    ADD CONSTRAINT specs_gpu_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 5165 (class 2606 OID 45365)
-- Name: specs_placa_madre specs_placa_madre_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_placa_madre
    ADD CONSTRAINT specs_placa_madre_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 5164 (class 2606 OID 45350)
-- Name: specs_procesador specs_procesador_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_procesador
    ADD CONSTRAINT specs_procesador_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 5166 (class 2606 OID 45380)
-- Name: specs_ram specs_ram_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specs_ram
    ADD CONSTRAINT specs_ram_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


-- Completed on 2026-07-04 22:09:24

--
-- PostgreSQL database dump complete
--

\unrestrict mZ3jntlTSs5CDP2uax6PTqTyQ5JiCDVgJTKu8GVH4S27TZAISsYHXefRrm0GZRr

