import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./UserContext"; // ✅ Import UserProvider
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import LogIn from "./pages/LogIn";
import Lesson from "./pages/Lesson";
import Progress from "./pages/Progress";
import Dashboard from "./pages/Dashboard"; 
import LessonSummary from "./pages/LessonSummary";
import NavBar from "./components/NavBar"; 

const App = () => {
  return (
    <UserProvider>
      <Router>
        {/* Add NavBar at the top */}
        <NavBar />

        <main className="container mx-auto py-8">
          <Routes>
            <Route path="/" element={<Home />} /> {/* Home Page */}
            <Route path="/signin" element={<SignUp />} /> {/* Sign Up Page */}
            <Route path="/login" element={<LogIn />} /> {/* Log In Page */}
            <Route path="/dashboard" element={<Dashboard />} /> {/* Dashboard */}
            <Route path="/lesson" element={<Lesson />} /> {/* Lesson */}
            <Route path="/progress" element={<Progress />} /> {/* Progress */}
            <Route path="/lesson-summary" element={<LessonSummary />} /> {/* lesson summary */}
          </Routes>
        </main>
      </Router>
    </UserProvider>
  );
};

export default App;
