"use client";

import { useState, useEffect } from "react";

export default function KlaviyoForm() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [klaviyoLoaded, setKlaviyoLoaded] = useState(false);

  useEffect(() => {
    // Check if Klaviyo script is loaded
    const checkKlaviyo = () => {
      if (window._klOnsite) {
        setKlaviyoLoaded(true);
      } else {
        // Try again after a short delay
        setTimeout(checkKlaviyo, 1000);
      }
    };
    
    checkKlaviyo();
  }, []);

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
      {/* Klaviyo embedded form */}
      <div className="klaviyo-form-WsTrqm" />
      
      {/* Fallback form if Klaviyo doesn't load */}
      {!klaviyoLoaded && (
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
      )}
    </div>
  );
}
