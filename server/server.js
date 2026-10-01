require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { connectDB, getIsConnected } = require('./config/db');
const { parseAndAnalyzeCV, matchCVWithJob, generateInterviewQuestions, analyzeJobDescription } = require('./services/aiService');
const { sendAnalysisReportEmail } = require('./services/emailService');
const { 
  register, 
  verifyOtp, 
  resendOtp, 
  forgotPassword, 
  resetPassword, 
  login, 
  getMe,
  updateProfile,
  changePassword 
} = require('./controllers/authController');
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  updateCompanyStatus,
  deleteUser,
  getAllApplications,
  getAllAnalyses
} = require('./controllers/adminController');
const {
  getApplicationsByJob,
  screenNewCandidate,
  updateApplicationStatus
} = require('./controllers/applicationController');
const { protect, requireAdmin, requireRecruiter } = require('./middleware/authMiddleware');

// Models
const Job = require('./models/Job');
const CVAnalysis = require('./models/CVAnalysis');
const Application = require('./models/Application');

const app = express();
const PORT = process.env.PORT || 5000;

// Kết nối cơ sở dữ liệu MongoDB thực tế
connectDB();

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ===== 1. AUTHENTICATION, EMAIL & PROFILE ROUTES =====
app.post('/api/auth/register', register);
app.post('/api/auth/verify-otp', verifyOtp);
app.post('/api/auth/resend-otp', resendOtp);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password', resetPassword);
app.post('/api/auth/login', login);
app.get('/api/auth/me', getMe);
app.put('/api/auth/profile', protect, updateProfile);
app.put('/api/auth/change-password', protect, changePassword);

// ===== 2. ADMIN PORTAL MANAGEMENT ROUTES =====
app.get('/api/admin/stats', protect, requireAdmin, getDashboardStats);
app.get('/api/admin/users', protect, requireAdmin, getAllUsers);
app.put('/api/admin/users/:id/role', protect, requireAdmin, updateUserRole);
app.put('/api/admin/users/:id/company-status', protect, requireAdmin, updateCompanyStatus);
app.delete('/api/admin/users/:id', protect, requireAdmin, deleteUser);
app.get('/api/admin/applications', protect, requireAdmin, getAllApplications);
app.get('/api/admin/analyses', protect, requireAdmin, getAllAnalyses);

// ===== 3. RECRUITMENT APPLICATIONS & HIRING PIPELINE ROUTES =====
app.get('/api/applications/job/:jobId', protect, requireRecruiter, getApplicationsByJob);
app.get('/api/applications/my', protect, async (req, res) => {
  try {
    const candidateId = req.user._id || req.user.id;
    const candidateEmail = req.user.email;
    
    if (getIsConnected()) {
      const applications = await Application.find({
        $or: [{ candidateId }, { candidateEmail }]
      })
      .populate('jobId', 'title company location salary type category')
      .sort({ createdAt: -1 });
      
      return res.json({ success: true, count: applications.length, applications });
    }
    return res.json({ success: true, count: 0, applications: [] });
  } catch (error) {
    console.error('Lỗi nạp đơn ứng tuyển của tôi:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi nạp đơn ứng tuyển' });
  }
});
app.post('/api/applications/screen-cv', protect, requireRecruiter, screenNewCandidate);
app.put('/api/applications/:id/status', protect, requireRecruiter, updateApplicationStatus);

// Cập nhật thông tin hồ sơ doanh nghiệp (HR / Recruiter)
app.put('/api/auth/company-profile', protect, requireRecruiter, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { companyName, companyWebsite, companyAddress, companySize, companyIndustry, companyDescription } = req.body;

    if (getIsConnected()) {
      const User = require('./models/User');
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          companyName,
          companyWebsite,
          companyAddress,
          companySize,
          companyIndustry,
          companyDescription
        },
        { new: true }
      ).select('-passwordHash');

      return res.json({ success: true, user: updatedUser, message: 'Đã cập nhật thông tin doanh nghiệp thành công' });
    }
    res.json({ success: true, message: 'Đã lưu thông tin' });
  } catch (error) {
    console.error('Lỗi cập nhật company profile:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật doanh nghiệp' });
  }
});

