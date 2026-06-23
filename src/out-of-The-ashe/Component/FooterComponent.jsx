import { faFacebook, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faMailBulk } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
export const FooterComponent = () => {
  return (
    <footer className="bg-primBtn text-slate-300 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 border-b border-slate-800 pb-12">
        <div className="space-y-4">
          <h4 className="text-white text-lg font-bold">Out of The Ashes</h4>
          <p className="text-sm text-white leading-relaxed">Reducing the suffering of orphans and vulnerable children in Ethiopia through sustainable community growth.</p>
        </div>
        
        <div className="flex flex-col items-center">
          <h4 className="text-white text-lg font-bold mb-6">Connect With Us</h4>
          <div className="flex text-white gap-6 text-2xl">
            <FontAwesomeIcon icon={faFacebook} className="hover:text-blue-500  cursor-pointer transition-colors" />
            <FontAwesomeIcon icon={faTwitter} className="hover:text-cyan-400 cursor-pointer transition-colors" />
            <FontAwesomeIcon icon={faLinkedin} className="hover:text-blue-700 cursor-pointer transition-colors" />
            <FontAwesomeIcon icon={faMailBulk} className="hover:text-red-400 cursor-pointer transition-colors" />
          </div>
        </div>

        <div className=" text-white text-right">
          <p className="text-sm ">© {new Date().getFullYear()} All Rights Reserved</p>
          <p className="text-sm text-text-white italic">Designed by Abay Tefera</p>
        </div>
      </div>
    </footer>
  );
};