// client/src/pages/CollegeDetail.js
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getCollegeBySlug, getStudentsByCollege, sendConnectionRequest } from "../api/api";

export default function CollegeDetail() {
  const { slug } = useParams();
  const [college, setCollege] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollegeData = async () => {
      try {
        setIsLoading(true);
        const collegeRes = await getCollegeBySlug(slug);

        if (!collegeRes.data || collegeRes.data.message) {
          throw new Error("College not found");
        }

        setCollege(collegeRes.data);

        // Fetch students from this college
        try {
          const studentsRes = await getStudentsByCollege(collegeRes.data._id);
          setStudents(studentsRes.data);
        } catch {
          // Students fetch may fail if no students - that's okay
          setStudents([]);
        }

        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load college details");
        setCollege(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollegeData();
  }, [slug]);

  const sendRequest = async (studentId) => {
    try {
      await sendConnectionRequest(studentId, 1);
      toast.success("Connection request sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500 text-lg">{error || "College not found"}</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 p-6">
      {/* College info left side */}
      <div className="w-1/2 bg-blue-100 p-6 rounded-lg">
        <h1 className="text-2xl font-bold">{college.name}</h1>
        <p className="mt-2">{college.description}</p>
        <p className="mt-2">📍 {college.location}</p>
        {college.websiteUrl && (
          <a
            href={college.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded mt-4"
          >
            Visit Website
          </a>
        )}
      </div>

      {/* Students from this college */}
      <div className="w-1/2">
        <h2 className="text-xl font-bold mb-4">Students from {college.name}</h2>
        {students.length === 0 ? (
          <p>No students found yet.</p>
        ) : (
          students.map((s) => (
            <div key={s._id} className="bg-blue-200 mb-3 p-4 rounded flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{s.username}</h3>
                <p className="text-sm text-gray-700">{s.course} • {s.year}</p>
                <p className="text-xs text-gray-600">⭐ {s.rating}/5</p>
              </div>
              <button
                onClick={() => sendRequest(s._id)}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                Connect
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}