// Phân tích mô tả công việc (JD) bằng Gemini 2.5 Flash
app.post('/api/ai/analyze-jd', protect, requireRecruiter, async (req, res) => {
  try {
    const { jdText } = req.body;
    if (!jdText || jdText.trim().length < 15) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung mô tả công việc (tối thiểu 15 ký tự)' });
    }
    const analysis = await analyzeJobDescription(jdText);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Lỗi phân tích JD bằng AI:', error);
    res.status(500).json({ success: false, message: 'Lỗi phân tích JD bằng AI' });
  }
});

// Chuyển trạng thái tin tuyển dụng (active / closed)
app.put('/api/jobs/:id/status', protect, requireRecruiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'closed'
    if (getIsConnected()) {
      const job = await Job.findByIdAndUpdate(
        id,
        { status, isActive: status === 'active' },
        { new: true }
      );
      return res.json({ success: true, job, message: `Đã chuyển trạng thái tin sang: ${status === 'active' ? 'Đang tuyển' : 'Tạm dừng'}` });
    }
    res.json({ success: true, message: 'Đã cập nhật' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái' });
  }
});

// Danh mục ngành nghề tuyển dụng
app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    categories: [
      { id: 'all', name: 'Tất cả ngành nghề' },
      { id: 'it', name: 'Công nghệ thông tin' },
      { id: 'ai-data', name: 'AI & Khoa học Dữ liệu' },
      { id: 'design', name: 'Thiết kế UI/UX' },
      { id: 'marketing', name: 'Marketing & Truyền thông' },
      { id: 'finance', name: 'Tài chính - Ngân hàng' },
      { id: 'hr', name: 'Nhân sự & Vận hành' }
    ]
  });
});

// ===== 4. JOBS & RECRUITMENT ROUTES =====
let mockJobs = [];

// Lấy danh sách việc làm riêng của Nhà tuyển dụng (Multi-tenant isolation)
app.get('/api/recruiter/jobs', protect, requireRecruiter, async (req, res) => {
  try {
    const recruiterId = req.user._id || req.user.id;
    const userCompany = req.user.companyName;
    const userRole = req.user.role;

    if (getIsConnected()) {
      let query = {};
      if (userRole === 'admin') {
        query = {}; // Admin có thể xem toàn bộ
      } else {
        query = {
          $or: [
            { recruiterId },
            ...(userCompany ? [{ company: new RegExp(`^${userCompany.trim()}$`, 'i') }] : [])
          ]
        };
      }

      const jobs = await Job.find(query).sort({ createdAt: -1 });
      const counts = await Application.aggregate([
        { $group: { _id: '$jobId', count: { $sum: 1 } } }
      ]);
      const countMap = {};
      counts.forEach(c => {
        if (c._id) countMap[c._id.toString()] = c.count;
      });

      const jobsWithRealCounts = jobs.map(job => {
        const realCount = countMap[job._id.toString()] || 0;
        const jobObj = job.toObject();
        jobObj.applicantsCount = realCount;
        return jobObj;
      });

      return res.json({ success: true, count: jobsWithRealCounts.length, jobs: jobsWithRealCounts });
    }
    return res.json({ success: true, count: 0, jobs: [] });
  } catch (err) {
    console.error('Lỗi lấy danh sách việc làm của nhà tuyển dụng:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách việc làm tuyển dụng' });
  }
});

