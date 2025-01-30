import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md text-center">
        <h1 className="text-4xl font-bold mb-6 text-blue-600">Welcome!</h1>
        <p className="text-gray-600 mb-6">What would you like to do?</p>

        <div className="flex flex-col space-y-4">
          <Link to="/lesson">
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
              Start Lesson
            </button>
          </Link>
          <Link to="/progress">
            <button className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
              View Progress
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
