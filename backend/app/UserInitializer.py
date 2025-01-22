import json

class UserInitializer:
    def __init__(self, name, age, hobbies):
        self.name = name
        self.age = age
        self.hobbies = hobbies

    def to_dict(self):
        return {
            "name": self.name,
            "age": self.age,
            "hobbies": self.hobbies
        }

class UserManager:
    def __init__(self):
        self.users = []

    def add_user(self, user):
        self.users.append(user)

    def save_users_to_file(self, filename):
        with open(filename, 'w') as file:
            json.dump([user.to_dict() for user in self.users], file, indent=4)

    def load_users_from_file(self, filename):
        with open(filename, 'r') as file:
            users_data = json.load(file)
            self.users = [
                UserInitializer(
                    name=data["name"],
                    age=data["age"],
                    hobbies=data["hobbies"]
                ) for data in users_data
            ]

    def get_valid_name(self, prompt):
        while True:
            name = input(prompt)
            if name.isalpha() or (' ' in name and name.replace(' ', '').isalpha()):
                return name
            print("Invalid input. Please use only letters and spaces.")

    def get_valid_age(self, prompt):
        while True:
            try:
                age = int(input(prompt))
                if age > 0:
                    return age
                else:
                    print("Please enter a positive integer for age.")
            except ValueError:
                print("Invalid input. Please enter an integer for age.")

    def get_valid_hobbies(self, prompt):
        while True:
            hobbies_input = input(prompt)
            hobbies = [hobby.strip() for hobby in hobbies_input.split(',') if hobby.strip()]
            if hobbies:
                return hobbies
            print("Please enter at least one hobby, separated by commas if multiple.")

    def display_user_progress(self, user_name, progress_manager):
        progress = progress_manager.get_user_progress(user_name)
        print(f"Progress for {user_name}:")
        for topic, stats in progress.items():
            print(f"  Topic: {topic}")
            print(f"    Correct Answers: {stats['correct_answers']}")
            print(f"    Total Questions: {stats['total_questions']}")


class ProgressManager:
    def __init__(self, filename="progress.json"):
        self.filename = filename
        self.progress_data = self.load_progress()

    def load_progress(self):
        try:
            with open(self.filename, 'r') as file:
                return json.load(file)
        except FileNotFoundError:
            return {}

    def save_progress(self):
        with open(self.filename, 'w') as file:
            json.dump(self.progress_data, file, indent=4)

    def update_user_progress(self, user_name, topic, correct_answers, total_questions):
        if user_name not in self.progress_data:
            self.progress_data[user_name] = {}
        if topic not in self.progress_data[user_name]:
            self.progress_data[user_name][topic] = {"correct_answers": 0, "total_questions": 0}

        self.progress_data[user_name][topic]["correct_answers"] += correct_answers
        self.progress_data[user_name][topic]["total_questions"] += total_questions
        self.save_progress()

    def get_user_progress(self, user_name):
        return self.progress_data.get(user_name, {})

# Example usage
if __name__ == "__main__":
    user_manager = UserManager()
    progress_manager = ProgressManager()

    # Collect user profile data
    name = user_manager.get_valid_name("Enter your name: ")
    age = user_manager.get_valid_age("Enter your age: ")
    hobbies = user_manager.get_valid_hobbies("Enter your hobbies (comma-separated): ")

    # Create a new user profile
    user = UserInitializer(name, age, hobbies)
    user_manager.add_user(user)

    # Save and load users
    user_manager.save_users_to_file('users.json')
    user_manager.load_users_from_file('users.json')

    # Update progress
    progress_manager.update_user_progress(name, "Math", 5, 6)
    progress_manager.update_user_progress(name, "Science", 3, 4)

    # Display progress
    user_manager.display_user_progress(name, progress_manager)