import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, Briefcase, Globe, 
  Lock, CheckCircle2, AlertCircle, Save, KeyRound, 
  Sparkles, Shield, Building, Code2, Eye, EyeOff, Award
} from 'lucide-react';
import { updateProfile, changePassword } from '../services/api';

export default function ProfileModal({ isOpen, onClose, currentUser, onProfileUpdated }) {
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'password'
  
  // Form Info State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState('1 - 2 năm kinh nghiệm');
  const [bio, setBio] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [skills, setSkills] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Status State
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setExperienceYears(currentUser.experienceYears || currentUser.title || '1 - 2 năm kinh nghiệm');
      setBio(currentUser.bio || '');
      setCompanyName(currentUser.companyName || '');
      setCompanyWebsite(currentUser.companyWebsite || '');
      setSkills(Array.isArray(currentUser.skills) ? currentUser.skills.join(', ') : (currentUser.skills || ''));
      setPortfolioUrl(currentUser.portfolioUrl || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        fullName,
        phone,
        title: experienceYears,
        experienceYears,
        bio,
        companyName,
        companyWebsite,
        portfolioUrl,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean)
      };

      const res = await updateProfile(payload);
      if (res && res.success) {
        setSuccessMsg('Đã cập nhật thông tin cá nhân thành công!');
        localStorage.setItem('smartrecruit_user', JSON.stringify(res.user));
        if (onProfileUpdated) onProfileUpdated(res.user);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res?.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res && res.success) {
        setSuccessMsg('Đổi mật khẩu thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res?.message || 'Không thể đổi mật khẩu');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
            {currentUser.role === 'admin' ? (
              <Shield className="w-6 h-6 text-indigo-600" />
            ) : currentUser.role === 'recruiter' ? (
              <Building className="w-6 h-6 text-purple-600" />
            ) : (
              <User className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Quản Lý Thông Tin Cá Nhân</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500 font-medium">{currentUser.email}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                currentUser.role === 'admin'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : currentUser.role === 'recruiter'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {currentUser.role === 'admin' ? 'Quản Trị Viên' : currentUser.role === 'recruiter' ? 'Nhà Tuyển Dụng' : 'Ứng Viên'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200">
          <button
            type="button"
            onClick={() => { setActiveTab('info'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'info' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hồ Sơ Cá Nhân
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('password'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'password' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đổi Mật Khẩu
          </button>
        </div>

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

        {/* Tab 1: Profile Info Form */}
        {activeTab === 'info' && (
          <form onSubmit={handleUpdateInfo} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                Họ và Tên *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                  Số Điện Thoại
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901 234 567"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    <span>Số Năm Kinh Nghiệm</span>
                  </span>
                </label>
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                >
                  <option value="Chưa có kinh nghiệm (Fresher/Thực tập sinh)">Chưa có kinh nghiệm (Fresher / Thực tập)</option>
                  <option value="Dưới 1 năm kinh nghiệm">Dưới 1 năm kinh nghiệm</option>
                  <option value="1 - 2 năm kinh nghiệm">1 - 2 năm kinh nghiệm (Junior)</option>
                  <option value="3 - 5 năm kinh nghiệm">3 - 5 năm kinh nghiệm (Middle)</option>
                  <option value="5+ năm kinh nghiệm (Senior / Leader)">5+ năm kinh nghiệm (Senior / Leader)</option>
                  <option value="10+ năm kinh nghiệm (Chuyên gia / Quản lý)">10+ năm kinh nghiệm (Chuyên gia / Quản lý)</option>
                </select>
              </div>
            </div>

            {/* Recruiter-specific fields */}
            {currentUser.role === 'recruiter' && (
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                <p className="text-xs font-bold text-purple-800 uppercase flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-purple-600" />
                  <span>Thông Tin Doanh Nghiệp Tuyển Dụng</span>
                </p>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Tên Công Ty / Doanh Nghiệp</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="VD: VNG Corporation, FPT Software..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Website Công Ty</label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://company.vn"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>
              </div>
            )}

            {/* Candidate-specific fields */}
            {currentUser.role === 'candidate' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                    Kỹ Năng Trọng Tâm (Cách nhau bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="React, Node.js, MongoDB, TypeScript, Docker..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                    Liên Kết Portfolio / GitHub / LinkedIn
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://github.com/username hoặc linkedin.com/in/..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                Giới Thiệu Bản Thân (Bio / Tóm Tắt)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tóm tắt ngắn gọn về kinh nghiệm, thế mạnh chuyên môn và mục tiêu nghề nghiệp..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Đang lưu...' : 'Lưu Thay Đổi Thông Tin'}</span>
            </button>
          </form>
        )}

        {/* Tab 2: Change Password Form */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                Mật Khẩu Hiện Tại *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors"
                  title={showCurrentPass ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                Mật Khẩu Mới *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors"
                  title={showNewPass ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                Xác Nhận Mật Khẩu Mới *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors"
                  title={showConfirmPass ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{loading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu Mới'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
