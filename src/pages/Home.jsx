import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
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
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 scroll-reveal overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary-soft/10 dark:from-primary/10 dark:to-primary-soft/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-gray-900 dark:text-white sm:text-5xl md:text-6xl animate-fadeInUp">
              Empowering Members Through <span className="text-primary">Savings</span>, <span className="text-primary">Loans</span> & <span className="text-primary">Financial Growth</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg leading-normal text-gray-600 dark:text-gray-400 animate-fadeInUp stagger-1">
              Join our community-focused SACCO and take control of your financial future. We are dedicated to supporting the well-being of our members in Uganda.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-center animate-fadeInUp stagger-2">
              <button className="w-full sm:w-auto flex min-w-[200px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full h-14 px-8 bg-primary text-gray-900 text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 hover-glow transform hover:scale-105 transition-all shadow-lg hover:shadow-xl">
                <span className="material-symbols-outlined">person_add</span>
                <span className="truncate">Become a Member</span>
              </button>
              <Link to="/loan-application" className="w-full sm:w-auto">
                <button className="w-full flex min-w-[200px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full h-14 px-8 bg-white dark:bg-gray-800 border-2 border-primary text-primary text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary hover:text-gray-900 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl">
                  <span className="material-symbols-outlined">request_quote</span>
                  <span className="truncate">Apply for a Loan</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black text-white scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center transform hover:scale-110 transition-transform duration-300 cursor-pointer">
              <div className="text-4xl md:text-5xl font-black mb-2 animate-fadeInUp text-primary">1000+</div>
              <div className="text-sm md:text-base font-semibold opacity-90">Active Members</div>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform duration-300 cursor-pointer">
              <div className="text-4xl md:text-5xl font-black mb-2 animate-fadeInUp stagger-1 text-primary">UGX 500M+</div>
              <div className="text-sm md:text-base font-semibold opacity-90">Total Savings</div>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform duration-300 cursor-pointer">
              <div className="text-4xl md:text-5xl font-black mb-2 animate-fadeInUp stagger-2 text-primary">98%</div>
              <div className="text-sm md:text-base font-semibold opacity-90">Satisfaction Rate</div>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform duration-300 cursor-pointer">
              <div className="text-4xl md:text-5xl font-black mb-2 animate-fadeInUp stagger-3 text-primary">10+</div>
              <div className="text-sm md:text-base font-semibold opacity-90">Years of Service</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white dark:bg-gray-900/50 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fadeInUp">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Why Choose SomaSave SACCO?</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Everything you need to achieve your financial goals.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="group flex flex-col gap-4 p-6 text-center items-center rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-primary hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 animate-scaleIn stagger-1 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <span className="material-symbols-outlined text-3xl">savings</span>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white text-lg font-bold leading-normal mb-2">Flexible Savings</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Securely grow your money with competitive interest rates.</p>
              </div>
            </div>
            
            <div className="group flex flex-col gap-4 p-6 text-center items-center rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-primary hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 animate-scaleIn stagger-2 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <span className="material-symbols-outlined text-3xl">payments</span>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white text-lg font-bold leading-normal mb-2">Affordable Loans</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Access funds with fair and transparent loan terms.</p>
              </div>
            </div>
            
            <div className="group flex flex-col gap-4 p-6 text-center items-center rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-primary hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 animate-scaleIn stagger-3 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <span className="material-symbols-outlined text-3xl">smartphone</span>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white text-lg font-bold leading-normal mb-2">Mobile Money</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Manage finances on the go with mobile integration.</p>
              </div>
            </div>
            
            <div className="group flex flex-col gap-4 p-6 text-center items-center rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-primary hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 animate-scaleIn stagger-4 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <span className="material-symbols-outlined text-3xl">star</span>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white text-lg font-bold leading-normal mb-2">Member Benefits</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Enjoy dividends, education, and a supportive community.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 scroll-reveal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="group flex flex-1 gap-3 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-5 items-center hover:border-primary hover:shadow-lg transform hover:scale-105 transition-all duration-300 animate-fadeInUp stagger-1 cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 text-primary group-hover:rotate-12 transition-transform duration-300">
                <span className="material-symbols-outlined text-2xl">shield</span>
              </div>
              <h2 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Registered SACCO</h2>
            </div>
            <div className="group flex flex-1 gap-3 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-5 items-center hover:border-primary hover:shadow-lg transform hover:scale-105 transition-all duration-300 animate-fadeInUp stagger-2 cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 text-primary group-hover:rotate-12 transition-transform duration-300">
                <span className="material-symbols-outlined text-2xl">lock</span>
              </div>
              <h2 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Secure Transactions</h2>
            </div>
            <div className="group flex flex-1 gap-3 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-5 items-center hover:border-primary hover:shadow-lg transform hover:scale-105 transition-all duration-300 animate-fadeInUp stagger-3 cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 text-primary group-hover:rotate-12 transition-transform duration-300">
                <span className="material-symbols-outlined text-2xl">support_agent</span>
              </div>
              <h2 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Reliable Support</h2>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white dark:bg-gray-900/50 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fadeInUp">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">What Our Members Say</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Real stories from our community.</p>
          </div>
          
          {/* Mobile: Stack, Tablet+: Horizontal Scroll */}
          <div className="flex flex-col sm:flex-row sm:overflow-x-auto gap-6 sm:gap-8 sm:pb-4 [-ms-scrollbar-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-200 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full">
            {[
              { 
                name: 'Sarah K.', 
                text: '"SomaSave helped me start my small business with a loan that had fair rates. I\'m so grateful for their support."',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArseaAnYHpdBe2K3C-u0pms9a_9SLOBGPKdI3rwDdv5yaXfn9eA7CHvGecrq0mAXAZbvgDWibOLLMOKSX4_j_AL1uBFN2jwN07KDogusjYITpMv2i7UMTM6OllIDEHUyL8KShczE0eAFALhwkn3Nuqkfu8btpu5WvKSVamonRNScL5WS66BANQBq1ePWFWFnm8aioJUbqo2ML09w4q5HEerf780w20ii1h-78J398ZWYwrnn8GpAjgh9CqfBxqb9gxAkpL2E2Vkoyp'
              },
              { 
                name: 'David M.', 
                text: '"The mobile money payment feature is so convenient! Managing my savings has never been easier."',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHE3hJ5qbK5WuT-0DSeog2TBP4D0I0t019f_pMJT4WV2IF9cBl9CeNyRPH2yy763wskDGHH706xs8RBWccti36iyPZFxAoirRoAUX-55VKKuCSQiiDAnGQHGTfdzn_fMO6ymRunCpzYVH47T7GH3o5EriSNw1i9c7WA1DWWSkxlUHAKNSssJsr2e9PvDpE_0DsJlIwKh2VkjPoQAx1rNlDQC1oikpn1Dm5Z6Jbhl5Fa3IZt3tmhRGesxC2EqLmeaNQeieKxhi-FmoR'
              },
              { 
                name: 'Grace A.', 
                text: '"Being part of this SACCO feels like being part of a family. They truly care about our financial growth."',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWlBxi1ttj7UXVc5_hwPmN56rOSnHlGEtyCQDGvhhguGpKdOkH55X3ZxrCThbouN8emV0bZQBXVGuc1HkOfTnkCTel0E8xFGH0dinFU3r_kRAIrlKJoLZDFhNV_3iOXBljfoeKjIIYpke2u17ZxQO9GOGF1BXteRPVhmpjWc92VlcKkHiGbL9R19vuSMk4P_dSWMrl1DBaVtGn56kseXyOU2fE5WnYCxB2HpNShb7Yaw8mIQlpQW0btjPX8hlyTOBA-G4nNtjiboHA'
              },
              { 
                name: 'John L.', 
                text: '"Their financial education workshops have been invaluable. I feel more confident managing my money."',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsFs1QwTyIsw2PORw1s6COi_8Q4CC71f3X06SpuSrpnYEKj5tlnAl9Pf0CGoWnYLjsHwBt6YEt3Yuuoq1SeVHCx1TzpPFAwm707VyL2E6JK6VjVjQXV2jB_dtpZ9NQYejkgqzFmggKbk7xG5dS7ZC5oSirL1R2oV28ELeb2datbQhI3uXf_dT34lS4rEcyS1vzjHpjlO0wjEoixj08iibIbh5EP_LQdDampijK4l8f4pdNcmnSuK9Gi4fmaLNuJ8TMBIKooglSfNpW'
              }
            ].map((testimonial, index) => (
              <div key={index} className={`group flex flex-col gap-6 text-center rounded-2xl sm:min-w-72 sm:max-w-72 p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 animate-fadeIn stagger-${index + 1} cursor-pointer`}>
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img 
                    src={testimonial.image} 
                    alt={`Portrait of ${testimonial.name}`}
                    className="relative w-20 h-20 mx-auto rounded-full object-cover ring-4 ring-white dark:ring-gray-800 group-hover:ring-primary transition-all duration-300 group-hover:scale-110"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-yellow-500 text-lg">star</span>
                    ))}
                  </div>
                  <p className="text-gray-900 dark:text-white text-lg font-bold leading-normal mb-3">{testimonial.name}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-relaxed italic">{testimonial.text}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Scroll Hint for Mobile */}
          <div className="sm:flex hidden items-center justify-center gap-2 mt-8 text-gray-500 dark:text-gray-400 animate-fadeIn">
            <span className="material-symbols-outlined animate-pulse">swipe</span>
            <span className="text-sm">Swipe to see more</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 dark:from-gray-900 dark:via-black dark:to-gray-900 scroll-reveal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 animate-fadeInUp">Ready to Start Your Financial Journey?</h2>
          <p className="text-lg text-gray-300 mb-8 animate-fadeInUp stagger-1">Join thousands of members who are building a better financial future.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp stagger-2">
            <button className="flex items-center justify-center gap-2 rounded-full h-14 px-8 bg-primary text-gray-900 text-base font-bold hover:opacity-90 transform hover:scale-105 transition-all shadow-xl">
              <span className="material-symbols-outlined">how_to_reg</span>
              <span>Register Now</span>
            </button>
            <Link to="/contact">
              <button className="flex items-center justify-center gap-2 rounded-full h-14 px-8 bg-white text-gray-900 text-base font-bold hover:bg-gray-100 transform hover:scale-105 transition-all shadow-xl">
                <span className="material-symbols-outlined">chat</span>
                <span>Talk to Us</span>
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
