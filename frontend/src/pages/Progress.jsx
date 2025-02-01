import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useUser } from "../UserContext";

const API_BASE_URL = "http://localhost:8000";

export default function Progress() {
  const { userName } = useUser();
  const [progressData, setProgressData] = useState(null); // Stores fetched progress data
  const [error, setError] = useState(""); // Stores any error messages
  const [loading, setLoading] = useState(false); // Indicates loading state

  // ✅ Wrap fetchProgress in useCallback to avoid re-creating the function
  const fetchProgress = useCallback(async () => {
    if (!userName?.trim()) {
      setError("Please log in to view progress.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API_BASE_URL}/get_progress/${userName}`);
      setProgressData(response.data.progress);
    } catch (err) {
      console.error(err);
      setError("Unable to fetch progress. Please check the user name or try again later.");
    } finally {
      setLoading(false);
    }
  }, [userName]); // ✅ Depend only on userName

  // ✅ Now fetchProgress is stable and can be included in useEffect
  useEffect(() => {
    if (userName) {
      fetchProgress();
    }
  }, [userName, fetchProgress]); // ✅ Include fetchProgress safely

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-blue-600">Your Learning Progress</h2>
        
        {userName ? (
          <p className="text-gray-600 mb-6 text-center">Showing progress for <strong>{userName}</strong>.</p>
        ) : (
          <p className="text-red-500 mb-6 text-center">Please log in to view progress.</p>
        )}

        {/* Loading State */}
        {loading && <p className="text-center text-gray-600">Loading progress...</p>}

        {/* Error Message */}
        {error && (
          <p className="text-red-500 mt-4 text-center font-medium">{error}</p>
        )}

        {/* Display Progress Data */}
        {progressData && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-center text-indigo-600">Progress Summary</h3>
            <ul className="mt-4 space-y-3">
              {Object.entries(progressData).map(([topic, stats]) => (
                <li
                  key={topic}
                  className="p-4 border rounded-lg shadow-sm bg-gray-50 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-medium text-gray-800">{topic}</h4>
                    <p className="text-sm text-gray-600">
                      Correct Answers: {stats.correct_answers} / {stats.total_questions}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      stats.accuracy >= 80
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {stats.accuracy}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
