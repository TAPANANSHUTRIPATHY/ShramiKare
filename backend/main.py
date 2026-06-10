#fastapi code here
# pyrefly: ignore [missing-import]
import dotenv
dotenv.load_dotenv()
from fastapi import FastAPI, Request, Response, status, Query, HTTPException, UploadFile, File, Form
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
    user_result = search_user_by_aadhaar(aadhaar_id)
    if not user_result.get("success") or not user_result.get("data"):
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_result["data"][0]

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

    llm_response = invoke_nvidia_llm(prompt)
    if "error" in llm_response:
        raise HTTPException(status_code=500, detail=llm_response["error"])

    advisory_message = llm_response.get("advice", ["Please follow up with nearest health facility"])[0]
    target_language = user_data.get("language", "en")
    translation_result = await multilingual_output(advisory_message, target_language)
    advisory_message = translation_result.get("advice", [advisory_message])[0]

    phone_number = str(user_data.get("phonenumber"))
    if not phone_number:
        raise HTTPException(status_code=400, detail="User phone number missing")

    sms_sid = send_sms_message(phone=phone_number, message=advisory_message)

    return {"message": "Reminder sent successfully", "sms_sid": sms_sid}


# Gemini client for outbreak prediction (lazy init - won't crash if no key)
client = None
try:
    _gemini_key = os.getenv("GEMINI_API_KEY")
    if _gemini_key:
        client = genai.Client(api_key=_gemini_key)
except Exception as _e:
    print(f"Warning: Gemini client init failed. Outbreak prediction will be disabled.")

@app.get("/outbreak-prediction/")
async def outbreak_prediction():
    if not client:
        return {"outbreak_summary": "Gemini API key missing. Outbreak surveillance offline.", "severity_score": 0}
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

        severity = output.get("severity_score", 0)
        if severity > 50:
            alert_message = f"OUTBREAK ALERT! Severity: {severity}/100\n{output.get('summary', '')}"
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
        user = search_user_by_aadhaar(user_id)
        if user.get("success") and user.get("data"):
            user_data = user["data"][0]
            target_language = user_data.get("language", "en")
            phone_number = str(user_data.get("phonenumber"))
            otp_message = f"Your OTP is: {otp}"
            try:
                if(target_language!="en"):
                    translation_result = await multilingual_output(otp_message, target_language)
                    translated_message = translation_result.get("advice", [otp_message])[0]
                    send_sms_message(phone=phone_number, message=translated_message)
                else:
                    send_sms_message(phone=phone_number, message=otp_message)
            except Exception as e:
                print(f"SMS Send Failure (normal if Twilio is not configured): {e}")
        
        print(f"\n==================================================")
        print(f"OTP FOR Aadhaar '{user_id}': {otp}")
        print(f"==================================================\n")
        return {"message": "OTP generated", "otp": otp}
    return JSONResponse(status_code=500, content={"error": result.get("error")})

