import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

interface PerformanceReviewsSectionProps {
  reviews: any[];
  fmtDate: (d: string | null) => string;
}

export const PerformanceReviewsSection = ({ reviews, fmtDate }: PerformanceReviewsSectionProps) => {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-7 md:p-9 border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-sm">
          <FontAwesomeIcon icon={faStar} />
        </div>
        <div>
          <h2 className="font-black text-slate-900 tracking-tight">Performance Reviews</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {reviews.length} evaluation{reviews.length !== 1 ? "s" : ""} on record
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((rev: any, i: number) => (
          <div key={rev.id ?? i}
            className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all">
            
            {/* Rating Star Indicator block */}
            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 shrink-0">
              <span className="text-amber-700 font-black text-sm">{rev.rating}</span>
              <div className="flex gap-0.5 ml-1">
                {Array.from({ length: 5 }).map((_, si) => (
                  <FontAwesomeIcon key={si} icon={faStar}
                    className={`text-[8px] ${si < rev.rating ? "text-amber-400" : "text-slate-200"}`} />
                ))}
              </div>
            </div>

            {/* Content text metadata */}
            <div className="flex-1 min-w-0">
              {rev.comments && (
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{rev.comments}</p>
              )}
              {rev.goals && (
                <p className="text-xs text-slate-500 mt-1 italic">{rev.goals}</p>
              )}
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                {fmtDate(rev.reviewDate)}
                {rev.reviewedById && <span className="ml-2">· Reviewer ID: {rev.reviewedById}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};