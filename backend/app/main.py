from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import pyttsx3
import vosk
import queue
import json
import requests
import numpy as np
import sounddevice as sd
from UserInitializer import ProgressManager, UserManager
from openai import OpenAI
from fuzzywuzzy import fuzz
import random
import json
import os
from fastapi import FastAPI, HTTPException
from typing import List


# Initialize FastAPI
app = FastAPI()


PROGRESS_FILE = "progress.json"
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

# Load the Vosk model (ensure it's downloaded)
MODEL_PATH = "./vosk-model-small-en-us-0.15"  # Adjust path if needed
model = vosk.Model(MODEL_PATH)

# Define speech parameters
SAMPLE_RATE = 16000
q = queue.Queue()

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
    correct: bool  # Track whether the answer was correct

class AskQuestionRequest(BaseModel):
    user: str
    lesson: str
    question: str

def load_progress():
    """Load progress from JSON file."""
    if not os.path.exists(PROGRESS_FILE):
        return {}
    try:
        with open(PROGRESS_FILE, "r") as file:
            return json.load(file)
    except json.JSONDecodeError:
        return {}

def save_progress(data):
    """Save progress to JSON file."""
    with open(PROGRESS_FILE, "w") as file:
        json.dump(data, file, indent=4)

def speak(text: str):
    """Convert text to speech with specific settings."""
    engine = pyttsx3.init()
    voices = engine.getProperty('voices')
    engine.setProperty('rate', 400)  # Adjust speed if needed
    engine.setProperty('voice', voices[14].id)  # Set specific voice
    engine.say(text)
    engine.runAndWait()

# Load users.json
USERS_FILE = "users.json"

def load_users():
    """Load users from users.json"""
    if not os.path.exists(USERS_FILE):
        return []
    try:
        with open(USERS_FILE, "r") as file:
            return json.load(file)
    except json.JSONDecodeError:
        return []

def save_users(users):
    """Save users to users.json"""
    with open(USERS_FILE, "w") as file:
        json.dump(users, file, indent=4)


@app.post("/check_user")
async def check_user(user_data: dict):
    """Check if user exists; if not, add them"""
    name = user_data.get("name")
    age = user_data.get("age")

    if not name or not age:
        raise HTTPException(status_code=400, detail="Name and age are required")

    users = load_users()

    # Check if user already exists
    for user in users:
        if user["name"].lower() == name.lower():
            return {"exists": True}

    # If not, add the user
    new_user = {"name": name, "age": age, "hobbies": []}  # Empty hobbies for now
    users.append(new_user)
    save_users(users)

    return {"exists": False}

@app.post("/login_user")
async def login_user(user_data: dict):
    """Check if user exists in users.json"""
    name = user_data.get("name")

    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    users = load_users()

    # Check if user exists
    for user in users:
        if user["name"].lower() == name.lower():
            return {"exists": True}

    # If user is not found, return false
    return {"exists": False}


def get_user_age(user_name):
    """Retrieve the age of a user from users.json"""
    try:
        with open("users.json", "r") as f:
            users = json.load(f)
        for user in users:
            if user["name"].lower() == user_name.lower():  # Case-insensitive match
                return user["age"]
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Users file not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON format")

    raise HTTPException(status_code=404, detail="User does not exist. Please enter a valid username.")

def fuzzy_match_number(text: str):
    """Match spoken text to numbers 1-4."""
    number_map = {
        "one": 1, "two": 2, "three": 3, "four": 4}
    
    best_match = None
    highest_score = 0
    for word, number in number_map.items():
        score = fuzz.ratio(text.lower(), word)
        if score > highest_score and score > 70:  # 70% confidence threshold
            best_match = number
            highest_score = score

    return best_match

