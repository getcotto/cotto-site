import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — COTTO",
};

export default function TermsPage() {
  return (
    <div className="container py-16 max-w-3xl">
      <h1 className="text-3xl font-semibold font-display text-brand-red mb-8">Terms of Use</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Agreement to Terms</h2>
          <p className="mb-4">
            By accessing and using the COTTO website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Description of Service</h2>
          <p className="mb-4">
            COTTO provides cottage cheese-based dips and related food products. Our website serves as a platform for information about our products, waitlist registration, and customer communication.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">User Accounts and Registration</h2>
          <p className="mb-4">
            When you register for our waitlist or create an account, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Acceptable Use</h2>
          <p className="mb-4">You agree not to use our services to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Transmit harmful, offensive, or inappropriate content</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with the proper functioning of our website</li>
            <li>Use automated systems to access our services</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Intellectual Property</h2>
          <p className="mb-4">
            All content on this website, including but not limited to text, graphics, logos, images, and software, is the property of COTTO and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written consent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Product Information</h2>
          <p className="mb-4">
            While we strive to provide accurate product information, we do not warrant that product descriptions, pricing, or other content is accurate, complete, reliable, current, or error-free. Product availability and pricing are subject to change without notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Health and Safety</h2>
          <p className="mb-4">
            Our products contain dairy and may contain other allergens. It is your responsibility to read product labels and consult with healthcare professionals if you have food allergies or dietary restrictions. We are not liable for any adverse reactions to our products.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Limitation of Liability</h2>
          <p className="mb-4">
            To the maximum extent permitted by law, COTTO shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising out of or relating to your use of our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Disclaimer of Warranties</h2>
          <p className="mb-4">
            Our services are provided "as is" and "as available" without warranties of any kind, either express or implied. We disclaim all warranties, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Third-Party Links</h2>
          <p className="mb-4">
            Our website may contain links to third-party websites. We are not responsible for the content, privacy policies, or practices of any third-party websites. You access these links at your own risk.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Governing Law</h2>
          <p className="mb-4">
            These terms shall be governed by and construed in accordance with the laws of the state in which COTTO operates, without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on this page and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Severability</h2>
          <p className="mb-4">
            If any provision of these terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these terms will otherwise remain in full force and effect.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-brand-red mb-4">Contact Information</h2>
          <p className="mb-4">
            If you have any questions about these Terms of Use, please contact us at:
          </p>
          <p className="mb-4">
            <strong>Email:</strong> legal@getcotto.com<br />
            <strong>Website:</strong> getcotto.com
          </p>
        </section>
      </div>
    </div>
  );
}




