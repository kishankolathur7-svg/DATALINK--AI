
import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai

load_dotenv(Path(__file__).resolve().parent / ".env")

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

if not api_key:
    raise SystemExit("ERROR: GEMINI_API_KEY is missing from backend/.env")

try:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model,
        contents="Reply with exactly: Data Link AI Gemini connection successful."
    )
    print("SUCCESS: Gemini API connection works.")
    print("Model:", model)
    print("Response:", response.text)

except Exception as error:
    print("Gemini connection failed.")
    print("Error type:", type(error).__name__)
    print("Details:", str(error))

