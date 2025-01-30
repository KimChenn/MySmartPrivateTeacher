import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-4xl font-bold mb-6 text-indigo-600">Welcome to Your Private Teacher</h1>
        <p className="text-gray-600 mb-6">Learn interactively and track your progress with ease.</p>

        <div className="flex flex-col space-y-4">
          <Link to="/signin">
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
              Sign Up
            </button>
          </Link>
          <Link to="/login">
            <button className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
              Log In
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
