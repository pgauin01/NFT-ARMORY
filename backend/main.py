import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Try importing LangChain - if this fails, we catch it
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.prompts import PromptTemplate
except ImportError as e:
    print(f"❌ CRITICAL ERROR: Missing Modules. Run 'pip install langchain langchain-google-genai'")
    raise e

app = FastAPI()

# --- 1. SUPER PERMISSIVE CORS SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows ALL origins (Port 5173, 3000, etc.)
    allow_credentials=True,
    allow_methods=["*"],  # Allows POST, GET, OPTIONS
    allow_headers=["*"],
)

# --- 2. API KEY SETUP (Hardcode it here just for testing) ---
# Replace this with your actual key starting with "AIza..."
MY_GOOGLE_KEY = os.getenv("MY_GOOGLE_KEY")

# Setup the AI Model
try:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro")
except Exception as e:
    print(f"❌ Error setting up Gemini: {e}")

class WeaponRequest(BaseModel):
    prompt: str

@app.post("/generate_weapon")
async def generate_weapon(request: WeaponRequest):
    print(f"🎨 Received prompt: {request.prompt}")

    if not MY_GOOGLE_KEY or "PASTE_YOUR" in MY_GOOGLE_KEY:
        raise HTTPException(status_code=500, detail="Google API Key is missing in main.py!")

    try:
        # The Prompt
        template = """
        You are a generative artist and weapon smith.
        Create a unique visual representation of a weapon based on: "{user_prompt}"
        
        Return a STRICT JSON object with these fields:
        - name: (String) Weapon name
        - description: (String) Short lore
        - level: (Integer) 1-10
        - svg: (String) VALID, MINIMALIST SVG CODE. 
          * Do NOT use '```xml' tags. 
          * The SVG must have viewBox="0 0 350 350".
          * Use vivid colors and interesting shapes (<path>, <circle>, <polygon>).
          * Keep it under 500 characters if possible (for gas savings).
          * Example format: "<svg ...><rect ... /><path d='...' /></svg>"
        
        JSON ONLY.
        """
        
        prompt = PromptTemplate(template=template, input_variables=["user_prompt"])
        chain = prompt | llm
        
        # Run AI
        response = chain.invoke({"user_prompt": request.prompt})
        
        # Cleaning the text (AI sometimes adds ```json ``` wrappers)
        clean_text = response.content.replace("```json", "").replace("```", "").strip()
        
        # Parse JSON
        weapon_data = json.loads(clean_text)
        print(f"✅ Success: {weapon_data}")
        
        return weapon_data

    except Exception as e:
        print(f"🔥 SERVER ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))