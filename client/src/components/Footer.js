/**
 * FOOTER COMPONENT - FULLY RESPONSIVE & ACCESSIBLE
 *
 * IMPROVEMENTS MADE:
 * ✅ Responsive multi-column layout (stacks on mobile)
 * ✅ Proper spacing and padding for all screen sizes
 * ✅ Social media links with hover effects
 * ✅ Quick links navigation
 * ✅ Contact information
 * ✅ Newsletter subscription (placeholder)
 * ✅ Accessibility improvements with ARIA labels
 * ✅ Semantic HTML structure
 *
 * RESPONSIVE BREAKPOINTS:
 * - Mobile (< 640px): Single column, stacked layout
 * - Tablet (640px - 1024px): 2 columns
 * - Desktop (≥ 1024px): 4 columns
 */

/** Footer component for the application
 * added Icon function for rendering SVG icons based on name props.
 * updated Footer component with new revised ui.
 * other functions and feature remain the same, including social media links, quick links, contact information, and copyright.
 */

import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    book: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />,
    briefcase: <path d="M9 6V4h6v2m5 4H4m1-4h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm5 7h4" />,
    graduation: <path d="m3 9 9-5 9 5-9 5-9-5Zm3 3v4.5c3.5 2.3 8.5 2.3 12 0V12m3-3v6" />,
    spark: <path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Zm7 13 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
        <path d="M8 6H5a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3h1" />
        <path d="M16 6h3a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3h-1" />
        <path d="M12 13v4" />
        <path d="M8.5 20h7M9.5 17h5a1 1 0 0 1 1 1v2h-7v-2a1 1 0 0 1 1-1Z" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      </>
    ),
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
    x: (
      <>
        <path d="M4 4l11.733 16H20L8.267 4H4Z" />
        <path d="M4 20l6.768-6.768m2.46-2.46L20 4" />
      </>
    ),
    facebook: (
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2Z" />
    ),
    linkedin: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    ),
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-9.2 6a1.5 1.5 0 0 1-1.6 0L2 7" />
      </>
    ),
    heart: (
      <path
        stroke="#ef4444"
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8Z"
      />
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    quickLinks: [
      { label: "Colleges", path: "/colleges" },
      { label: "Top Universities", path: "/topUniversity" },
      { label: "Courses", path: "/courses" },
      { label: "Jobs", path: "/jobs" },
    ],
    support: [
      { label: "Career Support", path: "/support" },
      { label: "About Us", path: "/about" },
      { label: "Contact", path: "/contact" },
      { label: "FAQ", path: "/faq" },
    ],
    legal: [
      { label: "Privacy Policy", path: "/privacy" },
      { label: "Terms of Service", path: "/terms" },
      { label: "Cookie Policy", path: "/cookies" },
      { label: "Disclaimer", path: "/disclaimer" },
    ],
  };

  const socialLinks = [
    { name: "Facebook", icon: <Icon name="facebook" />, url: "https://facebook.com", ariaLabel: "Visit our Facebook page" },
    { name: "Twitter", icon: <Icon name="x" />, url: "https://twitter.com", ariaLabel: "Visit our Twitter profile" },
    { name: "LinkedIn", icon: <Icon name="linkedin" />, url: "https://linkedin.com", ariaLabel: "Visit our LinkedIn page" },
    { name: "Instagram", icon: <Icon name="instagram" />, url: "https://instagram.com", ariaLabel: "Visit our Instagram profile" },
  ];

  return (
    <footer className="site-footer" role="contentinfo">
      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"> */}
        {/* Main Footer Content */}
        <div className="footer-grid">

          {/* Brand Section */}
          <div className="footer-about">
            <div className="brand footer-brand">
              <img src={logo} alt="" className="h-10 w-10" aria-hidden="true" />
              <span>Counsellor</span>
            </div>
            <p>
              Empowering students to find their dream colleges and connect with peers.
              For the Students, By the Students.
            </p>
            {/* Social Links */}
            <div className="footer-shortcuts">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:shadow-md hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={social.ariaLabel}
                  title={social.name}
                >
                  <span className="text-xl" aria-hidden="true">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Quick Links</h3>
            <ul className="space-y-2">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-600 hover:text-blue-600 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="footer-column">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-600 hover:text-blue-600 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Contact */}
          <div className="footer-column footer-contact">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Legal</h3>
            <ul className="space-y-2 mb-4">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-600 hover:text-blue-600 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="flex items-center">
                <Icon name="mail" />
                <a href="mailto:support@counselling.com" className="contact-link  hover:text-blue-600 hover:underline">
                  support@counselling.com
                </a>
              </p>
              <p className="flex items-center">
                <Icon name="phone" />
                <a href="tel:+1234567890" className="contact-link  hover:text-blue-600 hover:underline">
                  +1 (234) 567-890
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-blue-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-gray-600 text-center sm:text-left">
              © {currentYear} Counselling App. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="hidden sm:inline">Developed by Dotjson01 |</span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">Made with <Icon name="heart" /> for students</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-xs font-medium"
                aria-label="Scroll to top"
              >
                ↑ Back to Top
              </button>
            </div>
          </div>
        </div>
      {/* </div> */}
    </footer>
  );
}

export default Footer;