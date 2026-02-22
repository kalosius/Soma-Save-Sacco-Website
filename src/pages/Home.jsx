import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ImageSlider from '../components/ImageSlider';

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

  const [impactImages, setImpactImages] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetch('/impactweekimages/manifest.json')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(list => {
        if (mounted && Array.isArray(list)) setImpactImages(list.map(i => `/impactweekimages/${i}`));
      })
      .catch(() => {
        // manifest not available — leave empty
      });
    return () => { mounted = false; };
  }, []);

  return (
    <main className="flex-1">
      {/* Hero Slider Section */}
      <section className="py-6 md:py-10 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ImageSlider />
          <div className="-mt-24 md:-mt-32 relative z-10">
            <div className="bg-black/65 dark:bg-black/65 backdrop-blur rounded-xl p-6 max-w-3xl mx-auto text-center shadow-lg">
              <h1 className="text-2xl md:text-3xl font-black text-white">SomaSave SACCO — Student savings, simple and strong.</h1>
              <p className="mt-2 text-white/90">Join a community of students saving smarter, borrowing fairly, and learning together.</p>
              <div className="mt-4 flex gap-3 justify-center">
                <Link to="/register"><button className="px-6 py-2 rounded-full bg-primary text-black font-bold">Become a Member</button></Link>
                <Link to="/loan-application"><button className="px-6 py-2 rounded-full bg-white border border-primary text-primary font-bold">Apply for a Loan</button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black text-white scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center transform hover:scale-110 transition-transform duration-300 cursor-pointer">
              <div className="text-4xl md:text-5xl font-black mb-2 animate-fadeInUp text-primary">40+</div>
              <div className="text-sm md:text-base font-semibold opacity-90">Student Members</div>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform duration-300 cursor-pointer">
              <div className="text-4xl md:text-5xl font-black mb-2 animate-fadeInUp stagger-1 text-primary">UGX 800k+</div>
              <div className="text-sm md:text-base font-semibold opacity-90">Student Savings</div>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform duration-300 cursor-pointer">
              <div className="text-4xl md:text-5xl font-black mb-2 animate-fadeInUp stagger-2 text-primary">15+</div>
              <div className="text-sm md:text-base font-semibold opacity-90">Universities Served</div>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform duration-300 cursor-pointer">
              <div className="text-4xl md:text-5xl font-black mb-2 animate-fadeInUp stagger-3 text-primary">10+</div>
              <div className="text-sm md:text-base font-semibold opacity-90">Months of Service</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team / Impact Images (derived from impactweekimages manifest) */}
      <section className="py-12 bg-white dark:bg-gray-900/50 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Team & Impact</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Faces from our events and student leaders.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {impactImages.length ? (
              impactImages.slice(0, 12).map((src, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-2 p-2">
                  <img src={src} alt={`Member ${i + 1}`} className="w-full h-28 object-cover rounded-lg shadow-sm" />
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{src.split('/').pop().replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '')}</div>
                </div>
              ))
            ) : (
              <div className="col-span-6 text-center text-gray-500">No images found. Add a <span className="font-mono">manifest.json</span> to <span className="font-mono">public/impactweekimages</span>.</div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white dark:bg-gray-900/50 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fadeInUp">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Why University Students Choose SomaSave SACCO?</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Everything you need to achieve your financial goals as a student.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="group flex flex-col gap-4 p-6 text-center items-center rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-primary hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 animate-scaleIn stagger-1 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <span className="material-symbols-outlined text-3xl">savings</span>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white text-lg font-bold leading-normal mb-2">Student Savings Plans</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Flexible savings designed for students with competitive interest rates.</p>
              </div>
            </div>
            
            <div className="group flex flex-col gap-4 p-6 text-center items-center rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-primary hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 animate-scaleIn stagger-2 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <span className="material-symbols-outlined text-3xl">payments</span>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white text-lg font-bold leading-normal mb-2">Student-Friendly Loans</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Access emergency funds, tuition support, and project financing.</p>
              </div>
            </div>
            
            <div className="group flex flex-col gap-4 p-6 text-center items-center rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-primary hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 animate-scaleIn stagger-3 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <span className="material-symbols-outlined text-3xl">smartphone</span>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white text-lg font-bold leading-normal mb-2">Mobile Money</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Manage finances on campus with mobile money integration.</p>
              </div>
            </div>
            
            <div className="group flex flex-col gap-4 p-6 text-center items-center rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-primary hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 animate-scaleIn stagger-4 cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <span className="material-symbols-outlined text-3xl">star</span>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white text-lg font-bold leading-normal mb-2">Student Benefits</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Enjoy dividends, financial literacy, and student community support.</p>
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
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">What Our Student Members Say</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Real stories from university students across Uganda.</p>
          </div>
          
          {/* Mobile: Stack, Tablet+: Horizontal Scroll */}
          <div className="flex flex-col sm:flex-row sm:overflow-x-auto gap-6 sm:gap-8 sm:pb-4 [-ms-scrollbar-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-200 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full">
            {[{
                name: 'Aloisius Kasozi',
                role: 'Tech Lead',
                text: '"Building reliable digital tools for students."',
                image: '/impactweekimages/aloisius.jpeg'
              },{
                name: 'Melissa Nabasumba',
                role: 'Financial Manager',
                text: '"We make student savings simple and transparent."',
                image: '/impactweekimages/Melissa.jpeg'
              },{
                name: 'Mark B.',
                role: 'Communications Lead',
                text: '"Connecting students to clear financial choices."',
                image: '/impactweekimages/markB.jpeg'
              },{
                name: 'Mathew Mwesigwa',
                role: 'Chairperson',
                text: '"Guiding our student community with integrity."',
                image: '/impactweekimages/Mathew.jpeg'
              },{
                name: 'Arinda Mark',
                role: 'CEO',
                text: '"Committed to student success and growth."',
                image: '/impactweekimages/arindaM.jpeg'
              }].map((testimonial, index) => (
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
                  <p className="text-gray-900 dark:text-white text-lg font-bold leading-normal mb-1">{testimonial.name}</p>
                  <p className="text-primary text-sm font-semibold mb-2">{testimonial.role}</p>
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
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 animate-fadeInUp">Ready to Start Your Student Financial Journey?</h2>
          <p className="text-lg text-gray-300 mb-8 animate-fadeInUp stagger-1">Join university students across Uganda who are building a better financial future.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp stagger-2">
            <Link to="/register">
              <button className="flex items-center justify-center gap-2 rounded-full h-14 px-8 bg-primary text-gray-900 text-base font-bold hover:opacity-90 transform hover:scale-105 transition-all shadow-xl">
                <span className="material-symbols-outlined">how_to_reg</span>
                <span>Register Now</span>
              </button>
            </Link>
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
