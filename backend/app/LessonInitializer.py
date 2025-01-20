import requests
import json
import random
from UserInitializer import UserManager
from openai import OpenAI


client = OpenAI(api_key="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")
class LessonInitializer:
    def __init__(self, user, api_key):
        self.user = user
        self.api_key = api_key


    def initialize_lesson(self, subject):
        sub_subjects = self.generate_sub_subjects(subject)

        if not sub_subjects:
            print("No subtopics could be generated.")
            return ""

        for sub_subject in sub_subjects:
            lesson_segment = self.create_teaching_segment(sub_subject)
            mc_question = self.generate_mc_question(sub_subject)

            print(f"\n* {sub_subject}\n")  # Prints only the segment title
            print(lesson_segment)  # Prints the generated lesson content
            print("\nQuestion: " + mc_question["question"])
            for idx, option in enumerate(mc_question["options"], 1):
                print(f"{idx}. {option}")

            correct_index = mc_question["options"].index(mc_question["correct_answer"]) + 1
            user_answer = input("Enter the number of the correct answer: ")

            if user_answer.strip() == str(correct_index):
                print("Correct! Let's move on.\n")
            else:
                print(f"Incorrect. The correct answer was {correct_index}. {mc_question['correct_answer']}\n")

            print("=" * 80 + "\n")

            # Ensure user input before moving to the next segment
            input("Press Enter to continue to the next segment...\n")

    def generate_mc_question(self, content_item):
        correct_answer = f"Understanding {content_item}"
        wrong_answers = [
            "Basics of unrelated topic",
            f"Advanced {content_item} principles",
            f"Common myths about {content_item}"
        ]
        options = [correct_answer] + wrong_answers
        random.shuffle(options)

        question = f"What is essential to learn about {content_item}?"
        return {
            "question": question,
            "options": options,
            "correct_answer": correct_answer
        }
    
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
    lesson = generator.initialize_lesson(subject)
    print(f"Custom Lesson on {subject}:\n{lesson}\n{'=' * 80}\n")
