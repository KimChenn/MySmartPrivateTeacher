import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000";

const LessonSummary = () => {
  const [lessonSummary, setLessonSummary] = useState(null);
  const [studentQuestion, setStudentQuestion] = useState("");
  const [questionResponse, setQuestionResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Extract user & lesson from state (passed from Lesson.jsx)
  const { userName, lessonTopic, sessionCorrectAnswers, sessionTotalQuestions } = location.state || {};

  useEffect(() => {
    if (!userName || !lessonTopic) {
      console.error("Missing user or lesson data, redirecting to home...");
      navigate("/"); // ✅ Redirect to home if no user/lesson data
      return;
    }

    console.log(`Fetching lesson summary for user: ${userName}, lesson: ${lessonTopic}`);

    axios
      .get(`${API_BASE_URL}/lesson-summary/${userName}/${lessonTopic}`)
      .then((res) => {
        console.log("Lesson summary response:", res.data);
        setLessonSummary(res.data);
      })
      .catch((err) => console.error("Error fetching lesson summary:", err));
  }, [userName, lessonTopic, navigate]);

  const askQuestion = async () => {
    if (!studentQuestion.trim()) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/ask_question`, {
        user: userName,
        lesson: lessonTopic,
        question: studentQuestion.trim(),
      });

      setQuestionResponse(res.data.answer);
    } catch (err) {
      console.error("Error fetching response:", err);
      setQuestionResponse("Failed to retrieve an answer. Try again.");
    }
  };

  const startSpeechRecognition = async () => {
    try {
      setIsListening(true);
      console.log("Listening for speech...");
      const response = await axios.post(`${API_BASE_URL}/free_speech_to_text`);
      setIsListening(false);
  
      if (response.data.text) {
        setStudentQuestion((prev) => prev + " " + response.data.text);
      } else {
        console.log("No speech recognized.");
      }
    } catch (err) {
      console.error("Error with speech recognition:", err);
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-lg text-center">
        <h2 className="text-3xl font-bold mb-6 text-indigo-600">Lesson Complete! 🎉</h2>

        {lessonSummary ? (
          <>
            <p className="text-gray-700">Lesson Summary for {lessonTopic}</p>
            <p className="mt-4 text-green-500">✅ Correct Answers: {sessionCorrectAnswers}</p>
            <p className="text-red-500">❌ Incorrect Answers: {sessionTotalQuestions - sessionCorrectAnswers}</p>
          </>
        ) : (
          <p>Loading summary...</p>
        )}

        {/* Open-Ended Question Section */}
        <h3 className="mt-6 text-xl font-semibold text-gray-800">Ask a Question</h3>
        <input
          type="text"
          placeholder="Ask anything about the lesson..."
          value={studentQuestion}
          onChange={(e) => setStudentQuestion(e.target.value)}
          className="mt-4 w-full border-2 border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={startSpeechRecognition}
          className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
        >
          {isListening ? "🎤 Listening..." : "🎤 Speak"}
        </button>
        <button
          onClick={askQuestion}
          className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
        >
          Ask Question
        </button>

        {questionResponse && <p className="mt-4 text-gray-700">💡 Answer: {questionResponse}</p>}
      </div>
    </div>
  );
};

export default LessonSummary;
