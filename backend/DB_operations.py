# CRUD operaions here

import firebase_admin
from firebase_admin import credentials, firestore
from LLM_inference import predict_follow_up_date
import json
from datetime import datetime, timedelta

import os

service_account_path = os.path.join(os.path.dirname(__file__), "ps82-stellarythm-firebase-adminsdk-fbsvc-de4ed2b41c.json")
if not os.path.exists(service_account_path):
    raise FileNotFoundError(f"Service account file not found: {service_account_path}")

cred = credentials.Certificate(service_account_path)
app = firebase_admin.initialize_app(cred)
db = firestore.client()


def add_user(data):
    """
    Adds a new user document to the 'users' collection in the database.

    Schema for `data` argument:
        {
            "name": str,
            "age": int,
            "blood_group": str,
            "address": str,
            "aadhaarNumber": str,
            "phonenumber": int,
            "originState": str,
            "originDistrict": str,
            "destinationDistrict": str,
            "records": {
                "vaccination1": bool,
                "vaccination2": bool,
                "specialNotes": str
            },
            "companies": [
                {
                    "name": str,
                    "from": str (YYYY-MM-DD),
                    "to": Optional[str] (YYYY-MM-DD or None),
                    "working": bool
                },
                ...
            ]
        }

    Args:
        data (dict): A dictionary containing user information to be added to the database.

    Returns:
        dict: A dictionary indicating the success status of the operation.
            If successful, returns {"success": True, "id": <update_time>}, where <update_time> is the update time of the document.
            If failed, returns {"success": False, "error": <error_message>}, where <error_message> is the exception message.
    """

    try:
        doc_ref = db.collection('users').add(data)
        return {"success": True, "id": doc_ref[1]}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_user_by_id(user_id):
    """
    Retrieves a user document from the 'users' collection by user ID.

    Args:
        user_id (str): The unique document ID of the user.

    Returns:
        dict: If successful, returns {"success": True, "data": <user_data_dict>}, where <user_data_dict> is the user document.
            If not found, returns {"success": False, "error": "User not found"}.
            If failed, returns {"success": False, "error": <error_message>}.
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

    Args:
        user_id (str): The unique document ID of the user to update.
        update_data (dict): A dictionary containing the fields to update.

    Returns:
        dict: If successful, returns {"success": True}.
            If not found, returns {"success": False, "error": "User not found"}.
            If failed, returns {"success": False, "error": <error_message>}.
    """
    try:
        doc_ref = db.collection('users').document(user_id)
        doc = doc_ref.get()
        if doc.exists:
            # Check if lastVisitDate is being updated
            records_update = update_data.get("records", {})
            if "lastVisitDate" in records_update:
                # Get current user data for prediction
                user_data = doc.to_dict()
                # Merge update_data into user_data for accurate prediction
                user_data["records"] = {**user_data.get("records", {}), **records_update}
                # Predict next follow-up date
                next_follow_up = predict_follow_up_date(user_data)
                if next_follow_up:
                    records_update["nextFollowUpDate"] = next_follow_up
                    update_data["records"] = records_update
            doc_ref.update(update_data)
            return {"success": True}
        else:
            return {"success": False, "error": "User not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def delete_user(user_id):
    """
    Deletes a user document from the 'users' collection by user ID.

    Args:
        user_id (str): The unique document ID of the user to delete.

    Returns:
        dict: If successful, returns {"success": True}.
            If not found, returns {"success": False, "error": "User not found"}.
            If failed, returns {"success": False, "error": <error_message>}.
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

    Returns:
        dict: If successful, returns {"success": True, "data": <user_list>}, where <user_list> is a list of user documents with their IDs.
            If failed, returns {"success": False, "error": <error_message>}.
    """
    try:
        users = db.collection('users').stream()
        user_list = [{**doc.to_dict(), "id": doc.id} for doc in users]
        return {"success": True, "data": user_list}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_all_users_json():
    """
    Retrieves all user documents from the 'users' collection and returns them as a JSON string.

    Returns:
        dict: If successful, returns {"success": True, "json": <json_string>}, where <json_string> is the JSON representation of all users.
            If failed, returns {"success": False, "error": <error_message>}.
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
    Searches for a user document in the 'users' collection by Aadhaar number.

    Args:
        aadhaar_number (str): The Aadhaar number to search for.

    Returns:
        dict: If successful, returns {"success": True, "data": <user_list>}, where <user_list> is a list of matching user documents with their IDs.
            If failed, returns {"success": False, "error": <error_message>}.
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

    Args:
        district (str): The name of the district.

    Returns:
        dict: If successful, returns {"success": True, "district": <district_name>, "facilities": <facilities_list>}.
            If not found, returns {"success": False, "error": "No facilities found for district '<district>'"}.
            If failed, returns {"success": False, "error": <error_message>}.
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

    Args:
        user_id (str): The user's document ID.
        otp (str): The OTP to store.
        validity_minutes (int): Minutes until OTP expires.

    Returns:
        dict: Success status.
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

    Args:
        user_id (str): The user's document ID.
        entered_otp (str): The OTP to validate.

    Returns:
        dict: Success status.
    """
    try:
        doc_ref = db.collection("otps").document(user_id)
        doc = doc_ref.get()
        if not doc.exists:
            return {"success": False, "error": "OTP record not found"}
        otp_history = doc.to_dict().get("otpHistory", [])
        now = datetime.utcnow().isoformat()
        for record in reversed(otp_history):
            if record["otp"] == entered_otp:
                if record["status"] == "active" and record["expiresAt"] > now:
                    record["status"] = "used"
                    doc_ref.update({"otpHistory": otp_history})
                    return {"success": True}
                return {"success": False, "error": "OTP expired or already used"}
        return {"success": False, "error": "OTP not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}



#below code will be used for testing and will only run from this file
def main():
    # Example data
    user_dataa = {
    "name": "Jane Doe",
    "age": 57,
    "blood_group": "A+",
    "language": "en",
    "gender": "M",
    "address": "456 Avenue Name",
    "aadhaarNumber": "9876-5432-1898",
    "phonenumber": 7887788778,
    "originState": "Kerala",
    "originDistrict": "Ernakulam",
    "destinationDistrict": "Cuttack",
    "records": {
        "vaccination1": True,
        "vaccination2": True,
        "specialNotes": "None",
        "lastVisitReason": "Fever and cough",
        "lastVisitDate": "2025-09-10",
        "visitLocation": "District Hospital Ernakulam",
        "currentSymptoms": ["fever", "cough"],
        "nextFollowUpDate": "2025-09-24",
        "reminderStatus": "2025-09-10T09:00:00Z",
        "outbreakFlag": False
    },
    "companies": [
        {
            "name": "DEF Industries",
            "from": "xxxxxxxxxxxxxx",
            "to": "2024-01-31",
            "working": False
        },
        {
            "name": "GHI Services",
            "from": "2024-02-01",
            "to": None,
            "working": True
        }
    ],

    "aadhaarPhotoUrl": "https://storage.googleapis.com/bucket/aadhaar_jane_doe.jpg",
    "profilePhotoUrl": "https://avatar.iran.liara.run/public/",
}

    # Add user
    add_result = add_user(user_dataa)
    print("Add User Result:", add_result)

    if add_result.get("success"):
        # Get all users
        all_users = get_all_users()
        print("All Users:", all_users)

        # Get user by ID
        user_id = add_result["id"].id      #add_result["id"].path.split("/")[-1]
        # print(user_id,"++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

        if user_id:
            get_result = get_user_by_id(user_id)
            print("Get User Result:", get_result)

            # Update user
            update_data = {"address": "789 New Address"}
            update_result = update_user(user_id, update_data)
            print("Update User Result:", update_result)

            # Search user by Aadhaar number
            search_result = search_user_by_aadhaar(user_dataa["aadhaarNumber"])
            print("Search User by Aadhaar Result:", search_result)

            # Delete user
            # delete_result = delete_user(user_id)
            # print("Delete User Result:", delete_result)
        else:
            print("Could not determine user ID for further operations.")
    else:
        print("User addition failed, skipping further operations.")

if __name__ == "__main__":
    main()
    store_otp("cfxfnCXG4jSOAGL0nVzE",123456)
    #validate_otp("cfxfnCXG4jSOAGL0nVzE", 1236)
    validate_otp("cfxfnCXG4jSOAGL0nVzE", 123456)