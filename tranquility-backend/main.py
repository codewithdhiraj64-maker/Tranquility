import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
from supabase import create_client, Client

load_dotenv()
app = FastAPI()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client | None = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)

# Allow CORS for the dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    alias: str
    email: str
    age: str
    gender: str

class AuthRequest(BaseModel):
    email: str

class ExamContext(BaseModel):
    subject: str
    days_away: int
    difficulty: str

class CheckinRequest(BaseModel):
    name: str
    email: Optional[str] = None
    mood: int
    note: str
    mood_history: List[int]
    upcoming_exams: List[ExamContext]
    streak: int
    sleep_hours: float

@app.post("/login")
async def login(req: LoginRequest):
    if supabase:
        try:
            data = {
                "alias": req.alias,
                "email": req.email,
                "age": req.age,
                "gender": req.gender
            }
            response = supabase.table("users").upsert(data, on_conflict="email").execute()
            print("Supabase user updated.")
        except Exception as e:
            print(f"Supabase Login Error: {e}")

    return {"status": "success"}

@app.post("/authenticate")
async def authenticate(req: AuthRequest):
    from fastapi import HTTPException
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        response = supabase.table("users").select("*").eq("email", req.email).execute()
        users = response.data
        if not users or len(users) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users[0]
        return {
            "status": "success",
            "alias": user.get("alias"),
            "email": user.get("email"),
            "age": user.get("age")
        }
    except Exception as e:
        print(f"Supabase Auth Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.post("/checkin")
async def checkin(req: CheckinRequest):
    if supabase and req.email:
        try:
            data = {
                "user_email": req.email,
                "mood": req.mood,
                "note": req.note,
                "sleep_hours": req.sleep_hours
            }
            supabase.table("checkins").insert(data).execute()
        except Exception as e:
            print(f"Supabase Checkin Error: {e}")

    # Try using Gemini if we have a key, otherwise use mock responses
    api_key = os.getenv("GEMINI_API_KEY")
    
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = f"User {req.name} has a mood of {req.mood}/5 today. Note: {req.note}. Give a short JSON response with: reflection, greeting, activity, nudge, breathing_rec (478, box, or calm)."
            # Minimal example of using real GenAI here, but falling back to mock for robustness
            import json
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                }
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"GenAI Error: {e}")
            pass

    # Mock Response Generator (Fallback)
    mood_labels = ["Struggling", "Low", "Okay", "Good", "Great"]
    mood_text = mood_labels[req.mood - 1] if 1 <= req.mood <= 5 else "Okay"

    reflection = f"It sounds like you're feeling {mood_text} today. Taking it one step at a time is key."
    if req.note:
        reflection += " Thanks for sharing your thoughts."

    greeting = f"Hi {req.name}, welcome back to Tranquility."
    activity = "How about a quick 5-minute walk outside?"
    nudge = "Remember to stay hydrated!"
    breathing_rec = "calm"
    
    if req.mood <= 2:
        activity = "Maybe take some time to rest and do something you love."
        breathing_rec = "box"
    elif req.mood >= 4:
        activity = "Great energy! Use this time to tackle your most important task."
        breathing_rec = "478"

    return {
        "reflection": reflection,
        "greeting": greeting,
        "activity": activity,
        "nudge": nudge,
        "breathing_rec": breathing_rec
    }

class InsightsRequest(BaseModel):
    name: str
    mood_history: List[int]
    study_history: List[int]
    sleep_hours: float
    exams: List[dict]

@app.post("/insights")
async def get_insights(req: InsightsRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    
    if api_key:
        try:
            from google import genai
            import json
            client = genai.Client(api_key=api_key)
            prompt = f"""
            User {req.name} has the following data:
            - Mood History (last 7 days, 1-5 scale): {req.mood_history}
            - Study History (hours per day, last 5 days): {req.study_history}
            - Sleep Hours: {req.sleep_hours}
            - Exams: {req.exams}
            
            Return a JSON object matching this schema exactly:
            {{
                "burnoutAssessment": {{ "score": number(0-100), "level": "Low"|"Moderate"|"High"|"Critical", "color": "var(--accent-sage)"|"var(--accent-violet)"|"var(--accent-amber)"|"var(--accent-rose)", "explanation": string, "intervention": string }},
                "patternInsight": {{ "moodDrop": number, "examSubject": string, "examDays": number, "percentBelowAverage": number, "message": string }} | null,
                "subjectAnxietyInsight": {{ "subject": string, "message": string, "technique": string }} | null,
                "recoveryPlan": [
                    {{ "day": 1, "title": string, "subject": string, "duration": string, "recovery": string, "intensity": string }},
                    {{ "day": 2, "title": string, "subject": string, "duration": string, "recovery": string, "intensity": string }},
                    {{ "day": 3, "title": string, "subject": string, "duration": string, "recovery": string, "intensity": string }}
                ]
            }}
            """
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                }
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"GenAI Insights Error: {e}")
            pass

    # Mock Fallback
    return {
        "burnoutAssessment": {
            "score": 45,
            "level": "Moderate",
            "color": "var(--accent-violet)",
            "explanation": "You’re showing some warning signs based on your sleep and study patterns.",
            "intervention": "Aim for one calmer evening routine and a slightly earlier bedtime tonight."
        },
        "patternInsight": {
            "moodDrop": 2,
            "examSubject": req.exams[0].get('subject', 'Upcoming Exam') if req.exams else "General Studies",
            "examDays": 3,
            "percentBelowAverage": 15,
            "message": f"{req.name}, your mood tends to drop slightly before big assessments. This is normal. Make sure to pace yourself."
        } if req.exams else None,
        "subjectAnxietyInsight": None,
        "recoveryPlan": [
            { "day": 1, "title": "Light reset day", "subject": "Core Concepts", "duration": "25–30 min", "recovery": "stretch break + tea", "intensity": "Light" },
            { "day": 2, "title": "Build momentum", "subject": "Urgent Topics", "duration": "35–45 min", "recovery": "Short breathing reset", "intensity": "Steady" },
            { "day": 3, "title": "Return to pace", "subject": "Main Focus", "duration": "60–75 min", "recovery": "Evening rest", "intensity": "Full pace" }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
