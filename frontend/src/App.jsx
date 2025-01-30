import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import LogIn from "./pages/LogIn";
import Lesson from "./pages/Lesson";
import Progress from "./pages/Progress";
import Dashboard from "./pages/Dashboard"; // Import the Dashboard page
import LessonSummary from "./pages/LessonSummary";

const App = () => {
  return (
    <Router>
      <main className="container mx-auto py-8">
        <Routes>
          <Route path="/" element={<Home />} /> {/* Home Page */}
          <Route path="/signin" element={<SignIn />} /> {/* Sign Up Page */}
          <Route path="/login" element={<LogIn />} /> {/* Log In Page */}
          <Route path="/dashboard" element={<Dashboard />} /> {/* Dashboard */}
          <Route path="/lesson" element={<Lesson />} /> {/* Lesson */}
          <Route path="/progress" element={<Progress />} /> {/* Progress */}
          <Route path="/lesson-summary" element={<LessonSummary />} /> {/* lesson summary */}
        </Routes>
      </main>
    </Router>
  );
};

export default App;
