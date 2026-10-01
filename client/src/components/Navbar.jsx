import React, { useState } from 'react';
import { Sparkles, Briefcase, FileText, UserCheck, Cpu, LogIn, LogOut, User, ChevronDown, Shield, RefreshCw } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, currentUser, onOpenAuthModal, onOpenProfileModal, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Nhãn và màu sắc cho từng Role theo Light Theme
  const roleBadges = {
    candidate: {
      label: 'Ứng Viên',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500'
    },
    recruiter: {
      label: 'Nhà Tuyển Dụng',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500'
    },
    admin: {
      label: 'Quản Trị Viên',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500'
    }
  };

  const currentBadge = currentUser ? roleBadges[currentUser.role] || roleBadges.candidate : null;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200 px-4 lg:px-8 py-3 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('hero')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-all text-white">
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">SmartRecruit</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">Enterprise</span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium">Nền tảng Tuyển Dụng & Đánh Giá Năng Lực CV Trí Tuệ Nhân Tạo</p>
          </div>
        </div>

        {/* Navigation Tabs phân quyền chuẩn xác theo Role */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {/* 1. Nếu là Quản Trị Viên (Admin) */}
          {currentUser?.role === 'admin' ? (
            <>
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-600" />
                Quản Trị Hệ Thống
              </button>

              <button
                onClick={() => setActiveTab('recruiter')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'recruiter'
                    ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-4 h-4 text-purple-600" />
                Quản Lý Tuyển Dụng
              </button>

              <button
                onClick={() => setActiveTab('matching')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'matching'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                Thị Trường Việc Làm
              </button>

              <button
                onClick={() => setActiveTab('hero')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'hero'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Trang Chủ
              </button>
            </>
          ) : currentUser?.role === 'recruiter' ? (
            /* 2. Nếu là Nhà Tuyển Dụng (Recruiter / HR) */
            <>
              <button
                onClick={() => setActiveTab('recruiter')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'recruiter'
                    ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-4 h-4 text-purple-600" />
                Portal Tuyển Dụng
              </button>

              <button
                onClick={() => setActiveTab('matching')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'matching'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                Thị Trường Việc Làm
              </button>

              <button
                onClick={() => setActiveTab('hero')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'hero'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Trang Chủ
              </button>
            </>
          ) : (
            /* 3. Nếu là Ứng Viên hoặc Khách vãng lai */
            <>
              <button
                onClick={() => setActiveTab('hero')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'hero'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Trang Chủ
              </button>

              <button
                onClick={() => setActiveTab('matching')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'matching'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                Tìm Việc & So Khớp
              </button>

              <button
                onClick={() => setActiveTab('candidate')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'candidate'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-600" />
                Phân Tích CV
              </button>
            </>
          )}
        </nav>

        {/* User Auth & Profile Menu */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xs overflow-hidden shadow-xs">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    currentUser.fullName?.charAt(0) || 'U'
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser.fullName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${currentBadge.color}`}>
                      {currentBadge.label}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fadeIn">
                  <div className="p-3 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900">{currentUser.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                      <span>Vai trò:</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${currentBadge.color}`}>
                        {currentBadge.label}
                      </span>
                    </div>
                  </div>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-all mb-1"
                    >
                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Cổng Quản Trị Hệ Thống</span>
                    </button>
                  )}

                  {currentUser.role === 'recruiter' && (
                    <button
                      onClick={() => {
                        setActiveTab('recruiter');
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-all mb-1"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                      <span>Cổng Nhà Tuyển Dụng</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onOpenProfileModal();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all mb-1"
                  >
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Hồ Sơ & Đổi Mật Khẩu</span>
                  </button>

                  <button
                    onClick={() => {
                      onLogout();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng Xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập / Đăng Ký</span>
            </button>
          )}

          {/* Action Button bên phải theo Role */}
          {currentUser?.role === 'admin' ? (
            <button
              onClick={() => setActiveTab('admin')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Quản Trị</span>
            </button>
          ) : currentUser?.role === 'recruiter' ? (
            <button
              onClick={() => setActiveTab('recruiter')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 active:scale-95 transition-all"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Đăng Tin Mới</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('candidate')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phân Tích CV</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
