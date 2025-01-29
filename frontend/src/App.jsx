import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SignIn from "./pages/SignIn";
import Lesson from "./pages/Lesson"; // Import the lesson component
import Progress from "./pages/Progress"; // Import the progress component

const Home = () => (
  <div className="flex flex-col items-center p-6">
    <h1 className="text-4xl font-bold mb-4">Welcome to Your Private Teacher</h1>
    <p className="text-lg mb-6">Learn interactively and track your progress with ease.</p>
    <div className="flex space-x-4">
      <Link to="/lesson">
        <button className="bg-blue-500 text-white px-4 py-2 rounded">Start Lesson</button>
      </Link>
      <Link to="/progress">
        <button className="bg-green-500 text-white px-4 py-2 rounded">View Progress</button>
      </Link>
    </div>
  </div>
);

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
            <Route path="/" element={<SignIn />} /> {/* First Page */}
            <Route path="/lesson" element={<Lesson />} />
            <Route path="/progress" element={<Progress />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
