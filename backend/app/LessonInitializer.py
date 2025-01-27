import requests
import json
import random
import sys
import sounddevice as sd
import queue
import json
import vosk
from UserInitializer import UserManager
from UserInitializer import ProgressManager
from openai import OpenAI
import pyttsx3
from fuzzywuzzy import fuzz

client = OpenAI(api_key="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")

class LessonInitializer:
    def __init__(self, user, api_key):
        self.user = user
        self.api_key = api_key
        self.progress_manager = ProgressManager()  # Initialize ProgressManager
        self.tts_engine = pyttsx3.init()  # Initialize text-to-speech engine
        self.model = vosk.Model("/Users/ohadhacham/Desktop/idea_to_app/MySmartPrivateTeacher/backend/app/vosk-model-small-en-us-0.15")  # Path to Vosk model directory
        self.q = queue.Queue()
        self.samplerate = 16000
        self.number_map = {"one": 1, "two": 2, "three": 3, "four": 4}

    def speak(self, text):
        engine = pyttsx3.init()
    
        voices = engine.getProperty('voices')
        engine.setProperty('rate', 400)  # Adjust speed if needed
        engine.setProperty('voice', voices[14].id) 
        engine.say(text)
        engine.runAndWait()

    def callback(self, indata, frames, time, status):
        if status:
            print(status, file=sys.stderr)
        self.q.put(bytes(indata))

    def fuzzy_match_number(self, text):
        """Uses fuzzy matching to find the closest number word."""
        best_match = None
        highest_score = 0
        for word, number in self.number_map.items():
            score = fuzz.ratio(text.lower(), word)
            if score > highest_score and score > 70:  # Set a threshold for accuracy
                best_match = number
                highest_score = score
        return best_match
    
    def recognize_speech(self):
        with sd.RawInputStream(samplerate=self.samplerate, blocksize=8000, device=None,
                               dtype='int16', channels=1, callback=self.callback):
            recognizer = vosk.KaldiRecognizer(self.model, self.samplerate)
            recognizer.SetMaxAlternatives(6)  # Enable recognition of homophones
            print("Say the number (1-4):")
            while True:
                data = self.q.get()
                if recognizer.AcceptWaveform(data):
                    result = json.loads(recognizer.Result())
                    print(f"Raw recognition result: {result}")  # Debugging print
                    if 'alternatives' in result:
                        for alternative in result['alternatives']:
                            text = alternative['text'].strip()
                            print(f"Recognized alternative: {text}")  # Debugging print
                            if text.isdigit() and 1 <= int(text) <= 4:
                                return int(text)
                            fuzzy_number = self.fuzzy_match_number(text)
                            if fuzzy_number:
                                return fuzzy_number
                    print("Invalid response, please say a number between 1 and 4.")

    def recognize_speech_text(self):
        """Recognizes free-form speech for user questions."""
        with sd.RawInputStream(samplerate=self.samplerate, blocksize=8000, device=None,
                               dtype='int16', channels=1, callback=self.callback):
            recognizer = vosk.KaldiRecognizer(self.model, self.samplerate)
            print("Speak now...")
            while True:
                data = self.q.get()
                if recognizer.AcceptWaveform(data):
                    result = json.loads(recognizer.Result())
                    print(f"Recognized speech: {result}")  # Debugging print
                    return result.get("text", "").strip()

    def initialize_lesson(self, subject):
        sub_subjects = self.generate_sub_subjects(subject)

        if not sub_subjects:
            print("No subtopics could be generated.")
            return ""

        correct_count = 0  # Counter for correct answers
        wrong_count = 0    # Counter for wrong answers

        all_segments = []  # Store all lesson segments for reference

        for sub_subject in sub_subjects:
            lesson_segment = self.create_teaching_segment(sub_subject)
            mc_question = self.generate_mc_question(sub_subject)

            all_segments.append({"sub_subject": sub_subject, "lesson_segment": lesson_segment})

            print(f"\n* {sub_subject}\n")  # Prints only the segment title
            self.speak(f"Topic: {sub_subject}")  # Speak the segment title

            print(lesson_segment)  # Prints the generated lesson content
            self.speak(lesson_segment)  # Speak the lesson content

            print("\nQuestion: " + mc_question["question"])
            self.speak("Question: " + mc_question["question"])  # Speak the question

            for idx, option in enumerate(mc_question["options"], 1):
                print(f"{idx}. {option}")
                self.speak(f"Option {idx}: {option}")  # Speak each option

            correct_index = mc_question["options"].index(mc_question["correct_answer"]) + 1
            print("Say your answer now...")
            user_answer = self.recognize_speech()

            if user_answer == correct_index:
                print("Correct! Let's move on.\n")
                self.speak("Correct! Let's move on.")
                correct_count += 1  # Increment correct counter
            else:
                correct_answer = mc_question["correct_answer"]
                explanations = self.generate_explanations(mc_question["options"], correct_answer, sub_subject, lesson_segment)
                print(f"Incorrect. The correct answer was {correct_index}: {correct_answer}.")
                self.speak(f"Incorrect. The correct answer was {correct_index}: {correct_answer}.")

                print("Explanation:")
                self.speak("Here is the explanation.")

                for idx, option in enumerate(mc_question["options"], 1):
                    explanation = explanations.get(option, "Explanation unavailable.")
                    print(f"- {option}: {explanation}")
                    self.speak(f"Option {idx}: {explanation}")

                wrong_count += 1  # Increment wrong counter

            print("=" * 80 + "\n")
            input("Press Enter to continue to the next segment...\n")

        # Display final results
        print(f"\nLesson Complete! Here are your results:")
        self.speak("Lesson Complete! Here are your results.")

        print(f"Correct Answers: {correct_count}")
        self.speak(f"You answered {correct_count} questions correctly.")

        print(f"Wrong Answers: {wrong_count}")
        self.speak(f"You answered {wrong_count} questions incorrectly.")

        # Update progress
        self.progress_manager.update_user_progress(
            user_name=self.user.name,
            topic=subject,
            correct_answers=correct_count,
            total_questions=correct_count + wrong_count
        )
        print("Your progress has been updated and saved!")
        self.speak("Your progress has been updated and saved.")

        # Allow the student to ask questions after the lesson
        print("\nYou can now ask questions about the lesson. Say 'exit' to finish.")
        self.speak("You can now ask questions about the lesson. Say 'exit' to finish.")

        while True:
            self.speak("What is your question?")
            student_question = self.recognize_speech_text()
            if student_question.lower() == "exit":
                print("Thank you for participating! Goodbye!")
                self.speak("Thank you for participating! Goodbye!")
                break
            answer = self.generate_answer_to_question(student_question,all_segments)
            print(f"Answer: {answer}")
            self.speak(f"Answer: {answer}")

    def generate_mc_question(self, content_item):
        prompt = f"""You are tasked with creating a multiple-choice question for a lesson.
The topic is: {content_item}.

Provide the following in JSON format:
{{
  "question": "Your question here",
  "correct_answer": "The correct answer here",
  "distractors": ["Wrong answer 1", "Wrong answer 2", "Wrong answer 3"]
}}
The question should test understanding of the topic and be moderately challenging. The correct answer must be precise and accurate. Distractors should be plausible but clearly incorrect upon deeper reflection."""

        response = self._call_openai_api(prompt, max_tokens=300)
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
            print("Error parsing the response from the API. Generating fallback question.")
            return {None}

    def generate_answer_to_question(self, student_question, all_segments):
        combined_content = "\n\n".join([f"Topic: {segment['sub_subject']}\n{segment['lesson_segment']}" for segment in all_segments])
        prompt = f"""
        A student asked the following question:
        "{student_question}"

        The lesson content is as follows:
        {combined_content}

        Provide a clear and concise answer to the student's question in 2-3 sentences.
        """
        response = self._call_openai_api(prompt, max_tokens=200)
        return response.strip() if response else "I'm sorry, I couldn't generate an answer to your question."

    def generate_explanations(self, options, correct_answer, content_item, lesson_segment):
        explanations = {}
        for option in options:
            if option == correct_answer:
                prompt = f"""The topic is: {content_item}.
                        The lesson content is as follows:
                        {lesson_segment}

                        Explain concisely in one sentence why \"{option}\" is the correct answer."""
            else:
                prompt = f"""The topic is: {content_item}.
                        The lesson content is as follows:
                        {lesson_segment}

                        Explain concisely in one sentence why \"{option}\" is incorrect in the context of the lesson content."""
            response = self._call_openai_api(prompt, max_tokens=100)
            explanations[option] = response.strip() if response else "Explanation unavailable."
        return explanations

    def generate_sub_subjects(self, subject):
        prompt = f"""
        List exactly 5 specific sub-topics for the subject "{subject}". 
        Each sub-topic must be formatted as a separate item using '*' as a delimiter.
        Do NOT provide explanations, summaries, introductions, or commentary. 
        Just list the subtopics.

        Example response:
        * MacOS Overview
        * MacBook Hardware
        * Mac Software Applications
        * Mac Troubleshooting
        * Mac Security
        """

        response = self._call_openai_api(prompt, max_tokens=100)

        if response:
            sub_subjects = response.split('*')  # Splitting properly using ''
            return [sub.strip() for sub in sub_subjects if sub.strip()]  # Cleaning up empty items
        return []

    def create_teaching_segment(self, content_item):
        age = self.user.age
        prompt = f"""
        You are an expert educator explaining the topic of *{content_item}* to a {age}-year-old student.
    
        ### *Guidelines for Response:*
        - Use a *friendly, natural, and engaging tone*.
        - *DO NOT start with greetings* like "Hey there!" or "Let's get started!".
        - *DO NOT introduce the topic with an unnecessary build-up*—jump straight into the content.
        - Keep explanations *clear, slightly casual, and interesting* without sounding too robotic or too formal.
        - You may use light, natural phrasing, but *avoid overusing exclamations* or excessive excitement.
        - The response should be *informative and engaging without unnecessary fluff*.
        """
        return self._call_openai_api(prompt, max_tokens=1000)

    def _call_openai_api(self, prompt, max_tokens):
        try:
            url = 'https://api.openai.com/v1/chat/completions'
            headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {self.api_key}'}
            data = {'model': 'gpt-3.5-turbo', 'messages': [{'role': 'user', 'content': prompt}], 'max_tokens': max_tokens}
            response = requests.post(url, headers=headers, data=json.dumps(data))
            response.raise_for_status()
            return response.json()['choices'][0]['message']['content'].strip()
        except requests.exceptions.RequestException as e:
            print(f"Error calling OpenAI API: {e}")
            return "API call failed. Unable to generate content."

# Example usage
if __name__ == "__main__":
    manager = UserManager()
    manager.load_users_from_file('users.json')
    user = manager.users[0]
    api_key = "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"
    subject = input("What subject would you like a lesson on today? ")
    generator = LessonInitializer(user, api_key)
    generator.initialize_lesson(subject)