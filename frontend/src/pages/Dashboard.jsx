import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";

export default function Dashboard() {
  const { setUserName } = useUser(); // Get setUserName to reset user session
  const navigate = useNavigate();

  const handleLogout = () => {
    setUserName(""); // Reset the user session
    navigate("/login"); // Redirect to login page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md text-center">
        <h1 className="text-4xl font-bold mb-6 text-blue-600">Welcome!</h1>
        <p className="text-gray-600 mb-6">What would you like to do?</p>

        {/* Button Container */}
        <div className="flex flex-col space-y-6">  {/* Increased spacing */}
          <Link to="/lesson">
            <button className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">
              Start Lesson
            </button>
          </Link>
          <Link to="/progress">
            <button className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition">
              View Progress
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition mt-4"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
