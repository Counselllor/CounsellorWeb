// client/src/pages/CollegeDetail.js
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function CollegeDetail() {
  const { slug } = useParams();
  const [college, setCollege] = useState(null);
  const [students, setStudents] = useState([]);

 useEffect(() => {
  axios.get(`http://localhost:5000/api/colleges/${slug}`)
    .then(res => {
      if (!res.data || res.data.message) {
        throw new Error("College not found");
      }
      setCollege(res.data);

      return axios.get(`http://localhost:5000/api/students/college/${res.data._id}`);
    })
    .then(res => setStudents(res.data))
    .catch(err => {
      console.error(err);
      setCollege(null); // helps show fallback message
    });
}, [slug]);

  const sendRequest = async (studentId) => {
    await axios.post(
      "/api/connections",
      { to: studentId, level: 1 },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    alert("Request Sent!");
  };

  if (!college) return <p>Loading...</p>;

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