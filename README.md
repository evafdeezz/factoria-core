# Factoría Core

**Factoría Core** es una aplicación web progresiva (PWA) para la gestión, planificación y seguimiento del entrenamiento en grupos de atletismo de velocidad y vallas. Permite al entrenador planificar sesiones, importarlas automáticamente desde una fotografía enviada por Telegram, y hacer un seguimiento individualizado del rendimiento y el bienestar de cada atleta, incluyendo el seguimiento del ciclo menstrual con modelo de privacidad por doble consentimiento.

**Producción:** [https://factoriacore.duckdns.org](https://factoriacore.duckdns.org)

---

## Características principales

- Planificación de entrenamientos con bloques tipificados por especialidad del atleta
- Importación automática del plan mensual mediante fotografía vía Telegram, n8n y Groq Vision
- Registro de resultados, métricas de rendimiento y bienestar diario
- Seguimiento del ciclo menstrual con cálculo automático de fases hormonales
- Sesiones personales del atleta fuera del plan del grupo
- Autenticación mediante Google OAuth2
- Instalable como PWA en dispositivos móviles

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Java 17 · Spring Boot · Spring Security · JPA |
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind CSS |
| Base de datos | PostgreSQL · Supabase |
| Automatización | n8n · Groq Vision API · Llama 4 Scout |
| Infraestructura | Azure VM B1ms · Docker Compose · Caddy · DuckDNS |

---

## Estructura del repositorio

```
factoria-core/
├── backend/          # API REST con Spring Boot
│   ├── src/
│   └── Dockerfile
├── frontend/         # PWA con Next.js
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── Dockerfile
├── docker-compose.yml
├── Caddyfile
├── .env              # Variables de entorno (no incluido en el repositorio)
└── .gitignore
```

---

## Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/)
- Cuenta de [Google Cloud](https://console.cloud.google.com/) con OAuth2 configurado
- Base de datos PostgreSQL en [Supabase](https://supabase.com/)
- Bot de Telegram creado con [BotFather](https://t.me/botfather)
- Cuenta en [Groq](https://console.groq.com/) con acceso a Llama 4 Scout

---

## Instalación y despliegue

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/factoria-core.git
cd factoria-core
```

### 2. Configurar las variables de entorno

Crea un fichero `.env` en la raíz del proyecto a partir del siguiente ejemplo:

```env
# Base de datos (Supabase)
DB_URL=jdbc:postgresql://<host>:5432/postgres?sslmode=require
DB_USER=<usuario>
DB_PASSWORD=<contraseña>

# Google OAuth2
GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<client-secret>

# n8n
N8N_API_KEY=<clave-secreta-para-n8n>
WEBHOOK_URL=https://factoriacore.duckdns.org

# URLs
APP_URL=https://factoriacore.duckdns.org
NEXT_PUBLIC_API_BASE_URL=https://factoriacore.duckdns.org/api
```

### 3. Configurar el dominio en Caddyfile

El fichero `Caddyfile` ya está configurado para el dominio `factoriacore.duckdns.org`. Si despliegas en un dominio distinto, sustitúyelo:

```
factoriacore.duckdns.org {
    reverse_proxy /api/* factoria-backend:8085
    reverse_proxy /oauth2/* factoria-backend:8085
    reverse_proxy /login/* factoria-backend:8085
    reverse_proxy /webhooks/* factoria-n8n:5678
    reverse_proxy /webhook/* factoria-n8n:5678
    reverse_proxy factoria-frontend:3000
}
```

### 4. Configurar Google OAuth2

En la [consola de Google Cloud](https://console.cloud.google.com/):
1. Crea un proyecto y habilita la API de Google+
2. Crea credenciales OAuth2 de tipo "Aplicación web"
3. Añade como URI de redirección autorizada: `https://factoriacore.duckdns.org/login/oauth2/code/google`

### 5. Levantar el sistema

```bash
docker compose up -d --build
```

Esto levanta los cuatro servicios: `caddy`, `backend`, `frontend` y `n8n`. El certificado TLS se obtiene automáticamente mediante Let's Encrypt.

Verifica que todos los contenedores están activos:

```bash
docker compose ps
```

### 6. Configurar n8n

1. Accede a n8n en `https://factoriacore.duckdns.org:5678`
2. Importa el workflow desde `n8n_workflow_FINAL_v5.json`
3. Configura las credenciales del bot de Telegram
4. Activa el workflow

---

## Desarrollo local

Para ejecutar el proyecto en local sin Docker:

**Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Para las pruebas de la automatización con n8n en local, utiliza [ngrok](https://ngrok.com/) para exponer el backend con una URL pública temporal.

---

## Servicios y puertos

| Servicio | Puerto interno | Acceso externo |
|---|---|---|
| Caddy (proxy) | 80 / 443 | Público |
| Backend | 8085 | Solo red interna Docker |
| Frontend | 3000 | Solo red interna Docker |
| n8n | 5678 | https://factoriacore.duckdns.org:5678 |

---

## Autora

**Eva Carrasco Fernández**
Proyecto Fin de Grado — Ingeniería Informática
Universidad Francisco de Vitoria 2026