import { useLocation, useNavigate } from "react-router-dom";

export default function LessonContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const lessonContent = location.state?.lessonContent || [];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-4xl">
        <h2 className="text-3xl font-bold mb-6 text-center text-indigo-600">
          Lesson Content
        </h2>
        {lessonContent.length === 0 ? (
          <p className="text-gray-600 text-center">No lesson content available.</p>
        ) : (
          lessonContent.map((segment, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg shadow-md p-6 mb-4"
            >
              <h3 className="text-xl font-semibold text-indigo-600 mb-2">
                {segment.sub_subject}
              </h3>
              <p className="text-gray-700">{segment.lesson_segment}</p>
            </div>
          ))
        )}
        <button
          onClick={() => navigate("/lesson")}
          className="mt-6 bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition"
        >
          Back to Start
        </button>
      </div>
    </div>
  );
}
