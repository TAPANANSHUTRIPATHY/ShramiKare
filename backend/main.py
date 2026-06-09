#fastapi code here
from fastapi import FastAPI, Request, Response, status, Query, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import requests
from fastapi import Body
from DB_operations import add_user, get_all_users, search_user_by_aadhaar, get_user_by_id, update_user, delete_user, get_facilities_by_district, get_all_users_json, store_otp, validate_otp
from LLM_inference import invoke_nvidia_llm
from message import send_sms_message
from translate import multilingual_output
import json
from google import genai
from fastapi import Form
import random
from QR_generator import generate_qr
from datetime import datetime, timezone
import os
import uvicorn

app = FastAPI(root_path="/api")
# app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/users/")
async def create_migrant(migrant: dict = Body(...)):
    result = add_user(migrant)
    if result.get("success"):
        return {"message": "Migrant created", "id": str(result["id"].id)}
    return JSONResponse(status_code=400, content={"error": result.get("error")})

@app.get("/users/")
async def list_migrants():
    result = get_all_users()
    if result.get("success"):
        return result["data"]
    return JSONResponse(status_code=400, content={"error": result.get("error")})

#get all users full data, for company wise grouping in frontend
@app.get("/users/json/")
async def list_migrants_json():
    result = get_all_users_json()
    if result.get("success"):
        return JSONResponse(content=json.loads(result["json"]))
    return JSONResponse(status_code=400, content={"error": result.get("error")})

@app.get("/users/by-aadhaar/{aadhaar_number}")
async def get_migrant_by_aadhaar(aadhaar_number: str):
    result = search_user_by_aadhaar(aadhaar_number)
    if result.get("success"):
        return result["data"]
    return JSONResponse(status_code=404, content={"error": result.get("error")})

@app.get("/users/id/{user_id}")
async def get_migrant_by_id(user_id: str):
    result = get_user_by_id(user_id)
    if result.get("success"):
        return result["data"]
    return JSONResponse(status_code=404, content={"error": result.get("error")})

@app.put("/users/id/{user_id}")
async def update_migrant(user_id: str, update_data: dict = Body(...)):
    result = update_user(user_id, update_data)
    if result.get("success"):
        return {"message": "Migrant updated"}
    return JSONResponse(status_code=404, content={"error": result.get("error")})

@app.delete("/users/id/{user_id}")
async def delete_migrant(user_id: str):
    result = delete_user(user_id)
    if result.get("success"):
        return {"message": "Migrant deleted"}
    return JSONResponse(status_code=404, content={"error": result.get("error")})

@app.get("/users/{aadhaar_id}")
async def get_migrant_records(aadhaar_id: str):
    # Query DB for migrant health records by aadhaar_id
    # If found, return records, else 404
    return {"aadhaar": aadhaar_id, "records": "Sample records here"}

@app.get("/facilities/")
async def facilities_by_district(district: str = Query(..., description="Kerala district name")):
    result = get_facilities_by_district(district)

    if not result.get("success"):
        return JSONResponse(status_code=404, content={"error": result.get("error")})

    district_name = result["district"]
    facilities = result["facilities"]

    response = {}
    for idx, facility in enumerate(facilities, start=1):
        response[f"facility_{idx}"] = {
            "district": district_name,
            "facilityName": facility.get("facilityName"),
            "phoneNumbers": facility.get("phoneNumbers", []),
            "address": facility.get("address"),
            "facilityType": facility.get("facilityType"),
            "services": facility.get("services", []),
            "workingHours": facility.get("workingHours"),
            "remarks": facility.get("remarks", "")
        }

    return response


@app.post("/send-reminder/")
async def send_reminder(aadhaar_id: str):
    # Fetch user data from DB by Aadhaar
    user_result = search_user_by_aadhaar(aadhaar_id)
    if not user_result.get("success") or not user_result.get("data"):
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_result["data"][0]  # Assuming single match

    prompt = f"""
    User Details:
    Name: {user_data['name']}
    Age: {user_data.get('age', 'N/A')}
    Blood Group: {user_data.get('blood_group', 'N/A')}
    Language: {user_data.get('language', 'en')}
    Address: {user_data['address']}
    Vaccination Status: {user_data['records']}
    Special Notes: {user_data['records'].get('specialNotes', 'None')}
    Companies Worked: {[c['name'] for c in user_data['companies']]}
    
    Based on these details, generate a brief health advisory message for reminders.
    (KEEP THE OUTPUT IN LESS THAN 1200 CHARACTERS)
    """

    # Call Nvidia LLM inference
    llm_response = invoke_nvidia_llm(prompt)
    if "error" in llm_response:
        raise HTTPException(status_code=500, detail=llm_response["error"])

    advisory_message = llm_response.get("advice", ["Please follow up with nearest health facility"])[0]
    # Translate advisory message to user's preferred language
    target_language = user_data.get("language", "en")
    translation_result = await multilingual_output(advisory_message, target_language)
    advisory_message = translation_result.get("advice", [advisory_message])[0]

    # Send SMS in user's preferred language
    phone_number = str(user_data.get("phonenumber"))
    if not phone_number:
        raise HTTPException(status_code=400, detail="User phone number missing")

    sms_sid = send_sms_message(phone=phone_number, message=advisory_message)

    return {"message": "Reminder sent successfully", "sms_sid": sms_sid}


client = genai.Client()

