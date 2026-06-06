import backgroundImage from "../image/background-login.jpeg";
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Email:", email);
    console.log("Password:", password);
    // TODO: Replace with real authentication.
    // For now, mark authenticated and navigate to dashboard on submit.
    try {
      localStorage.setItem('isAuthenticated', 'true');
      // notify other components in the same window
      window.dispatchEvent(new Event('authChange'));
    } catch (err) {
      // ignore storage errors
    }
    navigate('/dashboard');
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-40px)] bg-gradient-to-br from-indigo-100 to-indigo-300"
        style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '100vh', width: '100vw', overflow: 'hidden', position: 'fixed', top: 49, left: 0 }}
    >
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md top-20 left-100 mb-20">
        <h2 className="text-2xl font-bold text-indigo-800 text-center mb-6">
          HR Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
