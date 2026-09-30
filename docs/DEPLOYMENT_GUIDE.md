# Comprehensive Deployment Guide
## Intelligent API Performance Monitoring and Anomaly Detection System

This guide outlines all options to deploy and host the API Monitoring & ML Anomaly Detection application across cloud providers, container registries, and standard hosting services.

---

### Option 1: Live in Google AI Studio (Already Active)

Your application is currently running live on Google Cloud infrastructure.

- **Development URL**: `https://ais-dev-fvd72rayqy72h3wisqx7au-681834351709.asia-southeast1.run.app`
- **Shared / Preview URL**: `https://ais-pre-fvd72rayqy72h3wisqx7au-681834351709.asia-southeast1.run.app`

#### How to Share with Users or Evaluators:
1. Locate the **"Share"** or **"Publish"** button in the top right header of the Google AI Studio Build interface.
2. Set access permissions (Public or Restricted by Google Account).
3. Copy the public link to provide to professors, evaluators, or team members.

---

### Option 2: Deploy with Docker Container

A production-ready `Dockerfile` is included in the project root with a multi-stage Alpine Linux build.

#### 1. Build the Docker Image:
```bash
docker build -t api-monitor-ml:latest .
```

#### 2. Run the Container Locally:
```bash
docker run -d -p 3000:3000 --name api-monitor api-monitor-ml:latest
```
Access at `http://localhost:3000`.

---

### Option 3: Deploy to Google Cloud Run (Serverless Container)

Because the project includes a `Dockerfile`, it can be deployed to Google Cloud Run in minutes:

#### 1. Authenticate with Google Cloud CLI:
```bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

#### 2. Build and Deploy:
```bash
gcloud run deploy api-monitor \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 3000
```
Google Cloud Run will automatically build the container image via Cloud Build, provision an HTTPS domain, and auto-scale to zero when idle.

---

### Option 4: Deploy to Render or Railway

Render and Railway offer free and affordable hosting for full-stack Node.js + Express + React applications:

#### Render.com:
1. Push your code to GitHub or GitLab.
2. In Render Dashboard, click **New +** → **Web Service**.
3. Connect your Git repository.
4. Set the following build and start commands:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Click **Deploy**. Render will allocate an HTTPS URL (e.g., `https://api-monitor.onrender.com`).

#### Railway.app:
1. Create a new project in Railway: **Deploy from GitHub repo**.
2. Railway detects `package.json` automatically.
3. Add environment variable `PORT=3000`.
4. Railway executes `npm run build` and runs `npm start`.

---

### Option 5: Traditional Linux VPS (Ubuntu/Debian with Nginx & PM2)

For deployment on AWS EC2, DigitalOcean Droplet, Linode, or Google Compute Engine:

#### 1. Server Setup:
```bash
sudo apt update && sudo apt install -y nodejs npm git nginx
sudo npm install -g pm2
```

#### 2. Clone & Build:
```bash
git clone <YOUR_GIT_REPO_URL> /var/www/api-monitor
cd /var/www/api-monitor
npm ci
npm run build
```

#### 3. Start Application with PM2:
```bash
pm2 start dist/server.cjs --name "api-monitor"
pm2 save
pm2 startup
```

#### 4. Configure Nginx Reverse Proxy:
Create `/etc/nginx/sites-available/api-monitor`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/api-monitor /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

### Verification Checklist After Deployment

- [ ] Check `/api/health` returns `{"status":"ok"}`
- [ ] Confirm Dashboard telemetry graphs and KPI cards load
- [ ] Test the **Traffic Simulator** (`⌘S`) to verify real-time ingestion
- [ ] Navigate to **Machine Learning Hub** to evaluate latency forecasting and the Time-of-Day Anomaly Heatmap
- [ ] Verify PDF report generation under the **Reports** tab
