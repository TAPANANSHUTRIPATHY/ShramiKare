from twilio.rest import Client
import os
import dotenv
dotenv.load_dotenv()

def send_sms_message(phone: str, message: str):
    """
    Send an SMS appointment or health advisory message via Twilio API.
    
    Args:
        phone (str): Destination phone number. e.g., "+919876543210".
        message (str): The dynamic text content to send.

    Returns:
        str: Twilio message SID on success.

    Raises:
        ValueError: If Twilio credentials are missing.
        Exception: Propagates Twilio API exceptions.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_PHONE_NUMBER")

    if not all([account_sid, auth_token, from_number]):
        raise ValueError("Twilio credentials are not set in environment variables.")

    client = Client(account_sid, auth_token)
    msg = client.messages.create(
        body=message[:1200],
        from_=from_number,
        to="+91"+phone
    )
    # Log or print the SID for tracking if needed
    print(f"Twilio SMS sent: SID={msg.sid}, MESSAGE: {message}")
    return msg.sid

# send_sms_message(phone="9937080977", message="vhjecawjkcvwkvcukwvcuwvhcuvbcjhavdjcgvaskjcevwjacvhsvajcvsdj,vchjav,cvkaujhvcjahcvuakweyhvcsuakvvukuksvdukakavkuvcsaukvdckuacvkusahvcuvchjsavucukasyhvcsavahsvcdjshvbabluiwepfwpufgewgpugqiytwejnvms,mznbzbiciwbvowbsjbjnsajoijbnviohbvhsbvknsbvhbeiowabeapuibjoaubjvsjcklzjdnlskbdokvhjecawjkcvwkvcukwvcuwvhcuvbcjhavdjcgvaskjcevwjacvhsvajcvsdj,vchjav,cvkaujhvcjahcvuakweyhvcsuakvvukuksvdukakavkuvcsaukvdckuacvkusahvcuvchjsavucukasyhvcsavahsvcdjshvbabluiwepfwpufgewgpugqiytwejnvms,mznbzbiciwbvowbsjbjnsajoijbnviohbvhsbvknsbvhbeiowabeapuibjoaubjvsjcklzjdnlskbdokvhjecawjkcvwkvcukwvcuwvhcuvbcjhavdjcgvaskjcevwjacvhsvajcvsdj,vchjav,cvkaujhvcjahcvuakweyhvcsuakvvukuksvdukakavkuvcsaukvdckuacvkusahvcuvchjsavucukasyhvcsavahsvcdjshvbabluiwepfwpufgewgpugqiytwejnvms,mznbzbiciwbvowbsjbjnsajoijbnviohbvhsbvknsbvhbeiowabeapuibjoaubjvsjcklzjdnlskbdokvhjecawjkcvwkvcukwvcuwvhcuvbcjhavdjcgvaskjcevwjacvhsvajcvsdj,vchjav,cvkaujhvcjahcvuakweyhvcsuakvvukuksvdukakavkuvcsaukvdckuacvkusahvcuvchjsavucukasyhvcsavahsvcdjshvbabluiwepfwpufgewgpugqiytwejnvms,mznbzbiciwbvowbsjbjnsajoijbnviohbvhsbvknsbvhbeiowabeapuibjoaubjvsjcklzjdnlskbdokvhjecawjkcvwkvcukwvcuwvhcuvbcjhavdjcgvaskjcevwjacvhsvajcvsdj,vchjav,cvkaujhvcjahcvuakweyhvcsuakvvukuksvdukakavkuvcsaukvdckuacvkusahvcuvchjsavucukasyhvcsavahsvcdjshvbabluiwepfwpufgewgpugqiytwejnvms,mznbzbiciwbvowbsjbjnsajoijbnviohbvhsbvknsbvhbeiowabeapuibjoaubjvsjcklzjdnlskbdokvhjecawjkcvwkvcukwvcuwvhcuvbcjhavdjcgvaskjcevwjacvhsvajcvsdj,vchjav,cvkaujhvcjahcvuakweyhvcsuakvvukuksvdukakavkuvcsaukvdckuacvkusahvcuvchjsavucukasyhvcsavahsvcdjshvbabluiwepfwpufgewgpugqiytwejnvms,mznbzbiciwbvowbsjbjnsajoijbnviohbvhsbvknsbvhbeiowabeapuibjoaubjvsjcklzjdnlskbdokvhjecawjkcvwkvcukwvcuwvhcuvbcjhavdjcgvaskjcevwjacvhsvajcvsdj,vchjav,cvkaujhvcjahcvuakweyhvcsuakvvukuksvdukakavkuvcsaukvdckuacvkusahvcuvchjsavucukasyhvcsavahsvcdjshvbabluiwepfwpufgewgpugqiytwejnvms,mznbzbiciwbvowbsjbjnsajoijbnviohbvhsbvknsbvhbeiowabeapuibjoaubjvsjcklzjdnlskbdok")