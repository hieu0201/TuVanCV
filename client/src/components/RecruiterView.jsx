import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Users, Filter, CheckCircle, AlertTriangle, 
  XCircle, Clock, ChevronRight, Sparkles, MessageSquare, 
  Search, Download, Share2, Eye, Check, X, Mail, Calendar, 
  DollarSign, Send, FileText, UserPlus, RefreshCw, Building, Globe, MapPin, Power
} from 'lucide-react';
import { 
  getJobs,
  getRecruiterJobs, 
  createJob, 
  generateInterviewQuestions, 
  getApplicationsByJob, 
  screenCandidateForJob, 
  updateApplicationStatus,
  getRecommendedCandidates,
  analyzeJobDescription,
  updateCompanyProfile,
  toggleJobStatus
} from '../services/api';

export default function RecruiterView() {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'post-job' | 'analyze-jd' | 'company-profile'
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [filterVerdict, setFilterVerdict] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // AI JD Analysis State
  const [jdTextToAnalyze, setJdTextToAnalyze] = useState('');
  const [analyzingJD, setAnalyzingJD] = useState(false);
  const [jdAnalysisResult, setJdAnalysisResult] = useState(null);

  // Company Profile State
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companySize, setCompanySize] = useState('50-150 nhân sự');
  const [companyIndustry, setCompanyIndustry] = useState('Công nghệ thông tin');
  const [companyDescription, setCompanyDescription] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);

  // AI Candidate Recommendation State
  const [candidateViewMode, setCandidateViewMode] = useState('applicants'); // 'applicants' | 'recommended'
  const [recommendedCandidates, setRecommendedCandidates] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);

  // Interview Questions Modal State
  const [interviewModalData, setInterviewModalData] = useState(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Screen Candidate Modal State (HR chủ động tải CV vào tuyển dụng)
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [screenCvText, setScreenCvText] = useState('');
  const [screenName, setScreenName] = useState('');
  const [screenEmail, setScreenEmail] = useState('');
  const [screenPhone, setScreenPhone] = useState('');
  const [isScreening, setIsScreening] = useState(false);

  // Hiring Action Modals
  const [actionCandidate, setActionCandidate] = useState(null);
  const [actionType, setActionType] = useState(null); // 'interview' | 'offer' | 'reject'
  const [interviewDate, setInterviewDate] = useState('');
  const [meetingLink, setMeetingLink] = useState('Online Google Meet: https://meet.google.com/xyz-recruitment');
  const [interviewNote, setInterviewNote] = useState('');
  const [salaryOffer, setSalaryOffer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // Post Job Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSkills, setNewSkills] = useState('');

  // Tải danh sách công việc riêng của Nhà tuyển dụng hiện tại
  const fetchJobs = async () => {
    try {
      const res = await getRecruiterJobs();
      if (res && res.jobs) {
        setJobs(res.jobs);
        if (res.jobs.length > 0) {
          setSelectedJob(prev => {
            if (prev && res.jobs.some(j => (j._id === prev._id || j.id === prev.id))) {
              return res.jobs.find(j => (j._id === prev._id || j.id === prev.id));
            }
            return res.jobs[0];
          });
        } else {
          setSelectedJob(null);
          setCandidates([]);
        }
      }
    } catch (e) {
      console.error("Lỗi nạp jobs:", e);
    }
  };

  useEffect(() => {
    fetchJobs();
    const saved = localStorage.getItem('smartrecruit_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.companyName) setCompanyName(u.companyName);
        if (u.companyWebsite) setCompanyWebsite(u.companyWebsite);
        if (u.companyAddress) setCompanyAddress(u.companyAddress);
        if (u.companySize) setCompanySize(u.companySize);
        if (u.companyIndustry) setCompanyIndustry(u.companyIndustry);
        if (u.companyDescription) setCompanyDescription(u.companyDescription);
      } catch (e) {}
    }
  }, []);

  // Xử lý Phân tích JD bằng AI
  const handleAnalyzeJD = async () => {
    if (!jdTextToAnalyze.trim()) return;
    setAnalyzingJD(true);
    try {
      const res = await analyzeJobDescription(jdTextToAnalyze);
      if (res && res.success) {
        setJdAnalysisResult(res.analysis);
      }
    } catch (e) {
      console.error(e);
      setFeedbackMsg({ type: 'error', text: 'Lỗi phân tích JD bằng AI' });
    } finally {
      setAnalyzingJD(false);
    }
  };

  // Cập nhật thông tin công ty
  const handleSaveCompanyProfile = async (e) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      const res = await updateCompanyProfile({
        companyName,
        companyWebsite,
        companyAddress,
        companySize,
        companyIndustry,
        companyDescription
      });
      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: 'Đã cập nhật thông tin doanh nghiệp thành công!' });
        // Cập nhật lại localStorage user
        const saved = localStorage.getItem('smartrecruit_user');
        if (saved) {
          const u = JSON.parse(saved);
          localStorage.setItem('smartrecruit_user', JSON.stringify({
            ...u,
            companyName,
            companyWebsite,
            companyAddress,
            companySize,
            companyIndustry,
            companyDescription
          }));
        }
      }
    } catch (e) {
      setFeedbackMsg({ type: 'error', text: 'Lỗi cập nhật hồ sơ doanh nghiệp' });
    } finally {
      setSavingCompany(false);
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4000);
    }
  };

  // Bật/tắt trạng thái tuyển dụng của Job
  const handleToggleJobStatus = async (jobId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      const res = await toggleJobStatus(jobId, nextStatus);
      if (res && res.success) {
        setJobs(jobs.map(j => (j._id === jobId || j.id === jobId) ? { ...j, status: nextStatus, isActive: nextStatus === 'active' } : j));
        if (selectedJob && (selectedJob._id === jobId || selectedJob.id === jobId)) {
          setSelectedJob({ ...selectedJob, status: nextStatus, isActive: nextStatus === 'active' });
        }
        setFeedbackMsg({ type: 'success', text: `Đã đổi trạng thái tin sang: ${nextStatus === 'active' ? 'Đang tuyển' : 'Tạm dừng nhận hồ sơ'}` });
      }
    } catch (e) {
      setFeedbackMsg({ type: 'error', text: 'Lỗi thay đổi trạng thái việc làm' });
    }
    setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 3000);
  };

  // Tải danh sách ứng viên thật từ MongoDB cho Job được chọn
  useEffect(() => {
    if (!selectedJob) return;
    const jobId = selectedJob._id || selectedJob.id;
    if (!jobId) return;

    async function loadApplicants() {
      setLoadingCandidates(true);
      try {
        const res = await getApplicationsByJob(jobId);
        if (res && res.success) {
          setCandidates(res.applications || []);
        } else {
          setCandidates([]);
        }
      } catch (e) {
        console.error("Lỗi nạp ứng viên:", e);
        setCandidates([]);
      } finally {
        setLoadingCandidates(false);
      }
    }
    loadApplicants();
  }, [selectedJob]);

  // Tải danh sách ứng viên đề xuất AI cho Job
  const fetchRecommendedCandidates = async (jobId) => {
    if (!jobId) return;
    setLoadingRecommended(true);
    try {
      const res = await getRecommendedCandidates(jobId);
      if (res && res.success) {
        setRecommendedCandidates(res.candidates || []);
      }
    } catch (e) {
      console.error("Lỗi nạp gợi ý ứng viên:", e);
    } finally {
      setLoadingRecommended(false);
    }
  };

  useEffect(() => {
    if (candidateViewMode === 'recommended' && selectedJob) {
      fetchRecommendedCandidates(selectedJob._id || selectedJob.id);
    }
  }, [candidateViewMode, selectedJob]);

  // Xử lý tạo câu hỏi phỏng vấn bằng AI
  const handleGenerateQuestions = async (candidate) => {
    setIsGeneratingQuestions(true);
    try {
      const jdText = selectedJob ? selectedJob.description : "Yêu cầu kỹ sư phần mềm";
      const cvText = candidate.cvSnippet || `${candidate.candidateName || candidate.name} - ${candidate.role || 'Kỹ sư phần mềm'}`;
      const res = await generateInterviewQuestions(cvText, jdText);
      if (res && res.questions) {
        setInterviewModalData({
          candidate,
          questions: res.questions
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleCopyQuestion = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // HR chủ động đưa CV vào sàng lọc bằng AI
  const handleScreenSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob || !screenCvText) return;
    setIsScreening(true);

    try {
      const res = await screenCandidateForJob({
        jobId: selectedJob._id || selectedJob.id,
        cvText: screenCvText,
        candidateName: screenName,
        candidateEmail: screenEmail,
        candidatePhone: screenPhone
      });

      if (res && res.success) {
        setCandidates([res.application, ...candidates]);
        setIsScreenModalOpen(false);
        setScreenCvText('');
        setScreenName('');
        setScreenEmail('');
        setScreenPhone('');
        setFeedbackMsg({ type: 'success', text: res.message || 'Đã thêm hồ sơ ứng viên thành công!' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Lỗi khi sàng lọc hồ sơ' });
    } finally {
      setIsScreening(false);
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 5000);
    }
  };

  // Xử lý Thay đổi trạng thái & Gửi Email (Mời PV / Tuyển / Từ chối)
  const handleExecuteHiringAction = async (e) => {
    e.preventDefault();
    if (!actionCandidate || !actionType) return;
    setActionLoading(true);

    try {
      const candidateId = actionCandidate._id || actionCandidate.id;
      let payload = {
        candidateEmail: actionCandidate.candidateEmail || actionCandidate.email,
        candidateName: actionCandidate.candidateName || actionCandidate.name,
        jobTitle: selectedJob?.title,
        companyName: selectedJob?.company
      };

      if (actionType === 'interview') {
        payload.status = 'interviewing';
        payload.interviewDetails = {
          scheduledDate: interviewDate,
          meetingLink,
          note: interviewNote
        };
      } else if (actionType === 'offer') {
        payload.status = 'hired';
        payload.offerDetails = {
          salaryOffer,
          startDate,
          note: offerNote
        };
      } else if (actionType === 'reject') {
        payload.status = 'rejected';
      }

      const res = await updateApplicationStatus(candidateId, payload);
      if (res && res.success) {
        setFeedbackMsg({ 
          type: 'success', 
          text: `Đã cập nhật trạng thái ứng viên [${payload.status.toUpperCase()}] và kích hoạt gửi email thông báo!` 
        });
        
        // Cập nhật state local
        setCandidates(candidates.map(c => 
          (c._id === candidateId || c.id === candidateId) ? { ...c, status: payload.status } : c
        ));

        setActionCandidate(null);
        setActionType(null);
      } else {
        setFeedbackMsg({ type: 'error', text: res?.message || 'Cập nhật thất bại' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Lỗi máy chủ khi cập nhật quyết định' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 5000);
    }
  };

  // Xử lý đăng job mới
  const handleCreateJobSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle) return;

    const payload = {
      title: newTitle,
      company: newCompany || companyName || "Doanh nghiệp tuyển dụng",
      salary: newSalary || "30 - 45 Triệu",
      description: newDescription,
      requiredSkills: newSkills.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      const res = await createJob(payload);
      if (res && res.job) {
        await fetchJobs();
        setSelectedJob(res.job);
        setActiveTab('pipeline');
        setNewTitle('');
        setNewCompany('');
        setNewSalary('');
        setNewDescription('');
        setNewSkills('');
        setFeedbackMsg({ type: 'success', text: 'Đăng tin tuyển dụng mới thành công!' });
      }
    } catch (e) {
      setFeedbackMsg({ type: 'error', text: 'Không thể đăng tin tuyển dụng' });
    } finally {
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4000);
    }
  };

  // Lọc ứng viên theo tìm kiếm và trạng thái
  const filteredCandidates = candidates.filter(c => {
    const name = c.candidateName || c.name || '';
    const email = c.candidateEmail || c.email || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || email.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterVerdict === 'all') return matchesSearch;
    return matchesSearch && c.status === filterVerdict;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span>Phân Hệ Doanh Nghiệp: Quản Trị Pipeline Tuyển Dụng & Quyết Định Phỏng Vấn</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Portal Nhà Tuyển Dụng (HR)
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Đánh giá độ tương thích, tạo câu hỏi phỏng vấn theo hồ sơ, mời phỏng vấn và gửi thư trúng tuyển qua Email.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'pipeline'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quy Trình Tuyển Dụng</span>
          </button>

          <button
            onClick={() => setActiveTab('post-job')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'post-job'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Đăng Tin Mới</span>
          </button>

          <button
            onClick={() => setActiveTab('analyze-jd')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'analyze-jd'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Phân Tích JD (AI)</span>
          </button>

          <button
            onClick={() => setActiveTab('company-profile')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'company-profile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Hồ Sơ Doanh Nghiệp</span>
          </button>
        </div>
      </div>

      {/* Thông báo thao tác */}
      {feedbackMsg.text && (
        <div className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Tab 1: Pipeline Management */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cột trái: Danh sách vị trí việc làm (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Vị Trí Đang Tuyển ({jobs.length})
              </h3>
              <button 
                onClick={fetchJobs} 
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {jobs.map((job) => {
                const jId = job._id || job.id;
                const isSelected = selectedJob && (selectedJob._id === jId || selectedJob.id === jId);
                return (
                  <div
                    key={jId}
                    onClick={() => setSelectedJob(job)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{job.title}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        {job.applicantsCount || 0} hồ sơ
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 font-semibold mt-1">{job.company}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-3">
                      <span className="font-medium text-emerald-600">{job.salary}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cột phải: Hồ sơ ứng viên & Pipeline (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedJob && (
              <div className="saas-card p-6 border-l-4 border-l-blue-600 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedJob.title}</h3>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">{selectedJob.company} • {selectedJob.location}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleToggleJobStatus(selectedJob._id || selectedJob.id, selectedJob.status || 'active')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                        (selectedJob.status === 'closed' || selectedJob.isActive === false)
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{(selectedJob.status === 'closed' || selectedJob.isActive === false) ? 'Đang Tạm Dừng' : 'Đang Nhận Hồ Sơ'}</span>
                    </button>

                    <button
                      onClick={() => setIsScreenModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>AI Sàng Lọc Hồ Sơ Mới</span>
                    </button>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Tìm ứng viên theo tên hoặc email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={filterVerdict}
                    onChange={(e) => setFilterVerdict(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="applied">Mới ứng tuyển</option>
                    <option value="interviewing">Mời phỏng vấn</option>
                    <option value="hired">Đã trúng tuyển</option>
                    <option value="rejected">Đã từ chối</option>
                  </select>
                </div>
              </div>
            )}

            {/* Mode Switcher: Ứng Viên Đã Nộp vs Gợi Ý Ứng Viên Tiềm Năng */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setCandidateViewMode('applicants')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  candidateViewMode === 'applicants'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Hồ Sơ Đã Nộp ({candidates.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCandidateViewMode('recommended')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  candidateViewMode === 'recommended'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Gợi Ý Ứng Viên Tiềm Năng (AI Match)</span>
              </button>
            </div>

            {/* AI Candidate Recommendations View */}
            {candidateViewMode === 'recommended' && (
              <div className="space-y-3">
                {loadingRecommended ? (
                  <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>AI đang phân tích và tìm kiếm ứng viên phù hợp nhất...</span>
                  </div>
                ) : recommendedCandidates.length > 0 ? (
                  recommendedCandidates.map((cand) => (
                    <div 
                      key={cand.id}
                      className="saas-card p-5 border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all space-y-4 bg-white"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={cand.avatar} alt="avatar" className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200" />
                          <div>
                            <h4 className="font-bold text-slate-900 text-base">{cand.fullName}</h4>
                            <p className="text-xs text-blue-600 font-semibold">{cand.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{cand.email || 'Email liên kết hệ thống'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-2xl font-black text-blue-600">
                              {cand.matchScore}%
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Độ Tương Thích AI</span>
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed italic">
                        "{cand.summary || 'Ứng viên có kỹ năng và nền tảng chuyên môn rất phù hợp với vị trí này.'}"
                      </p>

                      {/* Matched Skills */}
                      {cand.matchedSkills && cand.matchedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Kỹ năng khớp:</span>
                          {cand.matchedSkills.map((sk, sIdx) => (
                            <span key={sIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                              ✓ {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action to invite */}
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">Hồ sơ nổi bật đề xuất bởi Gemini 2.5 Flash</span>
                        <button
                          onClick={() => {
                            setActionCandidate({
                              _id: cand.id,
                              candidateName: cand.fullName,
                              candidateEmail: cand.email,
                              role: cand.title
                            });
                            setActionType('interview');
                            setInterviewDate('14:30 - Thứ Hai tuần tới');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Mời Phỏng Vấn Trực Tiếp</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="saas-card p-8 border border-slate-200 text-center space-y-2 bg-white">
                    <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-800">Chưa có ứng viên đề xuất nào</p>
                    <p className="text-xs text-slate-500">Kho dữ liệu ứng viên đang được cập nhật thêm hồ sơ mới.</p>
                  </div>
                )}
              </div>
            )}

            {/* Candidates List (Applied) */}
            {candidateViewMode === 'applicants' && (
            <div className="space-y-3">
              {loadingCandidates ? (
                <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Đang tải danh sách ứng viên...</span>
                </div>
              ) : filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => {
                  const cId = candidate._id || candidate.id;
                  const candidateName = candidate.candidateName || candidate.name || 'Ứng viên';
                  const candidateEmail = candidate.candidateEmail || candidate.email || 'ungvien@example.com';
                  const matchScore = candidate.matchScore || 80;
                  const status = candidate.status || 'applied';

                  return (
                    <div 
                      key={cId}
                      className="saas-card p-5 border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all space-y-4 bg-white"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">{candidateName}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              status === 'hired'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : status === 'interviewing'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {status === 'hired' ? 'Đã Trúng Tuyển' : status === 'interviewing' ? 'Mời Phỏng Vấn' : status === 'rejected' ? 'Đã Từ Chối' : 'Mới Ứng Tuyển'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{candidateEmail} • {candidate.candidatePhone || 'Chưa cập nhật SĐT'}</p>
                        </div>

                        {/* Matching Score Badge */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-2xl font-black text-blue-600">
                              {matchScore}%
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Điểm Matching</span>
                          </div>
                        </div>
                      </div>

                      {/* CV Snippet */}
                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-sans">
                        "{candidate.cvSnippet || 'Thông tin ứng viên đã được hệ thống AI lưu trữ.'}"
                      </p>

                      {/* HR Decision Action Buttons */}
                      <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Interview Questions Generator */}
                          <button
                            onClick={() => handleGenerateQuestions(candidate)}
                            disabled={isGeneratingQuestions}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            <span>Sinh Câu Hỏi Phỏng Vấn AI</span>
                          </button>
                        </div>

                        {/* Recruitment Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActionCandidate(candidate);
                              setActionType('interview');
                              setInterviewDate('14:30 - Thứ Hai tuần tới');
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all shadow-sm"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Mời Phỏng Vấn</span>
                          </button>

                          <button
                            onClick={() => {
                              setActionCandidate(candidate);
                              setActionType('offer');
                              setSalaryOffer(selectedJob?.salary || '35.000.000 VNĐ');
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Tuyển Dụng (Offer)</span>
                          </button>

                          <button
                            onClick={() => {
                              setActionCandidate(candidate);
                              setActionType('reject');
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-sm"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Từ Chối</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="saas-card p-10 border border-slate-200 text-center space-y-3 bg-white">
                  <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="text-slate-800 font-bold text-sm">Chưa có ứng viên nào nộp cho vị trí này</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Bạn có thể bấm vào nút <strong>"AI Sàng Lọc Hồ Sơ Mới"</strong> phía trên để dán CV ứng viên nhận được từ nguồn ngoài và chấm điểm tự động.
                  </p>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {/* Tab 2: Post New Job */}
      {activeTab === 'post-job' && (
        <div className="max-w-2xl mx-auto saas-card p-8 border border-slate-200 bg-white shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-1">Đăng Tuyển Vị Trí Việc Làm Mới</h3>
          <p className="text-xs text-slate-500 mb-6">Thông tin tuyển dụng sẽ được lưu vào cơ sở dữ liệu MongoDB và hiển thị cho toàn bộ ứng viên.</p>

          <form onSubmit={handleCreateJobSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tiêu Đề Công Việc *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Senior Backend Engineer (Node.js & MongoDB)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Công Ty Tuyển Dụng</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="VD: VNG Tech Innovation"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mức Lương Dự Kiến</label>
                <input
                  type="text"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  placeholder="VD: 30 - 45 Triệu VNĐ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Kỹ Năng Yêu Cầu (Phân cách bằng dấu phẩy)</label>
              <input
                type="text"
                value={newSkills}
                onChange={(e) => setNewSkills(e.target.value)}
                placeholder="Node.js, Express, MongoDB, Docker, RESTful API"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Mô Tả Chi Tiết Công Việc (JD) *</label>
              <textarea
                rows={6}
                required
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Mô tả trách nhiệm công việc, yêu cầu kỹ năng và quyền lợi ứng viên..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 resize-none font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              Đăng Tin Tuyển Dụng Ngay
            </button>
          </form>
        </div>
      )}

      {/* 3. SUBTAB: AI JD ANALYZER & OPTIMIZER */}
      {activeTab === 'analyze-jd' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          <div className="lg:col-span-5 saas-card p-6 space-y-4 bg-white border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Nội Dung Bản Mô Tả Công Việc (JD)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dán nội dung JD hoặc yêu cầu tuyển dụng để AI bóc tách cấu trúc, chấm điểm chất lượng và lập bộ câu hỏi phỏng vấn chuẩn bị sẵn.
            </p>
            <textarea
              rows={12}
              value={jdTextToAnalyze}
              onChange={(e) => setJdTextToAnalyze(e.target.value)}
              placeholder="Dán toàn bộ bản mô tả công việc (JD), bao gồm chức danh, trách nhiệm, yêu cầu kỹ năng, kinh nghiệm và chế độ đãi ngộ..."
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 resize-none font-mono leading-relaxed"
            />
            <button
              onClick={handleAnalyzeJD}
              disabled={analyzingJD || !jdTextToAnalyze.trim()}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {analyzingJD ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-blue-200" />}
              <span>{analyzingJD ? 'AI Đang Phân Tích...' : 'Bắt Đầu Phân Tích & Tối Ưu JD'}</span>
            </button>
          </div>

          <div className="lg:col-span-7">
            {analyzingJD && (
              <div className="saas-card p-12 text-center flex flex-col items-center justify-center space-y-3 bg-white border border-slate-200">
                <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900">Đang Bóc Tách & Đánh Giá Tiêu Chuẩn Tuyển Dụng</h3>
                <p className="text-xs text-slate-600 max-w-sm">
                  Gemini 2.5 Flash đang đo lường tính hấp dẫn, trích xuất bộ kỹ năng và lập danh mục câu hỏi phỏng vấn...
                </p>
              </div>
            )}

            {!analyzingJD && !jdAnalysisResult && (
              <div className="saas-card p-12 text-center flex flex-col items-center justify-center border-dashed bg-white border-slate-200">
                <Briefcase className="w-8 h-8 text-slate-400 mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">Chưa Có Báo Cáo Phân Tích JD</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Dán nội dung JD ở bên trái và bấm nút phân tích để nhận báo cáo chuẩn hóa và bộ câu hỏi phỏng vấn chuẩn bị sẵn.
                </p>
              </div>
            )}

            {!analyzingJD && jdAnalysisResult && (
              <div className="space-y-6 animate-fadeIn">
                {/* Header Score */}
                <div className="saas-card p-6 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/70 border-blue-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">Chức Danh Đã Trích Xuất</span>
                      <h3 className="text-xl font-bold text-slate-900 mt-0.5">{jdAnalysisResult.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                        <span>Cấp bậc: <strong className="text-slate-800">{jdAnalysisResult.level || 'Mid-Level'}</strong></span>
                        <span>•</span>
                        <span>Kinh nghiệm: <strong className="text-slate-800">{jdAnalysisResult.experienceRequired || '1+ năm'}</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase text-slate-500">JD Quality Score</div>
                      <div className="text-3xl font-extrabold text-blue-600">{jdAnalysisResult.jdScore || 85}<span className="text-sm text-slate-400 font-normal">/100</span></div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  {jdAnalysisResult.scoreBreakdown && (
                    <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-500">Độ Rõ Ràng</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">{jdAnalysisResult.scoreBreakdown.clarity || 85}%</div>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-500">Độ Đầy Đủ</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">{jdAnalysisResult.scoreBreakdown.requirementsCompleteness || 85}%</div>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-500">Mức Lương</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">{jdAnalysisResult.scoreBreakdown.salaryCompetitiveness || 80}%</div>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-500">Đãi Ngộ</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">{jdAnalysisResult.scoreBreakdown.attractivePerks || 80}%</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="saas-card p-5 border-l-4 border-l-blue-600 bg-white border-slate-200">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2.5">Kỹ Năng Cốt Lõi Bắt Buộc</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {jdAnalysisResult.requiredSkills?.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded text-xs bg-blue-50 border border-blue-200 text-blue-800 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="saas-card p-5 border-l-4 border-l-purple-600 bg-white border-slate-200">
                    <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2.5">Kỹ Năng Ưu Tiên / Điểm Cộng</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {jdAnalysisResult.niceToHaveSkills?.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded text-xs bg-purple-50 border border-purple-200 text-purple-800 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Strengths & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="saas-card p-5 bg-white border-slate-200 border-l-4 border-l-emerald-500">
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Điểm Thu Hút Nhân Tài</h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {jdAnalysisResult.strengths?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="saas-card p-5 bg-white border-slate-200 border-l-4 border-l-amber-500">
                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Đề Xuất Cải Thiện JD</h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {jdAnalysisResult.recommendations?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Suggested Interview Questions */}
                {jdAnalysisResult.suggestedQuestions && jdAnalysisResult.suggestedQuestions.length > 0 && (
                  <div className="saas-card p-5 bg-white border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                      Gợi Ý Câu Hỏi Phỏng Vấn Sàng Lọc Theo JD Này ({jdAnalysisResult.suggestedQuestions.length})
                    </h4>
                    <div className="space-y-3">
                      {jdAnalysisResult.suggestedQuestions.map((q, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                          <div className="font-semibold text-blue-700">{q.question}</div>
                          <div className="text-[11px] text-slate-600">Mục tiêu: <span className="text-slate-900 font-medium">{q.targetSkill}</span></div>
                          {q.criteria && <div className="text-[10px] text-slate-500 italic">Tiêu chí: {q.criteria}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SUBTAB: COMPANY PROFILE MANAGEMENT */}
      {activeTab === 'company-profile' && (
        <div className="max-w-2xl mx-auto saas-card p-6 space-y-5 animate-fadeIn bg-white border border-slate-200 shadow-sm">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>Hồ Sơ & Thông Tin Pháp Nhân Doanh Nghiệp</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Thông tin này được hiển thị công khai trên các tin tuyển dụng để tạo uy tín với ứng viên.
            </p>
          </div>

          <form onSubmit={handleSaveCompanyProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Tên Doanh Nghiệp / Công Ty *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ví dụ: Công ty Cổ phần Công nghệ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Website Chính Thức</label>
                <input
                  type="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://company.vn"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Quy Mô Doanh Nghiệp</label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Dưới 20 nhân sự">Dưới 20 nhân sự (Startup)</option>
                  <option value="20 - 50 nhân sự">20 - 50 nhân sự</option>
                  <option value="50 - 150 nhân sự">50 - 150 nhân sự</option>
                  <option value="150 - 500 nhân sự">150 - 500 nhân sự</option>
                  <option value="Trên 500 nhân sự">Trên 500 nhân sự (Tập đoàn)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Lĩnh Vực Hoạt Động</label>
                <input
                  type="text"
                  value={companyIndustry}
                  onChange={(e) => setCompanyIndustry(e.target.value)}
                  placeholder="Ví dụ: Công nghệ thông tin, Fintech, E-commerce..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Địa Chỉ Trụ Sở / Văn Phòng</label>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Tòa nhà, Đường, Quận/Huyện, Tỉnh/Thành phố..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Giới Thiệu Doanh Nghiệp & Văn Hóa Làm Việc</label>
              <textarea
                rows={5}
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder="Mô tả súc tích về tầm nhìn, môi trường làm việc và các chế độ đãi ngộ tiêu biểu..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingCompany}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
              >
                {savingCompany ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{savingCompany ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 1: AI Screen Candidate */}
      {isScreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsScreenModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">AI Sàng Lọc Hồ Sơ Ứng Viên Mới</h3>
                <p className="text-xs text-slate-500">Đối chiếu trực tiếp với vị trí: {selectedJob?.title}</p>
              </div>
            </div>

            <form onSubmit={handleScreenSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Họ và Tên Ứng Viên (Nếu có)</label>
                <input
                  type="text"
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                  placeholder="Để trống nếu muốn AI tự bóc tách từ CV"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email Ứng Viên</label>
                  <input
                    type="email"
                    value={screenEmail}
                    onChange={(e) => setScreenEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={screenPhone}
                    onChange={(e) => setScreenPhone(e.target.value)}
                    placeholder="0901 234 567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Dán Toàn Bộ Nội Dung CV *</label>
                <textarea
                  rows={8}
                  required
                  value={screenCvText}
                  onChange={(e) => setScreenCvText(e.target.value)}
                  placeholder="Dán nội dung CV để Gemini 2.5 Flash chấm điểm matching với vị trí này..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 resize-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScreenModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isScreening || !screenCvText}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isScreening ? 'AI Đang Chấm Điểm...' : 'Bắt Đầu Sàng Lọc & Lưu Hồ Sơ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Hiring Action (Mời PV / Offer / Từ Chối) */}
      {actionCandidate && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => { setActionCandidate(null); setActionType(null); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {actionType === 'interview' && 'Gửi Thư Mời Phỏng Vấn'}
                {actionType === 'offer' && 'Gửi Thư Chúc Mừng & Mời Nhận Việc (Offer)'}
                {actionType === 'reject' && 'Xác Nhận Từ Chối Hồ Sơ'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gửi đến: <strong className="text-slate-800">{actionCandidate.candidateName || actionCandidate.name}</strong> ({actionCandidate.candidateEmail || actionCandidate.email || 'Email ứng viên'})
              </p>
            </div>

            <form onSubmit={handleExecuteHiringAction} className="space-y-3.5">
              {actionType === 'interview' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Thời Gian Phỏng Vấn *</label>
                    <input
                      type="text"
                      required
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      placeholder="VD: 09:30 AM, Thứ Ba ngày 24/09/2026"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Hình Thức / Link Họp *</label>
                    <input
                      type="text"
                      required
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Ghi Chú Cho Ứng Viên</label>
                    <textarea
                      rows={2}
                      value={interviewNote}
                      onChange={(e) => setInterviewNote(e.target.value)}
                      placeholder="Chuẩn bị demo sản phẩm hoặc tài liệu liên quan..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </>
              )}

              {actionType === 'offer' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Mức Lương Đề Xuất *</label>
                    <input
                      type="text"
                      required
                      value={salaryOffer}
                      onChange={(e) => setSalaryOffer(e.target.value)}
                      placeholder="VD: 40.000.000 VNĐ Net + Thưởng KPI"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Ngày Bắt Đầu Làm Việc</label>
                    <input
                      type="text"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="VD: 01/10/2026"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Quyền Lợi & Ghi Chú Đãi Ngộ</label>
                    <textarea
                      rows={2}
                      value={offerNote}
                      onChange={(e) => setOfferNote(e.target.value)}
                      placeholder="Bảo hiểm sức khỏe cao cấp, thưởng dự án..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                </>
              )}

              {actionType === 'reject' && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed">
                  Hệ thống sẽ tự động gửi thư cảm ơn và từ chối lịch sự, đồng thời lưu hồ sơ ứng viên vào Talent Pool của doanh nghiệp để liên hệ trong tương lai.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setActionCandidate(null); setActionType(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 ${
                    actionType === 'offer'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : actionType === 'interview'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{actionLoading ? 'Đang gửi thông báo...' : 'Xác Nhận & Gửi Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Interview Questions View */}
      {interviewModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInterviewModalData(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Bộ Câu Hỏi Phỏng Vấn AI Cá Nhân Hóa</h3>
                <p className="text-xs text-slate-500">Được Gemini 2.5 Flash sinh riêng theo điểm mạnh/yếu của ứng viên</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-blue-700 uppercase">1. Câu Hỏi Chuyên Môn Kỹ Thuật (Technical):</h4>
              {interviewModalData.questions?.technicalQuestions?.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-slate-900 text-xs leading-relaxed">{q.question}</p>
                    <button
                      onClick={() => handleCopyQuestion(q.question, `tech-${idx}`)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold shrink-0"
                    >
                      {copiedId === `tech-${idx}` ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 italic">🎯 Gợi ý trả lời: {q.expectedAnswerInsight}</p>
                </div>
              ))}

              <h4 className="text-xs font-bold text-purple-700 uppercase pt-2">2. Câu Hỏi Tình Huống Xử Lý Thực Tế:</h4>
              {interviewModalData.questions?.situationalQuestions?.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-slate-900 text-xs leading-relaxed">{q.question}</p>
                    <button
                      onClick={() => handleCopyQuestion(q.question, `sit-${idx}`)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold shrink-0"
                    >
                      {copiedId === `sit-${idx}` ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 italic">🎯 Tiêu chí: {q.criteria}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
