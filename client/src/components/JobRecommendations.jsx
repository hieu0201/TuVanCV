import React, { useState } from 'react';
import { 
  Briefcase, Sparkles, CheckCircle2, TrendingUp, Users, 
  ArrowRight, Send, Building, MapPin, DollarSign, Clock, 
  AlertCircle, Check, Flame, ChevronRight
} from 'lucide-react';
import { applyToJob } from '../services/api';
import confetti from 'canvas-confetti';

export default function JobRecommendations({ recommendations = [], cvText = '', candidateInfo = null, onSelectJobForMatching }) {
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ id: null, text: '' });

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const handleQuickApply = async (job, matchScore, matchReason) => {
    const jobId = job._id || job.id;
    if (!jobId || appliedJobIds.has(jobId)) return;

    setApplyingJobId(jobId);
    setFeedbackMsg({ id: null, text: '' });

    try {
      const res = await applyToJob({
        jobId,
        candidateName: candidateInfo?.fullName || 'Ứng viên',
        candidateEmail: candidateInfo?.email || '',
        candidatePhone: candidateInfo?.phone || '',
        matchScore: matchScore || 85,
        matchingDetails: {
          skillsMatch: matchScore,
          hiringRecommendation: matchReason || 'Ứng viên phù hợp theo đề xuất AI'
        },
        cvSnippet: cvText.slice(0, 500)
      });

      if (res && res.success) {
        setAppliedJobIds(new Set([...appliedJobIds, jobId]));
        setFeedbackMsg({ id: jobId, text: 'Nộp hồ sơ thành công!' });
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } else {
        setFeedbackMsg({ id: jobId, text: res?.message || 'Không thể gửi hồ sơ' });
      }
    } catch (e) {
      setFeedbackMsg({ id: jobId, text: 'Lỗi khi nộp hồ sơ' });
    } finally {
      setApplyingJobId(null);
      setTimeout(() => setFeedbackMsg({ id: null, text: '' }), 5000);
    }
  };

  return (
    <div className="saas-card p-6 border-t-4 border-t-blue-600 space-y-5 animate-fadeIn bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Cơ Hội Việc Làm Phù Hợp Nhất (AI Đề Xuất)
            </h3>
            <p className="text-xs text-slate-500">
              Dựa trên kỹ năng và kinh nghiệm vừa bóc tách từ hồ sơ của bạn
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
          {recommendations.length} Vị trí phù hợp
        </span>
      </div>

      {/* Grid việc làm đề xuất */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.slice(0, 4).map((rec, idx) => {
          const job = rec.job;
          const jobId = job._id || job.id;
          const isApplied = appliedJobIds.has(jobId);
          const isApplying = applyingJobId === jobId;
          const score = rec.matchScore || 80;

          return (
            <div 
              key={jobId || idx}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all flex flex-col justify-between space-y-3 relative group"
            >
              <div>
                {/* Header: Title & Match Score Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                      {job.title}
                    </h4>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">{job.company}</p>
                  </div>
                  
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 ${
                    score >= 80 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    <span>{score}%</span>
                    <span className="text-[10px] font-normal">Match</span>
                  </div>
                </div>

                {/* Job Specs & Real Applicant Count */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2.5">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-slate-800 font-semibold">{job.salary}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.location}</span>
                  </span>
                  <span>•</span>
                  {/* Dynamic applicant count badge */}
                  <span className="flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[11px]">
                    <Users className="w-3 h-3 text-purple-600" />
                    <span>{job.applicantsCount || 0} người đã nộp</span>
                  </span>
                </div>

                {/* Match Reason snippet */}
                <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 mt-3 leading-relaxed italic shadow-2xs">
                  "{rec.matchReason}"
                </p>

                {/* Matched Skills */}
                {rec.matchedSkills && rec.matchedSkills.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Kỹ năng khớp:</span>
                    {rec.matchedSkills.slice(0, 4).map((sk, sIdx) => (
                      <span key={sIdx} className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectJobForMatching && onSelectJobForMatching(job)}
                  className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors font-medium"
                >
                  <span>Xem chi tiết JD</span>
                  <ChevronRight className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-2">
                  {feedbackMsg.id === jobId && (
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      {feedbackMsg.text}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleQuickApply(job, score, rec.matchReason)}
                    disabled={isApplied || isApplying}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                      isApplied
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã Nộp Hồ Sơ</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isApplying ? 'Đang gửi...' : 'Nộp Hồ Sơ Ngay'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
