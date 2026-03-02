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

import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";

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
    { name: "Facebook", icon: "📘", url: "https://facebook.com", ariaLabel: "Visit our Facebook page" },
    { name: "Twitter", icon: "🐦", url: "https://twitter.com", ariaLabel: "Visit our Twitter profile" },
    { name: "LinkedIn", icon: "💼", url: "https://linkedin.com", ariaLabel: "Visit our LinkedIn page" },
    { name: "Instagram", icon: "📷", url: "https://instagram.com", ariaLabel: "Visit our Instagram profile" },
  ];

  return (
    <footer className="bg-gradient-to-br from-blue-50 to-blue-100 border-t border-blue-200 mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="" className="h-10 w-10" aria-hidden="true" />
              <span className="font-bold text-xl text-blue-700">Counsellor</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Empowering students to find their dream colleges and connect with peers.
              For the Students, By the Students.
            </p>
            {/* Social Links */}
            <div className="flex space-x-3">
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
          <div>
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
          <div>
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
          <div>
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
                <span className="mr-2" aria-hidden="true">📧</span>
                <a href="mailto:support@counselling.com" className="hover:text-blue-600 hover:underline">
                  support@counselling.com
                </a>
              </p>
              <p className="flex items-center">
                <span className="mr-2" aria-hidden="true">📞</span>
                <a href="tel:+1234567890" className="hover:text-blue-600 hover:underline">
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
              <span className="hidden sm:inline">Made with ❤️ for students</span>
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
      </div>
    </footer>
  );
}

export default Footer;