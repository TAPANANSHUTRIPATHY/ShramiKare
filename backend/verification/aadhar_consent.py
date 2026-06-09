import requests

url = "https://staging.eko.in/ekoapi/external/getAdhaarConsent"

headers = {"accept": "application/json"}

response = requests.get(url, headers=headers)

print(response.text)