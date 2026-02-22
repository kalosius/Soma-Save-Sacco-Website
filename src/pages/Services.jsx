import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

export default function Services() {
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
    <main className="flex-1 px-4 lg:px-10 py-5">
      <Helmet>
        <title>Student Financial Services - Savings, Loans & Mobile Money | SomaSave SACCO</title>
        <meta name="description" content="Explore SomaSave SACCO's student-focused financial services: flexible savings accounts, affordable student loans, mobile money integration, and emergency funds. Tailored for university students in Uganda." />
        <meta name="keywords" content="student savings accounts, student loans Uganda, mobile money students, university financial services, campus banking, emergency student loans, tuition loans, flexible savings, Makerere students, university SACCO services, student financial aid Uganda" />
        <link rel="canonical" href="https://somasave.com/services" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Student Financial Services - SomaSave SACCO" />
        <meta property="og:description" content="Flexible savings accounts, affordable student loans, mobile money integration, and emergency funds tailored for university students in Uganda." />
        <meta property="og:url" content="https://somasave.com/services" />
        <meta property="og:type" content="website" />
        
        {/* Twitter */}
        <meta name="twitter:title" content="Student Financial Services - SomaSave SACCO" />
        <meta name="twitter:description" content="Flexible savings, affordable loans, and mobile money services designed for university students in Uganda." />
      </Helmet>
      
      <div className="flex flex-col max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="flex flex-col gap-6 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em] text-gray-900 dark:text-white">
                Financial services that work for students
              </h1>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
                Straightforward savings, fair loans, and campus-friendly payments.
              </p>
              <div className="flex justify-center md:justify-start">
                <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-primary text-white text-base font-bold tracking-[0.015em] hover:opacity-90 transition-opacity">
                  <span className="truncate">Get Started Today</span>
                </button>
              </div>
            </div>
            <div 
              className="w-full bg-center bg-no-repeat aspect-video md:aspect-square bg-cover rounded-xl"
              style={{
                backgroundImage: "url('/impactweekimages/professional%20group%20photo1.jpeg')"
              }}
            />
          </div>
        </section>

        {/* Savings Accounts Section */}
        <section className="py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight tracking-[-0.015em] mb-8 text-center text-gray-900 dark:text-white">
            Savings Accounts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[{ icon: 'savings', title: 'Student Savings Account', desc: 'Flexible, no-fuss savings for students.' },{ icon: 'event_available', title: 'Goal Savings', desc: 'Save for tuition or projects.' },{ icon: 'groups', title: 'Group Savings', desc: 'Pool funds with classmates.' }].map((account, index) => (
              <div 
                key={index} 
                className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark p-6 shadow-soft hover:shadow-soft-lg transition-shadow"
              >
                <div className="text-primary">
                  <span className="material-symbols-outlined text-2xl">{account.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{account.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{account.desc}</p>
                <a className="mt-auto text-sm font-bold text-primary hover:underline" href="#">
                  Learn More →
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Loan Products Section */}
        <section className="py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight tracking-[-0.015em] mb-8 text-center text-gray-900 dark:text-white">
            Loan Products
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: 'school',
                title: 'Tuition Support Loan',
                desc: 'Ensure your education is never interrupted due to tuition challenges.'
              },
              {
                icon: 'store',
                title: 'Student Business Loan',
                desc: 'Capital to start or expand your student business venture on campus.'
              },
              {
                icon: 'emergency',
                title: 'Emergency Student Loan',
                desc: 'Quick access to funds for urgent student needs and emergencies.'
              },
              {
                icon: 'trending_up',
                title: 'Project Finance Loan',
                desc: 'Finance your academic projects, research, or educational needs.'
              }
            ].map((loan, index) => (
              <div 
                key={index} 
                className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark p-6 shadow-soft hover:shadow-soft-lg transition-shadow"
              >
                <div className="text-primary">
                  <span className="material-symbols-outlined text-2xl">{loan.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{loan.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{loan.desc}</p>
                <a className="mt-auto text-sm font-bold text-primary hover:underline" href="#">
                  Learn More →
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* More Services Section */}
        <section className="py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight tracking-[-0.015em] mb-8 text-center text-gray-900 dark:text-white">
            More Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {[
              {
                icon: 'payments',
                title: 'Mobile Money for Students',
                desc: 'Make deposits and repayments easily using MTN MoMo & Airtel Money from campus.'
              },
              {
                icon: 'how_to_reg',
                title: 'Student Membership',
                desc: 'Register with your student ID and access your account online from any university.'
              }
            ].map((service, index) => (
              <div 
                key={index} 
                className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark p-6 shadow-soft hover:shadow-soft-lg transition-shadow"
              >
                <div className="text-primary">
                  <span className="material-symbols-outlined text-2xl">{service.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{service.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{service.desc}</p>
                <a className="mt-auto text-sm font-bold text-primary hover:underline" href="#">
                  Learn More →
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
