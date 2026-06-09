# make mock facility data to upload in firebase

import firebase_admin
from firebase_admin import credentials, firestore
import datetime

cred = credentials.Certificate("ps82-stellarythm-firebase-adminsdk-fbsvc-de4ed2b41c.json")
app = firebase_admin.initialize_app(cred)
db = firestore.client()

districts = [
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasargode", "Kollam",
    "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta",
    "Thiruvananthapuram", "Thrissur", "Wayanad"
]

mock_facilities = {
    "Alappuzha": [
        {
            "facilityName": "District Hospital Alappuzha",
            "phoneNumbers": ["+914771234567"],
            "address": "Main Road, Alappuzha",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency", "OPD"],
            "workingHours": "9 AM - 5 PM",
            "remarks": "24x7 Emergency available"
        },
        {
            "facilityName": "Govt PHC Alappuzha",
            "phoneNumbers": ["+914771234890"],
            "address": "Near Market, Alappuzha",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Maternal Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
    "Ernakulam": [
        {
            "facilityName": "District Hospital Ernakulam",
            "phoneNumbers": ["+914821234567", "+914821234890"],
            "address": "Main Road, Ernakulam",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency", "OPD"],
            "workingHours": "9 AM - 5 PM",
            "remarks": "24x7 Emergency available"
        },
        {
            "facilityName": "Govt Primary Health Centre",
            "phoneNumbers": ["+914821234999"],
            "address": "Near Market, Ernakulam",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Maternal Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
    "Idukki": [
        {
            "facilityName": "District Hospital Idukki",
            "phoneNumbers": ["+914861234567"],
            "address": "Main Road, Idukki",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency"],
            "workingHours": "8 AM - 6 PM",
            "remarks": "Ambulance available"
        },
        {
            "facilityName": "Govt PHC Idukki",
            "phoneNumbers": ["+914861234890"],
            "address": "Near Bus Stand, Idukki",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Child Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
    "Kannur": [
        {
            "facilityName": "District Hospital Kannur",
            "phoneNumbers": ["+914972345678"],
            "address": "Main Road, Kannur",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency", "OPD"],
            "workingHours": "9 AM - 5 PM",
            "remarks": "24x7 Emergency available"
        },
        {
            "facilityName": "Govt PHC Kannur",
            "phoneNumbers": ["+914972349012"],
            "address": "Near Market, Kannur",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Maternal Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
    "Kasargode": [
        {
            "facilityName": "District Hospital Kasargode",
            "phoneNumbers": ["+914992345678"],
            "address": "Main Road, Kasargode",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency"],
            "workingHours": "9 AM - 5 PM",
            "remarks": "Ambulance available"
        },
        {
            "facilityName": "Govt PHC Kasargode",
            "phoneNumbers": ["+914992349012"],
            "address": "Near Market, Kasargode",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Maternal Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
    "Kollam": [
        {
            "facilityName": "District Hospital Kollam",
            "phoneNumbers": ["+914742345678"],
            "address": "Main Road, Kollam",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency", "OPD"],
            "workingHours": "9 AM - 5 PM",
            "remarks": "24x7 Emergency available"
        },
        {
            "facilityName": "Govt PHC Kollam",
            "phoneNumbers": ["+914742349012"],
            "address": "Near Market, Kollam",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Maternal Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
    "Kottayam": [
        {
            "facilityName": "District Hospital Kottayam",
            "phoneNumbers": ["+914812345678"],
            "address": "Main Road, Kottayam",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency"],
            "workingHours": "9 AM - 5 PM",
            "remarks": "Ambulance available"
        },
        {
            "facilityName": "Govt PHC Kottayam",
            "phoneNumbers": ["+914812349012"],
            "address": "Near Market, Kottayam",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Maternal Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
    "Kozhikode": [
        {
            "facilityName": "District Hospital Kozhikode",
            "phoneNumbers": ["+914922345678"],
            "address": "Main Road, Kozhikode",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency", "OPD"],
            "workingHours": "9 AM - 5 PM",
            "remarks": "24x7 Emergency available"
        },
        {
            "facilityName": "Govt PHC Kozhikode",
            "phoneNumbers": ["+914922349012"],
            "address": "Near Market, Kozhikode",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Maternal Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
    "Malappuram": [
        {
            "facilityName": "District Hospital Malappuram",
            "phoneNumbers": ["+914832345678"],
            "address": "Main Road, Malappuram",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency"],
            "workingHours": "9 AM - 5 PM",
            "remarks": "Ambulance available"
        },
        {
            "facilityName": "Govt PHC Malappuram",
            "phoneNumbers": ["+914832349012"],
            "address": "Near Market, Malappuram",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Maternal Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
    "Palakkad": [
        {
            "facilityName": "District Hospital Palakkad",
            "phoneNumbers": ["+914922345679"],
            "address": "Main Road, Palakkad",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency", "OPD"],
            "workingHours": "9 AM - 5 PM",
            "remarks": "24x7 Emergency available"
        },
        {
            "facilityName": "Govt PHC Palakkad",
            "phoneNumbers": ["+914922349013"],
            "address": "Near Market, Palakkad",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Maternal Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
    "Pathanamthitta": [
        {
            "facilityName": "District Hospital Pathanamthitta",
            "phoneNumbers": ["+914622345678"],
            "address": "Main Road, Pathanamthitta",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency"],
            "workingHours": "9 AM - 5 PM",
            "remarks": "Ambulance available"
        },
        {
            "facilityName": "Govt PHC Pathanamthitta",
            "phoneNumbers": ["+914622349012"],
            "address": "Near Market, Pathanamthitta",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Maternal Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
    "Thiruvananthapuram": [
        {
            "facilityName": "District Hospital Thiruvananthapuram",
            "phoneNumbers": ["+914712345678"],
            "address": "Main Road, Thiruvananthapuram",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency", "OPD"],
            "workingHours": "9 AM - 5 PM",
            "remarks": "24x7 Emergency available"
        },
        {
            "facilityName": "Govt PHC Thiruvananthapuram",
            "phoneNumbers": ["+914712349012"],
            "address": "Near Market, Thiruvananthapuram",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Maternal Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
    "Thrissur": [
        {
            "facilityName": "District Hospital Thrissur",
            "phoneNumbers": ["+914872345678"],
            "address": "Main Road, Thrissur",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency"],
            "workingHours": "9 AM - 5 PM",
            "remarks": "Ambulance available"
        },
        {
            "facilityName": "Govt PHC Thrissur",
            "phoneNumbers": ["+914872349012"],
            "address": "Near Market, Thrissur",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Maternal Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
    "Wayanad": [
        {
            "facilityName": "District Hospital Wayanad",
            "phoneNumbers": ["+914932345678"],
            "address": "Main Road, Wayanad",
            "facilityType": "Hospital",
            "services": ["General Medicine", "Emergency", "OPD"],
            "workingHours": "9 AM - 5 PM",
            "remarks": "24x7 Emergency available"
        },
        {
            "facilityName": "Govt PHC Wayanad",
            "phoneNumbers": ["+914932349012"],
            "address": "Near Market, Wayanad",
            "facilityType": "Primary Health Centre",
            "services": ["Vaccination", "Maternal Care"],
            "workingHours": "9 AM - 4 PM",
            "remarks": ""
        }
    ],
}

for district in districts:
    doc_data = {
        "districtName": district,
        "lastUpdated": datetime.datetime.utcnow().isoformat() + "Z",
        "healthFacilities": mock_facilities[district]
    }
    db.collection("facility").document(district).set(doc_data)
    print(f"Updated data for district: {district}")