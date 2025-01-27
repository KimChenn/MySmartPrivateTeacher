import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";

// API Base URL (ensure FastAPI is running)
const API_BASE_URL = "http://localhost:8000";

// Home Page
const Home = () => (
  <div className="flex flex-col items-center p-6">
    <h1 className="text-4xl font-bold mb-4">Welcome to Your Private Teacher</h1>
    <p className="text-lg mb-6">Learn interactively and track your progress with ease.</p>
    <div className="flex space-x-4">
      <Link to="/lesson">
        <Button>Start Lesson</Button>
      </Link>
      <Link to="/progress">
        <Button>View Progress</Button>
      </Link>
    </div>
  </div>
);

// Lesson Page with User Name Input
const Lesson = () => {
  const [userName, setUserName] = useState(""); // Stores user name
  const [lessonTopic, setLessonTopic] = useState(""); // Stores lesson topic
  const [lessonContent, setLessonContent] = useState(""); // Stores API response
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startLesson = async () => {
    if (!userName.trim() || !lessonTopic.trim()) {
      setError("Please enter both your name and a lesson topic.");
      return;
    }

    setLoading(true);
    setError("");
    setLessonContent("");

    try {
      console.log("Sending request to:", `${API_BASE_URL}/start_lesson`);

      // API request to FastAPI backend
      const res = await axios.post(`${API_BASE_URL}/start_lesson`, {
        user: userName,
        subject: lessonTopic
      });

      console.log("Response received:", res.data);
      setLessonContent(res.data.lesson); // Display lesson response
    } catch (err) {
      console.error("Error starting lesson:", err);
      setError("Failed to fetch lesson. Please check backend.");
    } finally {
      setLoading(false);
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

        <Button
          onClick={startLesson}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "Start New Lesson"}
        </Button>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        {lessonContent && (
          <div className="mt-6 p-4 border border-gray-300 rounded-md bg-white text-center">
            <h2 className="text-lg font-semibold">Lesson:</h2>
            <pre className="mt-2 text-gray-700">{JSON.stringify(lessonContent, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

// Progress Page
const Progress = () => (
  <div className="p-6">
    <h2 className="text-2xl font-semibold mb-4">Progress Dashboard</h2>
    <p>Visual representation of your progress.</p>
    <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
      Progress Graph Placeholder
    </div>
  </div>
);

// 404 Not Found Page
const NotFound = () => (
  <div className="flex flex-col items-center p-6">
    <h1 className="text-4xl font-bold mb-4">404</h1>
    <p className="text-lg">
      Page not found. Return to <Link to="/" className="text-blue-500">Home</Link>.
    </p>
  </div>
);

// App Component
const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-blue-500 text-white p-4">
          <div className="container mx-auto flex justify-between">
            <Link to="/" className="text-xl font-bold">Private Teacher</Link>
            <div className="space-x-4">
              <Link to="/lesson" className="hover:underline">Lesson</Link>
              <Link to="/progress" className="hover:underline">Progress</Link>
            </div>
          </div>
        </nav>
        <main className="container mx-auto py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lesson" element={<Lesson />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
