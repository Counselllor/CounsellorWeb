import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getColleges } from "../api/api";

function Colleges() {
  const [colleges, setColleges] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all colleges
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setIsLoading(true);
        const { data } = await getColleges();
        setColleges(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching colleges:", err);
        setError("Failed to load colleges. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchColleges();
  }, []);

  // Search filter
  const filteredColleges = colleges.filter((col) =>
    col.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-100 py-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          Find your <span className="text-blue-600">Dream College</span> here!
        </h1>
        <p className="text-gray-600 mt-2">For the Students, By the Students</p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center mt-6">
        <div className="flex w-2/3 md:w-1/2 items-center border rounded-full overflow-hidden shadow">
          <span className="px-3 text-gray-500">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type college name or university name"
            className="w-full px-4 py-2 outline-none"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <p className="text-center text-red-500 text-lg mt-10">{error}</p>
      )}

      {/* Colleges Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-10">
          {filteredColleges.map((college) => (
          <Link
            to={`/colleges/${college.slug}`}
            key={college._id}
            className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 text-center cursor-pointer"
          >
            {/* College Image */}
            <img
              src={college.imageUrl || "https://via.placeholder.com/150"}
              alt={college.name}
              className="w-24 h-24 object-cover rounded-full mx-auto border mb-3"
            />

            {/* College Info */}
            <h2 className="text-lg font-semibold text-gray-800">
              {college.name}
            </h2>
            <span className="inline-block mt-1 bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
              {college.location}
            </span>

            {college.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {college.description}
              </p>
            )}

            {/* Extra info */}
            <div className="mt-3 space-y-1 text-sm text-gray-700">
              {college.phone && <p>📞 {college.phone}</p>}
              {college.email && <p>✉️ {college.email}</p>}
              {college.websiteUrl && (
                <a
                  href={college.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()} // important!
                >
                  🌐 Visit Website
                </a>
              )}
            </div>
            </Link>
          ))}
        </div>
      )}

      {/* No results message */}
      {!isLoading && !error && filteredColleges.length === 0 && (
        <p className="text-center text-gray-500 text-lg mt-10">
          No colleges found matching your search 🔍
        </p>
      )}
    </div>
  );
}

export default Colleges;