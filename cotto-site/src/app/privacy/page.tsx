import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — COTTO",
};

export default function PrivacyPage() {
  return (
    <div className="container py-16 max-w-3xl">
      <h1 className="text-3xl font-semibold font-display text-brand-red mb-8">Privacy Policy</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Introduction</h2>
          <p className="mb-4">
            COTTO ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our services, or interact with us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Information We Collect</h2>
          <h3 className="text-lg font-medium mb-2">Personal Information</h3>
          <p className="mb-4">
            We may collect personal information that you voluntarily provide to us, including:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Name and email address (when you join our waitlist)</li>
            <li>Contact information (when you reach out to us)</li>
            <li>Message content (when you submit inquiries)</li>
            <li>Social media information (if you interact with us on social platforms)</li>
          </ul>
          
          <h3 className="text-lg font-medium mb-2">Automatically Collected Information</h3>
          <p className="mb-4">
            We may automatically collect certain information about your device and usage, including:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>IP address and browser type</li>
            <li>Pages visited and time spent on our website</li>
            <li>Device information and operating system</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Provide and maintain our services</li>
            <li>Process your waitlist registration</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Send you updates about our products and services</li>
            <li>Improve our website and user experience</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Information Sharing</h2>
          <p className="mb-4">
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>With service providers who assist us in operating our website and business</li>
            <li>To comply with legal requirements or protect our rights</li>
            <li>In connection with a business transfer or merger</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Data Security</h2>
          <p className="mb-4">
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Access and update your personal information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt-out of marketing communications</li>
            <li>Request information about how we process your data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar technologies to enhance your experience on our website. You can control cookie settings through your browser preferences.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Third-Party Services</h2>
          <p className="mb-4">
            Our website may contain links to third-party websites or integrate with third-party services (such as Klaviyo for email marketing). We are not responsible for the privacy practices of these third parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Children's Privacy</h2>
          <p className="mb-4">
            Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="mb-4">
            <strong>Email:</strong> privacy@getcotto.com<br />
            <strong>Website:</strong> getcotto.com
          </p>
        </section>
      </div>
    </div>
  );
}




