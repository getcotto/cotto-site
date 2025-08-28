"use client";

import { useState } from "react";

export default function KlaviyoForm() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      // Here you would typically send the email to your backend
      console.log("Email submitted:", email);
    }
  };

  if (isSubmitted) {
    return (
      <div className="mt-6 text-center">
        <p className="text-green-600 font-medium">Thanks for joining the waitlist!</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Fallback form - always show since no Klaviyo ID is configured */}
      <div className="mt-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent text-brand-red"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-brand-red text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Join Waitlist
          </button>
        </form>
      </div>
    </div>
  );
}
