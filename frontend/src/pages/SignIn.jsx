import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000"; // Make sure backend is running

export default function SignIn() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async () => {
    if (!name.trim() || !age.trim()) {
      setError("Please enter both your name and age.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/check_user`, {
        name,
        age: parseInt(age),
      });

      console.log("User check response:", response.data);

      // Move to lesson page
      navigate("/lesson");
    } catch (err) {
      console.error("Error checking user:", err);
      setError("Failed to check user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-indigo-600">
          Welcome! Sign In
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          Enter your details to continue.
        </p>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-100 py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="number"
            placeholder="Your Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full bg-gray-100 py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <button
          onClick={handleSignIn}
          className={`mt-6 w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold py-3 rounded-lg hover:from-indigo-600 hover:to-blue-600 transition ${
            loading && "opacity-50 cursor-not-allowed"
          }`}
          disabled={loading}
        >
          {loading ? "Checking..." : "Continue"}
        </button>
        {error && <p className="text-red-500 mt-4 text-center font-medium">{error}</p>}
      </div>
    </div>
  );
}
