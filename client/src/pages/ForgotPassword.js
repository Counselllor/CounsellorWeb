/**
 * FORGOT PASSWORD PAGE — Production-Ready Implementation
 *
 * EDGE CASES HANDLED:
 * 1. Invalid/malformed email → client-side regex + server-side express-validator
 * 2. Non-existent email → backend returns generic success (no user enumeration)
 * 3. Network failures → try/catch with toast error, form re-enabled
 * 4. Rate limiting → server: 3 req/15min. Client: 60s cooldown timer
 * 5. Multiple rapid submissions → isSubmitting flag disables button instantly
 * 6. Already-requested reset → server overwrites old token, client shows cooldown
 * 7. Expired/used tokens → server validates expiry and clears after use
 * 8. User closes page mid-request → AbortController cancels in-flight fetch
 *
 * DESIGN DECISIONS:
 * - Matches Login page visual style (blue-purple gradients, two-column layout)
 * - Uses same validation pattern (touched/errors/handleBlur) as Login & Register
 * - 60s client-side cooldown prevents accidental spam without blocking determined users
 * - Success state replaces form entirely — clear visual feedback
 * - All state managed via useState hooks — no external state library needed for this scope
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { forgotPassword } from "../api/api";
import Footer from "../components/Footer";

function ForgotPassword() {
    // ─── STATE ──────────────────────────────────────────────────────
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [touched, setTouched] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    // AbortController ref — used to cancel in-flight requests if component unmounts
    // WHY useRef instead of useState? We don't want re-renders when the controller changes,
    // and we need the latest reference in cleanup functions
    const abortControllerRef = useRef(null);

    // ─── REDIRECT IF ALREADY LOGGED IN ─────────────────────────────
    // Consistent with Login/Register behavior
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            window.location.href = "/colleges";
        }
    }, []);

    // ─── COOLDOWN TIMER ─────────────────────────────────────────────
    // WHY client-side cooldown? Provides immediate UX feedback without
    // hitting the server rate limiter. The server-side limiter (3 req/15min)
    // is the actual security control — this is purely UX.
    useEffect(() => {
        if (cooldownSeconds <= 0) return;

        const timer = setInterval(() => {
            setCooldownSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [cooldownSeconds]);

    // ─── CLEANUP: Cancel in-flight requests on unmount ───────────────
    // EDGE CASE #8: If user navigates away mid-request, we abort the fetch
    // to prevent state updates on unmounted components (React memory leak warning)
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // ─── EMAIL VALIDATION ───────────────────────────────────────────
    // WHY this regex? It matches the same pattern used in Login.js and Register.js
    // for consistency. It catches common typos (missing @, missing domain, spaces)
    // without being overly strict (RFC 5322 compliance is unnecessary for UX validation)
    const validateEmail = useCallback((value) => {
        if (!value.trim()) {
            return "Email address is required";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return "Please enter a valid email address";
        }
        return "";
    }, []);

    const handleChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        // Only validate on change if user has already interacted (touched)
        // WHY? Showing errors before the user has finished typing is annoying
        if (touched) {
            setError(validateEmail(value));
        }
    };

    const handleBlur = () => {
        setTouched(true);
        setError(validateEmail(email));
    };

    // ─── FORM SUBMISSION ────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate before submission
        const validationError = validateEmail(email);
        setTouched(true);
        setError(validationError);

        if (validationError) {
            toast.error("Please enter a valid email address");
            return;
        }

        // EDGE CASE #5: Prevent multiple rapid submissions
        // isSubmitting is set synchronously before the async call,
        // so even rapid double-clicks can't trigger two submissions
        if (isSubmitting || cooldownSeconds > 0) return;

        setIsSubmitting(true);

        // Create AbortController for this specific request
        // EDGE CASE #8: Allows cleanup if component unmounts mid-request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            await forgotPassword(email, { signal: controller.signal });

            setIsSuccess(true);
            // EDGE CASE #4 & #6: Start 60s cooldown after successful submission
            // WHY 60 seconds? Balances between preventing spam and not frustrating
            // users who may have entered the wrong email
            setCooldownSeconds(60);
            toast.success("Reset link sent! Check your email inbox.");
        } catch (err) {
            // Don't show error if request was intentionally aborted (unmount)
            if (err.name === "AbortError" || err.code === "ERR_CANCELED") return;

            // EDGE CASE #3 & #4: Handle network failures and rate limiting
            if (err.response?.status === 429) {
                // Rate limited by server — show specific message
                toast.error(
                    err.response.data?.message ||
                    "Too many requests. Please try again later."
                );
                setCooldownSeconds(60);
            } else if (!err.response) {
                // Network error (no response at all)
                toast.error(
                    "Network error. Please check your connection and try again."
                );
            } else {
                // Other server errors
                toast.error(
                    err.response?.data?.message ||
                    "Something went wrong. Please try again."
                );
            }
        } finally {
            setIsSubmitting(false);
            abortControllerRef.current = null;
        }
    };

    // ─── RESEND HANDLER ─────────────────────────────────────────────
    // Allows resending after cooldown expires
    const handleResend = () => {
        if (cooldownSeconds > 0) return;
        setIsSuccess(false);
        setEmail("");
        setError("");
        setTouched(false);
    };

    // ─── RENDER ─────────────────────────────────────────────────────
    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl w-full bg-white shadow-2xl rounded-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden animate-scaleIn">

                    {/* LEFT — FORM / SUCCESS STATE */}
                    <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">

                        {!isSuccess ? (
                            /* ─── REQUEST FORM ─────────────────────────────────── */
                            <>
                                <div className="mb-6 sm:mb-8">
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-800">
                                        Forgot Password? 🔐
                                    </h1>
                                    <p className="text-base sm:text-lg font-medium text-gray-600">
                                        No worries! Enter your email and we'll send you a reset link.
                                    </p>
                                </div>

                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-5 sm:space-y-6"
                                    noValidate
                                    aria-label="Forgot password form"
                                >
                                    {/* Email Field */}
                                    <div>
                                        <label
                                            htmlFor="forgot-email"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <div
                                            className={`flex items-center border-2 rounded-lg px-3 py-2.5 sm:py-3 transition-all ${error && touched
                                                    ? "border-red-500 bg-red-50"
                                                    : "border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
                                                }`}
                                        >
                                            <span
                                                className="text-gray-400 mr-2 text-lg"
                                                aria-hidden="true"
                                            >
                                                ✉️
                                            </span>
                                            <input
                                                id="forgot-email"
                                                name="email"
                                                type="email"
                                                placeholder="your.email@example.com"
                                                value={email}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isSubmitting}
                                                autoFocus
                                                autoComplete="email"
                                                className="w-full outline-none bg-transparent text-sm sm:text-base disabled:opacity-50"
                                                aria-invalid={error && touched ? "true" : "false"}
                                                aria-describedby={
                                                    error && touched ? "email-error" : "email-help"
                                                }
                                                aria-required="true"
                                            />
                                        </div>
                                        {/* Error message */}
                                        {error && touched && (
                                            <p
                                                id="email-error"
                                                className="mt-1 text-xs sm:text-sm text-red-600 flex items-center"
                                                role="alert"
                                            >
                                                <span className="mr-1" aria-hidden="true">
                                                    ⚠️
                                                </span>
                                                {error}
                                            </p>
                                        )}
                                        {/* Help text (visible when no error) */}
                                        {!(error && touched) && (
                                            <p
                                                id="email-help"
                                                className="mt-1 text-xs text-gray-500"
                                            >
                                                Enter the email address associated with your account
                                            </p>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || cooldownSeconds > 0}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg py-3 sm:py-3.5 transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center min-h-[44px]"
                                        aria-label={
                                            isSubmitting
                                                ? "Sending reset link..."
                                                : cooldownSeconds > 0
                                                    ? `Please wait ${cooldownSeconds} seconds`
                                                    : "Send reset link"
                                        }
                                    >
                                        {isSubmitting ? (
                                            <>
                                                {/* Animated spinner — same pattern as Login/Register */}
                                                <svg
                                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    />
                                                </svg>
                                                Sending reset link...
                                            </>
                                        ) : cooldownSeconds > 0 ? (
                                            <>
                                                <span className="mr-2" aria-hidden="true">
                                                    ⏳
                                                </span>
                                                Resend in {cooldownSeconds}s
                                            </>
                                        ) : (
                                            <>
                                                <span className="mr-2" aria-hidden="true">
                                                    📧
                                                </span>
                                                Send Reset Link
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* Back to Login */}
                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-600">
                                        Remember your password?{" "}
                                        <Link
                                            to="/login"
                                            className="text-blue-600 hover:text-blue-700 font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                                        >
                                            Back to Login
                                        </Link>
                                    </p>
                                </div>
                            </>
                        ) : (
                            /* ─── SUCCESS STATE ────────────────────────────────── */
                            <div className="text-center space-y-6" role="status" aria-live="polite">
                                {/* Animated checkmark circle */}
                                <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-scaleIn">
                                    <span
                                        className="text-4xl sm:text-5xl"
                                        aria-hidden="true"
                                    >
                                        ✉️
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                        Check Your Email!
                                    </h2>
                                    <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-relaxed">
                                        If an account exists for{" "}
                                        <span className="font-semibold text-blue-600">
                                            {email}
                                        </span>
                                        , we've sent a password reset link. Please check your inbox
                                        and spam folder.
                                    </p>
                                </div>

                                {/* Security tip */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                                    <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                                        <span className="mr-2" aria-hidden="true">
                                            🛡️
                                        </span>
                                        Security Tips
                                    </h3>
                                    <ul className="text-xs sm:text-sm text-blue-700 space-y-1 list-disc list-inside">
                                        <li>The reset link expires in 1 hour</li>
                                        <li>Don't share the link with anyone</li>
                                        <li>
                                            If you didn't request this, you can safely ignore the
                                            email
                                        </li>
                                    </ul>
                                </div>

                                {/* Action buttons */}
                                <div className="space-y-3">
                                    {/* Resend button with cooldown */}
                                    <button
                                        onClick={handleResend}
                                        disabled={cooldownSeconds > 0}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg py-3 sm:py-3.5 transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
                                        aria-label={
                                            cooldownSeconds > 0
                                                ? `Resend available in ${cooldownSeconds} seconds`
                                                : "Send another reset link"
                                        }
                                    >
                                        {cooldownSeconds > 0 ? (
                                            <>
                                                <span className="mr-2" aria-hidden="true">
                                                    ⏳
                                                </span>
                                                Resend in {cooldownSeconds}s
                                            </>
                                        ) : (
                                            <>
                                                <span className="mr-2" aria-hidden="true">
                                                    🔄
                                                </span>
                                                Didn't receive? Send again
                                            </>
                                        )}
                                    </button>

                                    {/* Back to Login */}
                                    <Link
                                        to="/login"
                                        className="block w-full text-center border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg py-3 sm:py-3.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
                                    >
                                        <span className="mr-2" aria-hidden="true">
                                            ←
                                        </span>
                                        Back to Login
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT — ILLUSTRATION (Hidden on mobile) */}
                    <div className="hidden md:flex bg-gradient-to-br from-blue-100 to-purple-100 justify-center items-center p-8">
                        <div className="text-center space-y-6">
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/6195/6195699.png"
                                alt=""
                                className="max-w-xs lg:max-w-sm mx-auto"
                                aria-hidden="true"
                            />
                            <div className="space-y-2">
                                <h3 className="text-xl lg:text-2xl font-bold text-gray-800">
                                    Secure Password Reset
                                </h3>
                                <p className="text-sm lg:text-base text-gray-600 max-w-sm mx-auto">
                                    Your security is our priority. We'll send a secure link to
                                    reset your password that expires in 1 hour.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default ForgotPassword;
