import { useState } from "react";
import axios from "axios";

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

  const currentSegment = lessonContent[currentSegmentIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">Lesson Interface</h2>
        <p className="text-gray-600 mb-4 text-center">Enter your name and a topic to generate a lesson.</p>

        {/* User Name Input */}
        <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="border border-gray-300 rounded-md p-2 w-full mb-2"
        />

        {/* Lesson Topic Input */}
        <input
          type="text"
          placeholder="Enter a lesson topic (e.g., Photosynthesis)"
          value={lessonTopic}
          onChange={(e) => setLessonTopic(e.target.value)}
          className="border border-gray-300 rounded-md p-2 w-full"
        />

        <button
          onClick={startLesson}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "Start New Lesson"}
        </button>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        {currentSegment && (
          <div className="mt-6 p-4 border border-gray-300 rounded-md bg-white text-center">
            <h2 className="text-lg font-semibold">{currentSegment.sub_subject}</h2>
            <p className="mt-2 text-gray-700">{currentSegment.lesson_segment}</p>

            {/* Ensure question_data exists before rendering */}
            {currentSegment.question_data && (
              <>
                <h3 className="mt-4 font-semibold">Question:</h3>
                <p>{currentSegment.question_data.question}</p>

                <div className="mt-2">
                  {currentSegment.question_data.options.map((choice, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <input
                        type="radio"
                        name="answer"
                        value={index}
                        onChange={() => setSelectedAnswer(index)}
                        checked={selectedAnswer === index}
                        className="mr-2"
                      />
                      <label>{choice}</label>
                    </div>
                  ))}
                </div>

                <button
                  onClick={submitAnswer}
                  className="mt-4 bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 transition"
                  disabled={selectedAnswer === null}
                >
                  Submit Answer
                </button>

                {isCorrect !== null && (
                  <p className={`mt-4 font-semibold ${isCorrect ? "text-green-500" : "text-red-500"}`}>
                    {isCorrect ? "Correct! 🎉" : "Incorrect. Try again!"}
                  </p>
                )}

                {isCorrect && currentSegmentIndex < lessonContent.length - 1 && (
                  <button
                    onClick={nextSegment}
                    className="mt-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition"
                  >
                    Next Lesson Segment
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
