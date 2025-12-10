import { useEffect } from 'react';

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
      <div className="flex flex-1 justify-center py-5">
        <div className="layout-content-container flex flex-col max-w-5xl flex-1 px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="w-full scroll-reveal">
            <div>
              <div 
                className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat rounded-xl items-start justify-end px-6 pb-10 md:px-10 hover-lift transition-all duration-500"
                style={{
                  backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.5) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuBFia378COo-0sa3eVXhLah_t71YVMtO0iXNELua_tNnvVpKcl0OZC5aaxWRogBzvp3EEf55VeysGRqEdVpZS-9fqMIrvlcq5NgGUtwVSShy9-_UQnwQ63lfmVhO3yo_m1dfaAWgVO3f8QsbX9fRUwPEh39xW8bfDiv1umuCexJQg1pzUNHTh5VKVVCqk82JwJsDRpnirH5TGZaP8CmLxO3R3XOsMNI9bm3fbX5NzX2PRY6X2l2li3OHCGWcD2EwmC2AJexSz_fsq07')"
                }}
              >
                <div className="flex flex-col gap-2 text-left max-w-2xl animate-fadeInUp">
                  <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] md:text-5xl">
                    Building a Stronger Community, Together.
                  </h1>
                  <h2 className="text-white/90 text-sm font-normal leading-normal md:text-base">
                    Learn more about SomaSave SACCO and our commitment to empowering our members through community-focused financial services.
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Our Mission & Core Values */}
          <div className="flex flex-col gap-10 px-0 py-16 scroll-reveal">
            <div className="flex flex-col gap-4 text-center animate-fadeInUp">
              <h2 className="text-gray-900 dark:text-white text-[32px] font-bold leading-tight md:text-4xl md:font-black max-w-3xl mx-auto">
                Our Mission & Core Values
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal max-w-3xl mx-auto">
                SomaSave SACCO was founded to provide accessible and trustworthy financial services to our community. Our mission is to foster economic growth and stability for our members through savings, credit, and collective investment.
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
                  title: 'Community Growth',
                  desc: 'We are dedicated to reinvesting in our community and supporting local development.'
                },
                {
                  icon: 'trending_up',
                  title: 'Financial Discipline',
                  desc: 'We promote responsible financial habits to help our members achieve their goals.'
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
                Key milestones in our history of serving the community.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-[40px_1fr] gap-x-4">
                {[
                  { icon: 'flag', title: 'Founded in 2025', date: 'May 2025', hasLineTop: false, hasLineBottom: true },
                  { icon: 'real_estate_agent', title: 'First Community Project', date: 'August 2025', hasLineTop: true, hasLineBottom: true },
                  { icon: 'person_add', title: 'Reached 40 Members', date: 'September 2025', hasLineTop: true, hasLineBottom: true },
                  { icon: 'smartphone', title: 'Launched Mobile App', date: 'October 2025', hasLineTop: true, hasLineBottom: false }
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
                The dedicated team guiding our mission and serving our members.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Jane Doe',
                  role: 'Chairperson',
                  desc: 'Leading our SACCO with a vision for community empowerment and sustainable growth.',
                  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxu1upNuRcQ15NGZiSB7gfZfE0JSHXZNkc_1eAdSahLwbifwrzPfosICb5anmx8odcs602Nw_A5WM7C92fJWYYD1g7nXNm9lvOEMhCMwoqLhgcPKshBczcliVaDFl_I5Zf1kEPDymsLlOgXI_pBJlNQ01xKlow9IVU3jTK9EqdwKydDFbfHLDxSkSBEsTjhDRC2EJz9L4lf5Idshv_LNnpBm-d2A7jfVepqMurD-wllJhmn_IWANxqjnx2xsiZjkv_VC9A7iZ84RlM'
                },
                {
                  name: 'John Smith',
                  role: 'Vice-Chairperson',
                  desc: 'Dedicated to fostering financial literacy and ensuring transparent operations.',
                  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBk8IJ3R9f0Duf7OcoNAwG7mlXiPQgphfGFXIxTw_2Pib5GhdAcSJbHDSXDMil0n6-ahKRqmStr5rUZF8Q9UX1eKKG5rAH41U7_KJtsUGCwpHlY-HVSE571dFdBxlHprHSnwm_SCVmFJY0NWSMA8VsNj5G87p-Ca58WgoglhFZcX7xoMX_wjMTtbDcxg3iiQ8IkcvicX4CqpnpCl-KEd_qDNNLKDRtUkO7GMG23pO3XPVfDyBtKidf0KvwAwTazpPnpN49zAVy68jCx'
                },
                {
                  name: 'Mary Johnson',
                  role: 'Treasurer',
                  desc: 'Overseeing the financial health of our SACCO to safeguard our members\' investments.',
                  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjSq94bVvbAoGM_Szl_rOtsHWd84c59i2A5eLZSHR0ip40Ysa_U-nGsVS0i7mRFbJTc7rPviBLqMq9jxYf7MMdsZpi7_RutcSX_TplMzhT-SQfTokoLUzXDqR04JoWEndyd988z5qANLfpwTNXyXQhyEj2tuBu11-YjgRhvigRlbmkbBF4c2BEo675sUQ6o0vLBplsLLGB10m9_E1YSA5C7Sw2eHIflZHfZX9KIIB7BeMdQkeZBi2WvFLLoj_QORsXjZLwiUNUg-hw'
                }
              ].map((member, index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center text-center bg-white dark:bg-background-dark/50 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm"
                >
                  <div 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-24 mb-4"
                    style={{ backgroundImage: `url('${member.image}')` }}
                  />
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
              Ready to Grow With Us?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
              Join a community dedicated to mutual growth and financial well-being. Become a member of SomaSave SACCO today.
            </p>
            <button className="flex mx-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity">
              <span className="truncate">Join SomaSave Today</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
