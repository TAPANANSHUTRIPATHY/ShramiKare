from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import random
from datetime import datetime, timezone
from urllib.parse import urlparse, parse_qs

# Load environment variables
import dotenv
dotenv.load_dotenv()

# Add backend directory to path so we can import helper modules
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
sys.path.append(parent_dir)

# Import DB and helper operations
from DB_operations import (
    add_user, get_all_users, search_user_by_aadhaar, get_user_by_id, 
    update_user, delete_user, get_facilities_by_district, get_all_users_json, 
    store_otp, validate_otp
)
from LLM_inference import invoke_nvidia_llm
from message import send_sms_message
from translate import multilingual_output
from QR_generator import generate_qr
from google import genai

class handler(BaseHTTPRequestHandler):
    def write_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode('utf-8'))

    def write_html(self, status_code, html_content):
        self.send_response(status_code)
        self.send_header('Content-Type', 'text/html')
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(html_content.encode('utf-8'))

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def parse_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        body_bytes = self.rfile.read(content_length)
        content_type = self.headers.get('Content-Type', '')
        if 'application/json' in content_type:
            try:
                return json.loads(body_bytes.decode('utf-8'))
            except Exception:
                return {}
        elif 'application/x-www-form-urlencoded' in content_type:
            try:
                params = parse_qs(body_bytes.decode('utf-8'))
                return {k: v[0] for k, v in params.items()}
            except Exception:
                return {}
        return {}

    def parse_multipart(self, body_bytes, boundary):
        parts = body_bytes.split(boundary.encode())
        file_data = None
        content_type = None
        for part in parts:
            if b'filename=' in part:
                header_end = part.find(b'\r\n\r\n')
                if header_end != -1:
                    file_bytes = part[header_end+4:]
                    if file_bytes.endswith(b'\r\n'):
                        file_bytes = file_bytes[:-2]
                    elif file_bytes.endswith(b'\r\n--'):
                        file_bytes = file_bytes[:-4]
                    file_data = file_bytes
                    
                    for line in part[:header_end].split(b'\r\n'):
                        if line.lower().startswith(b'content-type:'):
                            content_type = line.split(b':')[1].strip().decode('utf-8')
        return file_data, content_type

    def do_GET(self):
        parsed_url = urlparse(self.path)
        # Normalize path: strip trailing slash and prefix '/api' if present
        path = parsed_url.path.rstrip('/')
        if path.startswith('/api'):
            path = path[4:]
        query_params = parse_qs(parsed_url.query)

        # GET /users
        if path == '/users':
            result = get_all_users()
            if result.get("success"):
                return self.write_json(200, result["data"])
            return self.write_json(400, {"error": result.get("error")})

        # GET /users/json
        elif path == '/users/json':
            result = get_all_users_json()
            if result.get("success"):
                try:
                    return self.write_json(200, json.loads(result["json"]))
                except Exception as e:
                    return self.write_json(500, {"error": str(e)})
            return self.write_json(400, {"error": result.get("error")})

        # GET /users/by-aadhaar/{aadhaar}
        elif path.startswith('/users/by-aadhaar/'):
            aadhaar = path.split('/')[-1]
            result = search_user_by_aadhaar(aadhaar)
            if result.get("success"):
                return self.write_json(200, result["data"])
            return self.write_json(404, {"error": result.get("error")})

        # GET /users/id/{id}
        elif path.startswith('/users/id/'):
            user_id = path.split('/')[-1]
            result = get_user_by_id(user_id)
            if result.get("success"):
                return self.write_json(200, result["data"])
            return self.write_json(404, {"error": result.get("error")})

        # GET /facilities
        elif path == '/facilities':
            district = query_params.get('district', [None])[0]
            if not district:
                return self.write_json(400, {"error": "district query param is required"})
            result = get_facilities_by_district(district)
            if not result.get("success"):
                return self.write_json(404, {"error": result.get("error")})
                
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
            return self.write_json(200, response)

        # GET /outbreak-prediction
        elif path == '/outbreak-prediction':
            # Lazy init Gemini client
            client = None
            try:
                _gemini_key = os.getenv("GEMINI_API_KEY")
                if _gemini_key:
                    client = genai.Client(api_key=_gemini_key)
            except Exception as _e:
                print("Gemini client init failed:", _e)

            if not client:
                return self.write_json(200, {"outbreak_summary": "Gemini API key missing. Outbreak surveillance offline.", "severity_score": 0})

            try:
                user_results = get_all_users()
                if not user_results.get("success") or not user_results.get("data"):
                    return self.write_json(404, {"error": "No user data found"})

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
                {"\n".join(case_lines)}

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
                        try:
                            send_sms_message(phone=number, message=alert_message)
                        except Exception as ex:
                            print(f"Failed to send outbreak alert SMS: {ex}")

                return self.write_json(200, {"outbreak_summary": output.get("summary"), "severity_score": severity})
            except Exception as e:
                return self.write_json(500, {"error": str(e)})

        # GET /generate-qr
        elif path == '/generate-qr':
            text = query_params.get('text', [None])[0]
            if not text:
                return self.write_json(400, {"error": "text query param is required"})
            try:
                html_img_tag = generate_qr(text)
                return self.write_html(200, html_img_tag)
            except Exception as e:
                return self.write_json(500, {"error": str(e)})

        # GET /send-followup-reminders
        elif path == '/send-followup-reminders':
            try:
                users_result = get_all_users()
                if not users_result.get("success") or not users_result.get("data"):
                    return self.write_json(404, {"error": "No users found"})

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

                        import asyncio
                        translation_result = asyncio.run(multilingual_output(message, target_language))
                        translated_message = translation_result.get("advice", [message])[0]

                        try:
                            send_sms_message(phone=phone, message=translated_message)
                            reminders_sent += 1
                            update_user(
                                user_id=user.get("aadhaarNumber"),
                                update_data={"records.reminderStatus": datetime.now(timezone.utc).isoformat()}
                            )
                        except Exception as e:
                            print(f"Failed to send SMS to {phone}: {e}")

                return self.write_json(200, {"message": f"Reminders sent to {reminders_sent} users."})
            except Exception as e:
                return self.write_json(500, {"error": str(e)})

        # GET /outbreak-metrics
        elif path == '/outbreak-metrics':
            try:
                users_result = get_all_users()
                if not users_result.get("success"):
                    return self.write_json(400, {"error": users_result.get("error")})

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

                _gemini_key = os.getenv("GEMINI_API_KEY")
                summary = ""
                severity_score = 0
                outbreak_flag = False

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
                        if text.startswith("```"):
                            text = text.split("\n", 1)[1].rsplit("\n", 1)[0].strip()
                        if text.startswith("json"):
                            text = text[4:].strip()
                        output = json.loads(text)
                        summary = output.get("summary", "")
                        severity_score = output.get("severity_score", 0)
                        outbreak_flag = output.get("outbreak_flag", False)
                    except Exception as e:
                        print("Outbreak Gemini API Error:", e)
                        _gemini_key = None

                if not _gemini_key:
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

                return self.write_json(200, {
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
                })
            except Exception as e:
                return self.write_json(500, {"error": str(e)})

        # Catch all / 404
        else:
            return self.write_json(404, {"error": "Not Found", "path": path})

    def do_POST(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path.rstrip('/')
        if path.startswith('/api'):
            path = path[4:]
        query_params = parse_qs(parsed_url.query)

        # POST /users
        if path == '/users':
            body = self.parse_body()
            result = add_user(body)
            if result.get("success"):
                return self.write_json(200, {"message": "Migrant created", "id": str(result["id"].id)})
            return self.write_json(400, {"error": result.get("error")})

        # POST /send-reminder
        elif path == '/send-reminder':
            body = self.parse_body()
            aadhaar_id = body.get("aadhaar_id") or query_params.get("aadhaar_id", [None])[0]
            if not aadhaar_id:
                return self.write_json(400, {"error": "aadhaar_id parameter is required"})

            user_result = search_user_by_aadhaar(aadhaar_id)
            if not user_result.get("success") or not user_result.get("data"):
                return self.write_json(404, {"error": "User not found"})

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
                return self.write_json(500, {"error": llm_response["error"]})

            advisory_message = llm_response.get("advice", ["Please follow up with nearest health facility"])[0]
            target_language = user_data.get("language", "en")

            import asyncio
            translation_result = asyncio.run(multilingual_output(advisory_message, target_language))
            advisory_message = translation_result.get("advice", [advisory_message])[0]

            phone_number = str(user_data.get("phonenumber"))
            if not phone_number:
                return self.write_json(400, {"error": "User phone number missing"})

            sms_sid = send_sms_message(phone=phone_number, message=advisory_message)
            return self.write_json(200, {"message": "Reminder sent successfully", "sms_sid": sms_sid})

        # POST /otp/generate
        elif path == '/otp/generate':
            body = self.parse_body()
            user_id = body.get("user_id") or query_params.get("user_id", [None])[0]
            if not user_id:
                return self.write_json(400, {"error": "user_id is required"})

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
                        if target_language != "en":
                            import asyncio
                            translation_result = asyncio.run(multilingual_output(otp_message, target_language))
                            translated_message = translation_result.get("advice", [otp_message])[0]
                            send_sms_message(phone=phone_number, message=translated_message)
                        else:
                            send_sms_message(phone=phone_number, message=otp_message)
                    except Exception as e:
                        print(f"SMS Send Failure: {e}")
                
                print(f"\n==================================================")
                print(f"OTP FOR Aadhaar '{user_id}': {otp}")
                print(f"==================================================\n")
                return self.write_json(200, {"message": "OTP generated", "otp": otp})
            return self.write_json(500, {"error": result.get("error")})

        # POST /otp/validate
        elif path == '/otp/validate':
            body = self.parse_body()
            user_id = body.get("user_id") or query_params.get("user_id", [None])[0]
            otp = body.get("otp") or query_params.get("otp", [None])[0]
            if not user_id or not otp:
                return self.write_json(400, {"error": "user_id and otp are required"})

            result = validate_otp(user_id, otp)
            if result.get("success"):
                return self.write_json(200, {"message": "OTP validated"})
            return self.write_json(400, {"error": result.get("error")})

        # POST /ocr-aadhaar
        elif path == '/ocr-aadhaar':
            try:
                content_type = self.headers.get('Content-Type', '')
                if 'multipart/form-data' not in content_type:
                    return self.write_json(400, {"error": "Content-Type must be multipart/form-data"})
                
                boundary_idx = content_type.find('boundary=')
                if boundary_idx == -1:
                    return self.write_json(400, {"error": "Multipart boundary not found"})
                boundary = '--' + content_type[boundary_idx + 9:]

                content_length = int(self.headers.get('Content-Length', 0))
                body_bytes = self.rfile.read(content_length)
                
                file_bytes, file_mime = self.parse_multipart(body_bytes, boundary)
                if not file_bytes:
                    return self.write_json(400, {"error": "No file uploaded or file could not be parsed"})

                _gemini_key = os.getenv("GEMINI_API_KEY")
                if _gemini_key:
                    gemini_client = genai.Client(api_key=_gemini_key)
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
                                "mime_type": file_mime or "image/jpeg",
                                "data": file_bytes
                            }
                        ]
                    )
                    text = response.text.strip()
                    if text.startswith("```"):
                        text = text.split("\n", 1)[1].rsplit("\n", 1)[0].strip()
                    if text.startswith("json"):
                        text = text[4:].strip()
                    output = json.loads(text)
                    return self.write_json(200, output)
                else:
                    return self.write_json(200, {
                        "name": "Mock Name (No API Key)",
                        "age": "30",
                        "aadhaar_number": "123456789012",
                        "gender": "Male"
                    })
            except Exception as e:
                print("OCR Error:", e)
                return self.write_json(200, {
                    "name": "Fallback User",
                    "age": "35",
                    "aadhaar_number": "000000000000",
                    "gender": "Male"
                })

        else:
            return self.write_json(404, {"error": "Not Found", "path": path})

    def do_PUT(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path.rstrip('/')
        if path.startswith('/api'):
            path = path[4:]

        # PUT /users/id/{id}
        if path.startswith('/users/id/'):
            user_id = path.split('/')[-1]
            body = self.parse_body()
            result = update_user(user_id, body)
            if result.get("success"):
                return self.write_json(200, {"message": "Migrant updated"})
            return self.write_json(404, {"error": result.get("error")})
        else:
            return self.write_json(404, {"error": "Not Found", "path": path})

    def do_DELETE(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path.rstrip('/')
        if path.startswith('/api'):
            path = path[4:]

        # DELETE /users/id/{id}
        if path.startswith('/users/id/'):
            user_id = path.split('/')[-1]
            result = delete_user(user_id)
            if result.get("success"):
                return self.write_json(200, {"message": "Migrant deleted"})
            return self.write_json(404, {"error": result.get("error")})
        else:
            return self.write_json(404, {"error": "Not Found", "path": path})
