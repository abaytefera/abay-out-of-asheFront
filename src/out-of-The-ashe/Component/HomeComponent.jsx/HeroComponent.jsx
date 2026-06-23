export const HeroComponent = () => {
  return (
    <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
      <div className="w-full md:w-1/2 space-y-6 animate-fadeIn">
        <span className="text-primBtn font-bold tracking-widest uppercase text-sm">Our Vision</span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight">
          Breaking the Cycle of <span className="text-primBtn">Poverty.</span>
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-md">
          Empowering orphans and vulnerable children in Korah, Ethiopia through education and holistic support.
        </p>
        <div className="pt-4 flex gap-4">
          <button className="px-8 py-3 bg-primBtn text-white rounded-lg font-semibold hover:shadow-lg transition-all">Get Involved</button>
        </div>
      </div>
      
      <div className="w-full md:w-1/2 relative">
        <div className="absolute -z-10 -top-10 -right-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <img src="https://res.cloudinary.com/dkzvlqjp9/image/upload/v1768032260/Child_1_axdjgd.png" 
             className="rounded-2xl shadow-2xl border-4 border-white" alt="Korah Child" />
      </div>
    </section>
  );
};