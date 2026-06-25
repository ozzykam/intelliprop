export const metadata = {
  title: 'Privacy Policy — IntelliProp',
};

const LAST_UPDATED = 'June 24, 2026';

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate">
          <div className="space-y-10 text-slate-700">

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Introduction</h2>
              <p className="leading-relaxed">
                {process.env.NEXT_PUBLIC_APP_NAME ?? 'IntelliProp'} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our property management platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Information We Collect</h2>
              <p className="leading-relaxed mb-3">We may collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li><strong>Account information:</strong> name, email address, phone number, and password.</li>
                <li><strong>Property data:</strong> property addresses, unit details, lease agreements, and tenant records.</li>
                <li><strong>Financial data:</strong> payment history, charge records, and banking information collected through our payment processor.</li>
                <li><strong>Usage data:</strong> log data, IP addresses, browser type, and pages visited.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>To provide, maintain, and improve the {process.env.NEXT_PUBLIC_APP_NAME ?? 'IntelliProp'} platform.</li>
                <li>To process transactions and send related information.</li>
                <li>To send administrative information, such as updates and security alerts.</li>
                <li>To respond to customer support inquiries.</li>
                <li>To comply with legal obligations.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Data Sharing</h2>
              <p className="leading-relaxed">
                We do not sell your personal information. We may share your data with third-party service providers who perform services on our behalf (e.g., payment processing, cloud hosting) subject to confidentiality obligations. We may also disclose information when required by law.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Data Security</h2>
              <p className="leading-relaxed">
                We implement industry-standard security measures to protect your information, including encryption at rest and in transit. However, no method of transmission over the internet is 100% secure.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Your Rights</h2>
              <p className="leading-relaxed">
                Depending on your jurisdiction, you may have rights to access, correct, delete, or port your personal data. To exercise any of these rights, please contact us at <a href="mailto:hello@intelliprop.com" className="text-primary hover:underline">hello@intelliprop.com</a>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page with an updated effective date.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Contact Us</h2>
              <p className="leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at <a href="mailto:hello@intelliprop.com" className="text-primary hover:underline">hello@intelliprop.com</a>.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
