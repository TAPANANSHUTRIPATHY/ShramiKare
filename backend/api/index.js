const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const twilio = require('twilio');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Connection Initialization
const firebaseCredentialsEnv = process.env.FIREBASE_CREDENTIALS_JSON;
if (!admin.apps.length) {
  if (firebaseCredentialsEnv) {
    let creds;
    try {
      let cleanJson = firebaseCredentialsEnv.trim();
      if ((cleanJson.startsWith("'") && cleanJson.endsWith("'")) || (cleanJson.startsWith('"') && cleanJson.endsWith('"'))) {
        cleanJson = cleanJson.substring(1, cleanJson.length - 1).trim();
      }
      creds = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse FIREBASE_CREDENTIALS_JSON env var:", e);
    }
    if (creds) {
      admin.initializeApp({
        credential: admin.credential.cert(creds)
      });
    }
  } else {
    // Look for local credential JSON files matching *firebase-adminsdk*.json
    const rootFiles = fs.readdirSync(path.join(__dirname, '..'));
    const credFile = rootFiles.find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));
    if (credFile) {
      const creds = JSON.parse(fs.readFileSync(path.join(__dirname, '..', credFile), 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(creds)
      });
    } else {
      console.warn("No Firebase credentials found! Set FIREBASE_CREDENTIALS_JSON env var.");
    }
  }
}

const db = admin.firestore();

// Gemini API Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Multer Storage Configuration (in-memory) for Vision API uploads
const upload = multer({ storage: multer.memoryStorage() });

// --- Helper Functions ---