def generate_mc_question(content_item, lesson_segment):
    """Generate a multiple-choice question with an explanation for the correct answer."""
    prompt = f"""You are tasked with creating a multiple-choice question for a lesson.
    The topic is: {content_item}.
    The lesson content is as follows:
        {lesson_segment}

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

        explanation_prompt = f"""The lesson topic is: {content_item}.
        The question is: "{question_data["question"]}"

        Explain concisely in one sentence why "{question_data["correct_answer"]}" is the correct answer.
        Keep it specific to the question rather than the general lesson topic.
        """
        
        explanation = call_openai_api(explanation_prompt, max_tokens=100)

        return {
            "question": question_data["question"],
            "options": options,
            "correct_answer": question_data["correct_answer"],
            "explanation": explanation.strip() if explanation else "Explanation unavailable."
        }
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(status_code=500, detail="Error parsing the response from the API.")

# API Endpoints
@app.post("/start_lesson")
def start_lesson(request: LessonRequest):
    user_age = get_user_age(request.user)
    
    if user_age is None:
        raise HTTPException(status_code=404, detail="User not found in database")
    
    sub_subjects = generate_sub_subjects(request.subject)
    if not sub_subjects:
        raise HTTPException(status_code=400, detail="No subtopics generated for this subject.")

    lesson_content = []
    
    for sub in sub_subjects:
        lesson_segment = create_teaching_segment(sub, user_age=user_age)  # Generate lesson once

        lesson_content.append({
            "sub_subject": sub,
            "lesson_segment": lesson_segment,  # Show the same segment to the user
            "question_data": generate_mc_question(sub, lesson_segment)  # Use same segment for explanations
        })

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
    
def callback(indata, frames, time, status):
    """Audio stream callback function."""
    if status:
        print(status, flush=True)
    q.put(bytes(indata))

@app.post("/speech_to_text")
async def recognize_speech():
    """Handles speech recognition and returns a number (1-4) instead of raw text."""
    with sd.RawInputStream(samplerate=SAMPLE_RATE, blocksize=8000, dtype='int16',
                           channels=1, callback=callback):
        recognizer = vosk.KaldiRecognizer(model, SAMPLE_RATE)
        print("Listening for speech...")

        while True:
            data = q.get()
            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                recognized_text = result.get("text", "").strip()
                print(f"Recognized Speech: {recognized_text}")  # Debugging output
                
                # Match spoken text to a number (1-4)
                matched_number = fuzzy_match_number(recognized_text)
                if matched_number:
                    return {"number": matched_number}
                else:
                    return {"error": "Could not match a valid answer"}

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
def ask_question(request: AskQuestionRequest):
    #Answer a user's question based on the lesson content.

    prompt = f"""
    A student just completed a lesson on '{request.lesson}' and asked the following question:
    "{request.question}"

    Provide a clear and concise answer based on the lesson's core concepts.
    """
    
    answer = call_openai_api(prompt, max_tokens=200)

    return {"answer": answer}

@app.post("/free_speech_to_text")
async def recognize_free_speech():
    """Handles general speech recognition and returns the transcribed text."""
    with sd.RawInputStream(samplerate=SAMPLE_RATE, blocksize=8000, dtype='int16',
                           channels=1, callback=callback):
        recognizer = vosk.KaldiRecognizer(model, SAMPLE_RATE)
        print("Listening for general speech...")

        while True:
            data = q.get()
            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                recognized_text = result.get("text", "").strip()
                print(f"Recognized Speech: {recognized_text}")  # Debugging output

                return {"text": recognized_text} if recognized_text else {"error": "No speech recognized"}


@app.post("/save_progress")
def save_progress(request: SaveProgressRequest):
    """Update user progress using ProgressManager with correct incrementation."""
    
    correct_answers = 1 if request.correct else 0  #  Increment only if correct
    total_questions = 1  # Always increment total questions

    #  Use ProgressManager's method to correctly update and save progress
    progress_manager.update_user_progress(
        user_name=request.user,
        topic=request.lesson,
        correct_answers=correct_answers,
        total_questions=total_questions
    )

    return {
        "message": "Progress updated successfully",
        "progress": progress_manager.get_user_progress(request.user)
    }


@app.get("/lesson-summary/{user}/{lesson}")
def get_lesson_summary(user: str, lesson: str):
    """Retrieve lesson summary based on user and lesson name (only for the current lesson)."""
    
    progress = progress_manager.get_user_progress(user.lower())

    # Ensure progress exists for this user and lesson
    if not progress or lesson.lower() not in progress:
        raise HTTPException(status_code=404, detail="No progress found for this user and lesson.")

    # Get current lesson progress (not total progress)
    lesson_progress = progress[lesson.lower()]
    return {
        "correct_answers": lesson_progress["correct_answers"],
        "total_questions": lesson_progress["total_questions"],
        "message": f"Lesson Complete! You answered {lesson_progress['correct_answers']} questions correctly out of {lesson_progress['total_questions']}."
    }


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
