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
            self.users = [UserInitializer(**data) for data in users_data]

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


# Example usage
if __name__ == "__main__":
    manager = UserManager()
    # Collect user profile data (this would typically come from a user interface)
    name = manager.get_valid_name("Enter your name: ")
    age = manager.get_valid_age("Enter your age: ")
    hobbies = manager.get_valid_hobbies("Enter your hobbies (comma-separated): ")

    # Create a new user profile
    user = UserInitializer(name, age, hobbies)
    manager.add_user(user)
    # Save users to a file
    manager.save_users_to_file('users.json')
    # Load profiles from a file (for testing)
    manager.load_users_from_file('users.json')
    for user in manager.users:
        print(user.to_dict())
