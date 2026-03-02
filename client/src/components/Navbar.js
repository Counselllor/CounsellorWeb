

import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import { markNotificationAsRead, markAllNotificationsAsRead } from "../api/api";
import logo from "../assets/logo.svg";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(localStorage.getItem("user") || "{}") : null;

  // Socket context for real-time notifications
  const socketCtx = useSocket();
  const unreadCount = socketCtx?.unreadCount || 0;
  const notifications = socketCtx?.notifications || [];

  // Handle scroll for sticky navbar shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
    setIsNotificationOpen(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  // Handle keyboard navigation (Escape to close)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsProfileDropdownOpen(false);
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Dispatch auth-change for SocketProvider to disconnect
      window.dispatchEvent(new Event("auth-change"));
      navigate("/login", { replace: true });
      window.location.reload();
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsProfileDropdownOpen(false);
    setIsNotificationOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    setIsNotificationOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsProfileDropdownOpen(false);
  };

  // Mark single notification as read
  const handleMarkRead = useCallback(async (id) => {
    try {
      await markNotificationAsRead(id);
      if (socketCtx) {
        socketCtx.setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        socketCtx.setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, [socketCtx]);

  // Mark all as read
  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      if (socketCtx) {
        socketCtx.setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        socketCtx.setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  }, [socketCtx]);

  // Format relative time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Notification type icon
  const getIcon = (type) => {
    switch (type) {
      case "connection_request": return "🔗";
      case "connection_accepted": return "✅";
      case "connection_rejected": return "❌";
      default: return "🔔";
    }
  };

  // Check if route is active
  const isActive = (path) => location.pathname === path;

  // Navigation links configuration
  const navLinks = [
    { path: "/colleges", label: "Colleges", icon: "🎓" },
    { path: "/chat", label: "Chat", icon: "💬", requiresAuth: true },
    { path: "/topUniversity", label: "Top Universities", icon: "🏆" },
    { path: "/jobs", label: "Jobs", icon: "💼" },
    { path: "/courses", label: "Courses", icon: "📚" },
    { path: "/support", label: "Career Support", icon: "🎯" },
  ];

  // Filter links based on auth status
  const visibleLinks = navLinks.filter(link => !link.requiresAuth || token);

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${isScrolled ? "shadow-lg" : "shadow-md"
        }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo - Always visible */}
          <Link
            to={token ? "/colleges" : "/login"}
            className="flex items-center space-x-2 sm:space-x-3 group outline-none rounded-lg px-2 py-1 -ml-2"
            aria-label="Counsellor App Home"
          >
            <img
              src={logo}
              alt=""
              className="h-8 w-8 sm:h-10 sm:w-10 transition-transform group-hover:scale-110"
              aria-hidden="true"
            />
            <span className="font-bold text-lg sm:text-xl text-blue-700 group-hover:text-blue-800 transition-colors">
              Counsellor
            </span>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {visibleLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive(link.path)
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                aria-current={isActive(link.path) ? "page" : undefined}
              >
                <span className="mr-1" aria-hidden="true">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section - Notification Bell + Auth/Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            {/* ── NOTIFICATION BELL ────────────────────────── */}
            {token && user && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                  aria-expanded={isNotificationOpen}
                  aria-haspopup="true"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>

                  {/* Unread Badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] animate-pulse">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    {/* Dropdown Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-blue-100 hover:text-white transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notification Items */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <span className="text-3xl block mb-2">🔔</span>
                          <p className="text-sm text-gray-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => {
                              if (!notif.isRead) handleMarkRead(notif._id);
                            }}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${!notif.isRead ? "bg-blue-50/60" : ""
                              }`}
                          >
                            {/* Sender avatar */}
                            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                              {notif.sender?.name?.charAt(0) || notif.sender?.username?.charAt(0) || "?"}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notif.isRead ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                                <span className="mr-1">{getIcon(notif.type)}</span>
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {formatTime(notif.createdAt)}
                              </p>
                            </div>

                            {/* Unread dot */}
                            {!notif.isRead && (
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Dropdown Footer */}
                    <Link
                      to="/notifications"
                      onClick={() => setIsNotificationOpen(false)}
                      className="block px-4 py-3 text-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-t border-gray-200 transition-colors"
                    >
                      View all notifications →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ── PROFILE DROPDOWN (Desktop) ─────────────── */}
            {token && user ? (
              <div className="hidden md:block relative" ref={profileDropdownRef}>
                <button
                  onClick={toggleProfileDropdown}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-expanded={isProfileDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700">
                    {user.name || user.username}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${isProfileDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{user.name || user.username}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.role && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {user.role}
                        </span>
                      )}
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="mr-2" aria-hidden="true">👤</span>
                      My Profile
                    </Link>
                    <Link
                      to="/notifications"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="mr-2" aria-hidden="true">🔔</span>
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        to="/admin/colleges"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <span className="mr-2" aria-hidden="true">⚙️</span>
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span className="mr-2" aria-hidden="true">🚪</span>
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Not logged in - Show Login/Register buttons (Desktop only)
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Slide in from right */}
      <div
        id="mobile-menu"
        ref={mobileMenuRef}
        className={`md:hidden fixed inset-y-0 right-0 w-64 sm:w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <span className="font-bold text-lg text-blue-700">Menu</span>
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close mobile menu"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Content - Scrollable */}
          <div className="flex-1 overflow-y-auto py-4">
            {/* User Info (if logged in) */}
            {token && user && (
              <div className="px-4 py-3 mb-4 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="px-2 space-y-1">
              {visibleLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all min-h-[44px] ${isActive(link.path)
                    ? "bg-blue-100 text-blue-700 shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                    }`}
                  aria-current={isActive(link.path) ? "page" : undefined}
                >
                  <span className="mr-3 text-xl" aria-hidden="true">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Profile & Notification Links (if logged in) */}
            {token && user && (
              <div className="px-2 mt-4 pt-4 border-t border-gray-200 space-y-1">
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-all min-h-[44px]"
                >
                  <span className="mr-3 text-xl" aria-hidden="true">👤</span>
                  My Profile
                </Link>
                <Link
                  to="/notifications"
                  className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-all min-h-[44px]"
                >
                  <span className="mr-3 text-xl" aria-hidden="true">🔔</span>
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                {user.role === "admin" && (
                  <Link
                    to="/admin/colleges"
                    className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-all min-h-[44px]"
                  >
                    <span className="mr-3 text-xl" aria-hidden="true">⚙️</span>
                    Admin Panel
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Footer - Auth Actions */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            {token ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <span className="mr-2" aria-hidden="true">🚪</span>
                Log Out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-all min-h-[44px]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm hover:shadow-md transition-all min-h-[44px]"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}

export default Navbar;