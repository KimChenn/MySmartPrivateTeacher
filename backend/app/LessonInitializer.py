import requests
import json
import random
from UserInitializer import UserManager
from UserInitializer import ProgressManager
from openai import OpenAI
import pyttsx3  # Library for text-to-speech
import speech_recognition as sr

client = OpenAI(api_key="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")

class LessonInitializer:
    def __init__(self, user, api_key):
        self.user = user
        self.api_key = api_key
        self.progress_manager = ProgressManager()  # Initialize ProgressManager
        self.tts_engine = pyttsx3.init()  # Initialize text-to-speech engine
        self.recognizer = sr.Recognizer()  # Initialize speech recognizer

    def speak(self, text):
        """Convert text to speech."""
        self.tts_engine.say(text)
        self.tts_engine.runAndWait()

    def listen(self):
        """Capture voice input, process it, and return as text."""
        number_map = {
            "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
            "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10
        }
        with sr.Microphone() as source:
            self.speak("Listening for your command...")
            print("Listening for your command...")
            try:
                audio = self.recognizer.listen(source, timeout=10)
                command = self.recognizer.recognize_google(audio).lower().strip()
                print(f"You said: {command}")

                # Map spoken words to numbers if applicable
                if command in number_map:
                    return number_map[command]
                elif command.isdigit():
                    return int(command)
                else:
                    return command
            except sr.WaitTimeoutError:
                self.speak("No command heard. Please try again.")
                return None
            except sr.UnknownValueError:
                self.speak("Sorry, I didn't understand that. Please repeat.")
                return None
            except sr.RequestError:
                self.speak("Speech recognition is not available right now.")
                return None

    def initialize_lesson(self, subject):
        sub_subjects = self.generate_sub_subjects(subject)
        if not sub_subjects:
            self.speak("No subtopics could be generated.")
            return

        correct_count = 0
        wrong_count = 0
        all_segments = []

        for sub_subject in sub_subjects:
            lesson_segment = self.create_teaching_segment(sub_subject)
            mc_question = self.generate_mc_question(sub_subject)
            all_segments.append({"sub_subject": sub_subject, "lesson_segment": lesson_segment})

            self.speak(f"Topic: {sub_subject}")
            print(f"\n* {sub_subject}\n")
            print(lesson_segment)
            self.speak(lesson_segment)

            print("\nQuestion: " + mc_question["question"])
            self.speak("Question: " + mc_question["question"])

            for idx, option in enumerate(mc_question["options"], 1):
                print(f"{idx}. {option}")
                self.speak(f"Option {idx}: {option}")

            while True:
                command = self.listen()

                # Handle voice or manual input for answers
                if isinstance(command, int) and command in range(1, len(mc_question["options"]) + 1):
                    user_answer = command
                    correct_index = mc_question["options"].index(mc_question["correct_answer"]) + 1
                    if user_answer == correct_index:
                        print("Correct! Let's move on.\n")
                        self.speak("Correct! Let's move on.")
                        correct_count += 1
                    else:
                        print("Incorrect. The correct answer was " +
                              f"{correct_index}: {mc_question['correct_answer']}.")
                        self.speak(f"Incorrect. The correct answer was {correct_index}.")
                        wrong_count += 1
                    break
                elif command in ["next", "skip"]:
                    print("Moving to the next question.")
                    self.speak("Moving to the next question.")
                    break
                elif command in ["repeat question", "repeat"]:
                    print("Repeating the question.")
                    self.speak("Repeating the question.")
                    self.speak("Question: " + mc_question["question"])
                elif command in ["end lesson", "exit"]:
                    self.speak("Ending the lesson. Goodbye!")
                    return
                else:
                    self.speak("Invalid response. Please try again.")

            # Ask if the user wants to continue to the next segment
            self.speak("Do you want to continue to the next topic?")
            print("Do you want to continue to the next topic? (yes/no)")
            while True:
                command = self.listen()
                if command in ["yes", "yeah", "continue"]:
                    self.speak("Great, let's move on!")
                    break
                elif command in ["no", "stop", "exit"]:
                    self.speak("Ending the lesson. Goodbye!")
                    return
                else:
                    self.speak("I didn't understand. Please say 'yes' to continue or 'no' to exit.")

        # Update progress
        self.progress_manager.update_user_progress(
            user_name=self.user.name,
            topic=subject,
            correct_answers=correct_count,
            total_questions=correct_count + wrong_count,
        )
        print("Your progress has been updated and saved.")
        self.speak("Your progress has been updated and saved.")

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
            return {
                "question": f"What is a key aspect of {content_item}?",
                "options": [
                    f"Understanding {content_item}",
                    f"Common misconceptions about {content_item}",
                    f"Advanced principles of {content_item}",
                    "An unrelated topic"
                ],
                "correct_answer": f"Understanding {content_item}"
            }

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
