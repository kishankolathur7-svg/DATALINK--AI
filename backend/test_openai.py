
import os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# Load the backend/.env file
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

api_key = os.getenv("OPENAI_API_KEY")
model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

if not api_key or api_key == "your_actual_api_key":
    print("ERROR: OpenAI API key is missing in backend/.env")
    raise SystemExit(1)

try:
    client = OpenAI(api_key=api_key)

    response = client.responses.create(
        model=model,
        input="Reply with exactly: Data Link AI connection successful."
    )

    print("SUCCESS: OpenAI API connection works.")
    print("Model:", model)
    print("Response:", response.output_text)

except Exception as error:
    print("OpenAI connection failed.")
    print("Error type:", type(error).__name__)
    print("Details:", str(error))
