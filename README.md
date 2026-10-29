# AtencIA Frontend

Aplicación web SPA para la operación de AtencIA. Ofrece una interfaz diferenciada para propietarios de negocio y técnicos: gestión de citas, registro de técnicos, configuración del negocio, reporte de pagos con comprobantes y validación de pagos por parte del propietario.

## Tecnologías

| Componente | Versión / tecnología |
|---|---|
| Framework | Angular 21.2 |
| Lenguaje | TypeScript 5.9 |
| Estilos | Tailwind CSS 4.3 + PostCSS |
| Reactividad | RxJS 7.8 + Angular Signals |
| Formularios | Reactive Forms |
| Autenticación | JWT almacenado en `localStorage` + `jwt-decode` |
| Router | Angular Router con guards funcionales |
| Pruebas | Vitest 4 |
| Build | Angular CLI / `@angular/build` |
| Calidad de formato | Prettier 3 |

La aplicación usa componentes standalone, `bootstrapApplication`, inyección con `inject()`, `signal()`/`computed()` y `ChangeDetectionStrategy.OnPush` en las vistas principales.

## Requisitos previos

- Node.js 20.19+, 22.12+ o 24+.
- npm 11.1.0 (versión declarada por el proyecto).
- Backend `G_O` disponible en `http://localhost:8080`.
- PostgreSQL y las migraciones del backend aplicadas.

## Instalación y ejecución

```bash
npm install
npm start
```

La aplicación queda disponible en `http://localhost:4200/`.

Para una instalación reproducible en CI:

```bash
npm ci
npm run build
```

## Compilación de producción

```bash
npm run build
```

El resultado se genera en:

```text
dist/G_O_frontend/browser
```

Ese directorio debe servirse con un servidor estático o un reverse proxy con fallback de SPA hacia `index.html`.

## Pruebas y formato

```bash
npm test
npx prettier --write "src/**/*.{ts,html,css,json,md}"
```

## Módulos y paneles

| Módulo / componente | Propósito |
|---|---|
| `login` | Inicio de sesión y almacenamiento del JWT. |
| `register` | Registro inicial de negocio y usuario propietario. |
| `sidebar` | Navegación lateral, ruta activa y logout del panel. |
| `dashboard` | Métricas del negocio: técnicos, ingresos, citas de hoy y estados. |
| `appointments` | Gestión de citas del negocio: listado, creación, edición, filtros y eliminación. |
| `business-configuration` | Consulta y actualización de la configuración del negocio usada por n8n. |
| `register-technician` | Creación de la cuenta de acceso de un técnico y vinculación al negocio. |
| `payment-validation` | Bandeja de pagos del propietario, aprobación/rechazo y previsualización de comprobantes. |
| `technician-mobile` | Vista operativa del técnico: citas, cronómetro, reporte de pago y estado del pago. |
| `toast-message` | Retroalimentación visual para operaciones y errores. |
| `payment-realtime` | Conexión WebSocket para recibir eventos de pago en tiempo real. |

## Rutas y control de acceso

| Ruta | Componente | Acceso |
|---|---|---|
| `/login` | `Login` | Público |
| `/register` | `Register` | Público |
| `/dashboard` | `Dashboard` | Autenticado + propietario |
| `/appointments` | `Appointments` | Autenticado + propietario |
| `/business-configuration` | `BusinessConfiguration` | Autenticado + propietario |
| `/payment-validation` | `PaymentValidation` | Autenticado + propietario |
| `/register-technician` | `RegisterTechnician` | Autenticado + propietario |
| `/technician-mobile` | `TechnicianMobile` | Autenticado + propietario o técnico |
| `/` | — | Redirección a `/login` |

Los guards `authGuard`, `ownerGuard` y `technicianViewGuard` validan la existencia, vigencia y rol del token antes de permitir la navegación.

## Autenticación y roles

1. El usuario inicia sesión contra `POST /api/auth/login`.
2. El backend devuelve un JWT y el frontend lo guarda en `localStorage` bajo la clave `token`.
3. `AuthService` decodifica los claims y expone `isOwner()`, `isTechnician()`, `getBusinessId()` y `getTechnicianId()`.
4. Las peticiones protegidas envían `Authorization: Bearer <token>`.
5. Al expirar el token, los guards eliminan la sesión y redirigen a `/login`.

Roles soportados:

- `owner`: administra citas, técnicos, configuración y pagos.
- `technician`: consulta sus citas y reporta pagos con comprobante.

El propietario puede abrir `/technician-mobile` en modo lectura; el reporte de pagos requiere una cuenta de técnico.

## Integración con el backend

Las URLs están definidas actualmente en los servicios:

| Servicio | URL |
|---|---|
| API REST | `http://localhost:8080` |
| Login | `http://localhost:8080/api/auth/login` |
| Registro | `http://localhost:8080/api/auth/register` |
| WebSocket | `ws://localhost:8080/ws/payments` |

Para desplegar en otro entorno deben reemplazarse por URLs configurables. El backend debe permitir el origen del frontend en `CORS_ALLOWED_ORIGINS`; no se admite `*`.

## Flujo de pagos y comprobantes

1. El técnico abre una cita y adjunta el comprobante.
2. El frontend valida tamaño máximo de 10 MB y tipos `image/jpeg`, `image/png`, `image/webp` o `application/pdf`.
3. Se envía `multipart/form-data` a `POST /appointments/{id}/payment`.
4. El propietario recibe el evento `PAYMENT_SUBMITTED` y recarga la bandeja de pagos.
5. El propietario aprueba o rechaza en `PATCH /payments/{id}/review`.
6. El técnico recibe `PAYMENT_REVIEWED` y actualiza el estado de la cita.
7. La evidencia se descarga como `Blob` autenticado y se muestra mediante object URL; la URL se revoca al cerrar la vista previa.

## Tiempo real

`PaymentRealtimeService` mantiene una conexión WebSocket con:

- Token JWT en la query string del handshake.
- Heartbeat cada 25 segundos mediante `ping`/`pong`.
- Reconexión automática cada 3 segundos tras un cierre inesperado.
- Distribución de eventos mediante un `Subject` de RxJS.

Eventos consumidos:

- `PAYMENT_SUBMITTED`: actualiza la bandeja del propietario.
- `PAYMENT_REVIEWED`: actualiza la vista del técnico.

## Estructura del proyecto

```text
src/app
├── components       Vistas y componentes de dominio
├── guards           Protección de rutas por sesión y rol
├── model            Interfaces y tipos compartidos
├── service
│   ├── Auth         Estado y decodificación del JWT
│   ├── payments     API de pagos y WebSocket
│   └── token        Lectura, validación y eliminación del token
├── app.config.ts    Providers globales
├── app.routes.ts    Definición de rutas
└── app.ts           Componente raíz
```

## Consideraciones de producción

- Sustituir las URLs locales por configuración por entorno.
- Servir la aplicación bajo HTTPS y usar `wss://` para WebSocket.
- Configurar el fallback de SPA en el servidor.
- Revisar la política de almacenamiento del JWT en `localStorage` y el riesgo de XSS.
- Mantener el backend y el frontend en orígenes permitidos explícitamente.
- Verificar los budgets de producción definidos en `angular.json` antes de desplegar.

## Documentación interna

- [Contexto del proyecto](../PROJECT_CONTEXT.md)
- [Contexto del frontend](../FRONTEND_CONTEXT.md)
- [Backlog y deuda técnica](../PENDIENTES.md)
- [Historial de cambios](../CHANGELOG_FEATURES.md)