@app.get("/outbreak-prediction/")
async def outbreak_prediction():
    try:
        user_results = get_all_users()
        if not user_results.get("success") or not user_results.get("data"):
            raise HTTPException(status_code=404, detail="No user data found")

        user_data_list = user_results["data"]

        case_lines = []
        for user in user_data_list:
            symptoms = ", ".join(user.get("records", {}).get("currentSymptoms", [])) or "none"
            line = (f"{user.get('name', 'Unknown')}, Age: {user.get('age', 'N/A')}, "
                    f"From: {user.get('originDistrict', 'N/A')}, "
                    f"At: {user.get('destinationDistrict', 'N/A')}, "
                    f"Symptoms: {symptoms}, "
                    f"Last Visit Reason: {user.get('records', {}).get('lastVisitReason', 'N/A')}, "
                    f"Last Visit Date: {user.get('records', {}).get('lastVisitDate', 'N/A')}")
            case_lines.append(line)

        prompt = f"""
        Health Surveillance Report:

        Recent cases summary (last 7 days):
        {chr(10).join(case_lines)}

        Please analyze these cases and provide:
        1. A summary of possible outbreak patterns or clusters.
        2. A severity score between 0 and 100 (100 = highest risk).

        Return the response as a JSON object with fields "summary" and "severity_score".
        KEEP THE LENGTH WITHIN 1200 CHARACTERS
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        text = response.text.strip()
        try:
            output = json.loads(text)
        except json.JSONDecodeError:
            output = {"summary": text, "severity_score": 0}

        # Example alert logic - call only if severity > 50
        severity = output.get("severity_score", 0)
        if severity > 50:
            alert_message = f"OUTBREAK ALERT! Severity: {severity}/100\n{output.get('summary', '')}" #restrict length, and keep basic info just for show
            # Fetch or define official phone numbers here
            official_numbers = ["9330559738", "9937080977"]
            for number in official_numbers:
                send_sms_message(phone=number, message=alert_message)

        return {"outbreak_summary": output.get("summary"), "severity_score": severity}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/otp/generate/")
async def generate_otp(user_id: str = Form(...)):
    otp = str(random.randint(100000, 999999))
    result = store_otp(user_id, otp)
    if result.get("success"):
        # Translate OTP message to user's preferred language and send SMS
        user = search_user_by_aadhaar(user_id)#get_user_by_id(user_id)
        if user.get("success") and user.get("data"):
            user_data = user["data"][0]
            target_language = user_data.get("language", "en")
            phone_number = str(user_data.get("phonenumber"))
            otp_message = f"Your OTP is: {otp}"
            if(target_language!="en"):
                translation_result = await multilingual_output(otp_message, target_language)
                translated_message = translation_result.get("advice", [otp_message])[0]
                send_sms_message(phone=phone_number, message=translated_message)
            else:
                send_sms_message(phone=phone_number, message=otp_message)
        return {"message": "OTP generated", "otp": otp}
    return JSONResponse(status_code=500, content={"error": result.get("error")})

@app.post("/otp/validate/")
async def check_otp(user_id: str = Form(...), otp: str = Form(...)):
    result = validate_otp(user_id, otp)
    if result.get("success"):
        return {"message": "OTP validated"}
    return JSONResponse(status_code=400, content={"error": result.get("error")})


#GET /generate-qr/?text=https://example.com
@app.get("/generate-qr/")
async def get_qr_code(text: str = Query(..., description="Text or URL to encode as QR")):
    try:
        html_img_tag = generate_qr(text)
        return Response(content=html_img_tag, media_type="text/html")
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/send-followup-reminders/")
async def send_followup_reminders():
    try:
        users_result = get_all_users()
        if not users_result.get("success") or not users_result.get("data"):
            raise HTTPException(status_code=404, detail="No users found")

        users = users_result["data"]
        now = datetime.now(timezone.utc).date()
        reminder_window_days = 3
        reminders_sent = 0

        for user in users:
            next_followup_str = user.get("records", {}).get("nextFollowUpDate")
            if not next_followup_str:
                continue

            try:
                next_followup_str_clean = next_followup_str.strip()
                next_followup_date = datetime.strptime(next_followup_str_clean, "%Y-%m-%d").date()
            except ValueError:
                continue  # Skip invalid date format

            days_until_followup = (next_followup_date - now).days
            if 0 <= days_until_followup <= reminder_window_days:
                phone = str(user.get("phonenumber"))
                if not phone:
                    continue

                target_language = user.get("language", "en")
                message = (f"Dear {user.get('name', 'User')}, your next health follow-up is scheduled on "
                           f"{next_followup_date.strftime('%d-%b-%Y')}. Please book your appointment at the earliest. Stay safe!")

                translation_result = await multilingual_output(message, target_language)
                translated_message = translation_result.get("advice", [message])[0]

                send_sms_message(phone=phone, message=translated_message)
                reminders_sent += 1

                # Optionally update reminder status with timestamp
                update_user(
                    user_id=user.get("aadhaarNumber"),
                    update_data={"records.reminderStatus": datetime.now(timezone.utc).isoformat()}
                )

        return {"message": f"Reminders sent to {reminders_sent} users."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import asyncio

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)


#kepp in mind about async and all for running different functions, according to await and all  








# പ്രിയ ജെയ്ൻ ഡൂ, നിങ്ങളുടെ അടുത്ത ഹെൽത്ത് ഫോളോ-അപ്പ് 18-സെപ്റ്റംബർ -2025 ന് ഷെഡ്യൂൾ ചെയ്തിട്ടുണ്ട്. നിങ്ങളുടെ കൂടിക്കാഴ്ച വേഗത്തിൽ ബുക്ക് ചെയ്യുക. സുരക്ഷിതമായി തുടരുക