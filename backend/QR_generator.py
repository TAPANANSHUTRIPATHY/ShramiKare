import qrcode
import io
import base64


def generate_qr(text):
    """Generate a QR code as an inline HTML <img> tag (base64 encoded, no external API needed)."""
    qr = qrcode.QRCode(version=1, box_size=6, border=2)
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#166534", back_color="white")

    # Convert to base64 PNG
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return f'<img src="data:image/png;base64,{b64}" alt="QR Code" style="width:160px;height:160px;" />'