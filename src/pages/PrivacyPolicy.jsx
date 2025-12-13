import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  useEffect(() => {
    const scrollRevealElements = document.querySelectorAll('.scroll-reveal');
    
    const scrollReveal = () => {
      scrollRevealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight * 0.85) {
          element.classList.add('revealed');
        }
      });
    };
    
    window.addEventListener('scroll', scrollReveal);
    window.addEventListener('load', scrollReveal);
    scrollReveal();
    
    return () => {
      window.removeEventListener('scroll', scrollReveal);
      window.removeEventListener('load', scrollReveal);
    };
  }, []);

  return (
    <main className="flex-1 bg-white dark:bg-gray-900">
      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 scroll-reveal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fadeInUp">
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Last updated: December 10, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 scroll-reveal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            
            {/* Introduction */}
            <div className="mb-12 animate-fadeInUp">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                SomaSave SACCO ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website <Link to="/" className="text-primary hover:underline">somasave.com</Link> and use our services.
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-12 scroll-reveal animate-fadeInUp stagger-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">info</span>
                </span>
                1. Information We Collect
              </h2>
              <div className="pl-13 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We may collect personal information that you voluntarily provide to us when you:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                    <li>Register for membership</li>
                    <li>Apply for loans</li>
                    <li>Contact us through our website</li>
                    <li>Subscribe to our newsletter</li>
                    <li>Use our member portal</li>
                  </ul>
                  <p className="text-gray-700 dark:text-gray-300 mt-3">
                    This information may include: full name, email address, phone number, physical address, national ID number, employment details, financial information, and other relevant data for SACCO membership.
                  </p>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Automatically Collected Information</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    When you visit our website, we may automatically collect certain information about your device, including:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                    <li>IP address and browser type</li>
                    <li>Operating system and device information</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Referring website addresses</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="mb-12 scroll-reveal animate-fadeInUp stagger-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">work</span>
                </span>
                2. How We Use Your Information
              </h2>
              <div className="pl-13">
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Process membership applications and manage member accounts</li>
                  <li>Process loan applications and disbursements</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Send important notices about your account and services</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Prevent fraud and ensure security of our systems</li>
                  <li>Improve our website and services</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Analyze usage patterns and trends</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="mb-12 scroll-reveal animate-fadeInUp stagger-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">share</span>
                </span>
                3. Information Sharing and Disclosure
              </h2>
              <div className="pl-13">
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>Service Providers:</strong> We may share information with third-party service providers who assist us in operating our business (e.g., IT services, payment processors)</li>
                  <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government regulations</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
                  <li><strong>With Your Consent:</strong> We may share information with your explicit permission</li>
                  <li><strong>Credit Reference Bureaus:</strong> For loan processing and credit assessment purposes</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mt-4">
                  We do not sell, rent, or trade your personal information to third parties for marketing purposes.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="mb-12 scroll-reveal animate-fadeInUp stagger-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">security</span>
                </span>
                4. Data Security
              </h2>
              <div className="pl-13">
                <p className="text-gray-700 dark:text-gray-300">
                  We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Encryption of sensitive data</li>
                  <li>Secure servers and firewalls</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                  <li>Employee training on data protection</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mt-4">
                  However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="mb-12 scroll-reveal animate-fadeInUp">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">person</span>
                </span>
                5. Your Rights
              </h2>
              <div className="pl-13">
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>Access:</strong> Request copies of your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
                  <li><strong>Objection:</strong> Object to processing of your personal information</li>
                  <li><strong>Restriction:</strong> Request restriction of processing your information</li>
                  <li><strong>Portability:</strong> Request transfer of your information to another party</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent for marketing communications at any time</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mt-4">
                  To exercise these rights, please contact us using the information provided at the end of this policy.
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div className="mb-12 scroll-reveal animate-fadeInUp">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">cookie</span>
                </span>
                6. Cookies and Tracking Technologies
              </h2>
              <div className="pl-13">
                <p className="text-gray-700 dark:text-gray-300">
                  We use cookies and similar tracking technologies to enhance your experience on our website. Cookies are small data files stored on your device. We use:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>Essential Cookies:</strong> Necessary for website functionality</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings (e.g., theme preference)</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mt-4">
                  You can control cookies through your browser settings. However, disabling cookies may affect website functionality.
                </p>
              </div>
            </div>

            {/* Section 7 */}
            <div className="mb-12 scroll-reveal animate-fadeInUp">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">schedule</span>
                </span>
                7. Data Retention
              </h2>
              <div className="pl-13">
                <p className="text-gray-700 dark:text-gray-300">
                  We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When information is no longer needed, we will securely delete or anonymize it.
                </p>
              </div>
            </div>

            {/* Section 8 */}
            <div className="mb-12 scroll-reveal animate-fadeInUp">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">child_care</span>
                </span>
                8. Children's Privacy
              </h2>
              <div className="pl-13">
                <p className="text-gray-700 dark:text-gray-300">
                  Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                </p>
              </div>
            </div>

            {/* Section 9 */}
            <div className="mb-12 scroll-reveal animate-fadeInUp">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">update</span>
                </span>
                9. Changes to This Privacy Policy
              </h2>
              <div className="pl-13">
                <p className="text-gray-700 dark:text-gray-300">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
                </p>
              </div>
            </div>

            {/* Section 10 - Contact */}
            <div className="mb-12 scroll-reveal animate-fadeInUp">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">contact_mail</span>
                </span>
                10. Contact Us
              </h2>
              <div className="pl-13">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">business</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">SomaSave SACCO</p>
                      <p className="text-gray-700 dark:text-gray-300">Plot 123, Kampala Road, Kampala, Uganda</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">mail</span>
                    <a href="mailto:info@somasave.com" className="text-primary hover:underline">info@somasave.com</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">call</span>
                    <a href="tel:+256763200075" className="text-primary hover:underline">+256763200075</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    <div className="text-gray-700 dark:text-gray-300">
                      <p>Mon - Fri: 8:00 AM - 5:00 PM</p>
                      <p>Sat: 9:00 AM - 1:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Home CTA */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center scroll-reveal animate-fadeInUp">
              <Link to="/">
                <button className="inline-flex items-center justify-center gap-2 rounded-full h-12 px-8 bg-primary text-gray-900 text-base font-bold hover:opacity-90 transform hover:scale-105 transition-all">
                  <span className="material-symbols-outlined">home</span>
                  <span>Back to Home</span>
                </button>
              </Link>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
