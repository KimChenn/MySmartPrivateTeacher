import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import mixpanel from "../mixpanel";
import { useUser } from "../UserContext";

const API_BASE_URL = "http://localhost:8000"; // Ensure FastAPI is running

export default function Lesson() {
  const { userName} = useUser(); // Get the logged-in user
  const [lessonTopic, setLessonTopic] = useState(""); // Stores lesson topic
  const [lessonContent, setLessonContent] = useState([]); // Stores all lesson segments
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0); // Tracks current lesson step
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(null); // Tracks if answer is correct
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lessonStarted, setLessonStarted] = useState(false); // Tracks whether the lesson has started
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionCorrectAnswers, setSessionCorrectAnswers] = useState(0);
  const [sessionTotalQuestions, setSessionTotalQuestions] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (!userName) {
      navigate("/login"); // Redirect if no user is logged in
    }
  }, [userName, navigate]);

  const startLesson = async () => {
    if (!lessonTopic.trim()) {
      setError("Please enter a lesson topic.");
      return;
    }

    setLoading(true);
    setError("");
    setLessonContent([]);
    setCurrentSegmentIndex(0); // Reset lesson index when starting a new lesson
    setIsCorrect(null);
    setUserAnswer("");
    setAnswerSubmitted(false);

    try {
      console.log("Sending request to:", `${API_BASE_URL}/start_lesson`);

      // API request to FastAPI backend
      const res = await axios.post(`${API_BASE_URL}/start_lesson`, {
        user: userName,
        subject: lessonTopic,
      });

      console.log("Response received:", res.data);
      setLessonContent(res.data.lesson || []); // Store lesson response safely
      setLessonStarted(true); // Transition to the lesson content view
      // Track event in Mixpanel
      mixpanel.track("Lesson Started", {
        user: userName,
        topic: lessonTopic,
    });
    } catch (err) {
      console.error("Error starting lesson:", err);

      // Check if the error is due to a missing user
      if (err.response && err.response.status === 404) {
        setError("User does not exist. Please enter a valid username.");
      } else {
        setError("Failed to fetch lesson. Please check backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      return;
    }

    const currentSegment = lessonContent[currentSegmentIndex];
    if (!currentSegment || !currentSegment.question_data) {
      return;
    }

    const correctAnswer = currentSegment.question_data.correct_answer.trim().toLowerCase();
    const explanation = currentSegment.question_data.explanation; // Get explanation

    let isAnswerCorrect = userAnswer.trim().toLowerCase() === correctAnswer;

    setIsCorrect(isAnswerCorrect);
    setExplanation(isAnswerCorrect ? "" : explanation || "Explanation unavailable.");
    setAnswerSubmitted(true);

    // Track user answer in Mixpanel
    mixpanel.track("Answer Submitted", {
      user: userName,
      topic: lessonTopic,
      question: currentSegment.question_data.question,
      userAnswer,
      isCorrect: isAnswerCorrect,
    });


    // Track session-based progress (only for this lesson run)
    setSessionTotalQuestions(prev => prev + 1);
    if (isAnswerCorrect) {
      setSessionCorrectAnswers(prev => prev + 1);
    }

    try {
      await axios.post(`${API_BASE_URL}/save_progress`, {
        user: userName,
        lesson: lessonTopic,
        correct: isAnswerCorrect
      });
      console.log("Progress saved successfully.");
    } catch (err) {
      console.error("Error saving progress:", err);
    }
  };


  const nextSegment = () => {
    if (currentSegmentIndex < lessonContent.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setIsCorrect(null);
      setUserAnswer("");
      setExplanation("");
      setAnswerSubmitted(false);
    } else {}
  };
  

  const playTTS = async () => {
    const currentSegment = lessonContent[currentSegmentIndex];
    if (!currentSegment) return;

    try {
      console.log("Sending text-to-speech request for:", currentSegment.lesson_segment);
      await axios.post(`${API_BASE_URL}/text_to_speech`, {
        text: currentSegment.lesson_segment, // Send as JSON object
      });
    } catch (err) {
      console.error("Error playing text-to-speech:", err);
    }
  };

  const startSpeechRecognition = async () => {
    try {
      setIsListening(true);
      console.log("Listening for speech...");
      const response = await axios.post(`${API_BASE_URL}/speech_to_text`);
      setIsListening(false);
  
      if (response.data.number) {
        const selectedNumber = response.data.number;
        
        // Set the answer field to match the selected option
        if (selectedNumber >= 1 && selectedNumber <= 4) {
          setUserAnswer(currentSegment.question_data.options[selectedNumber - 1]); 
        }
      } else {
        console.log("Speech did not match any valid number.");
      }
    } catch (err) {
      console.error("Error with speech recognition:", err);
      setIsListening(false);
    }
  };

  const currentSegment = lessonContent[currentSegmentIndex];

  // Initial Form View
  if (!lessonStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
        <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-lg">
          <h2 className="text-3xl font-bold mb-6 text-center text-indigo-600">Welcome to Your Lesson</h2>
          <p className="text-gray-600 mb-6 text-center">
            Enter your name and a topic to start an engaging lesson experience.
          </p>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Your Name"
              value={userName}
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold py-3 px-4 rounded-full placeholder-gray-200 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-transform transform hover:scale-105"
            />
            <input
              type="text"
              placeholder="Lesson Topic (e.g., Photosynthesis)"
              value={lessonTopic}
              onChange={(e) => setLessonTopic(e.target.value)}
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold py-3 px-4 rounded-full placeholder-gray-200 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-transform transform hover:scale-105"
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
          {error && <p className="text-red-500 mt-4 text-center font-medium">{error}</p>}
        </div>
      </div>
    );
  }

 // Initial Form View
 if (!lessonStarted) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-lg">
        <h2 className="text-3xl font-bold mb-6 text-center text-indigo-600">Welcome to Your Lesson</h2>
        <p className="text-gray-600 mb-6 text-center">
          Enter your name and a topic to start an engaging lesson experience.
        </p>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold py-3 px-4 rounded-full placeholder-gray-200 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-transform transform hover:scale-105"
          />
          <input
            type="text"
            placeholder="Lesson Topic (e.g., Photosynthesis)"
            value={lessonTopic}
            onChange={(e) => setLessonTopic(e.target.value)}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold py-3 px-4 rounded-full placeholder-gray-200 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-transform transform hover:scale-105"
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
        {error && <p className="text-red-500 mt-4 text-center font-medium">{error}</p>}
      </div>
    </div>
  );
}

