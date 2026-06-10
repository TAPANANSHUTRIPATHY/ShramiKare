# CRUD operaions here

import firebase_admin
from firebase_admin import credentials, firestore
from LLM_inference import predict_follow_up_date
import json
from datetime import datetime, timedelta

import os
import glob
import json

# Firebase credential loading - supports env var (for Render) or local JSON file
_render_secret_path = "/etc/secrets/shramikare-firebase-adminsdk.json"
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_firebase_jsons = glob.glob(os.path.join(_backend_dir, "*firebase-adminsdk*.json"))

_firebase_credentials_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")

if not firebase_admin._apps:
    if _firebase_credentials_json:
        # Load from environment variable (preferred for Render)
        cred_dict = json.loads(_firebase_credentials_json)
        cred = credentials.Certificate(cred_dict)
    elif os.path.exists(_render_secret_path):
        cred = credentials.Certificate(_render_secret_path)
    elif _firebase_jsons:
        cred = credentials.Certificate(_firebase_jsons[0])
    elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        cred = credentials.Certificate(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])
    else:
        raise FileNotFoundError(
            "No Firebase credentials found. Set FIREBASE_CREDENTIALS_JSON env var."
        )
    app = firebase_admin.initialize_app(cred)
else:
    app = firebase_admin.get_app()
db = firestore.client()



def add_user(data):
    """
    Adds a new user document to the 'users' collection in the database.
    """
    try:
        doc_ref = db.collection('users').add(data)
        return {"success": True, "id": doc_ref[1]}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_user_by_id(user_id):
    """
    Retrieves a user document from the 'users' collection by user ID.
    """
    try:
        doc = db.collection('users').document(user_id).get()
        if doc.exists:
            return {"success": True, "data": doc.to_dict()}
        else:
            return {"success": False, "error": "User not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def update_user(user_id, update_data):
    """
    Updates an existing user document in the 'users' collection.
    If 'records.lastVisitDate' is updated, predicts and sets 'records.nextFollowUpDate'.
    """
    try:
        doc_ref = db.collection('users').document(user_id)
        doc = doc_ref.get()
        if not doc.exists:
            # Fallback: Search by Aadhaar number
            query = db.collection('users').where('aadhaarNumber', '==', user_id).stream()
            docs = list(query)
            if docs:
                doc_ref = docs[0].reference
                doc = docs[0]
            else:
                return {"success": False, "error": "User not found"}
        
        # Check if lastVisitDate is being updated
        records_update = update_data.get("records", {})
        if "lastVisitDate" in records_update:
            user_data = doc.to_dict()
            user_data["records"] = {**user_data.get("records", {}), **records_update}
            next_follow_up = predict_follow_up_date(user_data)
            if next_follow_up:
                records_update["nextFollowUpDate"] = next_follow_up
                update_data["records"] = records_update
        doc_ref.update(update_data)
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}


def delete_user(user_id):
    """
    Deletes a user document from the 'users' collection by user ID.
    """
    try:
        doc_ref = db.collection('users').document(user_id)
        if doc_ref.get().exists:
            doc_ref.delete()
            return {"success": True}
        else:
            return {"success": False, "error": "User not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_all_users():
    """
    Retrieves all user documents from the 'users' collection.
    """
    try:
        users = db.collection('users').stream()
        user_list = [{**doc.to_dict(), "id": doc.id} for doc in users]
        return {"success": True, "data": user_list}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_all_users_json():
    """
    Retrieves all user documents as a JSON string.
    """
    try:
        users = db.collection('users').stream()
        user_list = [{**doc.to_dict(), "id": doc.id} for doc in users]
        json_string = json.dumps(user_list, default=str)
        return {"success": True, "json": json_string}
    except Exception as e:
        return {"success": False, "error": str(e)}


def search_user_by_aadhaar(aadhaar_number):
    """
    Searches for a user document by Aadhaar number.
    """
    try:
        query = db.collection('users').where('aadhaarNumber', '==', aadhaar_number).stream()
        results = [{**doc.to_dict(), "id": doc.id} for doc in query]
        return {"success": True, "data": results}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_facilities_by_district(district):
    """
    Retrieves health facilities for a given district from the 'facility' collection.
    """
    try:
        doc_ref = db.collection("facility").document(district)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            facilities = data.get("healthFacilities", [])
            facility_info = []
            for facility in facilities:
                info = {
                    "facilityName": facility.get("facilityName"),
                    "phoneNumbers": facility.get("phoneNumbers", []),
                    "address": facility.get("address"),
                    "facilityType": facility.get("facilityType"),
                    "services": facility.get("services", []),
                    "workingHours": facility.get("workingHours"),
                    "remarks": facility.get("remarks", "")
                }
                facility_info.append(info)
            return {
                "success": True,
                "district": data.get("districtName"),
                "facilities": facility_info
            }
        else:
            return {"success": False, "error": f"No facilities found for district '{district}'"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def store_otp(user_id, otp, validity_minutes=10):
    """
    Stores an OTP for a user in the 'otps' collection with validity and status.
    """
    try:
        doc_ref = db.collection("otps").document(user_id)
        now = datetime.utcnow()
        new_otp_record = {
            "otp": otp,
            "createdAt": now.isoformat(),
            "expiresAt": (now + timedelta(minutes=validity_minutes)).isoformat(),
            "status": "active"
        }
        doc = doc_ref.get()
        if doc.exists:
            otp_history = doc.to_dict().get("otpHistory", [])
            otp_history.append(new_otp_record)
            doc_ref.update({"otpHistory": otp_history})
        else:
            doc_ref.set({"otpHistory": [new_otp_record]})
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

def validate_otp(user_id, entered_otp):
    """
    Validates an entered OTP for a user.
    """
    try:
        doc_ref = db.collection("otps").document(user_id)
        doc = doc_ref.get()
        if not doc.exists:
            return {"success": False, "error": "OTP record not found"}
        otp_history = doc.to_dict().get("otpHistory", [])
        now = datetime.utcnow().isoformat()
        entered_otp_str = str(entered_otp)
        for record in reversed(otp_history):
            record_otp_str = str(record["otp"])
            if record_otp_str == entered_otp_str:
                if record["status"] == "active" and record["expiresAt"] > now:
                    record["status"] = "used"
                    doc_ref.update({"otpHistory": otp_history})
                    return {"success": True}
                return {"success": False, "error": "OTP expired or already used"}
        return {"success": False, "error": "OTP not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    print("DB_operations module loaded successfully.")
