"""
seed_demo_data.py
─────────────────
Pushes demo users and facility data into Firebase Firestore.

Usage:
    python seed_demo_data.py          # Only adds data that doesn't exist yet
    python seed_demo_data.py --force  # Overwrites existing data
"""

import firebase_admin
from firebase_admin import credentials, firestore
import os
import glob
import sys
import datetime

# ── Firebase Init ──────────────────────────────────────────────────────────────
backend_dir = os.path.dirname(os.path.abspath(__file__))
firebase_jsons = glob.glob(os.path.join(backend_dir, "*firebase-adminsdk*.json"))

if firebase_jsons:
    service_account_path = firebase_jsons[0]
elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
    service_account_path = os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
else:
    print("❌ ERROR: No Firebase service account JSON found in backend/ folder.")
    print("   Download it from: Firebase Console → Project Settings → Service Accounts")
    sys.exit(1)

print(f"🔑 Using credentials: {os.path.basename(service_account_path)}")

if not firebase_admin._apps:
    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ── Flags ──────────────────────────────────────────────────────────────────────
FORCE = "--force" in sys.argv

# ═════════════════════════════════════════════════════════════════════════════════
#  DEMO USERS
# ═════════════════════════════════════════════════════════════════════════════════

DEMO_USERS = [
    {
        "name": "Ravi Kumar Das",
        "age": 34,
        "gender": "M",
        "blood_group": "B+",
        "language": "hi",
        "address": "Ward No. 5, Balasore, Odisha – 756001",
        "aadhaarNumber": "DEMO_1234_5678_9012",
        "phonenumber": 9876543210,
        "originState": "Odisha",
        "originDistrict": "Balasore",
        "destinationDistrict": "Ernakulam",
        "workerId": "SHR/2025/ERN/00427",
        "profilePhotoUrl": "https://avatar.iran.liara.run/public/boy",
        "aadhaarPhotoUrl": "/sample_aadhar.png",
        "records": {
            "vaccination1": True,
            "vaccination2": True,
            "specialNotes": "Mild hypertension – monitor BP monthly. Allergic to penicillin.",
            "lastVisitReason": "Routine Health Checkup",
            "lastVisitDate": "2025-11-12",
            "visitLocation": "Government General Hospital, Ernakulam",
            "currentSymptoms": ["headache", "weakness"],
            "nextFollowUpDate": "2026-07-15",
            "reminderStatus": "2025-11-12T09:30:00Z",
            "outbreakFlag": False,
            "healthStatus": "Active",
            "registrationDate": "2024-03-01",
            "aadhaarImageUrl": "/sample_aadhar.png",
        },
        "companies": [
            {
                "name": "Kerala Infra Builders Pvt. Ltd.",
                "from": "2024-03-15",
                "to": None,
                "working": True,
            },
            {
                "name": "Odisha Steel Works",
                "from": "2022-01-10",
                "to": "2024-02-28",
                "working": False,
            },
        ],
    },
    {
        "name": "Sunita Devi Mahato",
        "age": 28,
        "gender": "F",
        "blood_group": "O+",
        "language": "hi",
        "address": "Jharkhand Colony, Perumbavoor, Kerala – 683542",
        "aadhaarNumber": "DEMO_9876_5432_1098",
        "phonenumber": 8765432109,
        "originState": "Jharkhand",
        "originDistrict": "Ranchi",
        "destinationDistrict": "Ernakulam",
        "workerId": "SHR/2025/ERN/00512",
        "profilePhotoUrl": "https://avatar.iran.liara.run/public/girl",
        "aadhaarPhotoUrl": "/sample_aadhar.png",
        "records": {
            "vaccination1": True,
            "vaccination2": False,
            "specialNotes": "Pregnant – 7 months. Requires regular check-ups.",
            "lastVisitReason": "Prenatal Checkup",
            "lastVisitDate": "2026-05-20",
            "visitLocation": "Perumbavoor Community Health Centre",
            "currentSymptoms": ["weakness", "body pain"],
            "nextFollowUpDate": "2026-06-25",
            "reminderStatus": "2026-05-20T10:00:00Z",
            "outbreakFlag": False,
            "healthStatus": "Active",
            "registrationDate": "2025-01-15",
            "aadhaarImageUrl": "/sample_aadhar.png",
        },
        "companies": [
            {
                "name": "Perumbavoor Plywood Industries",
                "from": "2025-02-01",
                "to": None,
                "working": True,
            },
        ],
    },
    {
        "name": "Md. Iqbal Hossain",
        "age": 41,
        "gender": "M",
        "blood_group": "A-",
        "language": "as",
        "address": "Silchar, Cachar, Assam – 788001",
        "aadhaarNumber": "DEMO_5555_6666_7777",
        "phonenumber": 7654321098,
        "originState": "Assam",
        "originDistrict": "Cachar",
        "destinationDistrict": "Thrissur",
        "workerId": "SHR/2025/TSR/00189",
        "profilePhotoUrl": "https://avatar.iran.liara.run/public/boy",
        "aadhaarPhotoUrl": "/sample_aadhar.png",
        "records": {
            "vaccination1": True,
            "vaccination2": True,
            "specialNotes": "Diabetic (Type 2) – on Metformin 500mg.",
            "lastVisitReason": "Blood Sugar Monitoring",
            "lastVisitDate": "2026-04-10",
            "visitLocation": "Thrissur District Hospital",
            "currentSymptoms": [],
            "nextFollowUpDate": "2026-07-10",
            "reminderStatus": "2026-04-10T11:00:00Z",
            "outbreakFlag": False,
            "healthStatus": "Active",
            "registrationDate": "2023-08-20",
            "aadhaarImageUrl": "/sample_aadhar.png",
        },
        "companies": [
            {
                "name": "Thrissur Metro Construction Co.",
                "from": "2023-09-01",
                "to": None,
                "working": True,
            },
            {
                "name": "NE Timber Works, Guwahati",
                "from": "2020-03-15",
                "to": "2023-08-15",
                "working": False,
            },
        ],
    },
]

