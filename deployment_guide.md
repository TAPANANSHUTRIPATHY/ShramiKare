# 🚀 ShramiKare - Production Deployment Guide

This guide details the steps to deploy ShramiKare frontend to **Vercel** and the FastAPI backend to a server hosting provider (like **Render**, **Railway**, or **Vercel Serverless**).

---

## 💻 1. Local Configuration (Development)

Before pushing to production, verify your local environment configuration:

1. **Frontend Base URL Configuration:**
   Inside [frontend/ShramiKare/src/config.js](file:///c:/Users/KIIT/Desktop/SAION/CODING%20WORLD/GITHUB/SIH%202025/shramikare/frontend/ShramiKare/src/config.js), set your backend host.
   - For local development: `export const API_BASE_URL = "http://localhost:8000";`
   - For production: Change `http://localhost:8000` to your deployed backend URL (e.g. `https://shramikare-api.onrender.com`). Do not append `/api` to `API_BASE_URL` since frontend pages append `/api` automatically.

2. **Backend API Keys (.env):**
   Create a `.env` in the `backend` folder with these variables:
   ```env
   FIREBASE_CREDENTIALS={"type": "service_account", "project_id": "...", ...}
   NVIDIA_API_KEY=your-nv-key
   GEMINI_API_KEY=your-gemini-key
   TWILIO_ACCOUNT_SID=your-sid
   TWILIO_AUTH_TOKEN=your-token
   TWILIO_PHONE_NUMBER=your-phone
   ```

---

## ☁️ 2. Backend Deployment (e.g., Render or Railway)

Since the backend is written in Python (FastAPI), hosting it on a persistent docker/server container is recommended to ensure image uploads remain saved (if not configured with external S3/Firebase Storage).

### Deploying on Render (Free Web Service)
1. Sign in to [Render](https://render.com) and create a **New Web Service**.
2. Connect your GitHub repository.
3. Configure the following values:
   - **Name**: `shramikare-backend`
   - **Environment**: `Python`
   - **Root Directory**: `backend` (Important: points Render to your backend subfolder)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Click **Advanced** and add these Environment Variables:
   - `FIREBASE_CREDENTIALS`: Paste the exact contents of your Firebase Service Account JSON certificate key file.
   - `GEMINI_API_KEY`: Google Gemini Flash API key.
   - `NVIDIA_API_KEY`: NVIDIA Llama API key.
   - `TWILIO_ACCOUNT_SID`: Twilio account SID.
   - `TWILIO_AUTH_TOKEN`: Twilio auth token.
   - `TWILIO_PHONE_NUMBER`: Twilio active phone number.
5. Launch the service. Render will output an active URL (e.g. `https://shramikare-backend.onrender.com`).

---

## 🎨 3. Frontend Deployment (Vercel)

Vercel is the recommended hosting platform for React SPA applications.

### Configuration
1. In [frontend/ShramiKare/src/config.js](file:///c:/Users/KIIT/Desktop/SAION/CODING%20WORLD/GITHUB/SIH%202025/shramikare/frontend/ShramiKare/src/config.js), update `API_BASE_URL` to point to your live Render backend:
   ```javascript
   export const API_BASE_URL = "https://shramikare-backend.onrender.com";
   ```
2. Log in to your [Vercel Dashboard](https://vercel.com).
3. Import your GitHub repository.
4. Select the project directory configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend/ShramiKare` (Important: points Vercel to your React subfolder)
5. Under **Build & Development Settings**, verify:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Click **Deploy**. Vercel will build your static React bundles and publish them to a production URL (e.g. `https://shramikare.vercel.app`).

---

## 🛠️ 4. Handling File Uploads in Production
Currently, when a user registers, their profile and Aadhaar photos are uploaded and stored in the backend's local `uploads` directory. 
- On container platforms with ephemeral file systems (like Render free tier or Vercel serverless), **locally saved uploads will disappear** when the server restarts or goes to sleep.
- **Production Recommendation**: To make file uploads persistent, modify `main.py` upload logic to send files to **Firebase Storage** (which is already configured via the `firebase-admin` library in your project) instead of writing them to `uploads/`.