@app.post("/otp/validate/")
async def check_otp(user_id: str = Form(...), otp: str = Form(...)):
    result = validate_otp(user_id, otp)
    if result.get("success"):
        return {"message": "OTP validated"}
    return JSONResponse(status_code=400, content={"error": result.get("error")})


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
                continue

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

                update_user(
                    user_id=user.get("aadhaarNumber"),
                    update_data={"records.reminderStatus": datetime.now(timezone.utc).isoformat()}
                )

        return {"message": f"Reminders sent to {reminders_sent} users."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/outbreak-metrics/")
async def get_outbreak_metrics():
    try:
        users_result = get_all_users()
        if not users_result.get("success"):
            raise HTTPException(status_code=400, detail=users_result.get("error"))
        
        users = users_result.get("data", [])
        total_workers = len(users)
        
        vac_dose1 = 0
        vac_dose2 = 0
        symptoms_count = {
            "Fever": 0, "Cough": 0, "Body Aches": 0, 
            "Diarrhea": 0, "Skin Rash": 0, "Difficulty Breathing": 0
        }
        district_count = {}
        
        for user in users:
            rec = user.get("records", {})
            if rec.get("vaccination1"):
                vac_dose1 += 1
            if rec.get("vaccination2"):
                vac_dose2 += 1
                
            symptom_list = rec.get("currentSymptoms", [])
            if isinstance(symptom_list, list):
                for sym in symptom_list:
                    # Normalize symptom name
                    norm_sym = str(sym).strip().title()
                    if norm_sym in symptoms_count:
                        symptoms_count[norm_sym] += 1
                    else:
                        symptoms_count[norm_sym] = symptoms_count.get(norm_sym, 0) + 1
            
            dest = user.get("destinationDistrict")
            if dest:
                district_count[dest] = district_count.get(dest, 0) + 1
                
        pct_dose1 = (vac_dose1 / total_workers * 100) if total_workers > 0 else 0
        pct_dose2 = (vac_dose2 / total_workers * 100) if total_workers > 0 else 0
        
        # Call Gemini model if key is set
        _gemini_key = os.getenv("GEMINI_API_KEY")
        if _gemini_key:
            try:
                gemini_client = genai.Client(api_key=_gemini_key)
                prompt = f"""
                You are a public health AI surveillance agent in Kerala, India.
                Here is the aggregated data for migrant workers registered in the ShramiKare database:
                
                - Total Workers: {total_workers}
                - Vaccinated Dose 1: {vac_dose1} ({pct_dose1:.1f}%)
                - Vaccinated Dose 2: {vac_dose2} ({pct_dose2:.1f}%)
                
                Symptom frequencies:
                {json.dumps(symptoms_count, indent=2)}
                
                District distribution:
                {json.dumps(district_count, indent=2)}
                
                Please analyze this aggregate health profile:
                1. Summarize any potential outbreak clusters, hotspots (e.g. districts with high symptom rates), or safety concerns.
                2. Set a severity score from 0 (very safe) to 100 (severe outbreak warning).
                3. Recommend specific actions (e.g., alert local health facilities, dispatch vaccination drives, or issue alerts).
                
                Return the response as a JSON object with fields:
                - "summary" (string, under 1200 characters, markdown format)
                - "severity_score" (integer 0-100)
                - "outbreak_flag" (boolean)
                """
                
                response = gemini_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                text = response.text.strip()
                # Clean code blocks markdown if present
                if text.startswith("```"):
                    text = text.split("\n", 1)[1].rsplit("\n", 1)[0].strip()
                if text.startswith("json"):
                    text = text[4:].strip()
                
                output = json.loads(text)
                summary = output.get("summary", "")
                severity_score = output.get("severity_score", 0)
                outbreak_flag = output.get("outbreak_flag", False)
            except Exception as e:
                print(f"Outbreak Gemini API Error: {e}")
                _gemini_key = None # Fallback
                
        if not _gemini_key:
            # Heuristic calculation if Gemini is not available
            total_symptoms = sum(symptoms_count.values())
            ratio = (total_symptoms / total_workers) if total_workers > 0 else 0
            severity_score = min(int(ratio * 75), 100)
            outbreak_flag = severity_score > 30
            summary = (
                f"* **Surveillance Analysis**: Rule-based heuristic warning evaluation (Gemini offline).\n"
                f"* **Symptom Level**: {total_symptoms} active symptoms reported across {total_workers} registered workers.\n"
                f"* **Risk Summary**: " + 
                ("High concentration of active illness reported. Outbreak screening recommended." if outbreak_flag else "Healthy levels. Keep monitoring district statistics.") + "\n"
                f"* **Vaccine Coverage**: Dose 1 is at {pct_dose1:.1f}%, Dose 2 is at {pct_dose2:.1f}%. Aim for 90%+ vaccine coverage to minimize outbreaks."
            )
            
        return {
            "success": True,
            "total_workers": total_workers,
            "vaccinated_dose1": vac_dose1,
            "vaccinated_dose2": vac_dose2,
            "pct_dose1": pct_dose1,
            "pct_dose2": pct_dose2,
            "symptoms": symptoms_count,
            "districts": district_count,
            "ai_report": {
                "summary": summary,
                "severity_score": severity_score,
                "outbreak_flag": outbreak_flag
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import asyncio
import base64

@app.post("/ocr-aadhaar/")
async def ocr_aadhaar(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        _gemini_key = os.getenv("GEMINI_API_KEY")
        
        if _gemini_key:
            gemini_client = genai.Client(api_key=_gemini_key)
            # Use gemini-2.5-flash for vision
            prompt = """
            Extract the following details from this Aadhaar card image:
            1. Full Name
            2. Age (calculate from Year of Birth or DOB if exact age isn't present, assume current year is 2025)
            3. Aadhaar Number (12 digits)
            4. Gender (Male, Female, Other)
            
            Return ONLY a valid JSON object with the keys: "name", "age", "aadhaar_number", "gender". 
            If a field is not found, use "".
            """
            
            response = gemini_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    prompt,
                    {
                        "mime_type": file.content_type,
                        "data": contents
                    }
                ]
            )
            
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("\n", 1)[0].strip()
            if text.startswith("json"):
                text = text[4:].strip()
                
            output = json.loads(text)
            return output
            
        else:
            # Fallback mock parsing
            return {
                "name": "Mock Name (No API Key)",
                "age": "30",
                "aadhaar_number": "123456789012",
                "gender": "Male"
            }
            
    except Exception as e:
        print(f"OCR Error: {e}")
        # Fallback in case of error
        return {
            "name": "Fallback User",
            "age": "35",
            "aadhaar_number": "000000000000",
            "gender": "Male"
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
