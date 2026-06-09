// ─── Demo Mode Configuration ─────────────────────────────────────────────────
// When a user clicks "Demo Login", this Aadhaar ID is stored as their session.
// Any page that detects DEMO_USER_ID falls back to DEMO_USER_DATA.
export const DEMO_USER_ID = "DEMO_1234_5678_9012";

// ─── Helper: Check if current session is demo ────────────────────────────────
export function isDemoMode() {
  return localStorage.getItem("userId") === DEMO_USER_ID;
}

// ─── Demo User Profile ────────────────────────────────────────────────────────
export const DEMO_USER_DATA = {
  name: "Ravi Kumar Das",
  age: 34,
  gender: "M",
  blood_group: "B+",
  language: "hi",
  address: "Ward No. 5, Balasore, Odisha – 756001",
  aadhaarNumber: DEMO_USER_ID,
  phonenumber: 9876543210,
  originState: "Odisha",
  originDistrict: "Balasore",
  destinationDistrict: "Ernakulam",
  workerId: "SHR/2025/ERN/00427",
  profilePhotoUrl: null, // will use default avatar
  aadhaarPhotoUrl: "/sample_aadhar.png",
  records: {
    vaccination1: true,
    vaccination2: true,
    specialNotes: "Mild hypertension – monitor BP monthly. Allergic to penicillin.",
    lastVisitReason: "Routine Health Checkup",
    lastVisitDate: "2025-11-12",
    visitLocation: "Government General Hospital, Ernakulam",
    currentSymptoms: ["headache", "weakness"],
    nextFollowUpDate: "2026-07-15",
    reminderStatus: "2025-11-12T09:30:00Z",
    outbreakFlag: false,
    healthStatus: "Active",
    registrationDate: "2024-03-01",
    aadhaarImageUrl: "/sample_aadhar.png",
  },
  companies: [
    {
      name: "Kerala Infra Builders Pvt. Ltd.",
      from: "2024-03-15",
      to: null,
      working: true,
    },
    {
      name: "Odisha Steel Works",
      from: "2022-01-10",
      to: "2024-02-28",
      working: false,
    },
  ],
};

// ─── Additional Demo Users (for future multi-user testing) ────────────────────
export const DEMO_USERS_LIST = [
  DEMO_USER_DATA,
  {
    name: "Sunita Devi Mahato",
    age: 28,
    gender: "F",
    blood_group: "O+",
    language: "hi",
    address: "Jharkhand Colony, Perumbavoor, Kerala – 683542",
    aadhaarNumber: "DEMO_9876_5432_1098",
    phonenumber: 8765432109,
    originState: "Jharkhand",
    originDistrict: "Ranchi",
    destinationDistrict: "Ernakulam",
    workerId: "SHR/2025/ERN/00512",
    profilePhotoUrl: null,
    aadhaarPhotoUrl: "/sample_aadhar.png",
    records: {
      vaccination1: true,
      vaccination2: false,
      specialNotes: "Pregnant – 7 months. Requires regular check-ups.",
      lastVisitReason: "Prenatal Checkup",
      lastVisitDate: "2026-05-20",
      visitLocation: "Perumbavoor Community Health Centre",
      currentSymptoms: ["weakness", "body pain"],
      nextFollowUpDate: "2026-06-25",
      reminderStatus: "2026-05-20T10:00:00Z",
      outbreakFlag: false,
      healthStatus: "Active",
      registrationDate: "2025-01-15",
      aadhaarImageUrl: "/sample_aadhar.png",
    },
    companies: [
      {
        name: "Perumbavoor Plywood Industries",
        from: "2025-02-01",
        to: null,
        working: true,
      },
    ],
  },
  {
    name: "Md. Iqbal Hossain",
    age: 41,
    gender: "M",
    blood_group: "A-",
    language: "as",
    address: "Silchar, Cachar, Assam – 788001",
    aadhaarNumber: "DEMO_5555_6666_7777",
    phonenumber: 7654321098,
    originState: "Assam",
    originDistrict: "Cachar",
    destinationDistrict: "Thrissur",
    workerId: "SHR/2025/TSR/00189",
    profilePhotoUrl: null,
    aadhaarPhotoUrl: "/sample_aadhar.png",
    records: {
      vaccination1: true,
      vaccination2: true,
      specialNotes: "Diabetic (Type 2) – on Metformin 500mg.",
      lastVisitReason: "Blood Sugar Monitoring",
      lastVisitDate: "2026-04-10",
      visitLocation: "Thrissur District Hospital",
      currentSymptoms: [],
      nextFollowUpDate: "2026-07-10",
      reminderStatus: "2026-04-10T11:00:00Z",
      outbreakFlag: false,
      healthStatus: "Active",
      registrationDate: "2023-08-20",
      aadhaarImageUrl: "/sample_aadhar.png",
    },
    companies: [
      {
        name: "Thrissur Metro Construction Co.",
        from: "2023-09-01",
        to: null,
        working: true,
      },
      {
        name: "NE Timber Works, Guwahati",
        from: "2020-03-15",
        to: "2023-08-15",
        working: false,
      },
    ],
  },
];

