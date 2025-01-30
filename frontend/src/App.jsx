import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import LogIn from "./pages/LogIn";
import Lesson from "./pages/Lesson";
import Progress from "./pages/Progress";

const App = () => {
  return (
    <Router>
      <main className="container mx-auto py-8">
        <Routes>
          <Route path="/" element={<Home />} /> {/* ✅ First Page */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/lesson" element={<Lesson />} />
          <Route path="/progress" element={<Progress />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
