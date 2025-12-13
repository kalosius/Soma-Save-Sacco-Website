import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    fullName: '',
    contactInfo: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ fullName: '', contactInfo: '', message: '' });
  };

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12 lg:mb-16">
          <h1 className="text-gray-900 dark:text-white text-4xl sm:text-5xl font-black leading-tight tracking-[-0.033em]">
            Get in Touch
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-400 text-base sm:text-lg font-normal leading-normal">
            We're here to help. Reach out to us with any questions or inquiries, and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left Column - Contact Info & Map */}
          <div className="flex flex-col gap-8">
            {/* Contact Information Card */}
            <div className="flex flex-col gap-6 p-8 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
              {/* Office Location */}
              <div className="flex items-start gap-4 min-h-[72px]">
                <div className="text-blue-500 flex items-center justify-center rounded-lg bg-blue-500/20 shrink-0 size-12">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">Our Office</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">
                    Plot 123, Kampala Road, Kampala, Uganda
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 min-h-[72px]">
                <div className="text-blue-500 flex items-center justify-center rounded-lg bg-blue-500/20 shrink-0 size-12">
                  <span className="material-symbols-outlined">call</span>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">Phone</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">
                    +256 708 080349<br />
                    +256 763 200075
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 min-h-[72px]">
                <div className="text-blue-500 flex items-center justify-center rounded-lg bg-blue-500/20 shrink-0 size-12">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">Email</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">
                    info@somasave.com
                  </p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-start gap-4 min-h-[72px]">
                <div className="text-blue-500 flex items-center justify-center rounded-lg bg-blue-500/20 shrink-0 size-12">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">Working Hours</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">
                    Mon - Fri: 8:00 AM - 5:00 PM<br />
                    Sat: 9:00 AM - 1:00 PM
                  </p>
                </div>
              </div>

              {/* WhatsApp Button */}
              <button className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-opacity-90 transition-opacity">
                <svg
                  fill="none"
                  height="20"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
               <a
  href="https://wa.me/256763200075"
  target="_blank"
  rel="noopener noreferrer"
>
  <span className="truncate">Chat on WhatsApp</span>
</a>
              </button>
            </div>

            {/* Map Image */}
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <img
                className="h-full w-full object-cover"
                alt="Abstract map of a city with pins"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfQavwN_dg4SZ7c1Yqx9cpILWhKx0THrOvTgWC3Z4OOVwGPTOEJaQiuk4YW8qs9Qr5XKKit1TK0VmMb4ZzMUnBkYfQR_VR3CTNSn1gH7P-5bJMFfFgpNXgNCeGhd5NH36FT47vtvSBV20R30qJzeCWwluBc1pgXT77G6LK_34OKJjgUBgWy5kVfa6MIVe__XumhCGPitD4jo4TVrSqSdtAUkWJwwgyJZ4wbwH8bMN2qs-frWVYvsuIb9tZYSsHHtFzjiilkhv7mM_F"
              />
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="flex flex-col p-8 sm:p-10 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Send us a Message</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Fill out the form below and we'll get back to you.</p>
            
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
              {/* Full Name */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                  htmlFor="full-name"
                >
                  Full Name
                </label>
                <input
                  className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white"
                  id="full-name"
                  name="fullName"
                  placeholder="Mathew Mwesigwa"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              {/* Email or Phone */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                  htmlFor="contact-info"
                >
                  Email or Phone
                </label>
                <input
                  className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white"
                  id="contact-info"
                  name="contactInfo"
                  placeholder="mathew@gmail.com"
                  type="text"
                  value={formData.contactInfo}
                  onChange={handleChange}
                />
              </div>

              {/* Message */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                  htmlFor="message"
                >
                  Your Message
                </label>
                <textarea
                  className="w-full p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow resize-none text-gray-900 dark:text-white"
                  id="message"
                  name="message"
                  placeholder="Write your message here..."
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-opacity-90 transition-opacity"
                type="submit"
              >
                <span className="truncate">Send Inquiry</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
