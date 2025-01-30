import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000"; // Ensure FastAPI is running

export default function LogIn() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogIn = async () => {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
  
    try {
      const response = await axios.post(`${API_BASE_URL}/login_user`, { name });
  
      if (response.data.exists) {
        navigate("/dashboard"); // ✅ Redirect to Dashboard
      } else {
        setError("User not found. Please sign up first.");
      }
    } catch (err) {
      console.error("Error logging in:", err);
      setError("Failed to log in. Please try again.");
    }
  };
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-600">Log In</h2>
        <p className="text-gray-600 mb-6 text-center">Enter your name to continue.</p>

        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full py-3 px-4 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
        />

        <button
          onClick={handleLogIn}
          className="w-full py-3 px-4 rounded-lg bg-blue-500 text-white font-semibold shadow-md hover:bg-blue-600 transition"
        >
          Log In
        </button>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        <p className="text-gray-600 mt-6 text-center">
          Don't have an account?{" "}
          <a href="/signin" className="text-blue-500 hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}
