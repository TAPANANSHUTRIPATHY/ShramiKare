import string
from googletrans import Translator

async def multilingual_output(text: str, target_language: str = "en") -> dict:
    """
    translate health advisory text to user's preferred language.

    Args:
        text (str): The original advice text in English or any language.
        target_language (str): Destination language code (e.g., 'ml' for Malayalam).

    Returns:
        dict: {
            "advice": [translated_text],
            "language": detected_source_lang
        }
        On failure, returns advice with error message and same target language.
    """
    try:
        async with Translator() as translator:
            translation = await translator.translate(text, dest=target_language)
            translated_text = translation.text
            # Clean translated text by stripping trailing/leading punctuation & whitespace
            clean_text = translated_text.strip(string.punctuation + string.whitespace)
            detected_language = translation.src
            return {"advice": [clean_text], "language": detected_language}
    except Exception as e:
        return {"advice": [f"Translation error: {str(e)}"], "language": target_language}
    

# Example usage:
if __name__=="__main__":
    import asyncio
    result = asyncio.run(multilingual_output("Stay hydrated!", "ml"))    #output - {'advice': ['ജലാംശം തുടരുക'], 'language': 'en'}
    print(result)