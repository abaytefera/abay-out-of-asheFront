import React, { useState, useEffect, useRef } from 'react';
import { Info, Award, Users } from 'lucide-react'; 

const FounderComponent = () => {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target); // Equivalent to triggerOnce: true
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="container mx-auto px-6 py-16 md:py-24 max-w-7xl"
    >
      <div className="flex flex-col gap-12">
        
        {/* Section Header */}
        <div className={`text-center transition-all duration-1000 ease-out 
          ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <div className="flex justify-center mb-4">
             <span className="p-3 bg-primBtn/10 rounded-full text-primBtn">
               <Info size={28} />
             </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            About <span className="text-primBtn">Out of the Ashes</span>
          </h1>
          <div className="w-24 h-1.5 bg-primBtn mx-auto rounded-full"></div>
        </div>

        {/* Content Grid */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          
          {/* Image Box */}
          <div className={`relative transition-all duration-1000 delay-300 ease-out
            ${inView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className="absolute -inset-4 bg-[#3B39CE]/10 rounded-3xl blur-2xl"></div>
            <img 
              src="https://res.cloudinary.com/dkzvlqjp9/image/upload/v1767960857/out_1_ligvau.png" 
              alt="Out of the Ashes Logo" 
              className="relative w-full max-w-[280px] md:max-w-[350px] h-auto object-contain transition-transform hover:scale-105 duration-500"
            />
          </div>

          {/* Text Content */}
          <div className={`flex flex-col gap-6 max-w-2xl transition-all duration-1000 delay-500 ease-out
            ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}>
            
            <div className="flex items-center gap-3">
              <Award className="text-primBtn" size={24} />
              <h2 className="text-2xl font-bold text- uppercase tracking-wide">
                Our Foundation & Legacy
              </h2>
            </div>

            <p className="text-lg text-slate-600 leading-relaxed text-justify md:text-left">
              Out of the Ashes is an <span className="font-semibold text-slate-900">International non-governmental organization</span>. 
              Registered under the Ethiopian Charities and Societies Agency (Reg. no. 4776), we have been active since 2013.
            </p>

            <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-primBtn shadow-sm">
              <p className="text-slate-700 italic leading-relaxed">
                "Established with a vision to contribute to poverty reduction in Addis Ababa, 
                we strive to bring positive behavioral and social change through the 
                empowerhood of children and their families."
              </p>
            </div>

            <div className="flex items-center gap-4 pt-4">
               <div className="flex -space-x-2">
                 <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white border-2 border-white"><Users size={16}/></div>
                 <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-white"></div>
                 <div className="w-10 h-10 rounded-full bg-blue-300 border-2 border-white"></div>
               </div>
               <span className="text-sm font-medium text-slate-500">Empowering 1000+ Families since 2013</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FounderComponent;