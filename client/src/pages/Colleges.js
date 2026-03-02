

import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getColleges } from "../api/api";
import Footer from "../components/Footer";

function Colleges() {
  const [colleges, setColleges] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState("name"); // 'name', 'location', 'newest'
  const [filterLocation, setFilterLocation] = useState("all");

  // Fetch all colleges
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setIsLoading(true);
        const { data } = await getColleges();
        setColleges(data || []);
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

  // Get unique locations for filter
  const locations = useMemo(() => {
    const locs = colleges.map(c => c.location).filter(Boolean);
    return ["all", ...new Set(locs)];
  }, [colleges]);

  // Filter and sort colleges
  const filteredColleges = useMemo(() => {
    let filtered = colleges.filter((col) => {
      const matchesSearch = col.name.toLowerCase().includes(search.toLowerCase()) ||
        col.location?.toLowerCase().includes(search.toLowerCase());
      const matchesLocation = filterLocation === "all" || col.location === filterLocation;
      return matchesSearch && matchesLocation;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "location":
          return (a.location || "").localeCompare(b.location || "");
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [colleges, search, filterLocation, sortBy]);

  // Loading Skeleton Component
  const CollegeSkeleton = () => (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6 animate-pulse">
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2 mx-auto mb-3"></div>
      <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-5/6 mx-auto"></div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-12 sm:py-16 lg:py-20 text-center px-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 animate-fadeIn">
            Find Your <span className="text-yellow-300">Dream College</span> 🎓
          </h1>
          <p className="text-blue-100 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto">
            For the Students, By the Students
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-white text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏫</span>
              <span>{colleges.length} Colleges</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📍</span>
              <span>{locations.length - 1} Locations</span>
            </div>
          </div>
        </div>

        {/* Search and Filters Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-xl">🔍</span>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by college name or location..."
                className="w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm sm:text-base"
                aria-label="Search colleges"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <span className="text-xl">✕</span>
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Location Filter */}
              <div className="flex-1">
                <label htmlFor="location-filter" className="block text-xs font-medium text-gray-700 mb-1">
                  Filter by Location
                </label>
                <select
                  id="location-filter"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm cursor-pointer"
                >
                  <option value="all">All Locations</option>
                  {locations.filter(loc => loc !== "all").map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="flex-1">
                <label htmlFor="sort-by" className="block text-xs font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm cursor-pointer"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="location">Location</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">View</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-4 py-2 rounded-lg transition-all ${viewMode === "grid"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    aria-label="Grid view"
                    title="Grid view"
                  >
                    <span className="text-lg">▦</span>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-4 py-2 rounded-lg transition-all ${viewMode === "list"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    aria-label="List view"
                    title="List view"
                  >
                    <span className="text-lg">☰</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-blue-600">{filteredColleges.length}</span> of{" "}
              <span className="font-semibold">{colleges.length}</span> colleges
            </div>
          </div>
        </div>

        {/* Loading State with Skeletons */}
        {isLoading && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <CollegeSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Colleges Grid/List */}
        {!isLoading && !error && filteredColleges.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className={viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              : "space-y-4"
            }>
              {filteredColleges.map((college) => (
                <Link
                  to={`/colleges/${college.slug}`}
                  key={college._id}
                  className={`group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 ${viewMode === "list" ? "flex flex-col sm:flex-row" : ""
                    }`}
                >
                  {/* College Image */}
                  <div className={`relative ${viewMode === "list" ? "sm:w-48 sm:flex-shrink-0" : ""}`}>
                    <img
                      src={college.imageUrl || "https://via.placeholder.com/300x200?text=College"}
                      alt={college.name}
                      className={`object-cover ${viewMode === "grid"
                        ? "w-full h-48 sm:h-56"
                        : "w-full h-48 sm:h-full"
                        }`}
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-blue-600">
                      {college.location || "Location N/A"}
                    </div>
                  </div>

                  {/* College Info */}
                  <div className="p-4 sm:p-6 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {college.name}
                    </h2>

                    {college.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 sm:line-clamp-3">
                        {college.description}
                      </p>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-1.5 text-sm text-gray-700 mb-4">
                      {college.phone && (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">📞</span>
                          <span className="truncate">{college.phone}</span>
                        </div>
                      )}
                      {college.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">✉️</span>
                          <span className="truncate">{college.email}</span>
                        </div>
                      )}
                      {college.websiteUrl && (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">🌐</span>
                          <span className="text-blue-600 truncate">Website Available</span>
                        </div>
                      )}
                    </div>

                    {/* View Details Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                        View Details →
                      </span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full group-hover:animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-600 rounded-full group-hover:animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-pink-600 rounded-full group-hover:animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - No Results */}
        {!isLoading && !error && filteredColleges.length === 0 && (
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Colleges Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find any colleges matching your search criteria.
              <br />
              Try adjusting your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setFilterLocation("all");
                setSortBy("name");
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default Colleges;