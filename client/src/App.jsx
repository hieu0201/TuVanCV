import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CandidateView from './components/CandidateView';
import MatchingView from './components/MatchingView';
import RecruiterView from './components/RecruiterView';
import AdminView from './components/AdminView';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { Sparkles, Cpu, Code2, Database, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';

export default function App() {
  // Khởi tạo thông tin người dùng từ localStorage thực tế (null nếu chưa đăng nhập)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('smartrecruit_user');
    const token = localStorage.getItem('smartrecruit_token');
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Khởi tạo tab mặc định theo Role của người dùng
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('smartrecruit_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === 'admin') return 'admin';
        if (u.role === 'recruiter') return 'recruiter';
      } catch (e) {}
    }
    return 'hero';
  });

  // State CV dùng chung toàn hệ thống (giữ nguyên khi chuyển giữa Phân Tích CV và So Khớp)
  const [activeCVText, setActiveCVText] = useState('');
  const [activeCVFileName, setActiveCVFileName] = useState('');
  const [prefilledJobId, setPrefilledJobId] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => {
    return !!localStorage.getItem('smartrecruit_pending_otp_email');
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Cập nhật nội dung CV khi người dùng upload Word/PDF hoặc sửa text
  const handleCVUpdated = (text, fileName = '') => {
    if (text) setActiveCVText(text);
    if (fileName) setActiveCVFileName(fileName);
  };

  // Chuyển nhanh từ kết quả phân tích CV sang màn hình Matching
  const handleSelectForMatching = (cvText, targetJob = null) => {
    const validText = cvText || activeCVText;
    setActiveCVText(validText);
    if (targetJob) {
      setPrefilledJobId(targetJob._id || targetJob.id || '');
    }
    setActiveTab('matching');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Đăng nhập thành công
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else if (user.role === 'recruiter') {
      setActiveTab('recruiter');
    } else {
      setActiveTab('candidate');
    }
  };

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('smartrecruit_token');
    localStorage.removeItem('smartrecruit_user');
    setCurrentUser(null);
    setActiveTab('hero');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-blue-100 selection:text-blue-800">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'hero' && (
          <HeroSection
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            onGetStarted={() => setActiveTab(currentUser?.role === 'recruiter' ? 'recruiter' : 'candidate')}
          />
        )}

        {activeTab === 'candidate' && (
          <CandidateView 
            onSelectForMatching={handleSelectForMatching}
            initialCV={activeCVText}
            initialFileName={activeCVFileName}
            onCVUpdated={handleCVUpdated}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'matching' && (
          <MatchingView
            prefilledCV={activeCVText}
            prefilledFileName={activeCVFileName}
            prefilledJobId={prefilledJobId}
            onCVUpdated={handleCVUpdated}
            currentUser={currentUser}
            onGoToRecruiter={() => setActiveTab('recruiter')}
          />
        )}

        {/* Route Guard cho Portal Tuyển Dụng */}
        {activeTab === 'recruiter' && (
          currentUser && (currentUser.role === 'recruiter' || currentUser.role === 'admin') ? (
            <RecruiterView currentUser={currentUser} />
          ) : (
            <AccessDeniedView
              requiredRole="Nhà Tuyển Dụng"
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onGoHome={() => setActiveTab('hero')}
            />
          )
        )}

        {/* Route Guard cho Quản Trị Hệ Thống */}
        {activeTab === 'admin' && (
          currentUser && currentUser.role === 'admin' ? (
            <AdminView currentUser={currentUser} />
          ) : (
            <AccessDeniedView
              requiredRole="Quản Trị Viên (Admin)"
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onGoHome={() => setActiveTab('hero')}
            />
          )
        )}
      </main>

      {/* Auth Modal (Đăng nhập / Đăng ký / Xác thực Email) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Profile Modal (Cập nhật thông tin cá nhân & Đổi mật khẩu) */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updatedUser) => setCurrentUser(updatedUser)}
      />

      {/* Clean Enterprise SaaS Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16 py-10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base tracking-tight">SmartRecruit Enterprise</p>
              <p className="text-xs text-slate-500">
                Nền tảng Tuyển Dụng & Đánh Giá Năng Lực Ứng Viên Trí Tuệ Nhân Tạo Chuẩn ATS
              </p>
            </div>
          </div>

          {/* Tech Stack Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
            <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5 font-medium">
              <Code2 className="w-3.5 h-3.5 text-blue-600" /> React.js & Vite
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" /> Node.js & Express
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-green-600" /> MongoDB
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Gemini 2.5 Flash
            </span>
          </div>

          <div className="text-xs text-slate-500 text-center md:text-right font-medium">
            <p>&copy; {new Date().getFullYear()} SmartRecruit Enterprise Platform.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Giải pháp AI tuyển dụng thông minh hàng đầu cho doanh nghiệp</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Màn hình thông báo truy cập bị từ chối khi không đúng vai trò
 */
function AccessDeniedView({ requiredRole, currentUser, onOpenAuthModal, onGoHome }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fadeIn">
      <div className="bg-white p-8 sm:p-12 border border-slate-200 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-6 shadow-xs">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">Truy Cập Yêu Cầu Phân Quyền</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Khu vực chức năng này chỉ dành riêng cho vai trò <strong className="text-rose-600 font-semibold">{requiredRole}</strong>.
          {currentUser ? (
            <> Tài khoản hiện tại của bạn đang đăng nhập với vai trò <span className="text-blue-600 font-semibold">{currentUser.role === 'candidate' ? 'Ứng Viên' : currentUser.role}</span>.</>
          ) : (
            <> Bạn chưa đăng nhập vào hệ thống.</>
          )}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onGoHome}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200"
          >
            Quay Về Trang Chủ
          </button>
          
          <button
            onClick={onOpenAuthModal}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            {currentUser ? 'Đăng Nhập Tài Khoản Khác' : 'Đăng Nhập / Đăng Ký Ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}

