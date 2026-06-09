import urllib.parse
import dotenv
import os
dotenv.load_dotenv()

#Returns html snippet, handle in frontend accordingly

def generate_qr(url=None):
    key = os.getenv("QRCODER_API_KEY")  # replace with your unique api key
    text = url  # replace with what you want to turn into a QR code

    # URL encode the text
    encoded_text = urllib.parse.quote(text)

    # Construct the API URL
    url_to_return_qrcode = f"https://www.qrcoder.co.uk/api/v4/?key={key}&text={encoded_text}"

    # print(f'<img src="{url_to_return_qrcode}" />')
    html = f'<img src="{url_to_return_qrcode}" />'
    return html

print(generate_qr("https://staging.eko.in/ekoapi/external/getAdhaarConsent"))