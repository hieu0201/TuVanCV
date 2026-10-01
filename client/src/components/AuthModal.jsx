import React, { useState } from 'react';
import { 
  X, User, Lock, Mail, Briefcase, Sparkles, 
  CheckCircle2, Shield, UserCheck, AlertCircle, 
  KeyRound, ArrowLeft, Send, Eye, EyeOff, Award, Building
} from 'lucide-react';
import { loginUser, registerUser, verifyOtp, resendOtp, forgotPassword } from '../services/api';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('smartrecruit_pending_otp_email') ? 'otp' : 'login';
  });
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('smartrecruit_pending_otp_email') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('candidate'); // 'candidate' | 'recruiter'
  const [companyName, setCompanyName] = useState('');
  const [experienceYears, setExperienceYears] = useState('1 - 2 năm kinh nghiệm');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(() => {
    return localStorage.getItem('smartrecruit_pending_otp_email') 
      ? 'Vui lòng nhập mã 6 số OTP đã gửi đến email của bạn để kích hoạt tài khoản.' 
      : '';
  });

  if (!isOpen) return null;

  // Nạp nhanh tài khoản mẫu chuẩn
  const handleFillAccount = (userEmail, userPassword) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setMode('login');
    setErrorMsg('');
  };

  // Xử lý submit Login hoặc Register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        const res = await loginUser(email, password);
        if (res && res.success) {
          localStorage.removeItem('smartrecruit_pending_otp_email');
          localStorage.setItem('smartrecruit_token', res.token);
          localStorage.setItem('smartrecruit_user', JSON.stringify(res.user));
          onLoginSuccess(res.user);
          onClose();
        } else if (res && res.requireOtp) {
          // Bắt buộc xác thực OTP: tự động chuyển sang tab OTP cho email này
          const targetEmail = res.email || email;
          setEmail(targetEmail);
          setMode('otp');
          localStorage.setItem('smartrecruit_pending_otp_email', targetEmail);
          setErrorMsg(res.message || 'Tài khoản chưa được kích hoạt. Vui lòng nhập mã OTP!');
        } else {
          setErrorMsg(res?.message || 'Email hoặc mật khẩu không chính xác');
        }
      } else if (mode === 'register') {
        if (role === 'recruiter' && !companyName.trim()) {
          setErrorMsg('Vui lòng nhập Tên công ty / Doanh nghiệp khi đăng ký Nhà tuyển dụng');
          setIsLoading(false);
          return;
        }

        const normalizedEmail = email.toLowerCase().trim();
        const res = await registerUser({
          fullName,
          email: normalizedEmail,
          password,
          role,
          title: experienceYears,
          experienceYears,
          companyName: role === 'recruiter' ? companyName.trim() : ''
        });
        if (res && res.success) {
          localStorage.setItem('smartrecruit_pending_otp_email', normalizedEmail);
          setSuccessMsg(res.message || 'Vui lòng kiểm tra mã OTP gửi về email.');
          setMode('otp');
        } else {
          setErrorMsg(res?.message || 'Đăng ký thất bại');
        }
      } else if (mode === 'otp') {
        const res = await verifyOtp(email, otp);
        if (res && res.success) {
          localStorage.removeItem('smartrecruit_pending_otp_email');
          localStorage.setItem('smartrecruit_token', res.token);
          localStorage.setItem('smartrecruit_user', JSON.stringify(res.user));
          onLoginSuccess(res.user);
          onClose();
        } else {
          setErrorMsg(res?.message || 'Mã OTP không chính xác hoặc đã hết hạn');
        }
      } else if (mode === 'forgot') {
        const res = await forgotPassword(email);
        if (res && res.success) {
          setSuccessMsg(res.message || 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.');
        } else {
          setErrorMsg(res?.message || 'Lỗi gửi yêu cầu');
        }
      }
    } catch (err) {
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const res = await resendOtp(email);
      if (res && res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res?.message || 'Không thể gửi lại mã');
      }
    } catch (err) {
      setErrorMsg('Lỗi khi gửi lại OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3 text-blue-600 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {mode === 'login' && 'Đăng Nhập Tài Khoản'}
            {mode === 'register' && 'Đăng Ký Tài Khoản Mới'}
            {mode === 'otp' && 'Xác Thực Email (OTP)'}
            {mode === 'forgot' && 'Khôi Phục Mật Khẩu'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login' && 'Truy cập hệ thống tuyển dụng & phân tích CV thông minh'}
            {mode === 'register' && 'Tạo tài khoản để mở khóa đánh giá AI chuẩn doanh nghiệp'}
            {mode === 'otp' && `Nhập mã xác thực 6 chữ số gửi đến: ${email}`}
            {mode === 'forgot' && 'Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu'}
          </p>
        </div>

        {/* Tab switch between Login & Register */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng Ký
            </button>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OTP Screen */}
          {mode === 'otp' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                  Mã OTP 6 số từ Email *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 text-center text-xl font-bold tracking-[8px] focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Gửi lại mã OTP
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-slate-500 hover:text-slate-800"
                >
                  Quay lại đăng nhập
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Đang xác thực...' : 'Xác Nhận Kích Hoạt Tài Khoản'}
              </button>
            </div>
          )}

          {/* Forgot Password Screen */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                  Địa Chỉ Email Của Bạn *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Đang gửi...' : 'Gửi Liên Kết Đặt Lại Mật Khẩu'}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Quay lại trang Đăng nhập</span>
                </button>
              </div>
            </div>
          )}

          {/* Register Mode Specific Fields */}
          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                  Họ và Tên *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                  Vai Trò Tham Gia *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('candidate')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      role === 'candidate'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ứng Viên</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('recruiter')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      role === 'recruiter'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Nhà Tuyển Dụng</span>
                  </button>
                </div>
              </div>

              {role === 'recruiter' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tên Công Ty / Doanh Nghiệp *</span>
                    </span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required={role === 'recruiter'}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ví dụ: FPT Software, VNG, Viettel..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    <span>{role === 'candidate' ? 'Số Năm Kinh Nghiệm' : 'Kinh Nghiệm Quản Lý Tuyển Dụng'}</span>
                  </span>
                </label>
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                >
                  <option value="Chưa có kinh nghiệm (Fresher/Thực tập sinh)">Chưa có kinh nghiệm (Fresher / Thực tập sinh)</option>
                  <option value="Dưới 1 năm kinh nghiệm">Dưới 1 năm kinh nghiệm</option>
                  <option value="1 - 2 năm kinh nghiệm">1 - 2 năm kinh nghiệm (Junior)</option>
                  <option value="3 - 5 năm kinh nghiệm">3 - 5 năm kinh nghiệm (Middle)</option>
                  <option value="5+ năm kinh nghiệm (Senior / Leader)">5+ năm kinh nghiệm (Senior / Leader)</option>
                  <option value="10+ năm kinh nghiệm (Chuyên gia / Quản lý)">10+ năm kinh nghiệm (Chuyên gia / Quản lý)</option>
                </select>
              </div>
            </>
          )}

          {/* Email & Password for Login / Register */}
          {(mode === 'login' || mode === 'register') && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                  Địa Chỉ Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Mật Khẩu *
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="text-[11px] text-blue-600 font-medium hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {isLoading 
                  ? 'Đang xử lý...' 
                  : (mode === 'login' ? 'Đăng Nhập Ngay' : 'Tạo Tài Khoản & Nhận Mã OTP')}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
