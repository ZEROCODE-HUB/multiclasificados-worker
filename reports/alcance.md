# Alcance Funcional Detallado — Plataforma "Multiclasificados EFFE"

## 1. Descripción General

Multiclasificados EFFE es una plataforma digital multiplataforma (web responsiva + aplicación móvil para Android e iOS) que conecta **anunciantes** y **buscadores** mediante avisos clasificados digitales, con gestión integral de pagos, comunicaciones y administración centralizada.

La plataforma permite a los anunciantes publicar avisos de empleo, bienes inmuebles, bienes muebles, maquinarias, equipos y servicios, previo pago en línea calculado según los días de publicación y las características del aviso. Los buscadores acceden de forma gratuita a la exploración y visualización de los avisos publicados.

---

## 2. Roles de Usuario

### 2.1 Anunciante
Usuario registrado que publica y gestiona avisos clasificados pagados, realiza pagos en línea, recibe contactos de buscadores y monitorea el rendimiento de sus publicaciones.

### 2.2 Buscador
Usuario registrado que explora avisos sin costo, contacta anunciantes mediante mensajería interna y postula a ofertas laborales adjuntando su CV y otra información personal.

### 2.3 Administrador
Personal interno que modera avisos, gestiona usuarios, configura tarifas y categorías, y genera reportes operativos y financieros de la plataforma.

### 2.4 Super Administrador
Nivel de acceso total que incluye todas las funciones del Administrador más la configuración de seguridad del sistema, auditoría y gestión de roles y permisos del equipo interno.

---

## 3. Módulo Anunciante

### 3.1 Acceso y seguridad
- Registro de cuenta de usuario tipo anunciante.
- Login con credenciales.
- Recuperación de contraseña.
- Autenticación de doble factor (2FA).

### 3.2 Gestión de avisos
- **Crear aviso** mediante formulario dinámico, cuyos campos varían según la categoría seleccionada.
- Adjuntar imágenes, documentos u otros archivos al aviso.
- **Calculadora de costo en tiempo real**: calcula el costo de publicación según los días seleccionados, el tipo de contenido y las características adicionales elegidas (posiciones premium, adjuntos, etc.).
- **Proceso de pago**: pago del aviso mediante billeteras digitales (Yape, Plin) y tarjetas Visa/Mastercard, directamente desde la plataforma.
- Listado de todos los avisos creados por el usuario.
- Editar avisos existentes.
- Pausar avisos activos.
- Renovar avisos.
- Eliminar avisos.

### 3.3 Comunicaciones
- Bandeja de mensajes por aviso (mensajería interna asociada a cada publicación).
- Gestión de postulaciones recibidas: revisión de CV, foto y otra información del postulante, y actualización del estado de la postulación (p. ej. en revisión, preseleccionado, descartado).

### 3.4 Comprobantes e historial
- Consulta del historial de pagos realizados.
- Visualización de comprobantes electrónicos emitidos (boleta o factura).
- Descarga de comprobante electrónico (boleta o factura) según el tipo de contribuyente del anunciante.

### 3.5 Cuenta y perfil
- Actualización de la información de perfil del anunciante.

---

## 4. Módulo Buscador

### 4.1 Acceso y seguridad
- Registro de cuenta de usuario tipo buscador.
- Login con credenciales.
- Recuperación de contraseña.
- Autenticación de doble factor (2FA).

### 4.2 Exploración de avisos
- Búsqueda de avisos mediante filtros avanzados.
- Visualización de avisos en formato de listado.
- Visualización de avisos en **mapa geográfico**.
- Detalle del aviso: galería de imágenes, datos de contacto, opción de compartir el aviso (enlace) y de guardarlo como favorito.

### 4.3 Comunicaciones
- Mensajería interna con anunciantes.
- Postulación a avisos de empleo mediante envío de CV u otra información solicitada.
- Consulta del estado de las postulaciones realizadas.

### 4.4 Cuenta y perfil
- Actualización de la información de perfil del usuario buscador.

> El acceso de los buscadores a la exploración y visualización de avisos es **gratuito**.

---

## 5. Módulo Administrador

### 5.1 Acceso
- Login seguro para personal administrativo.

### 5.2 Gestión de avisos
- Listado y moderación de avisos: aprobar, rechazar y destacar publicaciones.
- Estadísticas por aviso: visitas, contactos y postulaciones recibidas.

### 5.3 Gestión de usuarios
- Listado de usuarios registrados con acciones de activar, suspender o eliminar cuentas.
- Envío de comunicaciones a usuarios, ya sea de forma individual o mediante envíos masivos.

### 5.4 Configuración de la plataforma
- Gestión de categorías y subcategorías de avisos (empleo, inmuebles, bienes muebles, maquinarias, equipos, servicios, y las que se definan).
- Configuración de planes de publicación: tarifas base, multiplicadores por duración, recargos por adjuntos, posiciones premium, descuentos, promociones (con vigencia definida) e IGV configurable.

### 5.5 Reportes y dashboard
- Dashboard con indicadores en tiempo real, incluyendo:
  - Cantidad de avisos gratuitos por categoría.
  - Cantidad de avisos con visibilidad paga (incluyendo el total de importes cobrados).
  - Cantidad de avisos gratuitos por región y por categoría.
  - Cantidad de avisos con visibilidad paga por región y por categoría (incluyendo el total de importes cobrados).
  - Cantidad de reclamos: recibidos, pendientes de solución y solucionados con conformidad del cliente.