// ─── Demo Facilities (All 14 Kerala Districts) ───────────────────────────────
export const DEMO_FACILITIES = {
  Alappuzha: [
    {
      facilityName: "Alappuzha District Hospital",
      facilityType: "District Hospital",
      address: "Beach Road, Alappuzha, Kerala – 688001",
      phoneNumbers: ["0477-2252141"],
      workingHours: "24/7",
      services: ["Emergency", "OPD", "Surgery", "Maternity", "Radiology"],
      remarks: "Free treatment under NRHM for migrant workers",
    },
    {
      facilityName: "Vandanam PHC",
      facilityType: "Primary Health Centre",
      address: "Vandanam, Alappuzha, Kerala – 688005",
      phoneNumbers: ["0477-2273456"],
      workingHours: "Mon–Sat 8am–4pm",
      services: ["OPD", "Vaccination", "First Aid", "Maternal Care"],
      remarks: "Walk-in available for migrant workers",
    },
  ],
  Ernakulam: [
    {
      facilityName: "Government General Hospital, Ernakulam",
      facilityType: "Government Hospital",
      address: "Hospital Road, Ernakulam, Kerala – 682011",
      phoneNumbers: ["0484-2395510", "0484-2395511"],
      workingHours: "24/7",
      services: ["Emergency", "OPD", "Labour Ward", "Pathology", "Radiology"],
      remarks: "Free treatment for migrant workers under NRHM",
    },
    {
      facilityName: "Amrita Institute of Medical Sciences",
      facilityType: "Private Hospital",
      address: "AIMS Ponekkara, Ernakulam, Kerala – 682041",
      phoneNumbers: ["0484-2801234"],
      workingHours: "24/7",
      services: ["Cardiology", "Neurology", "Orthopaedics", "ICU", "Surgery"],
      remarks: "Empanelled under PMJAY / Ayushman Bharat",
    },
    {
      facilityName: "Perumbavoor Community Health Centre",
      facilityType: "Community Health Centre",
      address: "NH 85, Perumbavoor, Ernakulam – 683542",
      phoneNumbers: ["0484-2522701"],
      workingHours: "Mon–Sat 8am–4pm",
      services: ["OPD", "Vaccination", "Maternal Care", "First Aid"],
      remarks: "Nearest CHC for workers in industrial estates",
    },
  ],
  Idukki: [
    {
      facilityName: "Idukki District Hospital",
      facilityType: "District Hospital",
      address: "Painavu, Idukki, Kerala – 685603",
      phoneNumbers: ["04862-232223"],
      workingHours: "24/7",
      services: ["Emergency", "OPD", "Surgery", "Dental"],
      remarks: "Serves plantation workers in the highlands",
    },
  ],
  Kannur: [
    {
      facilityName: "Kannur District Hospital",
      facilityType: "District Hospital",
      address: "Fort Road, Kannur, Kerala – 670001",
      phoneNumbers: ["0497-2700120"],
      workingHours: "24/7",
      services: ["Emergency", "OPD", "Surgery", "ICU", "Maternity"],
      remarks: "Migrant worker health camp every 2nd Saturday",
    },
    {
      facilityName: "AKG Memorial Co-operative Hospital",
      facilityType: "Co-operative Hospital",
      address: "Kannur, Kerala – 670002",
      phoneNumbers: ["0497-2761414"],
      workingHours: "24/7",
      services: ["Cardiology", "Orthopaedics", "OPD", "Lab"],
      remarks: "Subsidized rates for ShramiKare ID holders",
    },
  ],
  Kasargode: [
    {
      facilityName: "Kasargode District Hospital",
      facilityType: "District Hospital",
      address: "Hospital Road, Kasargode, Kerala – 671121",
      phoneNumbers: ["04994-220335"],
      workingHours: "24/7",
      services: ["Emergency", "OPD", "Surgery", "Maternity"],
      remarks: "",
    },
  ],
  Kollam: [
    {
      facilityName: "Kollam District Hospital",
      facilityType: "District Hospital",
      address: "Chinnakkada, Kollam, Kerala – 691001",
      phoneNumbers: ["0474-2794910"],
      workingHours: "24/7",
      services: ["Emergency", "OPD", "Orthopaedics", "Surgery"],
      remarks: "Free OPD for workers with ShramiKare ID",
    },
    {
      facilityName: "Bishop Benziger Hospital",
      facilityType: "Private Hospital",
      address: "Beach Road, Kollam, Kerala – 691001",
      phoneNumbers: ["0474-2760001"],
      workingHours: "24/7",
      services: ["Multi-specialty", "Emergency", "ICU", "Lab"],
      remarks: "PMJAY empanelled",
    },
  ],
  Kottayam: [
    {
      facilityName: "Kottayam Medical College Hospital",
      facilityType: "Government Medical College",
      address: "Gandhinagar, Kottayam, Kerala – 686008",
      phoneNumbers: ["0481-2597311"],
      workingHours: "24/7",
      services: ["All specialties", "Emergency", "ICU", "OPD"],
      remarks: "Tertiary care referral centre",
    },
  ],
  Kozhikode: [
    {
      facilityName: "Kozhikode Medical College Hospital",
      facilityType: "Government Medical College",
      address: "Medical College Road, Kozhikode, Kerala – 673008",
      phoneNumbers: ["0495-2350216"],
      workingHours: "24/7",
      services: ["All specialties", "Emergency", "Trauma", "ICU"],
      remarks: "Premier referral hospital in Malabar region",
    },
    {
      facilityName: "Baby Memorial Hospital",
      facilityType: "Private Hospital",
      address: "Indira Gandhi Road, Kozhikode – 673004",
      phoneNumbers: ["0495-2723272"],
      workingHours: "24/7",
      services: ["Cardiology", "Neurology", "Oncology", "Emergency"],
      remarks: "Ayushman Bharat empanelled",
    },
  ],
  Malappuram: [
    {
      facilityName: "Malappuram District Hospital",
      facilityType: "District Hospital",
      address: "Malappuram Town, Kerala – 676505",
      phoneNumbers: ["0483-2734734"],
      workingHours: "24/7",
      services: ["Emergency", "OPD", "Surgery", "Maternity"],
      remarks: "Migrant worker vaccination drives monthly",
    },
    {
      facilityName: "MES Medical College",
      facilityType: "Medical College",
      address: "Perinthalmanna, Malappuram – 679322",
      phoneNumbers: ["04933-227771"],
      workingHours: "24/7",
      services: ["All specialties", "Emergency", "Lab", "Pharmacy"],
      remarks: "",
    },
  ],
  Palakkad: [
    {
      facilityName: "Palakkad District Hospital",
      facilityType: "District Hospital",
      address: "Palakkad Town, Kerala – 678001",
      phoneNumbers: ["0491-2522345"],
      workingHours: "24/7",
      services: ["Emergency", "OPD", "Surgery", "Dental", "Eye"],
      remarks: "Border district – serves workers from Tamil Nadu",
    },
  ],
  Pathanamthitta: [
    {
      facilityName: "Pathanamthitta General Hospital",
      facilityType: "Government Hospital",
      address: "Pathanamthitta, Kerala – 689645",
      phoneNumbers: ["0468-2222207"],
      workingHours: "24/7",
      services: ["Emergency", "OPD", "Surgery", "Maternity"],
      remarks: "",
    },
  ],
  Thiruvananthapuram: [
    {
      facilityName: "SAT Hospital, Thiruvananthapuram",
      facilityType: "Government Hospital",
      address: "Medical College Campus, Thiruvananthapuram – 695011",
      phoneNumbers: ["0471-2524274"],
      workingHours: "24/7",
      services: ["Paediatrics", "OPD", "Emergency", "Surgery"],
      remarks: "Free OPD for workers; produce ShramiKare ID",
    },
    {
      facilityName: "Neyyattinkara Taluk Hospital",
      facilityType: "Taluk Hospital",
      address: "Neyyattinkara, Thiruvananthapuram – 695121",
      phoneNumbers: ["0471-2222146"],
      workingHours: "Mon–Sat 9am–5pm",
      services: ["OPD", "Vaccination", "Blood Tests", "X-Ray"],
      remarks: "Migrant worker camp monthly health drives",
    },
  ],
  Thrissur: [
    {
      facilityName: "Thrissur District Hospital",
      facilityType: "District Hospital",
      address: "Round South, Thrissur, Kerala – 680001",
      phoneNumbers: ["0487-2424404"],
      workingHours: "24/7",
      services: ["Emergency", "OPD", "Surgery", "Maternity"],
      remarks: "",
    },
    {
      facilityName: "Jubilee Mission Medical College",
      facilityType: "Private Medical College",
      address: "Jubilee Mission, Thrissur – 680005",
      phoneNumbers: ["0487-2432200"],
      workingHours: "24/7",
      services: ["All specialties", "Emergency", "ICU", "Lab"],
      remarks: "PMJAY empanelled – subsidized for ShramiKare workers",
    },
  ],
  Wayanad: [
    {
      facilityName: "Wayanad District Hospital",
      facilityType: "District Hospital",
      address: "Kalpetta, Wayanad, Kerala – 673121",
      phoneNumbers: ["04936-202532"],
      workingHours: "24/7",
      services: ["Emergency", "OPD", "Surgery", "Dental"],
      remarks: "Serves plantation and estate workers",
    },
  ],
};

