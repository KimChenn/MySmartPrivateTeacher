import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const API_BASE_URL = "http://localhost:8000"; // Ensure FastAPI is running

export default function Lesson() {
  const [userName, setUserName] = useState(""); // Stores user name
  const [lessonTopic, setLessonTopic] = useState(""); // Stores lesson topic
  const [lessonContent, setLessonContent] = useState([]); // Stores all lesson segments
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0); // Tracks current lesson step
  const [selectedAnswer, setSelectedAnswer] = useState(null); // Tracks selected answer
  const [isCorrect, setIsCorrect] = useState(null); // Tracks if answer is correct
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startLesson = async () => {
    if (!userName.trim() || !lessonTopic.trim()) {
      setError("Please enter both your name and a lesson topic.");
      return;
    }

    setLoading(true);
    setError("");
    setLessonContent([]);
    setCurrentSegmentIndex(0); // Reset lesson index when starting a new lesson
    setIsCorrect(null);
    setSelectedAnswer(null);

    try {
      console.log("Sending request to:", `${API_BASE_URL}/start_lesson`);

      // API request to FastAPI backend
      const res = await axios.post(`${API_BASE_URL}/start_lesson`, {
        user: userName,
        subject: lessonTopic
      });

      console.log("Response received:", res.data);
      setLessonContent(res.data.lesson || []); // Store lesson response safely
    } catch (err) {
      console.error("Error starting lesson:", err);
      setError("Failed to fetch lesson. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) {
      return;
    }

    const currentSegment = lessonContent[currentSegmentIndex];
    if (!currentSegment || !currentSegment.question_data) {
      return;
    }

    const correctAnswer = currentSegment.question_data.correct_answer;
    if (currentSegment.question_data.options[selectedAnswer] === correctAnswer) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
  };

  const nextSegment = () => {
    if (currentSegmentIndex < lessonContent.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setIsCorrect(null);
      setSelectedAnswer(null);
    }
  };

  const playTTS = async () => {
    const currentSegment = lessonContent[currentSegmentIndex];
    if (!currentSegment) return;

    try {
        console.log("Sending text-to-speech request for:", currentSegment.lesson_segment);
        await axios.post(`${API_BASE_URL}/text_to_speech`, {
            text: currentSegment.lesson_segment // Send as JSON object
        });
    } catch (err) {
        console.error("Error playing text-to-speech:", err);
    }
};

  const currentSegment = lessonContent[currentSegmentIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-lg">
        <h2 className="text-3xl font-bold mb-6 text-center text-indigo-600">Welcome to Your Lesson</h2>
        <p className="text-gray-600 mb-6 text-center">
          Enter your name and a topic to start an engaging lesson experience.
        </p>
  
        {/* User Name Input */}
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-gray-200 transition-transform transform hover:scale-105"
          />
  
          {/* Lesson Topic Input */}
          <input
            type="text"
            placeholder="Lesson Topic (e.g., Photosynthesis)"
            value={lessonTopic}
            onChange={(e) => setLessonTopic(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
  
        <button
          onClick={startLesson}
          className={`mt-6 w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold py-3 rounded-lg hover:from-indigo-600 hover:to-blue-600 transition ${
            loading && "opacity-50 cursor-not-allowed"
          }`}
          disabled={loading}
        >
          {loading ? "Loading..." : "Start Lesson"}
        </button>
  
        {error && (
          <p className="text-red-500 mt-4 text-center font-medium">{error}</p>
        )}
  
        {/* Display current lesson segment */}
        {currentSegment && (
          <div className="mt-8 bg-gray-50 rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-semibold text-indigo-600 text-center">
              {currentSegment.sub_subject}
            </h3>
            <p className="mt-4 text-gray-700 text-center">
              {currentSegment.lesson_segment}
            </p>
  
            {/* Play Text-to-Speech Button */}
            <button
              onClick={playTTS}
              className="mt-6 w-full bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition"
            >
              🔊 Listen
            </button>
  
            {/* Render Question Section */}
            {currentSegment.question_data && (
              <>
                <h4 className="mt-6 text-lg font-semibold text-center text-gray-800">
                  Question: {currentSegment.question_data.question}
                </h4>
  
                <div className="mt-4 space-y-3">
                  {currentSegment.question_data.options.map((choice, index) => (
                    <label
                      key={index}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        selectedAnswer === index
                          ? "bg-indigo-50 border-indigo-500"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={index}
                        onChange={() => setSelectedAnswer(index)}
                        checked={selectedAnswer === index}
                        className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">{choice}</span>
                    </label>
                  ))}
                </div>
  
                <button
                  onClick={submitAnswer}
                  className={`mt-6 w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition ${
                    selectedAnswer === null && "opacity-50 cursor-not-allowed"
                  }`}
                  disabled={selectedAnswer === null}
                >
                  Submit Answer
                </button>
  
                {isCorrect !== null && (
                  <p
                    className={`mt-4 text-center font-semibold ${
                      isCorrect ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {isCorrect ? "Correct! 🎉" : "Incorrect. Try Again."}
                  </p>
                )}
  
                {isCorrect && currentSegmentIndex < lessonContent.length - 1 && (
                  <button
                    onClick={nextSegment}
                    className="mt-4 w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition"
                  >
                    Next Segment
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
