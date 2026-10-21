# Happy Go Lucky (HGL) Deployment Guide

This guide covers production deployment using Docker with automatic HTTPS certificate management via Caddy.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Production Deployment](#production-deployment)
  - [Prerequisites](#prerequisites)
  - [Initial Setup](#initial-setup)
  - [HTTPS Configuration](#https-configuration)
  - [Starting the Application](#starting-the-application)
  - [Verifying Deployment](#verifying-deployment)
- [Local Development Mode](#local-development-mode)
- [Environment Variables](#environment-variables)
- [Database Management](#database-management)
- [Certificate Management](#certificate-management)
- [Updating the Application](#updating-the-application)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)
---

## Architecture Overview

The application uses a **4-container Docker Compose setup**:

1. **Backend (`server`)**: Node.js + Express API server handling core HGL logic.
2. **Competition Service (`competition-service`)**: Autonomous Node.js microservice handling all competition logic, datasets, and evaluations.
3. **Frontend Builder (`client`)**: Builds React app, stores static files in volume.
4. **Reverse Proxy (`caddy`)**: Serves frontend, proxies API to the respective backends, and manages HTTPS.

### Request Flow

```
Internet → Caddy (port 80/443)
├─→ /api/competition/* → Strip /api → Competition Service:8081
├─→ /api/*             → Strip /api → Backend server:3000
└─→ /*                 → Serve frontend static files

```

**Key Points:**
- ✅ Backend receives clean URLs (`/user`, `/session`, etc.) without `/api` prefix
- ✅ Competition Service receives clean URLs (`/competition`, `/submissions`, etc.)
- ✅ Frontend makes requests to `/api/user`, `/api/competition`
- ✅ Caddy strips `/api` prefix when proxying to the respective backend
- ✅ Automatic HTTPS with Let's Encrypt via Caddy
- ✅ Shared SQLite Database with WAL (Write-Ahead Logging) for concurrent access by both services

### Container Details

| Container | Purpose | Exposed Ports | Volumes |
|-----------|---------|---------------|---------|
| `server` | Core Backend API | None (internal) | `happy-go-lucky-db` (database) |
| `competition-service` | Competition Backend | None (internal) | `happy-go-lucky-db`, `competition-uploads` |
| `client` | Builds frontend | None (exits) | `client-dist` (build output) |
| `caddy` | Web server & reverse proxy | 80, 443 | `client-dist`, `caddy-data`, `caddy-config`, `Caddyfile` |

---

## Production Deployment

### Prerequisites

**Server Requirements:**
- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- A domain name pointed to your server's IP address
- Ports 80 and 443 accessible from the internet (for Let's Encrypt verification and HTTPS)

**DNS Configuration:**
Before deployment, ensure your domain's DNS A record points to your server:
```bash
# Verify DNS resolution
nslookup your-domain.com
# or
dig your-domain.com
```

### Initial Setup

1. **Clone the repository on your server:**
```bash
git clone <repository-url>
cd happy-go-lucky
```


2. **Create production environment file:**
```bash
cp .env.example .env
```


3. **Edit `.env` with your production values:**
```bash
nano .env
```


**Critical variables to update:**
```env
# Your domain name (required for automatic HTTPS)
DOMAIN=your-domain.com

# Email for Let's Encrypt notifications
ACME_EMAIL=admin@your-domain.com

# Application URLs (update with your domain)
CLIENT_URL=[https://your-domain.com](https://your-domain.com)
VITE_API_URL=[https://your-domain.com/api](https://your-domain.com/api)

# Public URL for the competition API (called by student VMs)
PUBLIC_COMPETITION_API_URL=[https://your-domain.com/api/competition](https://your-domain.com/api/competition)

# Internal URL for the server scheduler to trigger evaluations
INTERNAL_COMPETITION_SERVICE_URL=http://competition-service:8081

# Generate strong random secrets
# Run: openssl rand -base64 32
JWT_SECRET=your_secure_random_jwt_secret_here
INTERNAL_API_SECRET=your_secure_internal_api_secret_here

# SMTP credentials for sending emails
EMAIL_SMTP_USER=your.email@fau.de
EMAIL_SMTP_PASS=your_secure_password

# Optional: GitHub token for code activity features
VITE_GITHUB_TOKEN=your_github_personal_access_token

```


**Important Docker Paths:**
* `DB_PATH` MUST remain as `/app/server/data/happyGoLucky.db`. This specific path ensures the shared volume maps correctly for WAL-mode synchronization across both services.
* `STORAGE_PATH` MUST remain as `/app/uploads`. This ensures datasets are stored in the correct `competition-uploads` Docker volume.



### HTTPS Configuration

Caddy handles HTTPS automatically using Let's Encrypt. The process:

1. **First startup**: Caddy requests a certificate from Let's Encrypt
2. **Verification**: Let's Encrypt verifies domain ownership via HTTP-01 challenge (requires port 80)
3. **Certificate issuance**: Takes 10-30 seconds on first run
4. **Auto-renewal**: Caddy automatically renews certificates before expiration

**Requirements for automatic HTTPS:**
- Valid domain name in `DOMAIN` variable
- Domain DNS A record points to server IP
- Ports 80 and 443 are accessible from internet
- Valid email in `ACME_EMAIL` for notifications

### Starting the Application

**Build and start the containers:**
```bash
docker compose up -d
```

This will:
* Build the backend Docker image and competition service image
* Build the frontend and store static files in a volume
* Start Caddy to serve frontend and proxy API requests
* Create five Docker volumes:
* `happy-go-lucky-db`: SQLite database and WAL files
* `competition-uploads`: Training and test datasets for competitions
* `client-dist`: Frontend static files
* `caddy-data`: Caddy certificates and data
* `caddy-config`: Caddy configuration



**Monitor the startup process:**
```bash
# Follow logs to watch certificate acquisition
docker compose logs -f caddy
```

You should see logs indicating:
```
obtaining certificate
certificate obtained successfully
serving HTTPS on :443
```

### Verifying Deployment

1. **Check container status:**
```bash
docker compose ps
```


Should show `server`, `competition-service` and `caddy` as "Up". `client` will show as "Exited" (normal - it only builds).
2. **Test HTTPS connection:**
```bash
curl -I [https://your-domain.com](https://your-domain.com)
```


. **Verify certificate:**
   ```bash
   openssl s_client -connect your-domain.com:443 -servername your-domain.com
   ```

   Check certificate issuer (should be Let's Encrypt).

4. **Access the application:**
   - Frontend: `https://your-domain.com`
   - API (proxied): `https://your-domain.com/api/user` (example)

5. **Test login with default admin:**
   - Email: `sys@admin.org`
   - Password: `helloworld`

---

## Local Development Mode

For local testing without a domain or HTTPS:

1. **Leave `DOMAIN` empty in `.env` (or don't set it):**
```env
DOMAIN=
CLIENT_URL=http://localhost
VITE_API_URL=http://localhost/api
PUBLIC_COMPETITION_API_URL=http://localhost/api/competition
INTERNAL_COMPETITION_SERVICE_URL=http://competition-service:8081
ACME_EMAIL=

```


2. **Start containers:**
```bash
docker compose up
```


3. **Access via HTTP:**
* Frontend: `http://localhost`
* API: `http://localhost/api/user` (example)
* Competition API: `http://localhost/api/competition` (example)

**Note**: Caddy will use a self-signed certificate for localhost (browser will show warning, this is expected).

---

## Environment Variables

### HTTPS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DOMAIN` | Production | _(empty)_ | Domain name for automatic HTTPS. Leave empty for local HTTP mode. |
| `ACME_EMAIL` | Production | _(empty)_ | Email for Let's Encrypt certificate notifications |

### Application URLs

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `CLIENT_URL` | No | `http://localhost:5173` | Frontend URL for CORS and email links |
| `VITE_API_URL` | No | `http://localhost:3000` | Backend API base URL  (should be `https://domain.com/api` in production)|
| `PUBLIC_COMPETITION_API_URL` | Production | `http://localhost/api/competition` | Base URL for student VMs to submit predictions |
| `INTERNAL_COMPETITION_SERVICE_URL` | Yes | `http://competition-service:8081` | Internal Docker URL used by the HGL scheduler to trigger competition evaluations |

**Important**: The backend services receive requests WITHOUT the `/api` or `/api/competition` prefix. Caddy strips it during reverse proxying.
### Backend Configuration

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Set to `production` for deployment |
| `PORT` | No | `3000` | Internal port for core backend server |
| `DB_PATH` | No | `/app/server/data/happyGoLucky.db` | Shared path to SQLite database. MUST reside in the `data` folder to ensure WAL files sync. |
| `STORAGE_PATH` | No | `/app/uploads` | Path inside the container where competition datasets are stored. Maps to the `competition-uploads` volume. |
| `JWT_SECRET` | **Yes** | `your_jwt_secret` | Secret key for JWT token signing |
| `INTERNAL_API_SECRET` | **Yes** | `your_internal_secret` | Key for secure communication between Server and Competition-Service |

### Email Configuration

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `EMAIL_SMTP_USER` | Production | - | SMTP username for sending emails (FAU email or Gmail address) |
| `EMAIL_SMTP_PASS` | Production | - | SMTP password or app password for sending emails |
| `EMAIL_FROM_NAME` | No | `Happy Go Lucky` | Sender name displayed in emails |
| `EMAIL_FROM_ADDRESS` | No | `dirk.riehle@fau.de` | Sender email address |
| `EMAIL_SMTP_HOST` | No | `smtp-auth.fau.de` | SMTP server hostname |
| `EMAIL_SMTP_PORT` | No | `465` | SMTP server port |
| `EMAIL_SMTP_SECURE` | No | `true` | Whether to use TLS/SSL for SMTP connection (true/false) |

**Email Behavior:**

* **Development** (`NODE_ENV !== 'production'`): Emails logged to console, not sent
* **Production** (`NODE_ENV === 'production'`):
* If `EMAIL_SMTP_USER` and `EMAIL_SMTP_PASS` are set: Emails sent via configured SMTP server
* Otherwise: Falls back to local MTA (if available)

**Supported Email Providers:**
- **FAU**: Uses default settings (`smtp-auth.fau.de:465`)
- **Gmail**: 
  - `EMAIL_SMTP_HOST=smtp.gmail.com`
  - `EMAIL_SMTP_PORT=465` (or 587 with `EMAIL_SMTP_SECURE=false`)
  - `EMAIL_SMTP_USER=your@gmail.com`
  - `EMAIL_SMTP_PASS=<your 16-character Gmail app password>`
  - Requires 2-Factor Authentication enabled on Google account

### Optional Features

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_GITHUB_TOKEN` | Optional | - | GitHub personal access token for code activity features |

---

## Database Management

The SQLite database is stored in a Docker named volume (`happy-go-lucky-db`) and runs in **WAL (Write-Ahead Logging)** mode. This ensures the `server` and `competition-service` can read and write concurrently without locking conflicts.

Because of WAL-mode, the database consists of three files (`.db`, `.db-wal`, `.db-shm`). Special care must be taken during backups.

### Backup Database (WAL-Safe Method)

⚠️ **CRITICAL:** Do NOT use `cp` or `cat` directly on the `.db` file while the containers are running. This will result in a corrupt or incomplete backup because pending writes exist in the `-wal` file. Always use the SQLite `.backup` command.

**Method 1: Automated safe backup script**

```bash
#!/bin/bash
# backup-db.sh
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Tell SQLite to create a clean, consolidated snapshot into a temp file
docker compose exec -T server sqlite3 /app/server/data/happyGoLucky.db ".backup /app/server/data/snapshot.db"

# Copy the consolidated snapshot to the host
docker cp $(docker compose ps -q server):/app/server/data/snapshot.db $BACKUP_DIR/backup-$TIMESTAMP.db

# Remove the temp snapshot from the container
docker compose exec -T server rm /app/server/data/snapshot.db

echo "Backup completed: $BACKUP_DIR/backup-$TIMESTAMP.db"

```

### Backup Competition Datasets

Competition datasets (training/test files) are stored in the `competition-uploads` volume. To back them up:

```bash
docker run --rm -v happy-go-lucky_competition-uploads:/uploads -v $(pwd)/backups:/backup alpine tar -czf /backup/datasets-backup-$(date +%Y%m%d).tar.gz -C /uploads .

```

### Restore Database

1. **Stop the containers:**
```bash
docker compose down
```

2. **Copy backup to volume:**
```bash
docker run --rm -v happy-go-lucky-db:/app/server/data -v $(pwd):/backup alpine \
  cp /backup/backup-YYYYMMDD-HHMMSS.db /app/server/data/happyGoLucky.db
```

3. **Restart containers:**
```bash
docker compose up -d
```



### Reset/Delete Database

```bash
docker compose exec server rm /app/server/data/happyGoLucky.db /app/server/data/happyGoLucky.db-wal /app/server/data/happyGoLucky.db-shm

```
### Manual Database Access

```bash
# Access SQLite database interactively
docker compose exec server sh
cd /app/server/data
sqlite3 happyGoLucky.db
```

### Inspect Volume

```bash
# Show volume details
docker volume inspect happy-go-lucky-db

# Show volume location on host
docker volume inspect happy-go-lucky-db | grep Mountpoint
```

---

## Certificate Management

Caddy automatically manages HTTPS certificates via Let's Encrypt.

### Certificate Storage

Certificates are stored in the `caddy-data` Docker volume and persist across container restarts.

### Certificate Renewal

* **Automatic**: Caddy checks and renews certificates automatically
* **Timing**: Renewal starts 30 days before expiration
* **No downtime**: Renewal happens in the background
* **Notifications**: Expiry warnings sent to `ACME_EMAIL` if renewal fails

### Manual Certificate Operations

**View certificate details:**

```bash
# Check current certificates
docker compose exec caddy caddy list-certificates

```

**Force certificate renewal:**

```bash
# Restart Caddy to trigger re-check
docker compose restart caddy

```

**View certificate expiry:**

```bash
echo | openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -dates

```

### Certificate Troubleshooting

**If certificate acquisition fails:**

1. **Check DNS:**
```bash
nslookup your-domain.com

```


2. **Verify ports 80 and 443 are accessible:**
```bash
# From another machine
nc -zv your-domain.com 80
nc -zv your-domain.com 443

```


3. **Check Caddy logs:**
```bash
docker compose logs caddy | grep -i certificate

```


4. **Common issues:**
* Domain DNS not propagated (wait 1-24 hours after DNS changes)
* Firewall blocking ports 80/443
* Port already in use by another service
* Rate limit exceeded (Let's Encrypt has rate limits)



---

## Updating the Application

### Standard Update Process

1. **Pull latest code:**
```bash
git pull

```


2. **Rebuild and restart containers:**
```bash
docker compose down
docker compose build --no-cache
docker compose up -d

```


The database, datasets, and certificates persist in volumes, so your data is safe.
3. **Verify update:**
```bash
docker compose logs -f

```



### Zero-Downtime Update (Advanced)

For production environments where downtime must be minimized:

1. **Build new images without stopping current containers:**
```bash
docker compose build

```


2. **Quickly swap containers:**
```bash
docker compose up -d --no-deps --force-recreate server competition-service caddy

```



This minimizes downtime to a few seconds during container swap.

---

## Common Commands

### Container Management

```bash
# Start services in background
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f server
docker compose logs -f competition-service
docker compose logs -f caddy

# View logs with timestamps
docker compose logs -f --timestamps

# Check container status
docker compose ps

# View resource usage
docker stats

```

### Rebuild and Deploy

```bash
# Rebuild after code changes (with cache)
docker compose build
docker compose up -d

# Rebuild from scratch (no cache)
docker compose build --no-cache
docker compose up -d

# Complete reset (removes containers, keeps volumes)
docker compose down
docker compose up -d --force-recreate

```

### Shell Access

```bash
# Access server container shell
docker compose exec server sh

# Access competition-service container shell
docker compose exec competition-service sh

# Access Caddy container shell
docker compose exec caddy sh

# Run commands in container
docker compose exec server node --version
docker compose exec caddy caddy version

# Access backend directory
docker compose exec server sh -c "cd /app/server && ls -la"

```

### Volume Management

```bash
# List volumes
docker volume ls | grep happy-go-lucky

# Inspect volumes
docker volume inspect happy-go-lucky-db
docker volume inspect competition-uploads
docker volume inspect caddy-data
docker volume inspect client-dist

# Remove unused volumes (CAUTION: data loss!)
docker volume prune

```

### Cleanup

```bash
# Remove stopped containers
docker compose down --remove-orphans

# Remove old images (be careful!)
docker image prune -a

# Complete cleanup (REMOVES ALL DATA!)
docker compose down -v
docker system prune -a

```

---

## Troubleshooting

### Container Won't Start

**Check logs:**

```bash
docker compose logs server
docker compose logs competition-service
docker compose logs caddy

```

**Common issues:**

* **Ports 80/443 in use**: Stop other services or change port mapping in `docker-compose.yml`
* **Environment variables missing**: Check `.env` file exists and has correct values
* **Build errors**: Try `docker compose build --no-cache`
* **Out of disk space**: Check `df -h` and clean up Docker resources
* **Database Initialization Loop**: If the `competition-service` keeps restarting or logging "Wait for database initialization", the main `server` has crashed or hasn't created the `competitions` table yet. Check the `server` logs first!

### HTTPS Not Working

**Certificate acquisition failed:**

1. **Verify domain DNS:**
```bash
nslookup your-domain.com
dig your-domain.com

```


2. **Check port 80 accessibility (required for Let's Encrypt):**
```bash
# From another machine
curl -I [http://your-domain.com](http://your-domain.com)

```


3. **Check Caddy logs for certificate errors:**
```bash
docker compose logs caddy | grep -i "certificate\|acme\|let's encrypt"

```


4. **Common solutions:**
* Wait for DNS propagation (24-48 hours after DNS changes)
* Check firewall allows ports 80 and 443
* Verify `DOMAIN` in `.env` matches actual domain
* Ensure no other service is using port 80 during certificate acquisition



**Browser shows "Not Secure":**

* Certificate may still be acquiring (wait 30 seconds)
* Hard refresh browser (Ctrl+Shift+R)
* Check certificate expiry date

### Backend API Not Responding

**Check if backends are running:**

```bash
docker compose exec server ps aux | grep node
docker compose exec competition-service ps aux | grep node

```

**Test backend internally (from Caddy container):**

```bash
docker compose exec caddy wget -O- http://server:3000/user
docker compose exec caddy wget -O- http://competition-service:8081/health

```

**Check backend logs:**

```bash
docker compose logs server | grep -i "error\|listening"
docker compose logs competition-service | grep -i "error\|connected"

```

**Common issues:**

* Backend crashed on startup (check logs for errors)
* Database connection issues
* Missing environment variables (JWT_SECRET, etc.)
* Network configuration issue (containers not on same network)

### API 404 Errors

**Problem**: Frontend requests to `/api/...` return 404.

**Check Caddyfile syntax:**

```bash
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile

```

**Verify reverse proxy is working:**

```bash
# From host machine
curl -I http://localhost/api/user

```

**Common causes:**

* Caddyfile not mounted correctly
* Backend container not reachable (check network)
* Typo in Caddyfile route configuration

### Database Issues

**Database not persisting:**

```bash
# Verify volume exists
docker volume ls | grep happy-go-lucky-db

# Inspect volume
docker volume inspect happy-go-lucky-db

# Check database file
docker compose exec server ls -la /app/server/data/

```

**Database corruption:**

```bash
# Restore from backup (see Database Management section)

```

**Database locked (`SQLITE_BUSY`):**
If you see `SQLITE_BUSY` errors in the logs:

* This indicates the `busy_timeout` pragma wasn't applied correctly or an extremely long transaction blocked the DB.
* Check if multiple manual processes are accessing the database:
```bash
docker compose exec server sh -c "cd /app/server/data && fuser happyGoLucky.db"

```


* Restart the containers:
```bash
docker compose restart server competition-service

```



### Competition Evaluation Not Starting

If the scheduler triggers but student APIs aren't called:

1. Verify `PUBLIC_COMPETITION_API_URL` is set correctly in `.env`.
2. Verify `INTERNAL_COMPETITION_SERVICE_URL` is correct (`http://competition-service:8081`).
3. Check the `competition-service` logs for failed API calls or timeouts.
4. Verify that the student VM's IP address and endpoints are reachable from your server.

### Email Not Sending (Production)

**Check configuration:**

1. Verify `NODE_ENV=production` in docker-compose.yml
2. Verify `EMAIL_SMTP_USER` and `EMAIL_SMTP_PASS` are correct in `.env`
3. Check server logs for SMTP errors:
```bash
docker compose logs server | grep -i "email\|smtp"

```



**Test email credentials:**

```bash
# From inside server container
docker compose exec server sh
cd /app/server
node -e "require('dotenv').config(); console.log(process.env.EMAIL_SMTP_USER);"

```

### Frontend Not Loading

**Check if Caddy is serving files:**

```bash
docker compose exec caddy ls -la /srv/

```

**Check client-dist volume:**

```bash
docker volume inspect client-dist

```

**Rebuild client if needed:**

```bash
docker compose build client --no-cache
docker compose up -d

```

**Test static file serving:**

```bash
curl -I http://localhost

```

### High Memory/CPU Usage

**Check resource usage:**

```bash
docker stats

```

**Inspect container processes:**

```bash
docker compose exec server ps aux
docker compose exec competition-service ps aux
docker compose exec caddy ps aux

```

**Optimize if needed:**

* Restart containers to clear memory leaks: `docker compose restart`
* Check for database optimization opportunities
* Review application logs for errors causing high CPU

### Build Failures

**Clean rebuild:**

```bash
# Remove all containers and images
docker compose down
docker system prune -a

# Rebuild from scratch
docker compose build --no-cache
docker compose up -d

```

**Node modules issues:**

```bash
# On host machine
rm -rf node_modules client/node_modules server/node_modules competition-service/node_modules
npm install

# Then rebuild Docker
docker compose build --no-cache

```

### Firewall Configuration

**For Ubuntu/Debian with UFW:**

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status

```

**For CentOS/RHEL with firewalld:**

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

```

---

## Security Best Practices

1. **Keep secrets secure:**
* Never commit `.env` to version control
* Use strong, randomly generated secrets (`JWT_SECRET`, `INTERNAL_API_SECRET`)
* Rotate secrets regularly


2. **Regular updates:**
```bash
# Pull latest code and rebuild monthly
git pull
docker compose build --no-cache
docker compose up -d

```


3. **Backup regularly:**
* Automated daily database backups (using WAL-safe snapshot method)
* Automated backups of competition datasets
* Test restore process quarterly


4. **Monitor logs:**
```bash
# Check for suspicious activity
docker compose logs | grep -i "error\|warning\|unauthorized"

```


5. **Firewall:**
* Only expose ports 80 and 443
* Use fail2ban for brute-force protection


6. **Certificate monitoring:**
* Ensure `ACME_EMAIL` receives notifications
* Monitor expiry dates



---

## Production Checklist

Before going live:

* [ ] Domain DNS configured and propagated
* [ ] Ports 80 and 443 accessible from internet
* [ ] `.env` file configured with production values
* [ ] `JWT_SECRET` and `INTERNAL_API_SECRET` are strong and random (use `openssl rand -base64 32`)
* [ ] `ACME_EMAIL` is valid and monitored
* [ ] Email credentials tested
* [ ] Database backup strategy in place (WAL-safe script)
* [ ] Dataset backup strategy in place
* [ ] Firewall configured properly
* [ ] HTTPS certificate acquired successfully
* [ ] Application accessible via HTTPS
* [ ] Default admin password changed
* [ ] API routes work correctly (test `/api/user` and `/api/competition/health`)
* [ ] Monitoring/alerting configured (optional)

---

## Support and Documentation

* **Caddy Documentation**: https://caddyserver.com/docs/
* **Docker Compose Documentation**: https://docs.docker.com/compose/
* **Let's Encrypt Documentation**: https://letsencrypt.org/docs/

For application-specific issues, refer to the project README and source code documentation.

```

```