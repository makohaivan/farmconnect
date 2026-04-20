"""
FarmConnect — Gemini API Client

Central place where we configure and call the Gemini API.
All AI features import from here — so if we ever switch
AI providers, we only change this one file.

Free tier limits:
  - 15 requests per minute
  - 1,500 requests per day
  - 1 million tokens per day

That is more than enough for an educational project.
"""
import json
import requests
from django.conf import settings


def call_gemini(prompt, system_instruction=None, expect_json=False, max_tokens=1024):
    """
    Call the Gemini 2.5 Flash API with a prompt.

    Args:
        prompt           : The user message / question
        system_instruction: Optional context/role for Gemini
        expect_json      : If True, tells Gemini to respond in JSON only
        max_tokens       : Maximum tokens in the response

    Returns:
        str — the response text from Gemini
        OR dict — if expect_json=True and parsing succeeds

    Raises:
        Exception if the API call fails
    """
    api_key = settings.GEMINI_API_KEY

    if not api_key:
        raise Exception(
            "GEMINI_API_KEY is not set. "
            "Add it to your .env file. "
            "Get a free key at https://aistudio.google.com"
        )

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={api_key}"
    )

    # Build the request body
    contents = [{"parts": [{"text": prompt}], "role": "user"}]

    body = {
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature":     0.7,
        }
    }

    # Add system instruction if provided
    if system_instruction:
        body["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    # Tell Gemini to respond in JSON if needed
    if expect_json:
        body["generationConfig"]["responseMimeType"] = "application/json"

    response = requests.post(url, json=body, timeout=30)

    if response.status_code != 200:
        raise Exception(
            f"Gemini API error {response.status_code}: {response.text}"
        )

    data = response.json()

    # Extract text from response
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        raise Exception(f"Unexpected Gemini response format: {data}")

    # Parse JSON if requested
    if expect_json:
        try:
            # Strip markdown code fences if present
            clean = text.strip()
            if clean.startswith("```"):
                clean = clean.split("```")[1]
                if clean.startswith("json"):
                    clean = clean[4:]
            return json.loads(clean.strip())
        except json.JSONDecodeError:
            # Return raw text if JSON parsing fails
            return {"raw": text}

    return text.strip()


def call_gemini_chat(messages, system_instruction=None):
    """
    Multi-turn chat with Gemini.
    messages is a list of { role: 'user'|'model', content: '...' }
    """
    api_key = settings.GEMINI_API_KEY

    if not api_key:
        raise Exception("GEMINI_API_KEY is not set.")

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={api_key}"
    )

    # Convert our format to Gemini format
    contents = [
        {
            "role":  msg["role"],   # 'user' or 'model'
            "parts": [{"text": msg["content"]}]
        }
        for msg in messages
    ]

    body = {
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": 1024,
            "temperature":     0.8,
        }
    }

    if system_instruction:
        body["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    response = requests.post(url, json=body, timeout=30)

    if response.status_code != 200:
        raise Exception(
            f"Gemini API error {response.status_code}: {response.text}"
        )

    data = response.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError):
        raise Exception(f"Unexpected Gemini response: {data}")
