import React from "react";

function Footer() {
  return (
    <footer className="bg-blue-100 text-center p-4 mt-10">
      <p className="text-gray-700">© {new Date().getFullYear()} Counselling App</p>
    </footer>
  );
}

export default Footer;