import { faGraduationCap, faUtensils } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
export const OurServiceComponent = () => {
  const services = [
    { 
      title: "Education", 
      text: "Tech Orphan Private School for better learning and future opportunities.", 
      icon: faGraduationCap, 
      img: "https://res.cloudinary.com/dkzvlqjp9/image/upload/v1768031988/school_yiltyp.png" 
    },
    { 
      title: "Food Security", 
      text: "Providing nutritious meals daily for orphaned and vulnerable children.", 
      icon: faUtensils, 
      img: "https://res.cloudinary.com/dkzvlqjp9/image/upload/v1767961085/lunch_ujtozk.png" 
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-6">
      <h2 className="text-3xl font-bold text-center mb-16 text-slate-800">Our Impact Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {services.map((s, i) => (
          <div key={i} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100">
            <div className="h-64 overflow-hidden">
              <img src={s.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-8">
              <div className="w-12 h-12  rounded-lg flex items-center justify-center text-primBtn mb-4 text-xl">
                <FontAwesomeIcon icon={s.icon} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-Hover">{s.title}</h3>
              <p className="text-slate-600">{s.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};