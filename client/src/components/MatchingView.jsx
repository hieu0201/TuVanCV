import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Sparkles, CheckCircle2, XCircle, AlertTriangle, 
  Lightbulb, Briefcase, TrendingUp, Check, ArrowRight, Send, Users,
  Search, MapPin, DollarSign, Clock, Filter, Eye, X, Building, Upload
} from 'lucide-react';
import { getJobs, evaluateMatch, applyToJob, analyzeCV } from '../services/api';
import confetti from 'canvas-confetti';

export default function MatchingView({ prefilledCV, prefilledFileName, prefilledJobId, onCVUpdated, currentUser, onGoToRecruiter }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [customJD, setCustomJD] = useState('');
  const [cvText, setCvText] = useState(prefilledCV || '');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Job Detail Modal State
  const [modalJob, setModalJob] = useState(null);

  // Apply state
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');

  // Tải danh sách công việc khi mount
  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await getJobs();
        if (res && res.jobs && res.jobs.length > 0) {
          setJobs(res.jobs);
          const targetJob = (prefilledJobId && res.jobs.find(j => (j._id === prefilledJobId || j.id === prefilledJobId))) || res.jobs[0];
          const targetId = targetJob._id || targetJob.id;
          setSelectedJobId(targetId);
          setCustomJD(targetJob.description);
        }
      } catch (e) {
        console.error("Không thể tải danh sách jobs:", e);
      }
    }
    loadJobs();
  }, [prefilledJobId]);

  // Khi prefilledJobId thay đổi
  useEffect(() => {
    if (prefilledJobId && jobs.length > 0) {
      const found = jobs.find(j => (j._id === prefilledJobId || j.id === prefilledJobId));
      if (found) {
        setSelectedJobId(found._id || found.id);
        setCustomJD(found.description);
        setMatchResult(null);
        setApplySuccessMsg('');
      }
    }
  }, [prefilledJobId, jobs]);

  // Cập nhật CV text nếu prefilledCV thay đổi
  useEffect(() => {
    if (prefilledCV) {
      setCvText(prefilledCV);
    }
  }, [prefilledCV]);

  // Khi chọn một job khác từ danh sách
  const handleJobSelect = (jobId) => {
    setSelectedJobId(jobId);
    const found = jobs.find(j => (j._id === jobId || j.id === jobId));
    if (found) {
      setCustomJD(found.description);
    }
    setMatchResult(null);
    setApplySuccessMsg('');
  };

  // Thực hiện chấm điểm
  const handleEvaluate = async () => {
    if (!cvText.trim() || !customJD.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    setApplySuccessMsg('');

    try {
      const res = await evaluateMatch(cvText, customJD);
      if (res && res.success) {
        setMatchResult(res.result);
        if (res.result.matchScore >= 80) {
          confetti({
            particleCount: 70,
            spread: 80,
            origin: { y: 0.5 }
          });
        }
      } else {
        setErrorMsg("Không thể hoàn tất đánh giá tương thích. Vui lòng thử lại!");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Lỗi kết nối máy chủ AI.");
    } finally {
      setIsLoading(false);
    }
  };

  // Tải trực tiếp tệp CV (Word .docx hoặc PDF) ngay tại màn hình So Khớp
  const handleDirectFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingDoc(true);
    setErrorMsg(null);
    try {
      const res = await analyzeCV('', file, {
        userId: currentUser?._id || currentUser?.id,
        candidateEmail: currentUser?.email,
        candidateName: currentUser?.fullName
      });
      if (res && res.success && res.extractedText) {
        setCvText(res.extractedText);
        if (onCVUpdated) {
          onCVUpdated(res.extractedText, file.name);
        }
      } else {
        setErrorMsg(res?.message || 'Không thể trích xuất nội dung từ tệp');
      }
    } catch (err) {
      setErrorMsg('Lỗi trích xuất tệp CV: ' + err.message);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Nộp hồ sơ ứng tuyển vào vị trí này
  const handleApplyJob = async () => {
    if (!selectedJobId) return;
    setIsApplying(true);
    setApplySuccessMsg('');

    try {
      const res = await applyToJob({
        jobId: selectedJobId,
        candidateId: currentUser?._id || currentUser?.id,
        candidateName: currentUser?.fullName || 'Ứng viên',
        candidateEmail: currentUser?.email || '',
        candidatePhone: currentUser?.phone || '',
        matchScore: matchResult?.matchScore || 80,
        matchingDetails: {
          skillsMatch: matchResult?.scoreBreakdown?.skillsMatch || 80,
          experienceMatch: matchResult?.scoreBreakdown?.experienceMatch || 75,
          matchedSkills: matchResult?.matchedSkills || [],
          missingSkills: matchResult?.missingCriticalSkills || [],
          hiringRecommendation: matchResult?.candidateAdvice || 'Hồ sơ ứng tuyển trực tiếp'
        },
        cvSnippet: cvText.slice(0, 1000)
      });

      if (res && res.success) {
        setApplySuccessMsg('Hồ sơ của bạn đã được chuyển thẳng tới Nhà Tuyển Dụng thành công!');
        confetti({ particleCount: 50, spread: 60 });
      } else {
        setErrorMsg(res?.message || 'Không thể gửi hồ sơ');
      }
    } catch (e) {
      setErrorMsg('Lỗi nộp hồ sơ: ' + e.message);
    } finally {
      setIsApplying(false);
    }
  };

  // Lọc danh sách việc làm
  const filteredJobs = jobs.filter(job => {
    const matchSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.requiredSkills || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchLocation = locationFilter === 'all' || 
      (job.location && job.location.toLowerCase().includes(locationFilter.toLowerCase()));

    const matchCategory = categoryFilter === 'all' || 
      (job.category && job.category.toLowerCase().includes(categoryFilter.toLowerCase()));

    return matchSearch && matchLocation && matchCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header Bar */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
          <Briefcase className="w-3.5 h-3.5 text-blue-600" />
          <span>Sàn Việc Làm & Đo Lường Tương Thích Tuyển Dụng</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Khám Phá Việc Làm & Đánh Giá Mức Độ Phù Hợp
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Tìm kiếm công việc theo ngành nghề, đọc chi tiết mô tả công việc (JD) và kiểm tra mức độ đáp ứng kỹ năng của CV bạn với vị trí tuyển dụng.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="saas-card p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Keyword Search (6 cols) */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo chức danh, kỹ năng (React, Python...), tên công ty..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Location Filter (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">📍 Tất cả địa điểm</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Remote">Làm việc từ xa (Remote)</option>
            </select>
          </div>

          {/* Category Filter (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">📁 Tất cả ngành nghề</option>
              <option value="Công nghệ thông tin">Công nghệ thông tin</option>
              <option value="AI">AI & Dữ liệu</option>
              <option value="Thiết kế">Thiết kế UI/UX</option>
              <option value="Marketing">Marketing</option>
              <option value="Tài chính">Tài chính</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Jobs List & Match Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Job Selector Cards */}
          <div className="saas-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Chọn Vị Trí Muốn So Khớp ({filteredJobs.length})
              </h3>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredJobs.map((job) => {
                const jobId = job._id || job.id;
                const isSelected = selectedJobId === jobId;
                return (
                  <div
                    key={jobId}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 cursor-pointer" onClick={() => handleJobSelect(jobId)}>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">{job.title}</h4>
                        <p className="text-[11px] text-blue-600 font-medium mt-0.5">{job.company}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 flex-wrap">
                          <span>📍 {job.location || 'Toàn quốc'}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold">{job.salary || 'Thoả thuận'}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          👥 {job.applicantsCount || 0} hồ sơ
                        </span>

                        <button
                          type="button"
                          onClick={() => setModalJob(job)}
                          className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium hover:underline"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Chi tiết</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredJobs.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  Không tìm thấy việc làm nào khớp với bộ lọc tìm kiếm
                </div>
              )}
            </div>
          </div>

          {/* Candidate CV Input Box */}
          <div className="saas-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Nội Dung CV Của Bạn
              </h3>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-[11px] font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-all shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isUploadingDoc ? 'Đang đọc...' : 'Tải File (Word/PDF)'}</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                    onChange={handleDirectFileUpload}
                    className="hidden"
                  />
                </label>

                {cvText && (
                  <button
                    type="button"
                    onClick={() => {
                      setCvText('');
                      if (onCVUpdated) onCVUpdated('', '');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Xóa
                  </button>
                )}
                <span className="text-[11px] text-slate-500">({cvText.length} ký tự)</span>
              </div>
            </div>

            <textarea
              rows={8}
              value={cvText}
              onChange={(e) => {
                setCvText(e.target.value);
                if (onCVUpdated) onCVUpdated(e.target.value);
              }}
              placeholder="Dán toàn bộ nội dung CV của bạn vào đây hoặc tải trực tiếp file Word / PDF (nếu đã phân tích ở mục 'Phân Tích CV' thì nội dung sẽ tự động xuất hiện tại đây)..."
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 resize-none font-mono leading-relaxed"
            />

            <button
              onClick={handleEvaluate}
              disabled={isLoading || !cvText.trim() || !customJD.trim()}
              className="mt-4 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-blue-200" />
                  <span>AI Đang So Khớp Ngữ Nghĩa Sâu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Chấm Điểm Phù Hợp Bằng AI</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Matching Evaluation Report (7 cols) */}
        <div className="lg:col-span-7">
          {isLoading && (
            <div className="saas-card p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Sparkles className="w-7 h-7 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Đang So Sánh Năng Lực CV Với Tiêu Chí Tuyển Dụng</h3>
              <p className="text-xs text-slate-600 max-w-md">
                Gemini 2.5 Flash đang bóc tách từng yêu cầu chuyên môn trong JD, đối chiếu kinh nghiệm trong CV và đo lường khoảng cách kỹ năng.
              </p>
            </div>
          )}

          {!isLoading && !matchResult && (
            <div className="saas-card p-12 text-center flex flex-col items-center justify-center border-dashed">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Sẵn Sàng Đo Lường Phù Hợp</h3>
              <p className="text-xs text-slate-500 max-w-md">
                Chọn một vị trí tuyển dụng bên trái và dán nội dung CV của bạn, sau đó nhấn nút "Chấm Điểm Phù Hợp Bằng AI" để nhận bảng phân tích chi tiết.
              </p>
            </div>
          )}

          {!isLoading && matchResult && (
            <div className="space-y-6 animate-fadeIn">
              {/* Score Header Card */}
              <div className="saas-card p-6 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/70 border-blue-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Đánh Giá Tương Thích</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                      {matchResult.verdict || "Phù Hợp"}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Dựa trên phân tích yêu cầu chuyên môn, năm kinh nghiệm và danh mục kỹ năng cốt lõi.
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Match Score</div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-blue-600">
                      {matchResult.matchScore}%
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Bars */}
                {matchResult.scoreBreakdown && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Kỹ Năng</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{matchResult.scoreBreakdown.skillsMatch || 80}%</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Kinh Nghiệm</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{matchResult.scoreBreakdown.experienceMatch || 75}%</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Học Vấn</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{matchResult.scoreBreakdown.educationMatch || 85}%</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Văn Hóa</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{matchResult.scoreBreakdown.domainFit || 80}%</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Matched vs Missing Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matched Skills */}
                <div className="saas-card p-5 border-l-4 border-l-emerald-500">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Kỹ Năng Đã Đáp Ứng ({matchResult.matchedSkills?.length || 0})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.matchedSkills?.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                        ✓ {skill}
                      </span>
                    ))}
                    {(!matchResult.matchedSkills || matchResult.matchedSkills.length === 0) && (
                      <p className="text-xs text-slate-500">Chưa ghi nhận kỹ năng nào trùng khớp</p>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="saas-card p-5 border-l-4 border-l-rose-500">
                  <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Kỹ Năng Cốt Lõi Còn Thiếu ({matchResult.missingCriticalSkills?.length || 0})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.missingCriticalSkills?.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded text-xs bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
                        ✗ {skill}
                      </span>
                    ))}
                    {(!matchResult.missingCriticalSkills || matchResult.missingCriticalSkills.length === 0) && (
                      <p className="text-xs text-emerald-700 font-semibold">Tuyệt vời! Không thiếu kỹ năng trọng yếu nào.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Strengths and Advice */}
              <div className="saas-card p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <span>Lời Khuyên Cho Ứng Viên Trước Khi Nộp Đơn</span>
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    {matchResult.candidateAdvice || "Hãy tập trung làm nổi bật các dự án thực tế liên quan đến kỹ năng nhà tuyển dụng yêu cầu trong phần tóm tắt CV."}
                  </p>
                </div>

                {matchResult.recruiterSummary && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Góc Nhìn Của Nhà Tuyển Dụng (HR Verdict)
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {matchResult.recruiterSummary}
                    </p>
                  </div>
                )}
              </div>

              {/* Apply Action Card */}
              <div className="saas-card p-5 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Bạn Đã Hài Lòng Với Kết Quả Này?</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Nộp đơn ngay để chuyển thẳng CV và báo cáo đánh giá tương thích tới Nhà Tuyển Dụng.
                  </p>
                </div>

                <button
                  onClick={handleApplyJob}
                  disabled={isApplying}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>{isApplying ? 'Đang gửi...' : 'Nộp Hồ Sơ Ứng Tuyển Ngay'}</span>
                </button>
              </div>

              {applySuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{applySuccessMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* JOB DETAIL MODAL (Requirement 2) */}
      {modalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="saas-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6 bg-white">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2 inline-block">
                  {modalJob.category || 'Công nghệ thông tin'}
                </span>
                <h3 className="text-xl font-bold text-slate-900">{modalJob.title}</h3>
                <p className="text-sm text-blue-600 font-semibold mt-1">{modalJob.company}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                  <span>📍 {modalJob.location || 'Toàn quốc'}</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold">💰 {modalJob.salary || 'Thoả thuận'}</span>
                  <span>•</span>
                  <span>{modalJob.type || 'Toàn thời gian'}</span>
                  <span>•</span>
                  <span>{modalJob.experience || '1+ năm kinh nghiệm'}</span>
                </div>
              </div>

              <button
                onClick={() => setModalJob(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant count & status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-600">Số lượng ứng viên đã nộp:</span>
              <span className="font-bold text-blue-700">👥 {modalJob.applicantsCount || 0} hồ sơ</span>
            </div>

            {/* Job Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mô Tả & Yêu Cầu Chi Tiết</h4>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                {modalJob.description}
              </div>
            </div>

            {/* Required Skills */}
            {modalJob.requiredSkills && modalJob.requiredSkills.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Kỹ Năng Cần Thiết</h4>
                <div className="flex flex-wrap gap-2">
                  {modalJob.requiredSkills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-lg text-xs bg-slate-100 border border-slate-200 text-slate-800 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalJob(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  handleJobSelect(modalJob._id || modalJob.id);
                  setModalJob(null);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <span>So Khớp Với CV Của Bạn</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
