

import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getCollegeBySlug, getStudentsByCollege, getCoursesByCollege, sendConnectionRequest, getConnectionRequests } from "../api/api";
import Footer from "../components/Footer";

export default function CollegeDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [college, setCollege] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // Store all students
  const [courses, setCourses] = useState([]); // Available courses
  const [selectedCourse, setSelectedCourse] = useState("all"); // Course filter
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'students', 'contact'
  const [sendingRequest, setSendingRequest] = useState({});
  const [connectionStatuses, setConnectionStatuses] = useState({}); // { [userId]: "pending"|"accepted"|"rejected" }

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Fetch college data and courses
  useEffect(() => {
    const fetchCollegeData = async () => {
      try {
        setIsLoading(true);
        const collegeRes = await getCollegeBySlug(slug);

        if (!collegeRes.data || collegeRes.data.message) {
          throw new Error("College not found");
        }

        setCollege(collegeRes.data);

        // Fetch all students from this college
        try {
          const studentsRes = await getStudentsByCollege(collegeRes.data._id);
          setAllStudents(studentsRes.data || []);
          setStudents(studentsRes.data || []);
        } catch {
          setAllStudents([]);
          setStudents([]);
        }

        // Fetch available courses
        try {
          const coursesRes = await getCoursesByCollege(collegeRes.data._id);
          setCourses(coursesRes.data || []);
        } catch {
          setCourses([]);
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

  // Fetch existing connection statuses so buttons show correct state
  useEffect(() => {
    const fetchConnectionStatuses = async () => {
      try {
        const { data } = await getConnectionRequests();
        const statuses = {};
        data.forEach((conn) => {
          const otherId =
            String(conn.from?._id || conn.from) === String(currentUser.id)
              ? String(conn.to?._id || conn.to)
              : String(conn.from?._id || conn.from);
          statuses[otherId] = conn.status;
        });
        setConnectionStatuses(statuses);
      } catch (err) {
        // Not critical — buttons will default to "Connect"
        console.error("Error fetching connections:", err);
      }
    };

    if (currentUser.id) {
      fetchConnectionStatuses();
    }
  }, [currentUser.id]);

  // Filter students by course
  useEffect(() => {
    if (selectedCourse === "all") {
      setStudents(allStudents);
    } else {
      setStudents(allStudents.filter(s => s.course === selectedCourse));
    }
  }, [selectedCourse, allStudents]);

  const sendRequest = async (studentId) => {
    setSendingRequest({ ...sendingRequest, [studentId]: true });
    try {
      await sendConnectionRequest(studentId, 1);
      toast.success("Connection request sent! 🎉");
      // Update button state to "Request Sent"
      setConnectionStatuses((prev) => ({ ...prev, [studentId]: "pending" }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setSendingRequest({ ...sendingRequest, [studentId]: false });
    }
  };

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          {/* Hero Skeleton */}
          <div className="h-64 sm:h-80 lg:h-96 bg-gray-300"></div>

          {/* Content Skeleton */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !college) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">College Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The college you're looking for doesn't exist."}</p>
          <button
            onClick={() => navigate("/colleges")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            ← Back to Colleges
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section with College Image */}
        <div className="relative h-64 sm:h-80 lg:h-96 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
          {college.imageUrl ? (
            <img
              src={college.imageUrl}
              alt={college.name}
              className="w-full h-full object-cover opacity-40"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-9xl opacity-20">🎓</span>
            </div>
          )}

          {/* Overlay Content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
              {/* Breadcrumbs */}
              <nav className="mb-4" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm text-white/80">
                  <li>
                    <Link to="/colleges" className="hover:text-white transition-colors">
                      Colleges
                    </Link>
                  </li>
                  <li>→</li>
                  <li className="text-white font-medium truncate">{college.name}</li>
                </ol>
              </nav>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                {college.name}
              </h1>
              {college.location && (
                <p className="text-lg sm:text-xl text-white/90 flex items-center gap-2">
                  <span>📍</span>
                  {college.location}
                </p>
              )}
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate("/colleges")}
            className="absolute top-4 left-4 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-800 rounded-lg hover:bg-white transition-all shadow-lg flex items-center gap-2 min-h-[44px]"
            aria-label="Back to colleges"
          >
            <span>←</span>
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
              {[
                { id: "overview", label: "Overview", icon: "📋" },
                { id: "students", label: `Students (${students.length})`, icon: "👥" },
                { id: "contact", label: "Contact", icon: "📞" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">About {college.name}</h2>
                    {college.description ? (
                      <p className="text-gray-600 leading-relaxed">{college.description}</p>
                    ) : (
                      <p className="text-gray-400 italic">No description available.</p>
                    )}
                  </div>

                  {college.websiteUrl && (
                    <div>
                      <a
                        href={college.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg min-h-[44px]"
                      >
                        <span>🌐</span>
                        Visit Official Website
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Students Tab */}
              {activeTab === "students" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Students from {college.name}
                    </h2>

                    {/* Course Filter */}
                    {courses.length > 0 && (
                      <div className="flex items-center gap-2">
                        <label htmlFor="course-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          Filter by Course:
                        </label>
                        <select
                          id="course-filter"
                          value={selectedCourse}
                          onChange={(e) => setSelectedCourse(e.target.value)}
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500 transition-all min-h-[44px] bg-white"
                        >
                          <option value="all">All Courses ({allStudents.length})</option>
                          {courses.map((course) => (
                            <option key={course} value={course}>
                              {course} ({allStudents.filter(s => s.course === course).length})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {students.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                      <div className="text-6xl mb-4">👥</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Students Yet</h3>
                      <p className="text-gray-600">
                        Be the first student to join from this college!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {students.map((student) => (
                        <div
                          key={student._id}
                          className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 sm:p-6"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                {student.name || student.username}
                              </h3>
                              {student.course && (
                                <p className="text-sm text-gray-600">
                                  📚 {student.course}
                                  {student.year && ` • Year ${student.year}`}
                                </p>
                              )}
                              {student.rating && (
                                <p className="text-sm text-yellow-600 mt-1">
                                  ⭐ {student.rating}/5
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Connect Button — 3 states: Connected / Request Sent / Connect */}
                          {String(student._id) !== String(currentUser.id) && (
                            connectionStatuses[student._id] === "accepted" ? (
                              <button
                                disabled
                                className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium min-h-[44px] flex items-center justify-center gap-2 cursor-default"
                              >
                                <span>✅</span> Connected
                              </button>
                            ) : connectionStatuses[student._id] === "pending" ? (
                              <button
                                disabled
                                className="w-full px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium min-h-[44px] flex items-center justify-center gap-2 cursor-default"
                              >
                                <span>⏳</span> Request Sent
                              </button>
                            ) : (
                              <button
                                onClick={() => sendRequest(student._id)}
                                disabled={sendingRequest[student._id]}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all shadow-sm hover:shadow-md min-h-[44px] flex items-center justify-center gap-2"
                              >
                                {sendingRequest[student._id] ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <span>🤝</span>
                                    Connect
                                  </>
                                )}
                              </button>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === "contact" && (
                <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Information</h2>

                  <div className="space-y-3">
                    {college.phone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-2xl">📞</span>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Phone</p>
                          <a href={`tel:${college.phone}`} className="text-blue-600 hover:underline">
                            {college.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {college.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-2xl">✉️</span>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Email</p>
                          <a href={`mailto:${college.email}`} className="text-blue-600 hover:underline">
                            {college.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {college.location && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-2xl">📍</span>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Location</p>
                          <p className="text-gray-800">{college.location}</p>
                        </div>
                      </div>
                    )}

                    {!college.phone && !college.email && !college.location && (
                      <p className="text-gray-400 italic text-center py-8">
                        No contact information available.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Students</span>
                    <span className="font-semibold text-blue-600">{students.length}</span>
                  </div>
                  {college.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Location</span>
                      <span className="font-semibold text-gray-800">{college.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Share Section */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Share</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm min-h-[44px]"
                    title="Copy link"
                  >
                    🔗
                  </button>
                  <button
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out ${college.name}&url=${window.location.href}`, '_blank')}
                    className="flex-1 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors text-sm min-h-[44px]"
                    title="Share on Twitter"
                  >
                    🐦
                  </button>
                  <button
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')}
                    className="flex-1 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors text-sm min-h-[44px]"
                    title="Share on Facebook"
                  >
                    📘
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}