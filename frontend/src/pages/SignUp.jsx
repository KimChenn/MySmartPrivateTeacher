import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import mixpanel from "../mixpanel";

const API_BASE_URL = "http://localhost:8000";

export default function SignUp() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    if (!name.trim() || !age.trim()) {
      setError("Please enter your name and age.");
      return;
    }
  
    try {
      const response = await axios.post(`${API_BASE_URL}/check_user`, {
        name,
        age: parseInt(age),
      });
  
      if (!response.data.exists) {
        console.log("User registered:", name);

        // Track successful sign-up in Mixpanel
        mixpanel.track("User Signed Up", {
          name,
          age: parseInt(age),
          timestamp: new Date().toISOString(),
        });
      }
  
      navigate("/dashboard"); //  Redirect to Dashboard
    } catch (err) {
      console.error("Error signing up:", err);
      setError("Failed to sign up. Please try again.");

      // Track failed sign-up in Mixpanel
      mixpanel.track("Sign Up Failed", {
        name,
        age: parseInt(age),
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  };
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-600">Sign Up</h2>
        <p className="text-gray-600 mb-6 text-center">Enter your details to create an account.</p>

        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full py-3 px-4 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
        />
        <input
          type="number"
          placeholder="Your Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full py-3 px-4 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
        />

        <button
          onClick={handleSignUp}
          className="w-full py-3 px-4 rounded-lg bg-blue-500 text-white font-semibold shadow-md hover:bg-blue-600 transition"
        >
          Sign Up
        </button>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}
