# Deployment Guide - Baynunah HRIS

## 🚀 Quick Start (Local Development)

### Prerequisites
```bash
node -v  # Should be 18.x or higher
psql --version  # Should be PostgreSQL 14+
```

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/baynunah_hris
SESSION_SECRET=generate-a-random-32-character-string
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=sk-your-key-here  # Optional
```

### 3. Initialize Database
```bash
# Create database
createdb baynunah_hris

# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Optional: View database in Drizzle Studio
npm run db:studio
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
npm run server
# Server runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Vite dev server runs on http://localhost:5173
```

## 📦 Production Build

```bash
# Build frontend
npm run build

# The dist/client folder contains production-ready files
```

## ☁️ Azure Deployment

### Architecture
- **Frontend**: Azure Static Web Apps
- **Backend**: Azure App Service
- **Database**: Azure Database for PostgreSQL
- **Storage**: Azure Blob Storage (file uploads)

### Step-by-Step Azure Deployment

#### 1. Create Azure Resources

```bash
# Login to Azure
az login

# Create resource group
az group create --name baynunah-hris-rg --location eastus

# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group baynunah-hris-rg \
  --name baynunah-hris-db \
  --location eastus \
  --admin-user baynunahadmin \
  --admin-password YourSecurePassword123! \
  --sku-name Standard_B1ms \
  --version 14

# Create database
az postgres flexible-server db create \
  --resource-group baynunah-hris-rg \
  --server-name baynunah-hris-db \
  --database-name baynunah_hris

# Create App Service Plan
az appservice plan create \
  --name baynunah-hris-plan \
  --resource-group baynunah-hris-rg \
  --sku B1 \
  --is-linux

# Create Web App for Backend
az webapp create \
  --resource-group baynunah-hris-rg \
  --plan baynunah-hris-plan \
  --name baynunah-hris-api \
  --runtime "NODE|18-lts"
```

#### 2. Configure Backend Environment

```bash
# Set environment variables
az webapp config appsettings set \
  --resource-group baynunah-hris-rg \
  --name baynunah-hris-api \
  --settings \
    DATABASE_URL="postgresql://baynunahadmin:YourSecurePassword123!@baynunah-hris-db.postgres.database.azure.com:5432/baynunah_hris?sslmode=require" \
    SESSION_SECRET="your-generated-secret-key" \
    NODE_ENV="production" \
    OPENAI_API_KEY="your-openai-key"
```

#### 3. Deploy Backend

```bash
# Create deployment ZIP
cd server
zip -r ../deploy.zip .

# Deploy to Azure Web App
az webapp deployment source config-zip \
  --resource-group baynunah-hris-rg \
  --name baynunah-hris-api \
  --src deploy.zip
```

#### 4. Deploy Frontend to Static Web Apps

```bash
# Build frontend
npm run build

# Create Static Web App
az staticwebapp create \
  --name baynunah-hris-frontend \
  --resource-group baynunah-hris-rg \
  --source https://github.com/ismaelloveexcel/BaynunahHRDigitalPass-1 \
  --location eastus \
  --branch main \
  --app-location "client" \
  --output-location "dist/client" \
  --api-location "server"
```

#### 5. Create Blob Storage for Uploads

```bash
# Create storage account
az storage account create \
  --name baynunahhrisstorage \
  --resource-group baynunah-hris-rg \
  --location eastus \
  --sku Standard_LRS

# Create containers
az storage container create \
  --name cvs \
  --account-name baynunahhrisstorage

az storage container create \
  --name documents \
  --account-name baynunahhrisstorage

az storage container create \
  --name offers \
  --account-name baynunahhrisstorage
```

### Post-Deployment Steps

1. **Run Database Migrations**
```bash
# SSH into App Service
az webapp ssh --resource-group baynunah-hris-rg --name baynunah-hris-api

# Run migrations
npm run db:migrate
```

2. **Configure CORS**
```bash
az webapp cors add \
  --resource-group baynunah-hris-rg \
  --name baynunah-hris-api \
  --allowed-origins https://baynunah-hris-frontend.azurestaticapps.net
```

3. **Set Up Custom Domain** (Optional)
```bash
az staticwebapp hostname set \
  --name baynunah-hris-frontend \
  --resource-group baynunah-hris-rg \
  --hostname hris.baynunah.com
```

## 🔧 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `SESSION_SECRET` | Session encryption key | Yes | - |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `OPENAI_API_KEY` | OpenAI API key for enhanced AI | No | - |
| `MAX_FILE_SIZE` | Max upload size in bytes | No | 10485760 |
| `UPLOAD_DIR` | Upload directory path | No | uploads |

## 🐳 Docker Deployment (Alternative)

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Build and Run

```bash
# Build image
docker build -t baynunah-hris .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="..." \
  baynunah-hris
```

### Docker Compose

```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: baynunah_hris
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/baynunah_hris
      SESSION_SECRET: your-secret-key
      NODE_ENV: production
    depends_on:
      - db

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

## 🔍 Health Checks & Monitoring

### Health Endpoint
```bash
curl https://baynunah-hris-api.azurewebsites.net/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-13T..."
}
```

### Azure Application Insights

```bash
# Enable Application Insights
az monitor app-insights component create \
  --app baynunah-hris-insights \
  --location eastus \
  --resource-group baynunah-hris-rg

# Link to Web App
az webapp config appsettings set \
  --resource-group baynunah-hris-rg \
  --name baynunah-hris-api \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="your-key"
```

## 🔒 Security Checklist

- [ ] Change default SESSION_SECRET
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up firewall rules for PostgreSQL
- [ ] Enable Azure AD authentication (optional)
- [ ] Configure rate limiting
- [ ] Set up backup strategy
- [ ] Enable audit logging
- [ ] Implement data encryption at rest

## 📊 Performance Optimization

1. **Enable compression**
2. **Configure CDN for static assets**
3. **Enable database connection pooling**
4. **Set up Redis for session storage** (optional)
5. **Configure caching headers**

## 🔄 CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: baynunah-hris-api
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

## 📞 Support

For deployment issues:
- GitHub Issues: https://github.com/ismaelloveexcel/BaynunahHRDigitalPass-1/issues
- Email: support@baynunah.com

---

**Powered by HR |IS| Baynunah 2025**
