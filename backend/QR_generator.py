import urllib.parse
import dotenv
import os
dotenv.load_dotenv()

#Returns html snippet, handle in frontend accordingly

def generate_qr(url=None):
    text = url  # replace with what you want to turn into a QR code

    # URL encode the text
    encoded_text = urllib.parse.quote(text)

    # Construct the free API URL (requires no API key)
    url_to_return_qrcode = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encoded_text}"

    # print(f'<img src="{url_to_return_qrcode}" />')
    html = f'<img src="{url_to_return_qrcode}" alt="QR Code" />'
    return html

if __name__ == "__main__":
    print(generate_qr("https://staging.eko.in/ekoapi/external/getAdhaarConsent"))