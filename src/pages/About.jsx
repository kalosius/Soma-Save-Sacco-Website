import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function About() {
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
    <main className="layout-container flex h-full grow flex-col">
      <Helmet>
        <title>About Us - SomaSave SACCO | Student-Focused Financial Services</title>
        <meta name="description" content="Learn about SomaSave SACCO - Uganda's leading student-focused financial cooperative. Discover our mission to empower university students with flexible savings accounts, affordable loans, and financial literacy programs." />
        <meta name="keywords" content="about SomaSave SACCO, student SACCO Uganda, university financial services, student cooperative, campus SACCO, student savings, university loans Uganda, financial empowerment students, Makerere SACCO" />
        <link rel="canonical" href="https://somasave.com/about" />
        
        {/* Open Graph */}
        <meta property="og:title" content="About SomaSave SACCO - Student Financial Services" />
        <meta property="og:description" content="Learn about SomaSave SACCO - Uganda's leading student-focused financial cooperative empowering university students with savings, loans, and financial literacy." />
        <meta property="og:url" content="https://somasave.com/about" />
        <meta property="og:type" content="website" />
        
        {/* Twitter */}
        <meta name="twitter:title" content="About SomaSave SACCO - Student Financial Services" />
        <meta name="twitter:description" content="Learn about SomaSave SACCO - empowering university students in Uganda with flexible savings, affordable loans, and financial literacy programs." />
      </Helmet>
      
      <div className="flex flex-1 justify-center py-5">
        <div className="layout-content-container flex flex-col max-w-5xl flex-1 px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="w-full scroll-reveal">
            <div>
              <div 
                className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat rounded-xl items-start justify-end px-6 pb-10 md:px-10 hover-lift transition-all duration-500"
                style={{
                  backgroundImage: "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url('/impactweekimages/somasave%20heads.jpeg')"
                }}
              >
                <div className="flex flex-col gap-2 text-left max-w-2xl animate-fadeInUp">
                  <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] md:text-5xl">
                    We help students save, borrow, and grow.
                  </h1>
                  <h2 className="text-white/90 text-sm font-normal leading-normal md:text-base">
                    Simple, trustworthy financial services built for university life.
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Our Mission & Core Values */}
          <div className="flex flex-col gap-10 px-0 py-16 scroll-reveal">
            <div className="flex flex-col gap-4 text-center animate-fadeInUp">
              <h2 className="text-gray-900 dark:text-white text-[32px] font-bold leading-tight md:text-4xl md:font-black max-w-3xl mx-auto">
                Mission
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal max-w-3xl mx-auto">
                Empower students with accessible savings, fair loans, and clear financial guidance.
              </p>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-0">
              {[
                {
                  icon: 'verified_user',
                  title: 'Integrity',
                  desc: 'We operate with the utmost honesty and ethical standards in all our dealings.'
                },
                {
                  icon: 'visibility',
                  title: 'Transparency',
                  desc: 'We believe in clear and open communication with our members about our operations and policies.'
                },
                {
                  icon: 'groups',
                  title: 'Student Community',
                  desc: 'We are dedicated to building a supportive network of students across all Ugandan universities.'
                },
                {
                  icon: 'trending_up',
                  title: 'Financial Literacy',
                  desc: 'We promote responsible financial habits to help students achieve their academic and personal goals.'
                }
              ].map((value, index) => (
                <div 
                  key={index}
                  className={`flex flex-1 gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark/50 p-4 flex-col shadow-sm hover-lift animate-scaleIn stagger-${index + 1} cursor-pointer`}
                >
                  <div className="text-primary hover-scale">
                    <span className="material-symbols-outlined !text-3xl">{value.icon}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">
                      {value.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Our Journey Section (Timeline) */}
          <div className="py-16">
            <div className="text-center mb-10">
              <h2 className="text-gray-900 dark:text-white text-[32px] font-bold leading-tight tracking-[-0.015em]">
                Our Journey So Far
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal max-w-2xl mx-auto">
                Key milestones in our history of serving university students across Uganda.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-[40px_1fr] gap-x-4">
                {[
                  { icon: 'flag', title: 'Founded for Students', date: 'May 2025', hasLineTop: false, hasLineBottom: true },
                  { icon: 'school', title: 'First University Partnership', date: 'August 2025', hasLineTop: true, hasLineBottom: true },
                  { icon: 'person_add', title: 'Reached 40 Student Members', date: 'September 2025', hasLineTop: true, hasLineBottom: true },
                  { icon: 'smartphone', title: 'Launched Student Mobile App', date: 'October 2025', hasLineTop: true, hasLineBottom: false }
                ].map((milestone, index) => (
                  <div key={index} className="contents">
                    <div className="flex flex-col items-center gap-1 pt-3">
                      {milestone.hasLineTop && (
                        <div className="w-[1.5px] bg-gray-200 dark:bg-gray-800 h-2 grow"></div>
                      )}
                      <div className="text-primary">
                        <span className="material-symbols-outlined">{milestone.icon}</span>
                      </div>
                      {milestone.hasLineBottom && (
                        <div className="w-[1.5px] bg-gray-200 dark:bg-gray-800 h-2 grow"></div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col py-3">
                      <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">
                        {milestone.title}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">
                        {milestone.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="py-16">
            <div className="text-center mb-10">
              <h2 className="text-gray-900 dark:text-white text-[32px] font-bold leading-tight tracking-[-0.015em]">
                Meet Our Leadership
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal max-w-2xl mx-auto">
                The dedicated student leaders guiding our mission and serving fellow university students.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Mathew Mwesigwa',
                  role: 'Chairperson',
                  desc: 'Leading our SACCO with a vision for student financial empowerment.',
                  image: '/impactweekimages/Mathew.jpeg'
                },
                {
                  name: 'Arinda Mark',
                  role: 'CEO',
                  desc: 'Committed to student success and organizational growth.',
                  image: '/impactweekimages/arindaM.jpeg'
                },
                {
                  name: 'Nabasumba Melissa',
                  role: 'Financial Manager',
                  desc: 'Safeguarding members\' funds and financial health.',
                  image: '/impactweekimages/Melissa.jpeg'
                },
                {
                  name: 'Aloisius Kasozi',
                  role: 'Tech Lead',
                  desc: 'Driving digital access and student tools.',
                  image: '/impactweekimages/aloisius.jpeg'
                },
                {
                  name: 'Mark Bakashaba',
                  role: 'Communications Lead',
                  desc: 'Leading communications and outreach for students.',
                  image: '/impactweekimages/markB.jpeg'
                }
                ,{
                  name: 'Millan',
                  role: 'Mentor',
                  desc: 'Providing guidance and mentorship to our leadership and members.',
                  image: '/impactweekimages/Millan.jpeg'
                }
              ].map((member, index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center text-center bg-white dark:bg-background-dark/50 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm"
                >
                  <img src={member.image} alt={member.name} className="w-28 h-28 rounded-full object-cover mb-4" />
                  <h3 className="text-gray-900 dark:text-white text-lg font-bold">{member.name}</h3>
                  <p className="text-primary text-sm font-medium">{member.role}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">{member.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="my-16 bg-primary-soft/30 dark:bg-primary-soft/10 rounded-xl p-10 text-center">
            <h2 className="text-gray-900 dark:text-white text-3xl font-bold mb-2">
              Ready to Join the Student Movement?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
              Join university students across Uganda building financial independence. Become a member of SomaSave SACCO today.
            </p>
            <Link to="/register">
              <button className="flex mx-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity">
                <span className="truncate">Join SomaSave Today</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