// 1. Predict Follow-up Date via Gemini
async function predictFollowUpDate(userData) {
  if (!process.env.GEMINI_API_KEY) {
    console.log("Gemini API key missing. Fallback to default follow-up in 14 days.");
    const lastVisitStr = userData.records?.lastVisitDate;
    if (lastVisitStr) {
      try {
        const lastVisit = new Date(lastVisitStr);
        lastVisit.setDate(lastVisit.getDate() + 14);
        return lastVisit.toISOString().split('T')[0];
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  }

  const prompt = `
  Patient Details:
  Name: ${userData.name}
  Age: ${userData.age || 'N/A'}
  Blood Group: ${userData.blood_group || 'N/A'}
  Last Visit Date: ${userData.records?.lastVisitDate || 'N/A'}
  Last Visit Reason: ${userData.records?.lastVisitReason || 'N/A'}
  Current Symptoms: ${(userData.records?.currentSymptoms || []).join(', ')}
  Vaccinations: vaccination1=${userData.records?.vaccination1}, vaccination2=${userData.records?.vaccination2}
  Special Notes: ${userData.records?.specialNotes || 'None'}

  Based on these details, suggest the next follow-up date in YYYY-MM-DD format. Return ONLY the date string, nothing else.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text;
    }
    console.warn("Unexpected response for follow-up date:", text);
    return null;
  } catch (e) {
    console.error("Gemini follow-up prediction failed:", e);
    return null;
  }
}

// 2. Invoke NVIDIA LLM for Health Advisories
async function invokeNvidiaLlm(prompt) {
  const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
  const headers = {
    "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
    "Accept": "application/json",
    "Content-Type": "application/json"
  };
  const payload = {
    "model": "meta/llama-4-scout-17b-16e-instruct",
    "messages": [{"role": "user", "content": prompt}],
    "max_tokens": 512,
    "temperature": 0.7,
    "top_p": 0.9,
    "response_format": {"type": "json_object"}
  };
  try {
    const res = await fetch(invokeUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const result = await res.json();
    const content = result.choices[0].message.content;
    return JSON.parse(content);
  } catch (e) {
    console.error("NVIDIA API Error:", e);
    return { error: "LLM processing failed" };
  }
}

// 3. Send SMS message via Twilio API
function sendSmsMessage(phone, message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials are not set in environment variables.");
  }
  const client = twilio(accountSid, authToken);
  return client.messages.create({
    body: message.substring(0, 1200),
    from: fromNumber,
    to: "+91" + phone
  }).then(msg => {
    console.log(`Twilio SMS sent: SID=${msg.sid}, MESSAGE: ${message}`);
    return msg.sid;
  });
}

// 4. Multilingual Translation via Gemini
async function multilingualOutput(text, targetLanguage = 'en') {
  if (targetLanguage === 'en') {
    return { advice: [text], language: 'en' };
  }
  if (!process.env.GEMINI_API_KEY) {
    return { advice: [text], language: 'en' };
  }
  try {
    const prompt = `Translate the following health advisory message to language code "${targetLanguage}". Return ONLY the translated text. Do not include any notes, formatting, or extra text.\n\nMessage: "${text}"`;
    const result = await model.generateContent(prompt);
    const translatedText = result.response.text().trim();
    return { advice: [translatedText], language: 'en' };
  } catch (e) {
    console.error("Translation error:", e);
    return { advice: [text], language: targetLanguage };
  }
}

// 5. Generate QR Code tag
async function generateQr(text) {
  const dataUrl = await QRCode.toDataURL(text, { margin: 2, scale: 6, color: { dark: '#166534', light: '#ffffff' } });
  return `<img src="${dataUrl}" alt="QR Code" style="width:160px;height:160px;" />`;
}

// --- Firestore CRUD functions ---

async function addUser(data) {
  try {
    const docRef = await db.collection('users').add(data);
    return { success: true, id: docRef.id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function getUserById(userId) {
  try {
    const doc = await db.collection('users').doc(userId).get();
    if (doc.exists) {
      return { success: true, data: { ...doc.data(), id: doc.id } };
    }
    return { success: false, error: "User not found" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function getAllUsers() {
  try {
    const snapshot = await db.collection('users').get();
    const userList = [];
    snapshot.forEach(doc => {
      userList.push({ ...doc.data(), id: doc.id });
    });
    return { success: true, data: userList };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function getAllUsersJson() {
  try {
    const snapshot = await db.collection('users').get();
    const userList = [];
    snapshot.forEach(doc => {
      userList.push({ ...doc.data(), id: doc.id });
    });
    return { success: true, json: JSON.stringify(userList) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function searchUserByAadhaar(aadhaarNumber) {
  try {
    const snapshot = await db.collection('users').where('aadhaarNumber', '==', aadhaarNumber).get();
    const results = [];
    snapshot.forEach(doc => {
      results.push({ ...doc.data(), id: doc.id });
    });
    return { success: true, data: results };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function updateUser(userId, updateData) {
  try {
    let docRef = db.collection('users').doc(userId);
    let doc = await docRef.get();
    if (!doc.exists) {
      const snapshot = await db.collection('users').where('aadhaarNumber', '==', userId).get();
      if (!snapshot.empty) {
        docRef = snapshot.docs[0].ref;
        doc = snapshot.docs[0];
      } else {
        return { success: false, error: "User not found" };
      }
    }

    const recordsUpdate = updateData.records || {};
    if (recordsUpdate.lastVisitDate) {
      const userData = { ...doc.data(), ...updateData };
      userData.records = { ...doc.data().records, ...recordsUpdate };
      const nextFollowUp = await predictFollowUpDate(userData);
      if (nextFollowUp) {
        recordsUpdate.nextFollowUpDate = nextFollowUp;
        updateData.records = recordsUpdate;
      }
    }

    await docRef.update(updateData);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function deleteUser(userId) {
  try {
    const docRef = db.collection('users').doc(userId);
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.delete();
      return { success: true };
    }
    return { success: false, error: "User not found" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function getFacilitiesByDistrict(district) {
  try {
    const snapshot = await db.collection('facilities').where('district', '==', district).get();
    const facilities = [];
    snapshot.forEach(doc => {
      facilities.push(doc.data());
    });
    return { success: true, district, facilities };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function storeOtp(userId, otp) {
  try {
    await db.collection('otps').doc(userId).set({
      otp,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function validateOtp(userId, otp) {
  try {
    const doc = await db.collection('otps').doc(userId).get();
    if (doc.exists) {
      const data = doc.data();
      if (data.otp === otp) {
        const timestamp = data.timestamp.toDate().getTime();
        const now = Date.now();
        if (now - timestamp < 300000) {
          return { success: true };
        } else {
          return { success: false, error: "OTP has expired" };
        }
      }
    }
    return { success: false, error: "Invalid OTP" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// --- API Endpoints Router ---

// GET /users
app.get('/users', async (req, res) => {
  const result = await getAllUsers();
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(400).json({ error: result.error });
  }
});

// GET /users/json
app.get('/users/json', async (req, res) => {
  const result = await getAllUsersJson();
  if (result.success) {
    res.json(JSON.parse(result.json));
  } else {
    res.status(400).json({ error: result.error });
  }
});

// GET /users/by-aadhaar/:aadhaar
app.get('/users/by-aadhaar/:aadhaar', async (req, res) => {
  const result = await searchUserByAadhaar(req.params.aadhaar);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(404).json({ error: result.error });
  }
});

// GET /users/id/:id
app.get('/users/id/:id', async (req, res) => {
  const result = await getUserById(req.params.id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(404).json({ error: result.error });
  }
});

// POST /users
app.post('/users', async (req, res) => {
  const result = await addUser(req.body);
  if (result.success) {
    res.json({ message: "Migrant created", id: result.id });
  } else {
    res.status(400).json({ error: result.error });
  }
});

// PUT /users/id/:id
app.put('/users/id/:id', async (req, res) => {
  const result = await updateUser(req.params.id, req.body);
  if (result.success) {
    res.json({ message: "Migrant updated" });
  } else {
    res.status(404).json({ error: result.error });
  }
});

// DELETE /users/id/:id
app.delete('/users/id/:id', async (req, res) => {
  const result = await deleteUser(req.params.id);
  if (result.success) {
    res.json({ message: "Migrant deleted" });
  } else {
    res.status(404).json({ error: result.error });
  }
});

// GET /facilities
app.get('/facilities', async (req, res) => {
  const district = req.query.district;
  if (!district) {
    return res.status(400).json({ error: "district query param is required" });
  }
  const result = await getFacilitiesByDistrict(district);
  if (!result.success) {
    return res.status(404).json({ error: result.error });
  }
  const response = {};
  result.facilities.forEach((facility, idx) => {
    response[`facility_${idx + 1}`] = {
      district: result.district,
      facilityName: facility.facilityName,
      phoneNumbers: facility.phoneNumbers || [],
      address: facility.address,
      facilityType: facility.facilityType,
      services: facility.services || [],
      workingHours: facility.workingHours,
      remarks: facility.remarks || ""
    };
  });
  res.json(response);
});

// POST /send-reminder
app.post('/send-reminder', async (req, res) => {
  const aadhaarId = req.body.aadhaar_id || req.query.aadhaar_id;
  if (!aadhaarId) {
    return res.status(400).json({ error: "aadhaar_id parameter is required" });
  }

  const userResult = await searchUserByAadhaar(aadhaarId);
  if (!userResult.success || !userResult.data || !userResult.data.length) {
    return res.status(404).json({ error: "User not found" });
  }

  const userData = userResult.data[0];
  const prompt = `
  User Details:
  Name: ${userData.name}
  Age: ${userData.age || 'N/A'}
  Blood Group: ${userData.blood_group || 'N/A'}
  Language: ${userData.language || 'en'}
  Address: ${userData.address}
  Vaccination Status: ${JSON.stringify(userData.records)}
  Special Notes: ${userData.records?.specialNotes || 'None'}
  Companies Worked: ${(userData.companies || []).map(c => c.name).join(', ')}
  
  Based on these details, generate a brief health advisory message for reminders.
  (KEEP THE OUTPUT IN LESS THAN 1200 CHARACTERS)
  `;

  const llmResponse = await invokeNvidiaLlm(prompt);
  if (llmResponse.error) {
    return res.status(500).json({ error: llmResponse.error });
  }

  const advisoryMessage = llmResponse.advice?.[0] || "Please follow up with nearest health facility";
  const targetLanguage = userData.language || "en";
  const translationResult = await multilingualOutput(advisoryMessage, targetLanguage);
  const translatedMessage = translationResult.advice?.[0] || advisoryMessage;

  const phoneNumber = userData.phonenumber;
  if (!phoneNumber) {
    return res.status(400).json({ error: "User phone number missing" });
  }

  try {
    const smsSid = await sendSmsMessage(phoneNumber, translatedMessage);
    res.json({ message: "Reminder sent successfully", sms_sid: smsSid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /outbreak-prediction
app.get('/outbreak-prediction', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ outbreak_summary: "Gemini API key missing. Outbreak surveillance offline.", severity_score: 0 });
  }

  try {
    const userResults = await getAllUsers();
    if (!userResults.success || !userResults.data) {
      return res.status(404).json({ error: "No user data found" });
    }

    const userDataList = userResults.data;
    const caseLines = [];
    userDataList.forEach(user => {
      const symptoms = (user.records?.currentSymptoms || []).join(", ") || "none";
      const line = `${user.name || 'Unknown'}, Age: ${user.age || 'N/A'}, From: ${user.originDistrict || 'N/A'}, At: ${user.destinationDistrict || 'N/A'}, Symptoms: ${symptoms}, Last Visit Reason: ${user.records?.lastVisitReason || 'N/A'}, Last Visit Date: ${user.records?.lastVisitDate || 'N/A'}`;
      caseLines.push(line);
    });

    const prompt = `
    Health Surveillance Report:

    Recent cases summary (last 7 days):
    ${caseLines.join("\n")}

    Please analyze these cases and provide:
    1. A summary of possible outbreak patterns or clusters.
    2. A severity score between 0 and 100 (100 = highest risk).

    Return the response as a JSON object with fields "summary" and "severity_score".
    KEEP THE LENGTH WITHIN 1200 CHARACTERS
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith("```")) {
      text = text.split("\n").slice(1, -1).join("\n").trim();
    }
    if (text.startsWith("json")) {
      text = text.substring(4).trim();
    }
    let output;
    try {
      output = JSON.parse(text);
    } catch (e) {
      output = { summary: text, severity_score: 0 };
    }

    const severity = output.severity_score || 0;
    if (severity > 50) {
      const alertMessage = `OUTBREAK ALERT! Severity: ${severity}/100\n${output.summary || ''}`;
      const officialNumbers = ["9330559738", "9937080977"];
      for (const number of officialNumbers) {
        try {
          await sendSmsMessage(number, alertMessage);
        } catch (ex) {
          console.error(`Failed to send outbreak alert SMS: ${ex.message}`);
        }
      }
    }

    res.json({ outbreak_summary: output.summary, severity_score: severity });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /otp/generate
app.post('/otp/generate', async (req, res) => {
  const userId = req.body.user_id || req.query.user_id;
  if (!userId) return res.status(400).json({ error: "user_id is required" });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const result = await storeOtp(userId, otp);
  if (result.success) {
    const user = await searchUserByAadhaar(userId);
    if (user.success && user.data && user.data.length) {
      const userData = user.data[0];
      const targetLanguage = userData.language || "en";
      const phoneNumber = userData.phonenumber;
      const otpMessage = `Your OTP is: ${otp}`;
      try {
        if (targetLanguage !== 'en') {
          const translationResult = await multilingualOutput(otpMessage, targetLanguage);
          const translatedMessage = translationResult.advice?.[0] || otpMessage;
          await sendSmsMessage(phoneNumber, translatedMessage);
        } else {
          await sendSmsMessage(phoneNumber, otpMessage);
        }
      } catch (e) {
        console.error("SMS Send Failure:", e.message);
      }
    }
    console.log(`\n==================================================\nOTP FOR Aadhaar '${userId}': ${otp}\n==================================================\n`);
    res.json({ message: "OTP generated", otp });
  } else {
    res.status(500).json({ error: result.error });
  }
});

// POST /otp/validate
app.post('/otp/validate', async (req, res) => {
  const userId = req.body.user_id || req.query.user_id;
  const otp = req.body.otp || req.query.otp;
  if (!userId || !otp) return res.status(400).json({ error: "user_id and otp are required" });

  const result = await validateOtp(userId, otp);
  if (result.success) {
    res.json({ message: "OTP validated" });
  } else {
    res.status(400).json({ error: result.error });
  }
});

// GET /generate-qr
app.get('/generate-qr', async (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: "text query param is required" });
  try {
    const htmlImgTag = await generateQr(text);
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlImgTag);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /send-followup-reminders
app.get('/send-followup-reminders', async (req, res) => {
  try {
    const usersResult = await getAllUsers();
    if (!usersResult.success || !usersResult.data) {
      return res.status(404).json({ error: "No users found" });
    }
    const users = usersResult.data;
    const now = new Date();
    now.setUTCHours(0,0,0,0);
    const reminderWindowDays = 3;
    let remindersSent = 0;

    for (const user of users) {
      const nextFollowupStr = user.records?.nextFollowUpDate;
      if (!nextFollowupStr) continue;

      let nextFollowupDate;
      try {
        nextFollowupDate = new Date(nextFollowupStr.trim());
        nextFollowupDate.setUTCHours(0,0,0,0);
      } catch (e) {
        continue;
      }

      const diffTime = nextFollowupDate.getTime() - now.getTime();
      const daysUntilFollowup = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysUntilFollowup >= 0 && daysUntilFollowup <= reminderWindowDays) {
        const phone = user.phonenumber;
        if (!phone) continue;

        const targetLanguage = user.language || "en";
        const message = `Dear ${user.name || 'User'}, your next health follow-up is scheduled on ${nextFollowupDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}. Please book your appointment at the earliest. Stay safe!`;

        const translationResult = await multilingualOutput(message, targetLanguage);
        const translatedMessage = translationResult.advice?.[0] || message;

        try {
          await sendSmsMessage(phone, translatedMessage);
          remindersSent++;
          await updateUser(user.aadhaarNumber, {
            "records.reminderStatus": new Date().toISOString()
          });
        } catch (e) {
          console.error(`Failed to send SMS to ${phone}: ${e.message}`);
        }
      }
    }

    res.json({ message: `Reminders sent to ${remindersSent} users.` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /outbreak-metrics
app.get('/outbreak-metrics', async (req, res) => {
  try {
    const usersResult = await getAllUsers();
    if (!usersResult.success) {
      return res.status(400).json({ error: usersResult.error });
    }

    const users = usersResult.data || [];
    const totalWorkers = users.length;
    let vacDose1 = 0;
    let vacDose2 = 0;
    const symptomsCount = {
      "Fever": 0, "Cough": 0, "Body Aches": 0,
      "Diarrhea": 0, "Skin Rash": 0, "Difficulty Breathing": 0
    };
    const districtCount = {};

    users.forEach(user => {
      const rec = user.records || {};
      if (rec.vaccination1) vacDose1++;
      if (rec.vaccination2) vacDose2++;

      const symptomList = rec.currentSymptoms || [];
      if (Array.isArray(symptomList)) {
        symptomList.forEach(sym => {
          const normSym = String(sym).trim().replace(/\b\w/g, c => c.toUpperCase());
          if (symptomsCount[normSym] !== undefined) {
            symptomsCount[normSym]++;
          } else {
            symptomsCount[normSym] = (symptomsCount[normSym] || 0) + 1;
          }
        });
      }

      const dest = user.destinationDistrict;
      if (dest) {
        districtCount[dest] = (districtCount[dest] || 0) + 1;
      }
    });

    const pctDose1 = totalWorkers > 0 ? (vacDose1 / totalWorkers * 100) : 0;
    const pctDose2 = totalWorkers > 0 ? (vacDose2 / totalWorkers * 100) : 0;

    let summary = "";
    let severityScore = 0;
    let outbreakFlag = false;

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `
        You are a public health AI surveillance agent in Kerala, India.
        Here is the aggregated data for migrant workers registered in the ShramiKare database:
        
        - Total Workers: ${totalWorkers}
        - Vaccinated Dose 1: ${vacDose1} (${pctDose1.toFixed(1)}%)
        - Vaccinated Dose 2: ${vacDose2} (${pctDose2.toFixed(1)}%)
        
        Symptom frequencies:
        ${JSON.stringify(symptomsCount, null, 2)}
        
        District distribution:
        ${JSON.stringify(districtCount, null, 2)}
        
        Please analyze this aggregate health profile:
        1. Summarize any potential outbreak clusters, hotspots (e.g. districts with high symptom rates), or safety concerns.
        2. Set a severity score from 0 (very safe) to 100 (severe outbreak warning).
        3. Recommend specific actions (e.g., alert local health facilities, dispatch vaccination drives, or issue alerts).
        
        Return the response as a JSON object with fields:
        - "summary" (string, under 1200 characters, markdown format)
        - "severity_score" (integer 0-100)
        - "outbreak_flag" (boolean)
        `;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        if (text.startsWith("```")) {
          text = text.split("\n").slice(1, -1).join("\n").trim();
        }
        if (text.startsWith("json")) {
          text = text.substring(4).trim();
        }
        const output = JSON.parse(text);
        summary = output.summary || "";
        severityScore = output.severity_score || 0;
        outbreakFlag = !!output.outbreak_flag;
      } catch (e) {
        console.error("Outbreak Gemini API Error:", e);
      }
    }

    if (!summary) {
      const totalSymptoms = Object.values(symptomsCount).reduce((a, b) => a + b, 0);
      const ratio = totalWorkers > 0 ? (totalSymptoms / totalWorkers) : 0;
      severityScore = Math.min(Math.floor(ratio * 75), 100);
      outbreakFlag = severityScore > 30;
      summary = `* **Surveillance Analysis**: Rule-based heuristic warning evaluation (Gemini offline).
* **Symptom Level**: ${totalSymptoms} active symptoms reported across ${totalWorkers} registered workers.
* **Risk Summary**: ${outbreakFlag ? 'High concentration of active illness reported. Outbreak screening recommended.' : 'Healthy levels. Keep monitoring district statistics.'}
* **Vaccine Coverage**: Dose 1 is at ${pctDose1.toFixed(1)}%, Dose 2 is at ${pctDose2.toFixed(1)}%. Aim for 90%+ vaccine coverage to minimize outbreaks.`;
    }

    res.json({
      success: true,
      total_workers: totalWorkers,
      vaccinated_dose1: vacDose1,
      vaccinated_dose2: vacDose2,
      pct_dose1: pctDose1,
      pct_dose2: pctDose2,
      symptoms: symptomsCount,
      districts: districtCount,
      ai_report: {
        summary,
        severity_score: severityScore,
        outbreak_flag: outbreakFlag
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /ocr-aadhaar
app.post('/ocr-aadhaar', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const prompt = `
      Extract the following details from this Aadhaar card image:
      1. Full Name
      2. Age (calculate from Year of Birth or DOB if exact age isn't present, assume current year is 2025)
      3. Aadhaar Number (12 digits)
      4. Gender (Male, Female, Other)
      
      Return ONLY a valid JSON object with the keys: "name", "age", "aadhaar_number", "gender". 
      If a field is not found, use "".
      `;
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: file.buffer.toString("base64"),
            mimeType: file.mimetype
          }
        }
      ]);
      let text = result.response.text().trim();
      if (text.startsWith("```")) {
        text = text.split("\n").slice(1, -1).join("\n").trim();
      }
      if (text.startsWith("json")) {
        text = text.substring(4).trim();
      }
      const output = JSON.parse(text);
      res.json(output);
    } else {
      res.json({
        name: "Mock Name (No API Key)",
        age: "30",
        aadhaar_number: "123456789012",
        gender: "Male"
      });
    }
  } catch (e) {
    console.error("OCR Error:", e);
    res.json({
      name: "Fallback User",
      age: "35",
      aadhaar_number: "000000000000",
      gender: "Male"
    });
  }
});

// Root check / redirect
app.get('/', (req, res) => {
  res.json({ message: "ShramiKare Node.js Serverless Backend is live!" });
});

module.exports = app;
