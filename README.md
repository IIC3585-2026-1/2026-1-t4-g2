# Split Fácil PWA

Split Fácil es una aplicación web progresiva para dividir gastos entre amigos. Permite agregar participantes, registrar gastos con quien pagó y quiénes deben pagar, y calcular balances activos.

## Qué hace la app

- Registra participantes en una lista.
- Crea gastos nuevos con:
  - descripción
  - monto en pesos
  - participante que pagó
  - participantes que deben pagar (selector múltiple)
- Muestra el historial de gastos.
- Permite editar, marcar como saldado o eliminar gastos.
- Ordena los gastos para mostrar primero los gastos activos y deja los saldados al final.
- Calcula los balances por participante excluyendo los gastos ya saldados.

## Cómo funciona

- La app guarda los datos en `localStorage` usando `storage.js`.
- `app.js` controla la navegación de vistas, el registro de participantes, los gastos y los cálculos de balances.
- El HTML usa vistas separadas para participante, nuevo gasto e historial.
- El CSS provee una experiencia móvil con menú inferior y tarjetas visuales.

## Manifest (`manifest.json`)

El manifiesto define la configuración de la PWA para que pueda instalarse como aplicación:

- `name` y `short_name`: nombre de la app.
- `theme_color` y `background_color`: colores del tema.
- `display`: modo de presentación en pantalla completa.
- `orientation`: orienta la app a modo retrato.
- `start_url` y `scope`: aseguran que la app se abra desde `index.html` y dentro del mismo alcance.
- `icons`: los iconos usados para la instalación en dispositivos.

## Service Worker (`service-worker.js`)

El service worker habilita el modo offline mediante caché:

- Durante la instalación, guarda recursos estáticos clave en la caché.
- En la activación, borra versiones antiguas del caché.
- En cada solicitud, responde primero con el recurso cacheado y, si no está, consulta la red.

### Recursos cacheados

El service worker guarda:

- `index.html`
- `styles.css`
- `app.js`
- `storage.js`
- `manifest.json`
- `service-worker.js`
- iconos usados en la app

## Ejecutar localmente

1. Abrir un servidor local en la carpeta del proyecto.
2. Abrir el navegador en la URL del servidor.

Ejemplo con Python:

```bash
python3 -m http.server 8000
```

3. Visitar `http://localhost:8000`.

> Nota: el service worker solo se registra en páginas servidas desde `http://` o `https://`, no desde archivos locales (`file://`).
