# 🚀 ShramiKare Deployment Guide

This guide details how to deploy the ShramiKare application, which consists of a React/Vite frontend and a FastAPI backend. Based on our architecture, the **Frontend** is hosted on **Vercel**, and the **Backend** is deployed using **Render**. The database relies on **Firebase Firestore**.

---

## 🏛️ Architecture Overview

*   **Frontend (Client):** React.js + Vite deployed on **Vercel**.
*   **Backend (API Server):** FastAPI deployed via Docker on **Render**.
*   **Database:** Firebase Firestore (Cloud-native).
*   **External APIs:** Twilio, Google Gemini, NVIDIA LLaMA.

---

## 1. 🟢 Frontend Deployment (Vercel)

*Since the frontend is already deployed to Vercel, this section details how to keep it linked to the production backend.*

### Configuration Updates
Once the backend is deployed (see Section 2), you will receive a production URL (e.g., `https://shramikare-api.onrender.com`). You must point your Vercel frontend to this URL.

1.  Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Navigate to your **ShramiKare** project.
3.  Go to **Settings** > **Environment Variables**.
4.  Add or update the environment variable used for the backend URL (often named `VITE_API_URL` or `VITE_BACKEND_URL`).
    *   **Key:** `VITE_API_BASE_URL` (Check your `.env.example` in frontend to see the exact variable name)
    *   **Value:** `https://your-render-backend-url.onrender.com`
5.  **Redeploy** the application on Vercel to apply the new environment variables.

---

## 2. 🟣 Backend Deployment (Render)

We will deploy the FastAPI backend to **Render** using the provided `Dockerfile`.

### Prerequisites
*   A [Render account](https://render.com/).
*   Your project code pushed to a GitHub repository.

### Step-by-Step Deployment

1.  **Create a New Web Service**
    *   In the Render dashboard, click **New +** and select **Web Service**.
    *   Connect your GitHub repository containing the ShramiKare backend.

2.  **Configure the Service**
    *   **Name:** `shramikare-api` (or your preferred name).
    *   **Root Directory:** `backend` (This is crucial! Tell Render to look inside the `backend` folder).
    *   **Environment:** Select `Docker`.
    *   **Region:** Select the region closest to your users (e.g., Singapore or Frankfurt for Indian users).
    *   **Instance Type:** Free tier works for development, but consider upgrading for production.

3.  **Set Environment Variables**
    Before clicking deploy, expand the **Advanced** section and click **Add Environment Variable**. Add all the secrets from your `backend/.env.example`:

    | Key | Value |
    | :--- | :--- |
    | `NVIDIA_API_KEY` | Your NVIDIA API Key |
    | `GEMINI_API_KEY` | Your Google Gemini API Key |
    | `TWILIO_ACCOUNT_SID` | Your Twilio Account SID |
    | `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
    | `TWILIO_PHONE_NUMBER` | Your Twilio Phone Number |
    | `QRCODER_API_KEY` | Your QRCoder API Key |

4.  **Handling the Firebase Credentials**
    The backend requires Firebase Admin SDK credentials. Since you should **not** commit this JSON key file to GitHub, you need to inject it using one of the following methods:
    *   **Recommended Method (Environment Variable):** Create an environment variable in Render:
        *   **Key:** `FIREBASE_CREDENTIALS_JSON`
        *   **Value:** Paste the entire JSON content of your `shramikare-firebase-adminsdk-fbsvc-*.json` key file (e.g., `'{"type": "service_account", ...}'`).
        *   The backend is configured to automatically parse this JSON string and authenticate with Firebase.
    *   **Alternative Method (Render Secret Files):**
        *   In the Render dashboard, under the **Advanced** section of your service settings, use **Secret Files**.
        *   **Filename:** `shramikare-firebase-adminsdk.json`
        *   **Contents:** Paste the entire contents of your Firebase JSON key.
        *   The backend will check the path `/etc/secrets/shramikare-firebase-adminsdk.json` and load it.

5.  **Deploy**
    *   Click **Create Web Service**.
    *   Render will begin building your Docker image. Once complete, it will be live at the provided `.onrender.com` URL.

---

## 3. 🗄️ Database (Firebase)

Firebase Firestore is fully managed. No specific deployment steps are needed other than ensuring your deployed backend has the correct service account credentials (as covered in the Render section) so it can authenticate and read/write data.

> [!CAUTION]
> Never expose your `shramikare-firebase-adminsdk.json` in your public frontend code or commit it to your GitHub repository. It grants full administrative access to your database.
