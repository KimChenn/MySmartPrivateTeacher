import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";

// Components
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

const Lesson = () => (
  <div className="p-6">
    <h2 className="text-2xl font-semibold mb-4">Lesson Interface</h2>
    <p>Interactive teaching content will appear here.</p>
    <Button className="mt-4">Start New Lesson</Button>
  </div>
);

const Progress = () => (
  <div className="p-6">
    <h2 className="text-2xl font-semibold mb-4">Progress Dashboard</h2>
    <p>Visual representation of your progress.</p>
    {/* Placeholder for graphs */}
    <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
      Progress Graph Placeholder
    </div>
  </div>
);

const NotFound = () => (
  <div className="flex flex-col items-center p-6">
    <h1 className="text-4xl font-bold mb-4">404</h1>
    <p className="text-lg">Page not found. Return to <Link to="/" className="text-blue-500">Home</Link>.</p>
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