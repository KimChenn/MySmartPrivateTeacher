from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import pyttsx3
import vosk
import queue
import json
import requests
import numpy as np
import sounddevice as sd
from app.UserInitializer import ProgressManager, UserManager
from openai import OpenAI
from fuzzywuzzy import fuzz
import random
import json
import os
from fastapi import FastAPI, HTTPException

# Initialize FastAPI
app = FastAPI()

API_KEY = "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"

# Add CORS Middleware for React
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (change in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize required components
client = OpenAI(api_key=API_KEY)
model_path = "./vosk-model-small-en-us-0.15" 
model = vosk.Model(model_path)
tts_engine = pyttsx3.init()
progress_manager = ProgressManager()
user_manager = UserManager()

# Request models for APIs
class LessonRequest(BaseModel):
    user: str
    subject: str

class TextToSpeechRequest(BaseModel):
    text: str
class SpeechToTextRequest(BaseModel):
    text: str

class SaveProgressRequest(BaseModel):
    user: str
    lesson: str
    response: str

def speak(text: str):
    """Convert text to speech with specific settings."""
    engine = pyttsx3.init()
    voices = engine.getProperty('voices')
    engine.setProperty('rate', 400)  # Adjust speed if needed
    engine.setProperty('voice', voices[14].id)  # Set specific voice
    engine.say(text)
    engine.runAndWait()

def fuzzy_match_number(text: str, number_map: dict):
    """Match spoken text to numbers."""
    best_match = None
    highest_score = 0
    for word, number in number_map.items():
        score = fuzz.ratio(text.lower(), word)
        if score > highest_score and score > 70:  # Threshold
            best_match = number
            highest_score = score
    return best_match

def generate_mc_question(content_item):
    prompt = f"""You are tasked with creating a multiple-choice question for a lesson.
The topic is: {content_item}.

Provide the following in JSON format:
{{
  "question": "Your question here",
  "correct_answer": "The correct answer here",
  "distractors": ["Wrong answer 1", "Wrong answer 2", "Wrong answer 3"]
}}
The question should test understanding of the topic and be moderately challenging. The correct answer must be precise and accurate. Distractors should be plausible but clearly incorrect upon deeper reflection."""

    response = call_openai_api(prompt, max_tokens=300)
    try:
        question_data = json.loads(response)
        options = [question_data["correct_answer"]] + question_data["distractors"]
        random.shuffle(options)
        return {
            "question": question_data["question"],
            "options": options,
            "correct_answer": question_data["correct_answer"]
        }
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(status_code=500, detail="Error parsing the response from the API.")

# API Endpoints
@app.post("/start_lesson")
def start_lesson(request: LessonRequest):
    """Start a lesson on a specific subject."""
    sub_subjects = generate_sub_subjects(request.subject)
    if not sub_subjects:
        raise HTTPException(status_code=400, detail="No subtopics generated for this subject.")

    # Generate lesson content for each subtopic, including multiple-choice questions
    lesson_content = [
        {
            "sub_subject": sub,
            "lesson_segment": create_teaching_segment(sub, user_age=25),
            "question_data": generate_mc_question(sub)  # Ensure question is included!
        }
        for sub in sub_subjects
    ]

    return {"lesson": lesson_content}

@app.post("/text_to_speech")
def text_to_speech(request: TextToSpeechRequest):
    """Convert lesson text to speech and play it."""
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text input cannot be empty.")
        
        speak(request.text)
        return {"message": "Speech played successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in text-to-speech: {str(e)}")
    
@app.post("/speech_to_text")
def speech_to_text(file: UploadFile = File(...)):
    """Convert speech to text."""
    audio_data = np.frombuffer(file.file.read(), dtype=np.int16)
    recognizer = vosk.KaldiRecognizer(model, 16000)
    if recognizer.AcceptWaveform(audio_data.tobytes()):
        result = json.loads(recognizer.Result())
        return {"transcription": result.get("text", "")}
    raise HTTPException(status_code=400, detail="Speech recognition failed.")

@app.post("/save_progress")
def save_progress(request: SaveProgressRequest):
    """Save user progress."""
    progress_manager.save_progress(request.user, request.lesson, request.response)
    return {"message": "Progress saved successfully"}

# File path to progress.json

PROGRESS_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../progress.json"))

@app.get("/get_progress/{user}")
def get_progress(user: str):
    """Retrieve user progress."""
    try:
        if not os.path.exists(PROGRESS_FILE):
            raise HTTPException(status_code=500, detail="Progress file not found.")

        with open(PROGRESS_FILE, "r") as file:
            data = json.load(file)

        # Debug logs to track progress
        print("User requested:", user)
        print("Data loaded from file:", data)

        # Case-insensitive user name matching
        user_key = next((key for key in data.keys() if key.lower() == user.lower()), None)
        if not user_key:
            raise HTTPException(status_code=404, detail=f"No progress found for user '{user}'.")

        # Calculate progress by topic
        progress_summary = {}
        for topic, stats in data[user_key].items():
            total_questions = stats.get("total_questions", 0)
            correct_answers = stats.get("correct_answers", 0)
            accuracy = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
            progress_summary[topic] = {
                "correct_answers": correct_answers,
                "total_questions": total_questions,
                "accuracy": round(accuracy, 1),
            }

        return {"progress": progress_summary}

    except Exception as e:
        print(f"Error while processing progress for user {user}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/ask_question")
def ask_question(user: str, question: str):
    """Answer a user's question based on the lesson content."""
    combined_content = "\n".join([
        f"Topic: {segment['sub_subject']}\n{segment['lesson_segment']}" for segment in []
    ])
    prompt = f"""
    A student asked the following question:
    "{question}"

    The lesson content is as follows:
    {combined_content}

    Provide a concise answer to the question in 2-3 sentences.
    """
    answer = call_openai_api(prompt, max_tokens=200)
    return {"answer": answer}

# Utility functions for lesson content generation
def generate_sub_subjects(subject):
    """Generate subtopics for a lesson subject."""
    prompt = f"List 5 subtopics for the subject: {subject}."
    response = call_openai_api(prompt, max_tokens=100)
    if response:
        return [line.strip() for line in response.split('\n') if line.strip()]
    return []

def create_teaching_segment(sub_subject, user_age):
    """Create a teaching segment for a subtopic."""
    prompt = f"Explain the topic '{sub_subject}' to a {user_age}-year-old student."
    return call_openai_api(prompt, max_tokens=500)

def call_openai_api(prompt, max_tokens):
    """Call OpenAI API."""
    url = 'https://api.openai.com/v1/chat/completions'
    headers = {'Content-Type': 'application/json', 'Authorization':f'Bearer {API_KEY}'}
    data = {'model': 'gpt-3.5-turbo', 'messages': [{'role': 'user', 'content': prompt}], 'max_tokens': max_tokens}
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content'].strip()
    except requests.exceptions.RequestException as e:
        print(f"OpenAI API error: {e}")
        return None
