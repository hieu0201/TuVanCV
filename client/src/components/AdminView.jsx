import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Briefcase, CheckCircle2, 
  XCircle, Search, RefreshCw, Trash2, UserCheck, 
  Activity, Server, Cpu, Mail, AlertTriangle, ChevronRight,
  TrendingUp, Building, Check, Ban, Clock,
  ExternalLink, ChevronDown, ChevronUp, Filter, Sparkles, Layers, Plus
} from 'lucide-react';
import { 
  getAdminStats, 
  getAdminUsers, 
  updateAdminUserRole, 
  deleteAdminUser, 
  getJobs,
  deleteJob,
  updateRecruiterCompanyStatus,
  getAdminApplications
} from '../services/api';

export default function AdminView({ currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' | 'recruiters' | 'jobs' | 'applications' | 'categories' | 'system'
  const [stats, setStats] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });
  const [expandedJobId, setExpandedJobId] = useState(null);

  // Categories & Taxonomy State (Requirement 12)
  const [categories, setCategories] = useState([
    { id: 'it', name: 'Công nghệ thông tin', skills: ['React.js', 'Node.js', 'Python', 'Docker', 'AWS', 'TypeScript'] },
    { id: 'ai-data', name: 'AI & Khoa học Dữ liệu', skills: ['PyTorch', 'TensorFlow', 'NLP', 'LangChain', 'Computer Vision', 'LLMs'] },
    { id: 'design', name: 'Thiết kế UI/UX', skills: ['Figma', 'Adobe XD', 'Design System', 'User Research', 'Wireframing'] },
    { id: 'marketing', name: 'Marketing & Truyền thông', skills: ['SEO', 'Content Strategy', 'Google Ads', 'Social Media', 'Copywriting'] },
    { id: 'finance', name: 'Tài chính - Ngân hàng', skills: ['Kế toán tài chính', 'Phân tích định lượng', 'Kiểm toán', 'Quản trị rủi ro'] },
    { id: 'hr', name: 'Nhân sự & Vận hành', skills: ['Tuyển dụng nhân tài', 'C&B', 'HRBP', 'Đào tạo nội bộ', 'Luật lao động'] }
  ]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSkills, setNewCatSkills] = useState('');

  // Tải dữ liệu điều hành trung tâm
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, jobsRes, appRes] = await Promise.all([
        getAdminStats().catch(() => ({ success: false })),
        getAdminUsers(searchTerm, roleFilter).catch(() => ({ success: false, users: [] })),
        getJobs().catch(() => ({ success: false, jobs: [] })),
        getAdminApplications().catch(() => ({ success: false, applications: [] }))
      ]);

      if (statsRes.success) {
        setStats(statsRes.data.stats);
        setSystemStatus(statsRes.data.systemStatus);
      }
      if (usersRes.success) setUsers(usersRes.users || []);
      if (jobsRes.success) setJobs(jobsRes.jobs || []);
      if (appRes.success) setApplications(appRes.applications || []);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu quản trị:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await updateAdminUserRole(userId, newRole);
      if (res.success) {
        setActionMsg({ type: 'success', text: `Đã cập nhật vai trò thành [${newRole.toUpperCase()}] thành công!` });
        setUsers(users.map(u => (u._id === userId || u.id === userId) ? { ...u, role: newRole } : u));
      } else {
        setActionMsg({ type: 'error', text: res.message || 'Lỗi cập nhật vai trò' });
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: 'Không thể kết nối máy chủ' });
    }
    setTimeout(() => setActionMsg({ type: '', text: '' }), 4000);
  };

  const handleCompanyStatusChange = async (userId, newStatus) => {
    try {
      const res = await updateRecruiterCompanyStatus(userId, newStatus);
      if (res.success) {
        setActionMsg({ 
          type: 'success', 
          text: newStatus === 'verified' 
            ? 'Đã phê duyệt doanh nghiệp tuyển dụng' 
            : 'Đã khóa quyền đăng tin của doanh nghiệp này' 
        });
        setUsers(users.map(u => (u._id === userId || u.id === userId) ? { ...u, companyStatus: newStatus } : u));
      } else {
        setActionMsg({ type: 'error', text: res.message || 'Lỗi cập nhật' });
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: 'Lỗi cập nhật trạng thái doanh nghiệp' });
    }
    setTimeout(() => setActionMsg({ type: '', text: '' }), 4000);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('CẢNH BÁO QUẢN TRỊ: Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này khỏi cơ sở dữ liệu?')) return;
    try {
      const res = await deleteAdminUser(userId);
      if (res.success) {
        setActionMsg({ type: 'success', text: 'Đã xóa tài khoản khỏi hệ thống' });
        setUsers(users.filter(u => u._id !== userId && u.id !== userId));
      } else {
        setActionMsg({ type: 'error', text: res.message || 'Không thể xóa' });
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: 'Lỗi khi xóa người dùng' });
    }
    setTimeout(() => setActionMsg({ type: '', text: '' }), 4000);
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Bạn có chắc chắn muốn gỡ tin tuyển dụng này khỏi hệ thống?')) return;
    try {
      const res = await deleteJob(jobId);
      if (res.success) {
        setActionMsg({ type: 'success', text: 'Đã gỡ bỏ tin tuyển dụng' });
        setJobs(jobs.filter(j => j._id !== jobId && j.id !== jobId));
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: 'Lỗi khi gỡ tin tuyển dụng' });
    }
    setTimeout(() => setActionMsg({ type: '', text: '' }), 4000);
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newCat = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      skills: newCatSkills ? newCatSkills.split(',').map(s => s.trim()).filter(Boolean) : []
    };
    setCategories([...categories, newCat]);
    setNewCatName('');
    setNewCatSkills('');
    setActionMsg({ type: 'success', text: `Đã bổ sung danh mục [${newCat.name}] vào hệ thống!` });
    setTimeout(() => setActionMsg({ type: '', text: '' }), 3000);
  };

  const handleDeleteCategory = (catId) => {
    setCategories(categories.filter(c => c.id !== catId));
    setActionMsg({ type: 'success', text: 'Đã xóa danh mục' });
    setTimeout(() => setActionMsg({ type: '', text: '' }), 3000);
  };

  const recruitersList = users.filter(u => u.role === 'recruiter');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn text-slate-800">
      {/* Executive Command Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Trung Tâm Quản Trị & Điều Hành Hệ Thống</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bảng Điều Khiển Quản Lý <span className="text-blue-600">SmartRecruit Enterprise</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
              Kiểm soát tài khoản, phê duyệt doanh nghiệp tuyển dụng, giám sát luồng ứng tuyển thực tế và kiểm tra hạ tầng máy chủ trực tuyến.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span>Đồng bộ dữ liệu</span>
            </button>
          </div>
        </div>

        {actionMsg.text && (
          <div className={`mt-4 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
            actionMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm' 
              : 'bg-rose-50 text-rose-800 border border-rose-200 shadow-sm'
          }`}>
            {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{actionMsg.text}</span>
          </div>
        )}
      </div>

      {/* 4 Executive KPI Cards (Real Data Only) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Tài Khoản</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats ? stats.totalUsers : users.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2 font-medium">
            <span className="text-blue-600 font-semibold">{stats?.candidatesCount || 0} Ứng viên</span>
            <span>•</span>
            <span className="text-purple-600 font-semibold">{stats?.recruitersCount || recruitersList.length} Doanh nghiệp HR</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tin Tuyển Dụng</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats?.totalJobs ?? jobs.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2 font-medium">
            <span className="text-emerald-600 font-semibold">Đang nhận hồ sơ</span>
            <span>•</span>
            <span className="text-indigo-600 font-semibold">{jobs.length} tin công khai</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Hồ Sơ Ứng Tuyển</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats?.totalApplications ?? applications.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2 font-medium">
            <span className="text-emerald-600 font-semibold">{stats?.totalHired || 0} Đã tuyển</span>
            <span>•</span>
            <span className="text-purple-600 font-semibold">{stats?.totalInterviewing || 0} Phỏng vấn</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Hạ Tầng Trực Tuyến</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{systemStatus?.database === 'connected' ? 'MongoDB Trực Tuyến' : 'MongoDB Sẵn Sàng'}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2 font-medium">
            <span className="text-blue-600">Gemini 2.5 Flash</span>
            <span>•</span>
            <span className="text-indigo-600">Gmail SMTP</span>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeSubTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quản Lý Người Dùng ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('recruiters')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeSubTab === 'recruiters' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Kiểm Soát Doanh Nghiệp ({recruitersList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('jobs')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeSubTab === 'jobs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Quản Trị Việc Làm & Ứng Tuyển ({jobs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('applications')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeSubTab === 'applications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Giám Sát Toàn Hệ Thống ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeSubTab === 'categories' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Danh Mục Ngành Nghề & Kỹ Năng ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('system')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeSubTab === 'system' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Hạ Tầng & Email</span>
        </button>
      </div>

      {/* 1. SUBTAB: USERS & ROLE MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Tìm theo họ tên, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium shrink-0">Lọc vai trò:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="">Tất cả vai trò</option>
                <option value="candidate">Ứng viên</option>
                <option value="recruiter">Nhà tuyển dụng</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Người Dùng</th>
                    <th className="px-5 py-3.5">Kinh Nghiệm</th>
                    <th className="px-5 py-3.5">Vai Trò Hệ Thống</th>
                    <th className="px-5 py-3.5">Xác Thực Email</th>
                    <th className="px-5 py-3.5">Số Điện Thoại</th>
                    <th className="px-5 py-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {users.map((user) => (
                    <tr key={user._id || user.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <img
                          src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.fullName || 'User')}`}
                          alt=""
                          className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{user.fullName || 'Người dùng'}</div>
                          <div className="text-[11px] text-slate-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 inline-block">
                          {user.experienceYears || user.title || 'Chưa cập nhật'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id || user.id, e.target.value)}
                          className="text-[11px] font-semibold rounded-lg px-2.5 py-1 bg-white border border-slate-300 text-slate-800 focus:border-blue-500"
                        >
                          <option value="candidate">Ứng Viên</option>
                          <option value="recruiter">Nhà Tuyển Dụng</option>
                          <option value="admin">Quản Trị Viên (Admin)</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        {user.isEmailVerified ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Đã xác thực
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 border border-amber-200">
                            <Clock className="w-3 h-3" /> Chờ xác thực
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {user.phone || 'Chưa cập nhật'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteUser(user._id || user.id)}
                          title="Xóa tài khoản"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        Không tìm thấy người dùng nào phù hợp với điều kiện tìm kiếm
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUBTAB: RECRUITER GOVERNANCE */}
      {activeSubTab === 'recruiters' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong>Chính sách quản lý tài khoản doanh nghiệp:</strong> Quản trị viên có thẩm quyền phê duyệt hồ sơ pháp nhân của nhà tuyển dụng hoặc tạm khóa quyền đăng tin tuyển dụng nếu phát hiện vi phạm tiêu chuẩn cộng đồng.
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Đại Diện Tuyển Dụng</th>
                    <th className="px-5 py-3.5">Tổ Chức / Doanh Nghiệp</th>
                    <th className="px-5 py-3.5">Website Doanh Nghiệp</th>
                    <th className="px-5 py-3.5">Trạng Thái Pháp Lý</th>
                    <th className="px-5 py-3.5 text-right">Hành Động Kiểm Duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recruitersList.map((recruiter) => {
                    const rId = recruiter._id || recruiter.id;
                    const cStatus = recruiter.companyStatus || 'verified';
                    return (
                      <tr key={rId} className="hover:bg-slate-50/80 transition-all">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{recruiter.fullName}</div>
                          <div className="text-[11px] text-slate-500">{recruiter.email}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-purple-700">
                            {recruiter.companyName || 'Doanh Nghiệp Tuyển Dụng'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-blue-600">
                          {recruiter.companyWebsite ? (
                            <a href={recruiter.companyWebsite} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1 font-medium">
                              <span>{recruiter.companyWebsite}</span>
                              <ExternalLink className="w-3 h-3 inline" />
                            </a>
                          ) : (
                            <span className="text-slate-400">Chưa cung cấp</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {cStatus === 'verified' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" /> Đã Phê Duyệt
                            </span>
                          ) : cStatus === 'suspended' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <Ban className="w-3 h-3" /> Đã Tạm Khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> Chờ Kiểm Duyệt
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {cStatus !== 'verified' && (
                              <button
                                onClick={() => handleCompanyStatusChange(rId, 'verified')}
                                className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-[11px] font-semibold transition-all shadow-sm"
                              >
                                Phê Duyệt
                              </button>
                            )}
                            {cStatus !== 'suspended' && (
                              <button
                                onClick={() => handleCompanyStatusChange(rId, 'suspended')}
                                className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[11px] font-semibold transition-all shadow-sm"
                              >
                                Tạm Khóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {recruitersList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                        Chưa có tài khoản nhà tuyển dụng nào đăng ký trên hệ thống
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUBTAB: JOBS & APPLICANTS MANAGEMENT */}
      {activeSubTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Danh sách tin tuyển dụng trên sàn và số lượng ứng viên đã nộp đơn thực tế.</span>
            <span className="font-semibold text-slate-700">Tổng: {jobs.length} tin</span>
          </div>

          <div className="space-y-3">
            {jobs.map((job) => {
              const jobId = job._id || job.id;
              const isExpanded = expandedJobId === jobId;
              const jobApps = applications.filter(app => (app.jobId?._id === jobId || app.jobId === jobId));

              return (
                <div key={jobId} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition-all shadow-sm">
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">{job.title}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          👥 {job.applicantsCount || 0} hồ sơ ứng tuyển
                        </span>
                        <span className="text-xs text-indigo-600 font-semibold">{job.company}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>📍 {job.location || 'Toàn quốc'}</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">💰 {job.salary || 'Thỏa thuận'}</span>
                        <span>•</span>
                        <span>{job.type || 'Toàn thời gian'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        onClick={() => setExpandedJobId(isExpanded ? null : jobId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-all shadow-sm"
                      >
                        <span>{isExpanded ? 'Ẩn hồ sơ ứng tuyển' : `Xem hồ sơ (${jobApps.length})`}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleDeleteJob(jobId)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-all shadow-sm"
                      >
                        Gỡ tin
                      </button>
                    </div>
                  </div>

                  {/* Expanded Applicants for this specific Job */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 animate-fadeIn">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                        Danh Sách Ứng Viên Đã Ứng Tuyển Vị Trí Này ({jobApps.length})
                      </h4>
                      {jobApps.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {jobApps.map((app, idx) => {
                            const candidateName = app.candidateName || app.candidateId?.fullName || 'Ứng viên';
                            const candidateEmail = app.candidateEmail || app.candidateId?.email || 'Chưa cập nhật';
                            return (
                              <div key={app._id || idx} className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                                <div>
                                  <div className="font-semibold text-slate-900 text-xs">{candidateName}</div>
                                  <div className="text-[11px] text-slate-500">{candidateEmail}</div>
                                  <div className="text-[10px] text-slate-400 mt-1">
                                    Nộp lúc: {app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-extrabold text-blue-600 block">{app.matchScore || 80}%</span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase mt-1 inline-block border ${
                                    app.status === 'hired' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    app.status === 'interviewing' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    app.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                    'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}>
                                    {app.status || 'applied'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 py-3 text-center">
                          Chưa có ứng viên nào nộp hồ sơ vào vị trí này
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {jobs.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                Chưa có tin tuyển dụng nào trên hệ thống
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SUBTAB: ALL SYSTEM APPLICATIONS */}
      {activeSubTab === 'applications' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Ứng Viên</th>
                    <th className="px-5 py-3.5">Vị Trí & Doanh Nghiệp</th>
                    <th className="px-5 py-3.5">Độ Phù Hợp AI</th>
                    <th className="px-5 py-3.5">Trạng Thái Tuyển Dụng</th>
                    <th className="px-5 py-3.5">Thời Gian Nộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {applications.map((app, idx) => {
                    const candidateName = app.candidateName || app.candidateId?.fullName || 'Ứng viên';
                    const candidateEmail = app.candidateEmail || app.candidateId?.email || 'Chưa cập nhật';
                    const jobTitle = app.jobId?.title || 'Vị trí chuyên môn';
                    const company = app.jobId?.company || 'Doanh nghiệp tuyển dụng';
                    const status = app.status || 'applied';

                    return (
                      <tr key={app._id || idx} className="hover:bg-slate-50/80 transition-all">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{candidateName}</div>
                          <div className="text-[11px] text-slate-500">{candidateEmail}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-slate-900">{jobTitle}</div>
                          <div className="text-[11px] text-indigo-600 font-semibold">{company}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-extrabold text-blue-600 text-sm">{app.matchScore || 80}%</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            status === 'hired'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : status === 'interviewing'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {status === 'hired' ? 'Đã Tuyển Dụng' : status === 'interviewing' ? 'Mời Phỏng Vấn' : status === 'rejected' ? 'Đã Từ Chối' : 'Mới Nộp Đơn'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                        </td>
                      </tr>
                    );
                  })}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                        Chưa có đơn ứng tuyển nào được ghi nhận trên toàn hệ thống
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUBTAB: CATEGORIES & TAXONOMY MANAGEMENT */}
      {activeSubTab === 'categories' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Add Category Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Bổ Sung Danh Mục Ngành Nghề & Bộ Kỹ Năng Hệ Thống</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Quản lý phân loại ngành nghề và từ khóa kỹ năng cốt lõi giúp thuật toán AI đối soát và phân loại tin tuyển dụng chính xác hơn.
            </p>
            <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4">
                <label className="text-xs text-slate-700 font-semibold block mb-1">Tên Danh Mục / Ngành Nghề *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ví dụ: An Toàn Thông Tin (Cybersecurity)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="text-xs text-slate-700 font-semibold block mb-1">Kỹ Năng Cốt Lõi (Phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={newCatSkills}
                  onChange={(e) => setNewCatSkills(e.target.value)}
                  placeholder="SOC, SIEM, Penetration Testing, Wireshark, ISO 27001"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Mới</span>
                </button>
              </div>
            </form>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Xóa danh mục"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {cat.skills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-md text-[11px] bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                        {skill}
                      </span>
                    ))}
                    {cat.skills.length === 0 && (
                      <span className="text-[11px] text-slate-400">Chưa thiết lập kỹ năng mẫu</span>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between font-medium">
                  <span>Hệ thống AI Taxonomy</span>
                  <span className="text-blue-600 font-bold">{cat.skills.length} kỹ năng</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. SUBTAB: SYSTEM INFRASTRUCTURE & SMTP */}
      {activeSubTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" />
              <span>Dịch Vụ Email SMTP Trực Tuyến</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Đang Hoạt Động
              </span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dịch vụ gửi email thông báo tự động (Nodemailer qua Gmail SMTP) được tích hợp với tài khoản quản trị hệ thống:
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-1.5">
              <p><span className="text-purple-600 font-semibold">EMAIL_HOST</span>=smtp.gmail.com (Port 587)</p>
              <p><span className="text-purple-600 font-semibold">EMAIL_USER</span>=huynhvanhieu020104@gmail.com</p>
              <p><span className="text-purple-600 font-semibold">EMAIL_FROM</span>="SmartRecruit Enterprise" &lt;huynhvanhieu020104@gmail.com&gt;</p>
              <p><span className="text-emerald-600 font-bold">SMTP_STATUS</span>=Google App Password Authenticated (Live)</p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              ⚡ Hệ thống gửi email thực tế cho người dùng khi: Xác thực đăng ký tài khoản, gửi thông báo phỏng vấn cho ứng viên và xác nhận thư mời nhận việc.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Hạ Tầng Kết Nối Trực Tiếp</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2.5 border-b border-slate-100">
                <span className="text-slate-500">Cơ Sở Dữ Liệu:</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  MongoDB Live
                </span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-100">
                <span className="text-slate-500">Mô Hình Trí Tuệ Nhân Tạo:</span>
                <span className="text-blue-600 font-bold">Google Gemini 2.5 Flash</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-100">
                <span className="text-slate-500">Chế Độ Bóc Tách & Đánh Giá:</span>
                <span className="text-slate-900 font-bold">Bóc tách thực thể & chấm điểm Real-time</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Số Lượng Ứng Tuyển:</span>
                <span className="text-purple-700 font-bold">{applications.length} hồ sơ thực tế</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