- Reportes filtrables y exportables por fecha, rango de fechas, cliente y sector, cubriendo pagos, avisos, usuarios y postulaciones.

### 5.6 Envío de correos a Usuario Buscador
- Ejecución de procesos de envío masivo de correos electrónicos a usuarios Buscadores, segmentados según perfil, avisos activos de anunciantes, ubicación geográfica, intereses de los buscadores y otros parámetros configurados para generar coincidencias (*match*).
- Estos envíos deben incluir en copia a los usuarios Administrador y Super Administrador.

---

## 6. Módulo Super Administrador

### 6.1 Acceso
- Login seguro.

### 6.2 Alcance
Incluye la totalidad de las funcionalidades del Módulo Administrador, más:

- **Seguridad y accesos**
  - Gestión de roles y permisos del equipo interno.
  - Configuración de parámetros de seguridad del sistema.
- **Auditoría**
  - Registro y consulta de logs de acceso y de operaciones críticas.
  - Consulta de conversaciones entre usuarios en caso de reclamos, incidencias o denuncias.

---

## 7. Funcionalidades Transversales

- **Registro y autenticación de usuarios**: verificación por correo electrónico, soporte de OAuth2, 2FA opcional, control de acceso basado en roles y bloqueo de cuenta ante intentos fallidos de acceso.
- **Contacto entre buscador y anunciante**: canal de comunicación habilitado a través de la propia plataforma entre la persona interesada y el anunciante del aviso.
- **Generación automática de comprobantes tributarios**: emisión de boleta o factura electrónica según el tipo de contribuyente del anunciante, cumpliendo los requisitos de la SUNAT.
- **Cumplimiento normativo de protección de datos**: la plataforma debe cumplir con la Ley 29733 (Ley de Protección de Datos Personales) respecto de los datos de los usuarios finales.

---

## 8. Arquitectura Tecnológica

| Capa | Tecnología |
|---|---|
| Frontend web | React |
| Frontend móvil | React Native |
| Backend | Next.js (exposición de APIs y lógica de negocio) |
| Base de datos | Supabase |
| Infraestructura / despliegue | Vercel |
| Repositorio de código | GitHub |

La interfaz debe ser responsiva y funcionar de forma multiplataforma (versión web y aplicación móvil para Android e iOS, nativas o híbridas).

### 8.1 Integraciones con terceros
- **Factiliza** — facturación electrónica.
- **Niubiz** — pasarela de pago (procesamiento de tarjetas Visa y Mastercard, y billeteras digitales como Yape y Plin).
- **Google Maps** — geolocalización de avisos y visualización en mapa.
- **OneSignal** — notificaciones push.
- **SendGrid** — comunicaciones y notificaciones por correo electrónico.
- **RENIEC** — validación de identidad de los usuarios.

> Todas las credenciales de las cuentas de servicios de terceros y los accesos correspondientes son de propiedad del Cliente y se administran en coordinación con el Proveedor.

---

## 9. Requisitos No Funcionales

### 9.1 Capacidad y desempeño
- La arquitectura debe soportar al menos **400 usuarios concurrentes** sin degradación del servicio.
- La base de datos (Supabase, plan starter) debe soportar hasta **100,000 usuarios**.

### 9.2 Pagos
- La integración con la pasarela de pago debe garantizar resiliencia ante interrupciones de red durante el proceso de pago.
- El procesamiento de pagos debe realizarse a través de pasarelas certificadas **PCI-DSS**.

### 9.3 Cumplimiento tributario
- La emisión de comprobantes tributarios debe estar alineada con los requisitos vigentes de la SUNAT bajo la legislación peruana.

### 9.4 Ciberseguridad (soportada por Supabase como backend)
- **Autenticación multifactor segura**: segundo factor para verificar y proteger la identidad del usuario.
- **Cumplimiento del protocolo SOC 2 Tipo 2**: manejo seguro y confiable de datos sensibles.
- **Cifrado integral de datos**: AES-256 en base de datos y TLS en tránsito.
- **Control de acceso basado en roles (RBAC)**: permisos específicos por rol de usuario.
- **Copias de seguridad diarias**: respaldos diarios con recuperación a un punto en el tiempo.
- **Gestión continua de vulnerabilidades**: pruebas, revisiones y escaneos constantes con herramientas especializadas.
- **Protección contra ataques DDoS**: mediante Cloudflare, con bloqueos automáticos y límites configurables.

### 9.5 Publicación en tiendas
- La plataforma debe publicarse en Google Play Store y Apple App Store.

---

## 10. Fuera de Alcance / Pendiente de Definición

Los siguientes puntos quedan pendientes de definición en una etapa posterior o de levantamiento detallado de información, según lo indicado en la documentación de origen:

- El dominio y el proveedor de dominio serán definidos por el cliente o acordados entre las partes posteriormente.
- El canal específico de contacto entre buscador y anunciante (más allá de la mensajería interna) se definirá en un requerimiento escrito complementario.
- El detalle final de funcionalidades listado en las secciones 3 a 7 está sujeto a confirmación luego del levantamiento detallado de información y análisis funcional.
