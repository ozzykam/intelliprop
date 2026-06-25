export const metadata = {
  title: 'Terms of Service — IntelliProp',
};

const LAST_UPDATED = 'June 24, 2026';

export default function TermsPage() {
  return (
    <div className="bg-white">
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-slate-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10 text-slate-700">

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing or using the {process.env.NEXT_PUBLIC_APP_NAME ?? 'IntelliProp'} platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use the platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Description of Service</h2>
              <p className="leading-relaxed">
                {process.env.NEXT_PUBLIC_APP_NAME ?? 'IntelliProp'} provides a cloud-based property management platform that enables users to manage properties, tenants, leases, finances, legal matters, and staff. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Account Registration</h2>
              <p className="leading-relaxed">
                You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Acceptable Use</h2>
              <p className="leading-relaxed mb-3">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>Use the platform for any unlawful purpose or in violation of any applicable laws.</li>
                <li>Attempt to gain unauthorized access to any part of the platform or its related systems.</li>
                <li>Transmit any harmful, offensive, or disruptive content.</li>
                <li>Reverse engineer, decompile, or disassemble any part of the platform.</li>
                <li>Resell or sublicense access to the platform without our written consent.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Payment & Subscriptions</h2>
              <p className="leading-relaxed">
                Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law. We reserve the right to change pricing upon 30 days' notice. Failure to pay may result in suspension or termination of your account.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Data Ownership</h2>
              <p className="leading-relaxed">
                You retain ownership of all data you input into the platform. By using the platform, you grant us a limited license to process your data solely to provide the service. Upon termination, you may export your data within 30 days before it is deleted from our systems.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, {process.env.NEXT_PUBLIC_APP_NAME ?? 'IntelliProp'} shall not be liable for any indirect, incidental, special, consequential, or punitive damages. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Termination</h2>
              <p className="leading-relaxed">
                Either party may terminate the agreement at any time. We may terminate or suspend your account immediately for material breach of these terms. Upon termination, your right to access the platform ceases.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms are governed by and construed in accordance with the laws of the State of Minnesota, without regard to its conflict of law provisions.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Contact</h2>
              <p className="leading-relaxed">
                Questions about these Terms should be directed to <a href="mailto:hello@intelliprop.com" className="text-primary hover:underline">hello@intelliprop.com</a>.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
