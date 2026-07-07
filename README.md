# Chat de estado de proyecto — todo en Vercel

Un solo despliegue en Vercel sirve el sitio completo (paginas estaticas +
funciones que hablan con DeepSeek, GitHub y Google Drive). No hay que
mezclar plataformas ni pegar URLs a mano: frontend y backend viven en el
mismo dominio.

## Estructura del proyecto

```
index.html               -> chat del cliente (publico, sin login)
interno/index.html        -> chat del equipo (con candado simple + GitHub/Drive en vivo)
assets/logo.png           -> tu logo
reports/status.json       -> nombre del proyecto, semaforo de estado, fecha
reports/alcance.md         -> documento real: alcance acordado
reports/avance.md          -> documento real: avance actual
api/chat.js                -> funcion serverless: responde el chat del cliente (DeepSeek)
api/chat-interno.js        -> funcion serverless: lee GitHub + Drive y responde (DeepSeek)
```

Todo en `/api` se despliega automaticamente como funciones serverless —
Vercel las detecta solas, no hay que configurar nada extra.

---

## PASOS EXACTOS

### Paso 1 — Sube el proyecto a GitHub

```bash
cd sitio-estado-proyecto
git init
git add .
git commit -m "Version inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/zerocode-estado-proyecto.git
git push -u origin main
```

### Paso 2 — Importa el repo en Vercel

1. Entra a [vercel.com](https://vercel.com) e inicia sesion (puedes usar tu cuenta de GitHub).
2. **Add New -> Project** -> selecciona el repositorio que acabas de subir.
3. Framework Preset: dejalo en **Other** (no es Next.js ni nada especial).
4. Root Directory: la raiz del repo (no cambies nada).
5. Todavia no toques "Deploy" -- primero agrega las variables de entorno (Paso 3).

### Paso 3 — Agrega las variables de entorno

En la pantalla de configuracion del proyecto (o despues, en
**Settings -> Environment Variables**), agrega:

| Variable | Para que sirve | Donde la consigues |
|---|---|---|
| `DEEPSEEK_API_KEY` | Habla con el modelo | platform.deepseek.com -> API Keys |
| `GITHUB_TOKEN` | Lee tu repo (solo el interno) | Ver Paso 4 |
| `GITHUB_REPO` | Que repo leer, ej `usuario/repo` | Tu mismo |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Lee la carpeta de Drive (solo el interno) | Ver Paso 5 |
| `GOOGLE_DRIVE_FOLDER_ID` | Que carpeta leer | Ver Paso 6 |

Aplican a los tres entornos (Production, Preview, Development) — deja las
casillas marcadas por defecto.

Tambien lo puedes hacer desde terminal:
```bash
npm install -g vercel
vercel login
vercel env add DEEPSEEK_API_KEY
vercel env add GITHUB_TOKEN
vercel env add GITHUB_REPO
vercel env add GOOGLE_SERVICE_ACCOUNT_KEY
vercel env add GOOGLE_DRIVE_FOLDER_ID
```

### Paso 4 — Crea el token de GitHub (para el chat interno)

1. GitHub -> foto de perfil -> **Settings -> Developer settings**
2. **Personal access tokens -> Fine-grained tokens -> Generate new token**
3. Repository access: **Only select repositories** -> elige tu repo
4. Permissions: Contents = Read-only, Issues = Read-only, Pull requests = Read-only
5. Genera y copia el token (no lo vuelves a ver despues)

### Paso 5 — Crea la cuenta de servicio de Google (para el chat interno)

1. [console.cloud.google.com](https://console.cloud.google.com) -> crea o elige un proyecto
2. Busca y habilita **Google Drive API**
3. **IAM y administracion -> Cuentas de servicio -> Crear cuenta de servicio**
4. Entra a la cuenta creada -> pestana **Claves -> Agregar clave -> Crear clave nueva -> JSON**
5. Copia TODO el contenido del archivo JSON descargado (esa es la variable `GOOGLE_SERVICE_ACCOUNT_KEY`)

### Paso 6 — Comparte la carpeta de Drive con la cuenta de servicio

1. En el JSON del paso anterior, busca `client_email`
2. En Google Drive, clic derecho en la carpeta del proyecto -> **Compartir**
   -> pega ese email -> permiso de **Lector**
3. Copia el ID de la carpeta desde la URL: `.../folders/ESTE-ES-EL-ID`

### Paso 7 — Despliega

Ya con las variables cargadas, dale **Deploy** en Vercel (o si usaste la
terminal: `vercel --prod`).

Tu sitio queda en algo como:
`https://zerocode-estado-proyecto.vercel.app`

- Chat del cliente: esa URL directa
- Chat del equipo: esa URL + `/interno`

Si conectas un dominio propio despues (Vercel -> Settings -> Domains),
las URLs cambian a tu dominio, sin tocar nada del codigo.

---

## Como actualizas la informacion

- **Chat del cliente**: edita `reports/alcance.md`, `reports/avance.md` o
  `reports/status.json` directo en GitHub. Vercel vuelve a desplegar solo
  con cada commit (auto-deploy activado por defecto).
- **Chat del equipo**: no hay nada que actualizar a mano -- lee GitHub y
  Drive en vivo en cada pregunta.

## Generar reportes en Markdown (chat del equipo)

El chat interno tiene un boton **"Generar reporte (.md)"** que arma un
reporte con Alcance / Avance / Riesgos / Proximos pasos usando la
informacion en vivo, y lo puedes descargar directo. Para convertirlo
despues en Word/Excel/PDF, sube ese `.md` a una conversacion normal de
Claude y pidele el formato que necesites -- no hace falta generarlo aqui.

## Seguridad

- Ninguna credencial vive en el codigo ni en el repositorio -- todas
  estan en las variables de entorno de Vercel, invisibles desde el
  navegador del cliente.
- La "frase de acceso" del chat interno (`ACCESS_PHRASE` en
  `interno/index.html`) es una traba simple, no seguridad real. Cambiala
  por una propia antes de compartir el link con tu equipo.
- Dale a las credenciales el minimo acceso posible: el token de GitHub
  solo a ese repo y solo lectura; la cuenta de servicio de Google solo
  puede leer la carpeta que le compartiste, nada mas de tu Drive.

## Limitacion actual

El chat interno solo lee Google Docs nativos y archivos `.md`/`.txt` de
la carpeta de Drive. Si tu documento de alcance esta en Word o PDF,
conviertelo a Google Doc primero ("Abrir con Google Docs" y guardar).

## Costos

- Vercel: gratis en el plan Hobby para este tipo de uso.
- DeepSeek: 5 millones de tokens gratis al crear la cuenta, despues pago
  por uso muy barato (~$0.14 por millon de tokens).
- GitHub API y Google Drive API: gratis para este volumen de uso.
