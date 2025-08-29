"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      // Send to contact API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          source: 'contact_form'
        }),
      });

      if (response.ok) {
        setStatus("Thanks! We received your message.");
        setFormData({ name: "", email: "", message: "" });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setStatus(errorData.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setStatus("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-brand-red">Name</label>
        <input 
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent" 
          required 
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-red">Email</label>
        <input 
          type="email" 
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent" 
          required 
          placeholder="your.email@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-red">Message (optional)</label>
        <textarea 
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent" 
          rows={4} 
          placeholder="Your message here..."
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-md bg-brand-red text-white px-6 py-3 text-base font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        data-analytics="cta_click"
      >
        {isSubmitting ? "Sending..." : "Send"}
      </button>
      {status && (
        <p className={`text-sm ${status.includes("Thanks") ? "text-green-600" : "text-red-600"}`}>
          {status}
        </p>
      )}
    </form>
  );
}


