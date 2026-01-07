import os
try:
    from dotenv import load_dotenv
    load_dotenv()  # loads variables from backend/.env
    print("✅ Loaded .env file.")
except Exception:
    print("⚠️ python-dotenv not installed, proceeding with environment variables only.")

# Read the key from environment (or .env)
MY_KEY = os.getenv("MY_KEY")
if not MY_KEY:
    print("❌ ERROR: MY_KEY not found in environment or .env file.")
    exit(1)
os.environ["GOOGLE_API_KEY"] = MY_KEY

print("✅ Key set. Importing LangChain...")

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    print("✅ Import successful.")
except ImportError:
    print("❌ ERROR: LangChain is not installed correctly.")
    exit()

print("🤖 Asking AI a test question...")

try:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro")
    response = llm.invoke("Say 'Hello Gamer'")
    print(f"✅ AI Responded: {response.content}")
except Exception as e:
    print(f"❌ CRITICAL AI ERROR: {e}")