# ═════════════════════════════════════════════════════════════════════════════════
#  DEMO FACILITIES (All 14 Kerala districts)
# ═════════════════════════════════════════════════════════════════════════════════

DEMO_FACILITIES = {
    "Alappuzha": [
        {
            "facilityName": "District Hospital Alappuzha",
            "phoneNumbers": ["+914771234567"],
            "address": "Beach Road, Alappuzha, Kerala – 688001",
            "facilityType": "District Hospital",
            "services": ["Emergency", "OPD", "Surgery", "Maternity", "Radiology"],
            "workingHours": "24/7",
            "remarks": "Free treatment under NRHM for migrant workers",
        },
        {
            "facilityName": "Vandanam PHC",
            "phoneNumbers": ["+914772273456"],
            "address": "Vandanam, Alappuzha, Kerala – 688005",
            "facilityType": "Primary Health Centre",
            "services": ["OPD", "Vaccination", "First Aid", "Maternal Care"],
            "workingHours": "Mon–Sat 8am–4pm",
            "remarks": "Walk-in available for migrant workers",
        },
    ],
    "Ernakulam": [
        {
            "facilityName": "Government General Hospital, Ernakulam",
            "phoneNumbers": ["0484-2395510", "0484-2395511"],
            "address": "Hospital Road, Ernakulam, Kerala – 682011",
            "facilityType": "Government Hospital",
            "services": ["Emergency", "OPD", "Labour Ward", "Pathology", "Radiology"],
            "workingHours": "24/7",
            "remarks": "Free treatment for migrant workers under NRHM",
        },
        {
            "facilityName": "Amrita Institute of Medical Sciences",
            "phoneNumbers": ["0484-2801234"],
            "address": "AIMS Ponekkara, Ernakulam, Kerala – 682041",
            "facilityType": "Private Hospital",
            "services": ["Cardiology", "Neurology", "Orthopaedics", "ICU", "Surgery"],
            "workingHours": "24/7",
            "remarks": "Empanelled under PMJAY / Ayushman Bharat",
        },
        {
            "facilityName": "Perumbavoor Community Health Centre",
            "phoneNumbers": ["0484-2522701"],
            "address": "NH 85, Perumbavoor, Ernakulam – 683542",
            "facilityType": "Community Health Centre",
            "services": ["OPD", "Vaccination", "Maternal Care", "First Aid"],
            "workingHours": "Mon–Sat 8am–4pm",
            "remarks": "Nearest CHC for workers in industrial estates",
        },
    ],
    "Idukki": [
        {
            "facilityName": "District Hospital Idukki",
            "phoneNumbers": ["04862-232223"],
            "address": "Painavu, Idukki, Kerala – 685603",
            "facilityType": "District Hospital",
            "services": ["Emergency", "OPD", "Surgery", "Dental"],
            "workingHours": "24/7",
            "remarks": "Serves plantation workers in the highlands",
        },
    ],
    "Kannur": [
        {
            "facilityName": "District Hospital Kannur",
            "phoneNumbers": ["0497-2700120"],
            "address": "Fort Road, Kannur, Kerala – 670001",
            "facilityType": "District Hospital",
            "services": ["Emergency", "OPD", "Surgery", "ICU", "Maternity"],
            "workingHours": "24/7",
            "remarks": "Migrant worker health camp every 2nd Saturday",
        },
        {
            "facilityName": "AKG Memorial Co-operative Hospital",
            "phoneNumbers": ["0497-2761414"],
            "address": "Kannur, Kerala – 670002",
            "facilityType": "Co-operative Hospital",
            "services": ["Cardiology", "Orthopaedics", "OPD", "Lab"],
            "workingHours": "24/7",
            "remarks": "Subsidized rates for ShramiKare ID holders",
        },
    ],
    "Kasargode": [
        {
            "facilityName": "District Hospital Kasargode",
            "phoneNumbers": ["04994-220335"],
            "address": "Hospital Road, Kasargode, Kerala – 671121",
            "facilityType": "District Hospital",
            "services": ["Emergency", "OPD", "Surgery", "Maternity"],
            "workingHours": "24/7",
            "remarks": "",
        },
    ],
    "Kollam": [
        {
            "facilityName": "District Hospital Kollam",
            "phoneNumbers": ["0474-2794910"],
            "address": "Chinnakkada, Kollam, Kerala – 691001",
            "facilityType": "District Hospital",
            "services": ["Emergency", "OPD", "Orthopaedics", "Surgery"],
            "workingHours": "24/7",
            "remarks": "Free OPD for workers with ShramiKare ID",
        },
        {
            "facilityName": "Bishop Benziger Hospital",
            "phoneNumbers": ["0474-2760001"],
            "address": "Beach Road, Kollam, Kerala – 691001",
            "facilityType": "Private Hospital",
            "services": ["Multi-specialty", "Emergency", "ICU", "Lab"],
            "workingHours": "24/7",
            "remarks": "PMJAY empanelled",
        },
    ],
    "Kottayam": [
        {
            "facilityName": "Kottayam Medical College Hospital",
            "phoneNumbers": ["0481-2597311"],
            "address": "Gandhinagar, Kottayam, Kerala – 686008",
            "facilityType": "Government Medical College",
            "services": ["All specialties", "Emergency", "ICU", "OPD"],
            "workingHours": "24/7",
            "remarks": "Tertiary care referral centre",
        },
    ],
    "Kozhikode": [
        {
            "facilityName": "Kozhikode Medical College Hospital",
            "phoneNumbers": ["0495-2350216"],
            "address": "Medical College Road, Kozhikode, Kerala – 673008",
            "facilityType": "Government Medical College",
            "services": ["All specialties", "Emergency", "Trauma", "ICU"],
            "workingHours": "24/7",
            "remarks": "Premier referral hospital in Malabar region",
        },
        {
            "facilityName": "Baby Memorial Hospital",
            "phoneNumbers": ["0495-2723272"],
            "address": "Indira Gandhi Road, Kozhikode – 673004",
            "facilityType": "Private Hospital",
            "services": ["Cardiology", "Neurology", "Oncology", "Emergency"],
            "workingHours": "24/7",
            "remarks": "Ayushman Bharat empanelled",
        },
    ],
    "Malappuram": [
        {
            "facilityName": "District Hospital Malappuram",
            "phoneNumbers": ["0483-2734734"],
            "address": "Malappuram Town, Kerala – 676505",
            "facilityType": "District Hospital",
            "services": ["Emergency", "OPD", "Surgery", "Maternity"],
            "workingHours": "24/7",
            "remarks": "Migrant worker vaccination drives monthly",
        },
        {
            "facilityName": "MES Medical College",
            "phoneNumbers": ["04933-227771"],
            "address": "Perinthalmanna, Malappuram – 679322",
            "facilityType": "Medical College",
            "services": ["All specialties", "Emergency", "Lab", "Pharmacy"],
            "workingHours": "24/7",
            "remarks": "",
        },
    ],
    "Palakkad": [
        {
            "facilityName": "District Hospital Palakkad",
            "phoneNumbers": ["0491-2522345"],
            "address": "Palakkad Town, Kerala – 678001",
            "facilityType": "District Hospital",
            "services": ["Emergency", "OPD", "Surgery", "Dental", "Eye"],
            "workingHours": "24/7",
            "remarks": "Border district – serves workers from Tamil Nadu",
        },
    ],
    "Pathanamthitta": [
        {
            "facilityName": "Pathanamthitta General Hospital",
            "phoneNumbers": ["0468-2222207"],
            "address": "Pathanamthitta, Kerala – 689645",
            "facilityType": "Government Hospital",
            "services": ["Emergency", "OPD", "Surgery", "Maternity"],
            "workingHours": "24/7",
            "remarks": "",
        },
    ],
    "Thiruvananthapuram": [
        {
            "facilityName": "SAT Hospital, Thiruvananthapuram",
            "phoneNumbers": ["0471-2524274"],
            "address": "Medical College Campus, Thiruvananthapuram – 695011",
            "facilityType": "Government Hospital",
            "services": ["Paediatrics", "OPD", "Emergency", "Surgery"],
            "workingHours": "24/7",
            "remarks": "Free OPD for workers; produce ShramiKare ID",
        },
        {
            "facilityName": "Neyyattinkara Taluk Hospital",
            "phoneNumbers": ["0471-2222146"],
            "address": "Neyyattinkara, Thiruvananthapuram – 695121",
            "facilityType": "Taluk Hospital",
            "services": ["OPD", "Vaccination", "Blood Tests", "X-Ray"],
            "workingHours": "Mon–Sat 9am–5pm",
            "remarks": "Migrant worker camp monthly health drives",
        },
    ],
    "Thrissur": [
        {
            "facilityName": "Thrissur District Hospital",
            "phoneNumbers": ["0487-2424404"],
            "address": "Round South, Thrissur, Kerala – 680001",
            "facilityType": "District Hospital",
            "services": ["Emergency", "OPD", "Surgery", "Maternity"],
            "workingHours": "24/7",
            "remarks": "",
        },
        {
            "facilityName": "Jubilee Mission Medical College",
            "phoneNumbers": ["0487-2432200"],
            "address": "Jubilee Mission, Thrissur – 680005",
            "facilityType": "Private Medical College",
            "services": ["All specialties", "Emergency", "ICU", "Lab"],
            "workingHours": "24/7",
            "remarks": "PMJAY empanelled – subsidized for ShramiKare workers",
        },
    ],
    "Wayanad": [
        {
            "facilityName": "District Hospital Wayanad",
            "phoneNumbers": ["04936-202532"],
            "address": "Kalpetta, Wayanad, Kerala – 673121",
            "facilityType": "District Hospital",
            "services": ["Emergency", "OPD", "Surgery", "Dental"],
            "workingHours": "24/7",
            "remarks": "Serves plantation and estate workers",
        },
    ],
}


