import React, { useState } from 'react';
import { 
  Sparkles, ArrowRight, ShieldCheck, Search, MapPin, 
  Briefcase, CheckCircle2, Award, Users, Building, 
  BarChart3, FileText, ChevronRight
} from 'lucide-react';

export default function HeroSection({ setActiveTab, onGetStarted, currentUser }) {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('all');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveTab('matching');
  };

  return (
    <div className="relative pt-8 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Professional Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-semibold shadow-xs">
            <Building className="w-4 h-4 text-blue-600" />
            <span>SmartRecruit Enterprise • Hệ Thống Tuyển Dụng & Phân Tích Hồ Sơ Chuyên Nghiệp</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 mb-5 leading-tight">
            Kết Nối Việc Làm Chất Lượng Cao & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Phân Tích CV Chuẩn Doanh Nghiệp
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Giải pháp tuyển dụng toàn diện giúp ứng viên bóc tách năng lực, đo lường chỉ số phù hợp với từng vị trí tuyển dụng và hỗ trợ doanh nghiệp tìm đúng nhân tài.
          </p>

          {/* Quick Search & Explore Box */}
          <div className="mt-8 max-w-3xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="bg-white p-2.5 sm:p-3 flex flex-col sm:flex-row gap-2.5 shadow-md border border-slate-200 rounded-2xl">
              <div className="flex-1 relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Vị trí công việc, kỹ năng chuyên môn..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                />
              </div>

              <div className="sm:w-48 relative flex items-center">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                >
                  <option value="all">Tất cả địa điểm</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Remote">Làm việc từ xa</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Tìm Việc Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Popular Categories Chips */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 font-medium">
              <span className="text-slate-400 text-[11px]">Ngành nghề thịnh hành:</span>
              <button 
                type="button" 
                onClick={() => setActiveTab('matching')}
                className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-700 transition-colors shadow-xs"
              >
                Công nghệ thông tin
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('matching')}
                className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-700 transition-colors shadow-xs"
              >
                AI & Khoa học Dữ liệu
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('matching')}
                className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-700 transition-colors shadow-xs"
              >
                Thiết kế UI/UX
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('matching')}
                className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-700 transition-colors shadow-xs"
              >
                Marketing & Vận hành
              </button>
            </div>
          </div>
        </div>

        {/* 3 Core Platform Pillars (Adaptive theo Role) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto mt-6">
          <div 
            onClick={() => setActiveTab('candidate')}
            className="bg-white border border-slate-200 rounded-3xl p-6 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              1. Phân Tích CV Chuẩn ATS
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Bóc tách cấu trúc kinh nghiệm, phân loại kỹ năng chuyên môn và đánh giá điểm chuẩn hóa hồ sơ một cách khách quan.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs text-blue-600 font-semibold">
              <span>Bắt đầu kiểm tra CV</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('matching')}
            className="bg-white border border-slate-200 rounded-3xl p-6 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 mb-4 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
              2. So Khớp CV & JD Việc Làm
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Đối chiếu trực tiếp hồ sơ với bản mô tả công việc, phát hiện kỹ năng còn thiếu và nhận lời khuyên trước khi ứng tuyển.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs text-cyan-600 font-semibold">
              <span>Đo lường độ phù hợp</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {currentUser?.role === 'admin' ? (
            <div 
              onClick={() => setActiveTab('admin')}
              className="bg-white border border-slate-200 rounded-3xl p-6 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group shadow-xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                3. Bảng Điều Khiển Quản Trị
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Quản lý người dùng, duyệt tài khoản Nhà tuyển dụng, quản trị danh mục kỹ năng và giám sát số liệu hệ thống.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-indigo-600 font-semibold">
                <span>Vào trang quản trị</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : currentUser?.role === 'candidate' ? (
            <div 
              onClick={() => setActiveTab('matching')}
              className="bg-white border border-slate-200 rounded-3xl p-6 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group shadow-xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                3. Đơn Tuyển Dụng & Phỏng Vấn
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Nộp hồ sơ trực tiếp tới nhà tuyển dụng, theo dõi trạng thái phản hồi và lịch phỏng vấn được cập nhật tự động.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-purple-600 font-semibold">
                <span>Xem việc làm đang tuyển</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setActiveTab('recruiter')}
              className="bg-white border border-slate-200 rounded-3xl p-6 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group shadow-xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                3. Cổng Nhà Tuyển Dụng (HR)
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Đăng tin tuyển dụng, phân tích chất lượng JD, quản lý luồng ứng viên và gửi thông báo phỏng vấn tự động qua email.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-purple-600 font-semibold">
                <span>Truy cập tuyển dụng</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Bảo mật thông tin ứng viên</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Phân tích dữ liệu thực tế 100%</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Hỗ trợ gửi thư mời phỏng vấn tự động</span>
          </div>
        </div>
      </div>
    </div>
  );
}