// ─── Demo QR Code HTML ────────────────────────────────────────────────────────
export const DEMO_QR_HTML = `
<div style="display:flex;align-items:center;justify-content:center;width:160px;height:160px;border:2px solid #166534;border-radius:12px;background:#f0fdf4;">
  <svg viewBox="0 0 100 100" width="140" height="140">
    <!-- QR-like pattern -->
    <rect x="5" y="5" width="25" height="25" fill="#166534" rx="3"/>
    <rect x="70" y="5" width="25" height="25" fill="#166534" rx="3"/>
    <rect x="5" y="70" width="25" height="25" fill="#166534" rx="3"/>
    <rect x="10" y="10" width="15" height="15" fill="#f0fdf4" rx="2"/>
    <rect x="75" y="10" width="15" height="15" fill="#f0fdf4" rx="2"/>
    <rect x="10" y="75" width="15" height="15" fill="#f0fdf4" rx="2"/>
    <rect x="15" y="15" width="5" height="5" fill="#166534"/>
    <rect x="80" y="15" width="5" height="5" fill="#166534"/>
    <rect x="15" y="80" width="5" height="5" fill="#166534"/>
    <!-- Data modules -->
    <rect x="35" y="5" width="5" height="5" fill="#166534"/>
    <rect x="45" y="5" width="5" height="5" fill="#166534"/>
    <rect x="55" y="10" width="5" height="5" fill="#166534"/>
    <rect x="35" y="15" width="5" height="5" fill="#166534"/>
    <rect x="50" y="15" width="5" height="5" fill="#166534"/>
    <rect x="60" y="20" width="5" height="5" fill="#166534"/>
    <rect x="40" y="25" width="5" height="5" fill="#166534"/>
    <rect x="55" y="25" width="5" height="5" fill="#166534"/>
    <rect x="5" y="35" width="5" height="5" fill="#166534"/>
    <rect x="15" y="40" width="5" height="5" fill="#166534"/>
    <rect x="25" y="35" width="5" height="5" fill="#166534"/>
    <rect x="35" y="35" width="5" height="5" fill="#166534"/>
    <rect x="45" y="40" width="5" height="5" fill="#166534"/>
    <rect x="55" y="35" width="5" height="5" fill="#166534"/>
    <rect x="65" y="40" width="5" height="5" fill="#166534"/>
    <rect x="75" y="35" width="5" height="5" fill="#166534"/>
    <rect x="85" y="40" width="5" height="5" fill="#166534"/>
    <rect x="90" y="35" width="5" height="5" fill="#166534"/>
    <rect x="10" y="45" width="5" height="5" fill="#166534"/>
    <rect x="20" y="50" width="5" height="5" fill="#166534"/>
    <rect x="30" y="45" width="5" height="5" fill="#166534"/>
    <rect x="40" y="45" width="5" height="5" fill="#166534"/>
    <rect x="50" y="50" width="5" height="5" fill="#166534"/>
    <rect x="60" y="45" width="5" height="5" fill="#166534"/>
    <rect x="70" y="50" width="5" height="5" fill="#166534"/>
    <rect x="80" y="45" width="5" height="5" fill="#166534"/>
    <rect x="5" y="55" width="5" height="5" fill="#166534"/>
    <rect x="15" y="60" width="5" height="5" fill="#166534"/>
    <rect x="25" y="55" width="5" height="5" fill="#166534"/>
    <rect x="35" y="60" width="5" height="5" fill="#166534"/>
    <rect x="45" y="55" width="5" height="5" fill="#166534"/>
    <rect x="55" y="60" width="5" height="5" fill="#166534"/>
    <rect x="65" y="55" width="5" height="5" fill="#166534"/>
    <rect x="75" y="60" width="5" height="5" fill="#166534"/>
    <rect x="85" y="55" width="5" height="5" fill="#166534"/>
    <rect x="40" y="70" width="5" height="5" fill="#166534"/>
    <rect x="50" y="75" width="5" height="5" fill="#166534"/>
    <rect x="60" y="70" width="5" height="5" fill="#166534"/>
    <rect x="70" y="70" width="5" height="5" fill="#166534"/>
    <rect x="80" y="75" width="5" height="5" fill="#166534"/>
    <rect x="90" y="70" width="5" height="5" fill="#166534"/>
    <rect x="45" y="85" width="5" height="5" fill="#166534"/>
    <rect x="55" y="80" width="5" height="5" fill="#166534"/>
    <rect x="65" y="85" width="5" height="5" fill="#166534"/>
    <rect x="75" y="80" width="5" height="5" fill="#166534"/>
    <rect x="85" y="85" width="5" height="5" fill="#166534"/>
    <rect x="90" y="90" width="5" height="5" fill="#166534"/>
  </svg>
</div>
`;

// ─── Helper: Get facilities for a district (with fallback) ────────────────────
export function getDemoFacilities(district) {
  return DEMO_FACILITIES[district] || [];
}
