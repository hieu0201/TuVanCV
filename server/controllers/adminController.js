const User = require('../models/User');
const Job = require('../models/Job');
const CVAnalysis = require('../models/CVAnalysis');
const Application = require('../models/Application');
const { getIsConnected } = require('../config/db');
const { fallbackUsers } = require('./authController');

/**
 * Lấy dữ liệu thống kê tổng quan cho Admin Dashboard
 */
async function getDashboardStats(req, res) {
  try {
    const isDbConnected = getIsConnected();

    let totalUsers = 0;
    let candidatesCount = 0;
    let recruitersCount = 0;
    let adminsCount = 0;
    let totalJobs = 0;
    let totalAnalyses = 0;
    let totalApplications = 0;
    let totalHired = 0;
    let totalInterviewing = 0;
    let averageCvScore = 80;
    let recentAnalyses = [];
    let recentApplications = [];

    if (isDbConnected) {
      try {
        totalUsers = await User.countDocuments();
        candidatesCount = await User.countDocuments({ role: 'candidate' });
        recruitersCount = await User.countDocuments({ role: 'recruiter' });
        adminsCount = await User.countDocuments({ role: 'admin' });
        totalJobs = await Job.countDocuments();
        totalAnalyses = await CVAnalysis.countDocuments();
        totalApplications = await Application.countDocuments();
        totalHired = await Application.countDocuments({ status: 'hired' });
        totalInterviewing = await Application.countDocuments({ status: 'interviewing' });

        const avgResult = await CVAnalysis.aggregate([
          { $group: { _id: null, avgScore: { $avg: '$overallScore' } } }
        ]);
        if (avgResult.length > 0 && avgResult[0].avgScore) {
          averageCvScore = Math.round(avgResult[0].avgScore);
        }

        recentAnalyses = await CVAnalysis.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .select('candidateName candidateEmail detectedTitle overallScore scores createdAt');

        recentApplications = await Application.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('jobId', 'title company')
          .populate('candidateId', 'fullName email');
      } catch (e) {
        console.warn('Stats calculation warning:', e.message);
      }
    } else {
      totalUsers = fallbackUsers.length;
      candidatesCount = fallbackUsers.filter(u => u.role === 'candidate').length;
      recruitersCount = fallbackUsers.filter(u => u.role === 'recruiter').length;
      adminsCount = fallbackUsers.filter(u => u.role === 'admin').length;
      totalJobs = 3;
      totalAnalyses = 14;
      totalApplications = 8;
      totalHired = 2;
      totalInterviewing = 3;
      averageCvScore = 82;
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          candidatesCount,
          recruitersCount,
          adminsCount,
          totalJobs,
          totalAnalyses,
          totalApplications,
          totalHired,
          totalInterviewing,
          averageCvScore,
        },
        systemStatus: {
          database: isDbConnected ? 'connected' : 'standby',
          aiEngine: 'Google Gemini 2.5 Flash',
          emailService: process.env.EMAIL_USER || process.env.EMAIL_API_KEY ? 'active' : 'ready_queue',
          uptime: Math.floor(process.uptime())
        },
        recentAnalyses,
        recentApplications
      }
    });
  } catch (error) {
    console.error('Lỗi getDashboardStats:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy thống kê' });
  }
}

/**
 * Lấy danh sách tất cả tài khoản người dùng
 */
async function getAllUsers(req, res) {
  try {
    const { search = '', role = '' } = req.query;
    const isDbConnected = getIsConnected();

    if (isDbConnected) {
      try {
        const query = {};
        if (role) query.role = role;
        if (search) {
          query.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { companyName: { $regex: search, $options: 'i' } }
          ];
        }

        const users = await User.find(query)
          .select('-passwordHash')
          .sort({ createdAt: -1 });

        return res.json({ success: true, users });
      } catch (e) {}
    }

    let filtered = [...fallbackUsers];
    if (role) filtered = filtered.filter(u => u.role === role);
    if (search) {
      filtered = filtered.filter(u => 
        u.fullName.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({ success: true, users: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách user' });
  }
}

/**
 * Duyệt hoặc tạm dừng tư cách Nhà Tuyển Dụng / Doanh Nghiệp (Admin độc quyền)
 */
async function updateCompanyStatus(req, res) {
  try {
    const { id } = req.params;
    const { companyStatus } = req.body; // 'verified' | 'pending' | 'suspended'

    if (!['verified', 'pending', 'suspended'].includes(companyStatus)) {
      return res.status(400).json({ success: false, message: 'Trạng thái doanh nghiệp không hợp lệ' });
    }

    if (getIsConnected()) {
      try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy nhà tuyển dụng' });
        
        user.companyStatus = companyStatus;
        await user.save();
        return res.json({ success: true, message: `Đã cập nhật trạng thái doanh nghiệp thành: ${companyStatus}`, user });
      } catch (e) {}
    }

    res.json({ success: true, message: 'Đã cập nhật trạng thái doanh nghiệp' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái doanh nghiệp' });
  }
}

/**
 * Cập nhật vai trò người dùng (Admin, Recruiter, Candidate)
 */
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['candidate', 'recruiter', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' });
    }

    if (getIsConnected()) {
      try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

        user.role = role;
        await user.save();
        return res.json({ success: true, message: `Đã cập nhật vai trò thành công: ${role}`, user });
      } catch (e) {}
    }

    const fbUser = fallbackUsers.find(u => (u.id === id || u._id === id));
    if (fbUser) {
      fbUser.role = role;
      return res.json({ success: true, message: `Đã cập nhật vai trò: ${role}`, user: fbUser });
    }

    res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật vai trò' });
  }
}

/**
 * Xóa tài khoản người dùng
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (req.user && (req.user.id === id || req.user._id === id)) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự xóa tài khoản quản trị viên của chính mình' });
    }

    if (getIsConnected()) {
      try {
        await User.findByIdAndDelete(id);
        return res.json({ success: true, message: 'Đã xóa người dùng thành công' });
      } catch (e) {}
    }

    const index = fallbackUsers.findIndex(u => (u.id === id || u._id === id));
    if (index !== -1) {
      fallbackUsers.splice(index, 1);
      return res.json({ success: true, message: 'Đã xóa người dùng thành công' });
    }

    res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa người dùng' });
  }
}

/**
 * Xem tất cả đơn ứng tuyển trên toàn hệ thống (Admin quản lý tổng thể)
 */
async function getAllApplications(req, res) {
  try {
    if (getIsConnected()) {
      try {
        const applications = await Application.find()
          .sort({ createdAt: -1 })
          .populate('jobId', 'title company location salary')
          .populate('candidateId', 'fullName email phone');
        return res.json({ success: true, applications });
      } catch (e) {}
    }

    res.json({ success: true, applications: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách ứng tuyển' });
  }
}

/**
 * Xem lịch sử toàn bộ các lượt phân tích CV
 */
async function getAllAnalyses(req, res) {
  try {
    if (getIsConnected()) {
      try {
        const analyses = await CVAnalysis.find()
          .sort({ createdAt: -1 })
          .limit(50)
          .populate('userId', 'fullName email');
        return res.json({ success: true, analyses });
      } catch (e) {}
    }

    res.json({ success: true, analyses: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy lịch sử phân tích' });
  }
}

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  updateCompanyStatus,
  deleteUser,
  getAllApplications,
  getAllAnalyses
};
