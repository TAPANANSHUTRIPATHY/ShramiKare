const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const credPath = path.join(__dirname, 'shramikare-firebase-adminsdk-fbsvc-647c7c6f4e.json');
console.log("Reading credentials from file:", credPath);
const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));

console.log("Private key length:", creds.private_key.length);
console.log("Does private key contain literal \\n (escaped)?", creds.private_key.includes('\\n'));
console.log("Does private key contain real newlines?", creds.private_key.includes('\n'));

// Let's replace literal \\n with real newlines just in case!
const privateKey = creds.private_key.replace(/\\n/g, '\n');
console.log("Sanitized private key starts with:", privateKey.substring(0, 30));

admin.initializeApp({
  credential: admin.credential.cert({
    ...creds,
    private_key: privateKey
  })
});
console.log("Firebase initialized successfully!");

const db = admin.firestore();
db.collection('users').limit(1).get()
  .then(snapshot => {
    console.log("Successfully queried users! Doc count:", snapshot.size);
    process.exit(0);
  })
  .catch(err => {
    console.error("Query failed:", err);
    process.exit(1);
  });