# ═════════════════════════════════════════════════════════════════════════════════
#  SEED FUNCTIONS
# ═════════════════════════════════════════════════════════════════════════════════

def seed_users():
    """Push demo users to Firestore 'users' collection."""
    print("\n📋 Seeding USERS...")
    users_ref = db.collection("users")

    for user in DEMO_USERS:
        aadhaar = user["aadhaarNumber"]

        # Check if user already exists (by aadhaarNumber)
        existing = users_ref.where("aadhaarNumber", "==", aadhaar).limit(1).stream()
        existing_list = list(existing)

        if existing_list and not FORCE:
            print(f"   ⏭️  Skipping {user['name']} (already exists, use --force to overwrite)")
            continue

        if existing_list and FORCE:
            # Delete existing then re-add
            for doc in existing_list:
                doc.reference.delete()
            print(f"   🗑️  Deleted existing record for {user['name']}")

        users_ref.add(user)
        print(f"   ✅ Added: {user['name']} (Aadhaar: {aadhaar})")

    print(f"   📊 Total demo users in DB: {len(list(users_ref.stream()))}")


def seed_facilities():
    """Push demo facilities to Firestore 'facility' collection."""
    print("\n🏥 Seeding FACILITIES...")
    facility_ref = db.collection("facility")

    for district, facilities in DEMO_FACILITIES.items():
        doc_ref = facility_ref.document(district)
        doc = doc_ref.get()

        if doc.exists and not FORCE:
            print(f"   ⏭️  Skipping {district} (already exists, use --force to overwrite)")
            continue

        doc_data = {
            "districtName": district,
            "lastUpdated": datetime.datetime.utcnow().isoformat() + "Z",
            "healthFacilities": facilities,
        }
        doc_ref.set(doc_data)
        print(f"   ✅ Added: {district} ({len(facilities)} facilities)")

    print(f"   📊 Total districts in DB: {len(list(facility_ref.stream()))}")


# ═════════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═════════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 60)
    print("  ShramiKare — Demo Data Seeder")
    print("=" * 60)

    if FORCE:
        print("⚠️  FORCE mode: will overwrite existing data")

    seed_users()
    seed_facilities()

    print("\n" + "=" * 60)
    print("  ✅ Seeding complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Start backend:  uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
    print("  2. Test:           curl http://localhost:8000/api/users/")
    print("  3. Frontend:       npm run dev  (in frontend/ShramiKare)")
