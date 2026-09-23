import json
import os

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()

API_KEY = os.getenv("OPENAI_API_KEY")

if not API_KEY:
    raise RuntimeError("OPENAI_API_KEY is not set in the .env file.")

client = OpenAI(api_key=API_KEY)


def structure_unstructured_data(text):
    """
    Convert unstructured text into structured JSON using OpenAI.
    """

    if not text or not text.strip():
        raise ValueError("Input text cannot be empty.")

    prompt = f"""
You are the Data Structuring Engine of Data Link AI.

Your task is to convert unstructured human-readable information
into clean, structured JSON.

Rules:
1. Identify the important entities and attributes in the input.
2. Do not invent information.
3. Keep values exactly or semantically equivalent to the input.
4. Dynamically determine useful field names.
5. If information is missing, use null.
6. Return valid JSON only.
7. Use a single JSON object with:
   - "data": an object containing the structured attributes
   - "fields": an array containing the field names
   - "summary": a short explanation of what was extracted

Input:
{text}
"""

    response = client.responses.create(
        model="gpt-5.6-luna",
        input=prompt,
    )

    output = response.output_text.strip()

    try:
        result = json.loads(output)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"AI returned invalid JSON: {output}"
        ) from exc

    if not isinstance(result, dict):
        raise ValueError("AI response must be a JSON object.")

    return result