// Lesson Content View
return (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
    <div className="mt-8 bg-gray-50 rounded-xl p-6 shadow-md">
      {currentSegment && (
        <>
          <h3 className="text-xl font-semibold text-indigo-600 text-center">{currentSegment.sub_subject}</h3>
          <p className="mt-4 text-gray-700 text-center">{currentSegment.lesson_segment}</p>

          {/* Play Text-to-Speech Button */}
          <button
            onClick={playTTS}
            className="mt-6 w-full bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition"
          >
            🔊 Listen
          </button>

          {currentSegment.question_data && (
            <>
              <h4 className="mt-6 text-lg font-semibold text-center text-gray-800">
                Question: {currentSegment.question_data.question}
              </h4>
              <ul className="mt-4 text-gray-700">
                {currentSegment.question_data.options.map((choice, index) => (
                  <li key={index}>
                    {index + 1}. {choice}
                  </li>
                ))}
              </ul>

              <input
                type="text"
                placeholder="Enter your answer"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="mt-4 w-full border-2 border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={startSpeechRecognition}
                className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
              >
                {isListening ? "🎤 Listening..." : "🎤 Speak"}
              </button>

              <button
                onClick={submitAnswer}
                className={`mt-6 w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition ${
                  (!userAnswer.trim() || answerSubmitted) && "opacity-50 cursor-not-allowed"
                }`}
                disabled={!userAnswer.trim() || answerSubmitted} // ✅ Button is now disabled after first press
              >
                Submit Answer
              </button>
              {isCorrect !== null && (
                <p
                  className={`mt-4 text-center font-semibold ${
                    isCorrect ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {isCorrect ? "Correct! 🎉" : "Incorrect. :("}
                </p>
              )}
              {/* Explanation for Incorrect Answers */}
              {!isCorrect && explanation && (
                <p className="mt-2 text-gray-700 text-center">
                💡 Explanation: {explanation}
                </p>
              )}    
              {answerSubmitted && (
                currentSegmentIndex < lessonContent.length - 1 ? (
                  <button
                    onClick={nextSegment}
                    className="mt-4 w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition"
                  >
                    Next Segment
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      navigate("/lesson-summary", {
                        state: { 
                          userName, 
                          lessonTopic, 
                          sessionCorrectAnswers, 
                          sessionTotalQuestions 
                      }
                    })
                    }
                    className="mt-4 w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition"
                  >
                    Finish Lesson
                  </button>
                )
              )}
            </>
          )}
        </>
      )}
    </div>
  </div>
);
}