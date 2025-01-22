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

        correct_count = 0  # Counter for correct answers
        wrong_count = 0    # Counter for wrong answers

        all_segments = []  # Store all lesson segments for reference

        for sub_subject in sub_subjects:
            lesson_segment = self.create_teaching_segment(sub_subject)
            mc_question = self.generate_mc_question(sub_subject)

            all_segments.append({"sub_subject": sub_subject, "lesson_segment": lesson_segment})

            print(f"\n* {sub_subject}\n")  # Prints only the segment title
            print(lesson_segment)  # Prints the generated lesson content
            print("\nQuestion: " + mc_question["question"])
            for idx, option in enumerate(mc_question["options"], 1):
                print(f"{idx}. {option}")

            correct_index = mc_question["options"].index(mc_question["correct_answer"]) + 1
            user_answer = input("Enter the number of the correct answer: ")

            if user_answer.strip() == str(correct_index):
                print("Correct! Let's move on.\n")
                correct_count += 1  # Increment correct counter
            else:
                correct_answer = mc_question["correct_answer"]
                explanations = self.generate_explanations(mc_question["options"], correct_answer, sub_subject, lesson_segment)
                print(f"Incorrect. The correct answer was {correct_index}: {correct_answer}.")
                print("Explanation:")
                for idx, option in enumerate(mc_question["options"], 1):
                    explanation = explanations.get(option, "Explanation unavailable.")
                    print(f"- {option}: {explanation}")
                wrong_count += 1  # Increment wrong counter

            print("=" * 80 + "\n")
            input("Press Enter to continue to the next segment...\n")

        # Display final results
        print(f"\nLesson Complete! Here are your results:")
        print(f"Correct Answers: {correct_count}")
        print(f"Wrong Answers: {wrong_count}")

        # Allow the student to ask questions after the lesson
        print("\nYou can now ask questions about the lesson. (Type 'exit' to finish)")
        while True:
            student_question = input("Your question: ").strip()
            if student_question.lower() == "exit":
                print("Thank you for participating! Goodbye!")
                break
            answer = self.generate_answer_to_question(student_question, all_segments)
            print(f"Answer: {answer}")

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
