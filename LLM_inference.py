import requests
import json
from dotenv import load_dotenv
import os
load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

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
