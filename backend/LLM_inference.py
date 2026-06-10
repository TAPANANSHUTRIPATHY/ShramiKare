import requests
import json
import dotenv
import os
dotenv.load_dotenv()
from google import genai
# from google.genai import types
from datetime import datetime, timedelta

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


# Lazy init - won't crash if no key
client = None
if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Warning: Gemini client init failed ({e})")

def predict_follow_up_date(user_data: dict) -> str:
    if not client:
        # Fallback: return a date 14 days after last visit
        print("Gemini client not initialized (missing API key). Fallback to default follow-up in 14 days.")
        last_visit_str = user_data.get('records', {}).get('lastVisitDate')
        if last_visit_str:
            try:
                last_visit = datetime.strptime(last_visit_str, "%Y-%m-%d").date()
                return str(last_visit + timedelta(days=14))
            except ValueError:
                pass
        return None

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
        return None
