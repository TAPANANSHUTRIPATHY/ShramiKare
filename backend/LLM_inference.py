import requests
import json
import dotenv
import os
dotenv.load_dotenv()
from google import genai
# from google.genai import types
from datetime import datetime

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def invoke_nvidia_llm(prompt: str) -> dict:
    invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Accept": "application/json"
    }
    
    payload = {
        "model": "meta/llama-4-scout-17b-16e-instruct",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 512,
        "temperature": 0.7,
        "top_p": 0.9,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(invoke_url, headers=headers, json=payload, timeout=40)
        response.raise_for_status()
        result = response.json()
        
        # Extract and parse JSON content
        content = result['choices'][0]['message']['content']
        return json.loads(content)
    except (requests.exceptions.RequestException, json.JSONDecodeError, KeyError) as e:
        print(f"API Error: {e}")
        return {"error": "LLM processing failed"}

# def invoke_gemini(prompt: str, model: str = "gemini-2.5-flash") -> str:
#     response = client.models.generate_content(
#         model=model,
#         contents=prompt
#     )
#     return response.text.strip()


client = genai.Client(api_key=GEMINI_API_KEY)

def predict_follow_up_date(user_data: dict) -> str:
    prompt = f"""
    Patient Details:
    Name: {user_data.get('name')}
    Age: {user_data.get('age', 'N/A')}
    Blood Group: {user_data.get('blood_group', 'N/A')}
    Last Visit Date: {user_data['records'].get('lastVisitDate', 'N/A')}
    Last Visit Reason: {user_data['records'].get('lastVisitReason', 'N/A')}
    Current Symptoms: {', '.join(user_data['records'].get('currentSymptoms', []))}
    Vaccinations: vaccination1={user_data['records'].get('vaccination1')}, vaccination2={user_data['records'].get('vaccination2')}
    Special Notes: {user_data['records'].get('specialNotes', 'None')}

    Based on these details, suggest the next follow-up date in YYYY-MM-DD format.
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    # Expected output: date string in YYYY-MM-DD
    text = response.text.strip()

    # Validate date format roughly
    try:
        next_follow_up = datetime.strptime(text, "%Y-%m-%d").date()
        return str(next_follow_up)
    except ValueError:
        print(f"Unexpected response for follow-up date: {text}")
        # You may want a fallback default date here
        return None

# print(predict_follow_up_date({
#         "name": "Jane Doe",
#         "age": 57,
#         "blood_group": "A+",
#         "language": "en",
#         "gender": "M",
#         "address": "456 Avenue Name",
#         "aadhaarNumber": "9876-5432-1898",
#         "phonenumber": 7887788778,
#         "originState": "Kerala",
#         "originDistrict": "Ernakulam",
#         "destinationDistrict": "Cuttack",
#         "records": {
#             "vaccination1": True,
#             "vaccination2": True,
#             "specialNotes": "None",
#             "lastVisitReason": "Fever and cough",
#             "lastVisitDate": "2025-09-10",
#             "visitLocation": "District Hospital Ernakulam",
#             "currentSymptoms": ["fever", "cough"],
#             "nextFollowUpDate": "2025-09-24",
#             "reminderStatus": "2025-09-10T09:00:00Z",
#             "outbreakFlag": False
#         },
#         "companies": [
#             {
#                 "name": "DEF Industries",
#                 "from": "xxxxxxxxxxxxxx",
#                 "to": "2024-01-31",
#                 "working": False
#             },
#             {
#                 "name": "GHI Services",
#                 "from": "2024-02-01",
#                 "to": None,
#                 "working": True
#             }
#         ]
#     }))