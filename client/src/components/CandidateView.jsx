import React, { useState, useEffect } from 'react';
import { 
  Upload, FileText, Sparkles, CheckCircle, AlertCircle, 
  ArrowRight, User, Briefcase, GraduationCap, Code, Star, 
  Check, Mail, Send, X, CheckCircle2, Clock, Calendar,
  ExternalLink, Layers, Award, RefreshCw, UserCheck
} from 'lucide-react';
import RadarChart from './RadarChart';
import JobRecommendations from './JobRecommendations';
import { analyzeCV, sendCVReportEmail, getRecommendedJobs, getMyApplications } from '../services/api';
import confetti from 'canvas-confetti';

export default function CandidateView({ onSelectForMatching, initialCV = '', initialFileName = '', onCVUpdated, currentUser }) {
  const [candidateTab, setCandidateTab] = useState('analyze'); // 'analyze' | 'applications'
  const [cvText, setCvText] = useState(initialCV || '');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  // My Applications State
  const [myApplications, setMyApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Email report state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(currentUser?.email || '');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState('');

  // Đồng bộ khi initialCV thay đổi
  useEffect(() => {
    if (initialCV && !cvText) {
      setCvText(initialCV);
    }
  }, [initialCV]);

  // Tải danh sách đơn đã nộp
  const loadMyApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await getMyApplications();
      if (res && res.success) {
        setMyApplications(res.applications || []);
      }
    } catch (e) {
      console.error('Lỗi tải đơn ứng tuyển:', e);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    if (candidateTab === 'applications') {
      loadMyApplications();
    }
  }, [candidateTab]);

  // Xóa trắng toàn bộ nội dung để dán CV mới
  const handleClearCV = () => {
    setCvText('');
    setUploadedFile(null);
    setAnalysisResult(null);
    setRecommendations([]);
    setErrorMsg(null);
    if (onCVUpdated) onCVUpdated('', '');
  };

  // Upload file PDF hoặc Word
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setAnalysisResult(null);
      setRecommendations([]);
      setErrorMsg(null);
    }
  };

  // Kích hoạt phân tích AI
  const handleStartAnalysis = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    setScanStep(1);

    const stepTimer1 = setTimeout(() => setScanStep(2), 700);
    const stepTimer2 = setTimeout(() => setScanStep(3), 1400);

    try {
      const response = await analyzeCV(cvText, uploadedFile, {
        userId: currentUser?._id || currentUser?.id,
        candidateEmail: currentUser?.email,
        candidateName: currentUser?.fullName
      });
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      
      if (response && response.success) {
        setAnalysisResult(response.analysis);

        // Lưu lại văn bản trích xuất từ tệp Word hoặc PDF
        const textContent = response.extractedText || cvText;
        if (response.extractedText) {
          setCvText(response.extractedText);
        }

        // Đồng bộ dữ liệu CV lên App-level state để mục So Khớp dùng ngay lập tức
        if (onCVUpdated) {
          onCVUpdated(textContent, uploadedFile?.name || initialFileName);
        }

        if (response.analysis.candidateInfo?.email) {
          setRecipientEmail(response.analysis.candidateInfo.email);
        }

        // Tự động tìm kiếm các công việc phù hợp nhất với năng lực CV này
        const allSkills = [
          ...(response.analysis.skills?.technicalSkills || []),
          ...(response.analysis.skills?.toolsAndFrameworks || [])
        ];
        getRecommendedJobs({
          skills: allSkills,
          title: response.analysis.candidateInfo?.title || '',
          experienceYears: response.analysis.candidateInfo?.yearsOfExperience || 2,
          cvText: textContent
        }).then(recRes => {
          if (recRes && recRes.success) {
            setRecommendations(recRes.recommendations || []);
          }
        }).catch(() => {});

        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 }
        });
      } else {
        setErrorMsg(response?.message || "Không thể phân tích dữ liệu CV. Vui lòng kiểm tra lại văn bản hoặc tệp CV (PDF / Word)!");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Không thể kết nối đến máy chủ AI. Vui lòng thử lại sau giây lát.");
    } finally {
      setIsScanning(false);
      setScanStep(0);
    }
  };

  // Gửi báo cáo đánh giá về email
  const handleSendEmailReport = async (e) => {
    e.preventDefault();
    if (!recipientEmail || !analysisResult) return;
    setEmailLoading(true);
    setEmailStatusMsg('');

    try {
      const res = await sendCVReportEmail(
        recipientEmail,
        analysisResult.candidateInfo?.fullName || 'Ứng viên',
        {
          overallScore: analysisResult.atsScore || 85,
          scores: analysisResult.radarMetrics ? {
            technical: analysisResult.radarMetrics.technicalSkills || 85,
            experience: analysisResult.radarMetrics.practicalExperience || 80,
            education: analysisResult.radarMetrics.educationCertificates || 90,
            presentation: analysisResult.radarMetrics.presentationStructure || 85,
            atsCompatibility: analysisResult.radarMetrics.atsCompatibility || 88
          } : {},
          strengths: analysisResult.strengths || [],
          improvements: analysisResult.recommendations || []
        }
      );

      if (res && res.success) {
        setEmailStatusMsg('Đã gửi báo cáo đánh giá thành công đến hộp thư của bạn!');
        setTimeout(() => {
          setIsEmailModalOpen(false);
          setEmailStatusMsg('');
        }, 2500);
      } else {
        setEmailStatusMsg(res?.message || 'Không thể gửi email lúc này');
      }
    } catch (err) {
      setEmailStatusMsg('Lỗi gửi email. Vui lòng kiểm tra lại cấu hình email hệ thống.');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Không Gian Ứng Viên Chuyên Nghiệp</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản Lý Hồ Sơ & Đánh Giá Năng Lực Chuẩn ATS
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Tải lên hồ sơ để AI bóc tách thực tế, đo lường năng lực và theo dõi tiến độ các vị trí bạn đã ứng tuyển.
          </p>
        </div>

        {/* Subtabs Selector */}
        <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl shrink-0">
          <button
            onClick={() => setCandidateTab('analyze')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              candidateTab === 'analyze'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phân Tích CV (AI)
          </button>
          <button
            onClick={() => setCandidateTab('applications')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              candidateTab === 'applications'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đơn Đã Ứng Tuyển
          </button>
        </div>
      </div>

      {/* SUBTAB 1: PHÂN TÍCH CV */}
      {candidateTab === 'analyze' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input Form (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Upload PDF / Word Box */}
            <div className="saas-card p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                <span>Cách 1: Tải Lên Tệp CV (PDF hoặc Word .docx)</span>
                <span className="text-[11px] font-semibold text-blue-600">Khuyên dùng</span>
              </h3>
              
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/70 hover:bg-blue-50/40 group">
                <Upload className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform mb-2" />
                <p className="text-sm font-semibold text-slate-800 text-center">
                  {uploadedFile ? uploadedFile.name : "Kéo thả hoặc nhấp để tải file CV (PDF hoặc Word .docx)"}
                </p>
                <p className="text-xs text-slate-500 mt-1">Hỗ trợ PDF, DOCX (Word) tối đa 10MB</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* 2. Paste CV Text Box */}
            <div className="saas-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cách 2: Dán Nội Dung Văn Bản CV
                </h3>
                <div className="flex items-center gap-2">
                  {(cvText || uploadedFile) && (
                    <button
                      type="button"
                      onClick={handleClearCV}
                      className="text-xs text-rose-600 hover:text-rose-700 transition-colors font-medium"
                    >
                      Xóa nội dung
                    </button>
                  )}
                  <span className="text-[11px] text-slate-500">
                    {cvText ? `(${cvText.length} ký tự)` : ''}
                  </span>
                </div>
              </div>

              <textarea
                rows={9}
                value={cvText}
                onChange={(e) => {
                  setCvText(e.target.value);
                  if (onCVUpdated) onCVUpdated(e.target.value);
                }}
                placeholder="Dán toàn bộ nội dung CV thực tế của bạn vào đây (Họ tên, Mục tiêu nghề nghiệp, Kinh nghiệm làm việc, Kỹ năng, Học vấn, Dự án tiêu biểu)..."
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 resize-none font-mono leading-relaxed"
              />

              <button
                onClick={handleStartAnalysis}
                disabled={isScanning || (!cvText.trim() && !uploadedFile)}
                className="mt-4 w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm hover:shadow disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Hệ Thống Đang Bóc Tách Thực Thể...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-200" />
                    <span>Bắt Đầu Phân Tích Bằng AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Results Dashboard (7 cols) */}
          <div className="lg:col-span-7">
            {isScanning && (
              <div className="saas-card p-12 text-center flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Đang Xử Lý Dữ Liệu Bằng Google Gemini 2.5 Flash</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    {scanStep === 1 && "Bước 1/3: Đọc hiểu và trích xuất cấu trúc văn bản CV..."}
                    {scanStep === 2 && "Bước 2/3: Định danh kỹ năng, dòng thời gian làm việc & thành tựu..."}
                    {scanStep === 3 && "Bước 3/3: Tính toán điểm tương thích ATS và tạo đề xuất tối ưu..."}
                    {scanStep === 0 && "Khởi động mô hình phân tích..."}
                  </p>
                </div>
                {/* Progress bar */}
                <div className="w-64 bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                    style={{ width: scanStep === 1 ? '35%' : scanStep === 2 ? '70%' : '95%' }}
                  />
                </div>
              </div>
            )}

            {!isScanning && !analysisResult && (
              <div className="saas-card p-12 text-center flex flex-col items-center justify-center border-dashed">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1.5">Chưa Có Dữ Liệu Phân Tích</h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Vui lòng tải lên tệp PDF hoặc dán nội dung CV của bạn ở cột bên trái để bắt đầu bóc tách và nhận báo cáo đánh giá toàn diện.
                </p>
              </div>
            )}

            {!isScanning && analysisResult && (
              <div className="space-y-6 animate-fadeIn">
                {/* Score & Candidate Overview Banner */}
                <div className="saas-card p-6 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/70 border-blue-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                    <div>
                      <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">Hồ Sơ Đã Bóc Tách</div>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                        {analysisResult.candidateInfo?.fullName || "Ứng Viên"}
                      </h3>
                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-2">
                        <span className="text-slate-800 font-semibold">{analysisResult.candidateInfo?.title || "Chuyên viên"}</span>
                        <span>•</span>
                        <span>{analysisResult.candidateInfo?.email || "Chưa cung cấp email"}</span>
                        {analysisResult.candidateInfo?.phone && (
                          <>
                            <span>•</span>
                            <span>{analysisResult.candidateInfo.phone}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Điểm ATS Tổng</div>
                        <div className="text-3xl font-extrabold text-blue-600">
                          {analysisResult.atsScore || 85}<span className="text-sm text-slate-400 font-normal">/100</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsEmailModalOpen(true)}
                        title="Gửi báo cáo qua Email"
                        className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-sm hover:border-blue-400"
                      >
                        <Mail className="w-4 h-4 text-blue-600" />
                      </button>

                      <button
                        onClick={() => onSelectForMatching && onSelectForMatching(cvText)}
                        title="So khớp với các việc làm đang mở tuyển"
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>So Khớp Việc Làm</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  {analysisResult.candidateInfo?.summary && (
                    <p className="text-xs text-slate-700 mt-4 leading-relaxed italic bg-white/80 p-3.5 rounded-xl border border-slate-200 shadow-sm">
                      "{analysisResult.candidateInfo.summary}"
                    </p>
                  )}
                </div>

                {/* Radar Chart & Skills Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Radar Chart 5 Dimensions */}
                  <div className="saas-card p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span>Đánh Giá Năng Lực 5 Chiều</span>
                    </h4>
                    <div className="h-64 flex items-center justify-center">
                      <RadarChart metrics={analysisResult.radarMetrics || {
                        technicalSkills: 85,
                        practicalExperience: 80,
                        educationCertificates: 80,
                        presentationStructure: 85,
                        atsCompatibility: 88
                      }} />
                    </div>
                  </div>

                  {/* Extracted Skills */}
                  <div className="saas-card p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                        <Code className="w-4 h-4 text-blue-600" />
                        <span>Kỹ Năng Đã Nhận Diện</span>
                      </h4>

                      <div className="space-y-3">
                        <div>
                          <p className="text-[11px] text-blue-700 font-bold mb-1.5">Kỹ Năng Chuyên Môn (Technical):</p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysisResult.skills?.technicalSkills?.map((skill, idx) => (
                              <span key={idx} className="px-2.5 py-1 rounded-md text-xs bg-slate-100 border border-slate-200 text-slate-800 font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] text-purple-700 font-bold mb-1.5">Công Cụ & Nền Tảng (Tools):</p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysisResult.skills?.toolsAndFrameworks?.map((tool, idx) => (
                              <span key={idx} className="px-2.5 py-1 rounded-md text-xs bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 mt-4">
                      <button
                        onClick={() => onSelectForMatching(cvText)}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <span>So Khớp CV Này Với Tin Tuyển Dụng (JD)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Strengths & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="saas-card p-5 border-l-4 border-l-emerald-500">
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Điểm Mạnh Nổi Bật</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {analysisResult.strengths?.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold mt-0.5">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="saas-card p-5 border-l-4 border-l-amber-500">
                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Đề Xuất Nâng Cấp Chuẩn Doanh Nghiệp</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {analysisResult.recommendations?.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Experience Timeline */}
                <div className="saas-card p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>Lịch Sử Kinh Nghiệm Làm Việc</span>
                  </h4>
                  <div className="space-y-3">
                    {analysisResult.experienceTimeline?.map((exp, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {exp.role} <span className="text-blue-600 font-medium">@ {exp.company}</span>
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                            {exp.duration}
                          </span>
                        </div>
                        {exp.keyAchievements && (
                          <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                            {exp.keyAchievements.map((ach, aIdx) => (
                              <li key={aIdx}>{ach}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gợi Ý Việc Làm Phù Hợp */}
                {recommendations && recommendations.length > 0 && (
                  <JobRecommendations
                    recommendations={recommendations}
                    onSelectJobForMatching={(job) => onSelectForMatching && onSelectForMatching(cvText, job)}
                    cvText={cvText}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: ĐƠN ỨNG TUYỂN CỦA TÔI */}
      {candidateTab === 'applications' && (
        <div className="saas-card overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Lịch Sử Hồ Sơ Đã Nộp</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi tình trạng phản hồi từ các nhà tuyển dụng đối với những vị trí bạn đã nộp đơn.
              </p>
            </div>
            <button
              onClick={loadMyApplications}
              disabled={loadingApps}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingApps ? 'animate-spin text-blue-600' : ''}`} />
              <span>Cập nhật</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Vị Trí & Doanh Nghiệp</th>
                  <th className="px-5 py-3.5">Mức Phù Hợp AI</th>
                  <th className="px-5 py-3.5">Ngày Nộp</th>
                  <th className="px-5 py-3.5">Trạng Thái Xét Duyệt</th>
                  <th className="px-5 py-3.5">Lịch Phỏng Vấn / Ghi Chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {myApplications.map((app) => {
                  const jobTitle = app.jobId?.title || 'Kỹ sư phần mềm';
                  const company = app.jobId?.company || 'Doanh nghiệp tuyển dụng';
                  const status = app.status || 'applied';

                  return (
                    <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 text-sm">{jobTitle}</div>
                        <div className="text-xs text-blue-600 font-medium mt-0.5">{company}</div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          📍 {app.jobId?.location || 'Toàn quốc'} • 💰 {app.jobId?.salary || 'Thoả thuận'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-extrabold text-blue-600 text-sm">{app.matchScore || 80}%</span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{app.verdict || 'Phù hợp'}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          status === 'hired'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : status === 'interviewing'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {status === 'hired' ? '🎉 Trúng Tuyển / Nhận Việc' :
                           status === 'interviewing' ? '📅 Mời Phỏng Vấn' :
                           status === 'rejected' ? 'Chưa Phù Hợp' : 'Đã Nộp Đơn (Chờ duyệt)'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {app.interviewDetails?.scheduledDate ? (
                          <div className="p-2 rounded bg-purple-50 border border-purple-200 text-xs space-y-1">
                            <div className="font-semibold text-purple-800 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{app.interviewDetails.scheduledDate}</span>
                            </div>
                            {app.interviewDetails.meetingLink && (
                              <a 
                                href={app.interviewDetails.meetingLink.replace('Online Google Meet: ', '')} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                              >
                                <span>Link phòng họp</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Chờ phản hồi từ HR</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {myApplications.length === 0 && !loadingApps && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm font-semibold text-slate-700">Bạn chưa nộp hồ sơ vào vị trí nào</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Hãy chọn tin tuyển dụng phù hợp ở mục "Việc Làm & So Khớp" để gửi hồ sơ trực tiếp đến nhà tuyển dụng.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Email Báo Cáo */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="saas-card max-w-md w-full p-6 shadow-2xl bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span>Nhận Báo Cáo Đánh Giá Qua Email</span>
              </h3>
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Báo cáo định dạng chuẩn gồm điểm ATS, phân tích kỹ năng và các khuyến nghị tối ưu sẽ được gửi trực tiếp tới email của bạn.
            </p>

            <form onSubmit={handleSendEmailReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Địa Chỉ Email Nhận Báo Cáo:
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {emailStatusMsg && (
                <div className="p-3 rounded-lg text-xs bg-blue-50 border border-blue-200 text-blue-700">
                  {emailStatusMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  {emailLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{emailLoading ? 'Đang gửi...' : 'Gửi Ngay'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
