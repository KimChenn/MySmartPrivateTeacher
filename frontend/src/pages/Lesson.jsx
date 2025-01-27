import { useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000"; // Ensure FastAPI is running

export default function Lesson() {
  const [userName, setUserName] = useState(""); // Stores user name
  const [lessonTopic, setLessonTopic] = useState(""); // Stores lesson topic
  const [lessonContent, setLessonContent] = useState([]); // Stores all lesson segments
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0); // Tracks current lesson step
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

    try {
      console.log("Sending request to:", `${API_BASE_URL}/start_lesson`);

      // API request to FastAPI backend
      const res = await axios.post(`${API_BASE_URL}/start_lesson`, {
        user: userName,
        subject: lessonTopic
      });

      console.log("Response received:", res.data);
      setLessonContent(res.data.lesson); // Store lesson response
    } catch (err) {
      console.error("Error starting lesson:", err);
      setError("Failed to fetch lesson. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  const nextSegment = () => {
    if (currentSegmentIndex < lessonContent.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
    }
  };

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

        {lessonContent.length > 0 && (
          <div className="mt-6 p-4 border border-gray-300 rounded-md bg-white text-center">
            <h2 className="text-lg font-semibold">{lessonContent[currentSegmentIndex].sub_subject}</h2>
            <p className="mt-2 text-gray-700">{lessonContent[currentSegmentIndex].lesson_segment}</p>

            {currentSegmentIndex < lessonContent.length - 1 && (
              <button
                onClick={nextSegment}
                className="mt-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition"
              >
                Next Lesson Segment
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
