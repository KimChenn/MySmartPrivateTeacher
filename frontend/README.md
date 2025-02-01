# **Private Teacher App**

Welcome to the **Private Teacher App** – an interactive platform designed to provide personalized lessons, track user progress, and enhance learning through features like text-to-speech and speech recognition.

---

## **Features**

- **User Authentication**: Users can sign up or log in to access their personalized dashboard.
- **Dynamic Lessons**: AI-generated lessons tailored to the user's preferences and age.
- **Progress Tracking**: View detailed progress reports to track your learning journey.
- **Interactive Quizzes**: Engage in multiple-choice quizzes with speech-to-text functionality.
- **Modern UI**: A clean, responsive design with gradient styling for a seamless user experience.

---

## **Tech Stack**

### **Frontend**
- **React.js**: Built with a modern JavaScript library for interactive UIs.
- **Tailwind CSS**: Styled with a utility-first CSS framework for rapid development.
- **React Router**: Navigation between pages.

### **Backend**
- **FastAPI**: Provides robust API endpoints for lesson generation, user authentication, and progress tracking.
- **Vosk**: Speech recognition library for interactive quizzes.
- **OpenAI API**: Powers AI-generated lesson content and quiz explanations.

---

## **Installation**

### 1. **Clone the Repository**
```bash
git clone https://github.com/KimChenn/MySmartPrivateTeacher
cd private-teacher-app

### 2. **Install Dependencies**
```bash
npm install


Install backend dependencies (if using a virtual environment for Python):

pip install -r requirements.txt

3. Start the Backend
Ensure the FastAPI backend is running:

uvicorn main:app --reload

4. Start the Frontend
Run the React development server:

npm start

Open http://localhost:3000 to view the app in your browser.


Usage
1. Sign Up / Log In
New users can sign up by providing their name and age.
Returning users can log in to access their dashboard.
2. Dashboard
Choose between:
Starting a Lesson: Generate lessons tailored to your age and preferences.
Viewing Progress: Track your learning progress with detailed statistics.
3. Interactive Features
Use the text-to-speech feature to hear lessons aloud.
Answer quiz questions via speech-to-text for an immersive experience.


Available Scripts
In the project directory, you can run:

npm start
Runs the app in development mode.
Open http://localhost:3000 to view it.

npm run build
Builds the app for production into the build folder.

Contributing
Contributions are welcome! Please follow these steps:

Fork the repository.
1. Create a new branch: git checkout -b feature/your-feature.
2. Commit your changes: git commit -m "Add some feature".
3. Push to the branch: git push origin feature/your-feature.
4. Open a pull request.

Contact
For any inquiries or issues, please contact chenkimi10@gmail.com