// Lấy danh sách việc làm công khai (tính toán chính xác số lượng ứng viên thời gian thực)
app.get('/api/jobs', async (req, res) => {
  try {
    if (getIsConnected()) {
      const dbJobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
      if (dbJobs.length > 0) {
        // Đếm chính xác số lượng hồ sơ nộp thực tế cho từng job từ bảng Application
        const counts = await Application.aggregate([
          { $group: { _id: '$jobId', count: { $sum: 1 } } }
        ]);
        const countMap = {};
        counts.forEach(c => {
          if (c._id) countMap[c._id.toString()] = c.count;
        });

        const jobsWithRealCounts = dbJobs.map(job => {
          const realCount = countMap[job._id.toString()] || 0;
          const jobObj = job.toObject();
          jobObj.applicantsCount = realCount;
          return jobObj;
        });

        return res.json({ success: true, count: jobsWithRealCounts.length, jobs: jobsWithRealCounts });
      }
    }
  } catch (err) {
    console.warn('[Jobs Fetch Warning]:', err.message);
  }
  res.json({ success: true, count: mockJobs.length, jobs: mockJobs });
});

// Gợi ý việc làm phù hợp cho Ứng viên dựa trên năng lực CV
app.post('/api/recommendations/jobs', async (req, res) => {
  try {
    const { skills = [], title = '', experienceYears = 0, cvText = '' } = req.body;
    let allJobs = [];

    if (getIsConnected()) {
      allJobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    } else {
      allJobs = mockJobs;
    }

    if (!allJobs || allJobs.length === 0) {
      return res.json({ success: true, count: 0, recommendations: [] });
    }

    // Lấy số lượng hồ sơ nộp thực tế cho từng job
    let countMap = {};
    if (getIsConnected()) {
      try {
        const counts = await Application.aggregate([
          { $group: { _id: '$jobId', count: { $sum: 1 } } }
        ]);
        counts.forEach(c => {
          if (c._id) countMap[c._id.toString()] = c.count;
        });
      } catch (e) {}
    }

    const candidateSkillsLower = (Array.isArray(skills) ? skills : []).map(s => String(s).toLowerCase().trim());
    const candidateTitleLower = (title || '').toLowerCase();

    const recommendations = allJobs.map(job => {
      const jobObj = typeof job.toObject === 'function' ? job.toObject() : { ...job };
      jobObj.applicantsCount = countMap[jobObj._id?.toString() || jobObj.id] || jobObj.applicantsCount || 0;

      const required = (jobObj.requiredSkills || []).map(s => String(s).toLowerCase().trim());
      const matched = [];
      const missing = [];

      required.forEach(reqSkill => {
        const isMatched = candidateSkillsLower.some(cs => cs.includes(reqSkill) || reqSkill.includes(cs)) ||
                          (cvText && cvText.toLowerCase().includes(reqSkill));
        if (isMatched) {
          matched.push(reqSkill);
        } else {
          missing.push(reqSkill);
        }
      });

      let skillScore = required.length > 0 ? Math.round((matched.length / required.length) * 65) : 45;
      let titleBonus = 0;
      if (candidateTitleLower && jobObj.title.toLowerCase().includes(candidateTitleLower.slice(0, 5))) {
        titleBonus = 20;
      } else {
        titleBonus = 10;
      }
      const matchScore = Math.min(98, Math.max(45, skillScore + titleBonus + 12));

      let matchReason = '';
      if (matchScore >= 80) {
        matchReason = `Hồ sơ của bạn tương thích xuất sắc với vị trí này (${matched.length}/${required.length} kỹ năng trọng yếu).`;
      } else if (matchScore >= 65) {
        matchReason = `Năng lực phù hợp tốt với yêu cầu (${matched.slice(0, 3).join(', ') || 'kinh nghiệm liên quan'}). Cần bổ sung thêm: ${missing.slice(0, 2).join(', ')}.`;
      } else {
        matchReason = `Vị trí tiềm năng giúp mở rộng năng lực. Đã đáp ứng một số tiêu chí cơ bản của nhà tuyển dụng.`;
      }

      return {
        job: jobObj,
        matchScore,
        matchedSkills: matched,
        missingSkills: missing,
        matchReason
      };
    });

    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ success: true, count: recommendations.length, recommendations });
  } catch (err) {
    console.error('Lỗi recommendations/jobs:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi khi gợi ý việc làm' });
  }
});

// Gợi ý ứng viên tiềm năng cho Nhà tuyển dụng theo Job
app.get('/api/recommendations/candidates/:jobId', protect, requireRecruiter, async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!getIsConnected()) {
      return res.json({ success: true, count: 0, candidates: [] });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công việc' });
    }

    const analyses = await CVAnalysis.find()
      .sort({ createdAt: -1 })
      .limit(15);

    const requiredSkills = (job.requiredSkills || []).map(s => String(s).toLowerCase().trim());

    const recommendedCandidates = analyses.map(analysis => {
      const candSkills = (analysis.technicalSkills || []).concat(analysis.toolsAndFrameworks || []).map(s => String(s).toLowerCase().trim());
      const matched = requiredSkills.filter(rs => candSkills.some(cs => cs.includes(rs) || rs.includes(cs)));
      const score = Math.min(97, Math.max(55, Math.round((matched.length / (requiredSkills.length || 1)) * 60) + 36));

      return {
        id: analysis._id,
        fullName: analysis.candidateName || 'Ứng viên tiềm năng',
        email: analysis.candidateEmail || '',
        title: analysis.detectedTitle || 'Kỹ sư phần mềm',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(analysis.candidateName || 'candidate')}`,
        overallScore: analysis.overallScore || 80,
        matchScore: score,
        matchedSkills: matched,
        summary: analysis.summary || '',
        strengths: analysis.strengths || []
      };
    });

    recommendedCandidates.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ success: true, count: recommendedCandidates.length, candidates: recommendedCandidates });
  } catch (err) {
    console.error('Lỗi recommendations/candidates:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi khi gợi ý ứng viên' });
  }
});

// Thêm tin việc làm mới (Nhà tuyển dụng hoặc Quản trị viên)
app.post('/api/jobs', protect, requireRecruiter, async (req, res) => {
  try {
    const { title, company, location, salary, type, experience, description, requiredSkills, category } = req.body;
    const recruiterId = req.user?._id || req.user?.id;
    const resolvedCompany = req.user?.companyName || company || "Doanh nghiệp tuyển dụng";
    
    if (getIsConnected()) {
      try {
        const newJob = new Job({
          title: title || "Kỹ sư phần mềm",
          company: resolvedCompany,
          location: location || "Toàn quốc",
          salary: salary || "Thỏa thuận",
          type: type || "Toàn thời gian",
          category: category || "it",
          experience: experience || "1+ năm kinh nghiệm",
          description: description || "Mô tả yêu cầu công việc chi tiết...",
          requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills ? requiredSkills.split(',').map(s => s.trim()) : ["Kỹ năng chuyên môn"]),
          recruiterId,
          applicantsCount: 0,
          status: 'active',
          isActive: true
        });
        await newJob.save();
        return res.status(201).json({ success: true, job: newJob });
      } catch (dbErr) {
        console.warn('DB Job create error, using fallback:', dbErr.message);
      }
    }

    const fallbackJob = {
      id: `job-${Date.now()}`,
      title: title || "Tuyển dụng kỹ sư",
      company: company || "Doanh nghiệp tuyển dụng",
      location: location || "Toàn quốc",
      salary: salary || "Thỏa thuận",
      type: type || "Toàn thời gian",
      category: category || "it",
      experience: experience || "1+ năm",
      description: description || "Mô tả công việc chi tiết...",
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : ["Kỹ năng chuyên môn"],
      applicantsCount: 0,
      postedAt: "Vừa xong"
    };
    mockJobs.unshift(fallbackJob);
    res.status(201).json({ success: true, job: fallbackJob });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tạo tin tuyển dụng' });
  }
});

// Xóa tin tuyển dụng (Admin)
app.delete('/api/jobs/:id', protect, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (getIsConnected()) {
      try {
        await Job.findByIdAndDelete(id);
        return res.json({ success: true, message: 'Đã xóa tin tuyển dụng thành công' });
      } catch (e) {}
    }
    mockJobs = mockJobs.filter(j => j.id !== id && j._id !== id);
    res.json({ success: true, message: 'Đã xóa tin tuyển dụng' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa tin' });
  }
});

// ===== 4. AI CV PARSING & MATCHING ROUTES =====
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Phân tích CV qua Text hoặc Upload file (PDF / Word .docx)
app.post('/api/cv/analyze', upload.single('cvFile'), async (req, res) => {
  try {
    let cvText = req.body.cvText || '';
    const { userId, candidateEmail, candidateName } = req.body;

    // Nếu có file upload thì bóc tách text theo định dạng (PDF hoặc Word .docx)
    if (req.file) {
      const originalName = (req.file.originalname || '').toLowerCase();
      const mimeType = req.file.mimetype || '';

      try {
        if (originalName.endsWith('.docx') || mimeType.includes('wordprocessingml')) {
          const mammothResult = await mammoth.extractRawText({ buffer: req.file.buffer });
          cvText = mammothResult.value ? mammothResult.value.trim() : '';
        } else if (originalName.endsWith('.pdf') || mimeType === 'application/pdf') {
          const parsed = await pdfParse(req.file.buffer);
          cvText = parsed.text ? parsed.text.trim() : '';
        } else if (originalName.endsWith('.doc') || mimeType.includes('msword')) {
          try {
            const mammothResult = await mammoth.extractRawText({ buffer: req.file.buffer });
            cvText = mammothResult.value ? mammothResult.value.trim() : '';
          } catch (docErr) {
            return res.status(400).json({
              success: false,
              message: 'Tệp .doc định dạng cũ (Word 97-2003) không thể đọc trực tiếp. Vui lòng lưu tệp thành định dạng .docx (Word hiện đại) hoặc xuất sang PDF để hệ thống phân tích.'
            });
          }
        } else {
          // Thử trích xuất bằng mammoth trước, sau đó tới pdf-parse, cuối cùng là utf-8
          try {
            const mammothResult = await mammoth.extractRawText({ buffer: req.file.buffer });
            if (mammothResult.value && mammothResult.value.trim().length > 20) {
              cvText = mammothResult.value.trim();
            } else {
              const parsed = await pdfParse(req.file.buffer);
              cvText = parsed.text ? parsed.text.trim() : '';
            }
          } catch {
            cvText = req.file.buffer.toString('utf-8');
          }
        }
      } catch (parseErr) {
        console.warn("Lỗi trích xuất tệp CV:", parseErr.message);
        return res.status(400).json({
          success: false,
          message: `Không thể đọc nội dung tệp "${req.file.originalname}". Chi tiết lỗi: ${parseErr.message}`
        });
      }
    }

    if (!cvText || cvText.trim().length < 15) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy nội dung văn bản hợp lệ trong tệp CV tải lên. Vui lòng kiểm tra lại tệp PDF hoặc Word (đảm bảo văn bản không phải là hình scan ảnh chụp) hoặc dán trực tiếp nội dung CV vào ô nhập liệu.'
      });
    }

    const analysisResult = await parseAndAnalyzeCV(cvText);

    // Lưu kết quả phân tích vào MongoDB nếu cơ sở dữ liệu đang hoạt động
    let savedAnalysisId = null;
    if (getIsConnected()) {
      try {
        const newAnalysis = new CVAnalysis({
          userId: userId || null,
          candidateName: candidateName || analysisResult.candidateName || 'Ứng viên',
          candidateEmail: candidateEmail || '',
          detectedTitle: analysisResult.detectedTitle || 'Chuyên viên',
          overallScore: analysisResult.overallScore || 80,
          scores: analysisResult.scores || {},
          strengths: analysisResult.strengths || [],
          weaknesses: analysisResult.weaknesses || [],
          improvements: analysisResult.improvements || [],
          technicalSkills: analysisResult.technicalSkills || [],
          softSkills: analysisResult.softSkills || [],
          summary: analysisResult.summary || '',
          recommendedRoles: analysisResult.recommendedRoles || [],
          rawCvText: cvText.slice(0, 3000)
        });
        const saved = await newAnalysis.save();
        savedAnalysisId = saved._id;
      } catch (saveErr) {
        console.warn('Lỗi lưu lịch sử CV vào DB:', saveErr.message);
      }
    }

    res.json({
      success: true,
      analysis: analysisResult,
      analysisId: savedAnalysisId,
      extractedText: cvText,
      rawTextLength: cvText.length
    });
  } catch (error) {
    console.error("Lỗi phân tích CV:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy lịch sử phân tích CV của người dùng
app.get('/api/cv/history', async (req, res) => {
  try {
    const { userId, email } = req.query;
    if (getIsConnected()) {
      const query = {};
      if (userId) query.userId = userId;
      else if (email) query.candidateEmail = email;

      const history = await CVAnalysis.find(query)
        .sort({ createdAt: -1 })
        .limit(20);
      return res.json({ success: true, history });
    }
    res.json({ success: true, history: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy lịch sử CV' });
  }
});

// Gửi báo cáo đánh giá CV chi tiết về Email
app.post('/api/cv/send-email-report', async (req, res) => {
  try {
    const { email, candidateName, reportData } = req.body;
    if (!email || !reportData) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email nhận và dữ liệu đánh giá' });
    }

    const emailResult = await sendAnalysisReportEmail(email, candidateName, reportData);
    res.json({
      success: true,
      message: 'Báo cáo đánh giá năng lực CV đã được gửi thành công đến hộp thư của bạn!',
      details: emailResult
    });
  } catch (error) {
    console.error("Lỗi gửi email báo cáo:", error);
    res.status(500).json({ success: false, message: 'Không thể gửi email lúc này. Vui lòng thử lại sau.' });
  }
});

// Chấm điểm mức độ phù hợp giữa CV và JD (Matching Score)
app.post('/api/match/evaluate', async (req, res) => {
  try {
    const { cvText, jobDescription } = req.body;
    if (!cvText || !jobDescription) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp cả nội dung CV và bản mô tả JD" });
    }

    const matchResult = await matchCVWithJob(cvText, jobDescription);
    res.json({
      success: true,
      result: matchResult
    });
  } catch (error) {
    console.error("Lỗi đánh giá Matching:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// AI sinh câu hỏi phỏng vấn theo hồ sơ ứng viên
app.post('/api/interview/generate', async (req, res) => {
  try {
    const { cvText, jobDescription } = req.body;
    const questions = await generateInterviewQuestions(cvText, jobDescription);
    res.json({
      success: true,
      questions
    });
  } catch (error) {
    console.error("Lỗi tạo câu hỏi phỏng vấn:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== 5. APPLICATIONS (ỨNG TUYỂN) =====
app.post('/api/applications/apply', async (req, res) => {
  try {
    const { 
      jobId, 
      candidateId, 
      candidateName, 
      candidateEmail, 
      candidatePhone, 
      cvSnippet, 
      cvAnalysisId, 
      matchScore, 
      matchingDetails, 
      notes 
    } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin vị trí ứng tuyển (jobId)' });
    }

    if (getIsConnected()) {
      try {
        const application = new Application({
          jobId,
          candidateId: candidateId || null,
          candidateName: candidateName || 'Ứng viên',
          candidateEmail: candidateEmail || '',
          candidatePhone: candidatePhone || '',
          cvSnippet: cvSnippet || '',
          cvAnalysisId: cvAnalysisId || null,
          matchScore: matchScore || 75,
          matchingDetails: matchingDetails || {},
          notes: notes || '',
          status: 'applied'
        });
        await application.save();

        // Tăng applicantsCount cho Job
        await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
        return res.status(201).json({ success: true, message: 'Hồ sơ đã được nộp thành công đến Nhà Tuyển Dụng!', application });
      } catch (e) {
        console.warn('Lỗi lưu Application:', e.message);
      }
    }

    res.status(201).json({ success: true, message: 'Hồ sơ ứng tuyển đã được ghi nhận!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi ứng tuyển: ' + error.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '2.0.0',
    service: 'SmartRecruit AI Enterprise Engine',
    database: getIsConnected() ? 'MongoDB Connected' : 'Standby / Fallback',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SmartRecruit AI Enterprise Server running on http://localhost:${PORT}`);
});
