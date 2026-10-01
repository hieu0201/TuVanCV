const Application = require('../models/Application');
const Job = require('../models/Job');
const { matchCVWithJob, parseAndAnalyzeCV } = require('../services/aiService');
const { 
  sendInterviewInvitationEmail, 
  sendHiringOfferEmail, 
  sendRejectionEmail 
} = require('../services/emailService');
const { getIsConnected } = require('../config/db');

/**
 * 1. Lấy danh sách hồ sơ ứng tuyển của một Job cụ thể
 */
async function getApplicationsByJob(req, res) {
  try {
    const { jobId } = req.params;
    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role;
    const userCompany = req.user?.companyName;

    if (getIsConnected()) {
      try {
        const job = await Job.findById(jobId);
        if (!job) {
          return res.status(404).json({ success: false, message: 'Không tìm thấy vị trí tuyển dụng này' });
        }

        // Kiểm tra quyền: Nhà tuyển dụng chỉ xem được hồ sơ nộp vào tin của chính mình hoặc cùng công ty
        if (userRole === 'recruiter') {
          const isOwner = (job.recruiterId && String(job.recruiterId) === String(userId)) ||
                          (userCompany && job.company && job.company.toLowerCase().trim() === userCompany.toLowerCase().trim());
          if (!isOwner) {
            return res.status(403).json({ 
              success: false, 
              message: 'Bảo mật thông tin: Bạn chỉ được phép xem hồ sơ ứng tuyển nộp vào tin tuyển dụng của công ty bạn.' 
            });
          }
        }

        const applications = await Application.find({ jobId })
          .sort({ matchScore: -1, createdAt: -1 })
          .populate('candidateId', 'fullName email phone avatar title experienceYears');
        return res.json({ success: true, count: applications.length, applications });
      } catch (e) {
        console.warn('Lỗi query Applications:', e.message);
      }
    }
    res.json({ success: true, count: 0, applications: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách ứng viên' });
  }
}

/**
 * 2. HR thêm hồ sơ ứng viên trực tiếp để AI chấm điểm và đưa vào Pipeline tuyển dụng
 */
async function screenNewCandidate(req, res) {
  try {
    const { jobId, cvText, candidateName, candidateEmail, candidatePhone } = req.body;
    if (!jobId || !cvText) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã công việc và nội dung CV' });
    }

    let job = null;
    if (getIsConnected()) {
      job = await Job.findById(jobId);
    }
    const jdText = job ? job.description : "Yêu cầu công việc kỹ sư phần mềm";
    const jobTitle = job ? job.title : "Kỹ sư phần mềm";
    const company = job ? job.company : "Doanh nghiệp tuyển dụng";

    // 1. Phân tích nội dung CV bằng Gemini 2.5 Flash
    const analysis = await parseAndAnalyzeCV(cvText);
    // 2. Chấm điểm tương thích với JD
    const match = await matchCVWithJob(cvText, jdText);

    const detectedName = candidateName || analysis.candidateInfo?.fullName || 'Ứng viên mới';
    const detectedEmail = candidateEmail || analysis.candidateInfo?.email || 'ungvien@example.com';
    const detectedPhone = candidatePhone || analysis.candidateInfo?.phone || '';

    let applicationRecord = null;
    if (getIsConnected()) {
      try {
        const app = new Application({
          jobId,
          candidateName: detectedName,
          candidateEmail: detectedEmail,
          candidatePhone: detectedPhone,
          cvSnippet: cvText.slice(0, 500),
          matchScore: match.matchScore || analysis.atsScore || 75,
          verdict: match.verdict || 'Phù hợp',
          matchingDetails: {
            skillsMatch: match.scoreBreakdown?.skillsMatch || 80,
            experienceMatch: match.scoreBreakdown?.experienceMatch || 75,
            matchedSkills: match.matchedSkills || analysis.skills?.technicalSkills || [],
            missingSkills: match.missingCriticalSkills || [],
            hiringRecommendation: match.recruiterSummary || analysis.overallAssessment || ''
          },
          status: 'applied'
        });
        applicationRecord = await app.save();
        await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
      } catch (e) {
        console.warn('Lỗi lưu Application mới:', e.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `Đã sàng lọc hồ sơ ứng viên ${detectedName} thành công bằng AI!`,
      application: applicationRecord || {
        _id: `app-${Date.now()}`,
        jobId,
        candidateName: detectedName,
        candidateEmail: detectedEmail,
        candidatePhone: detectedPhone,
        cvSnippet: cvText.slice(0, 500),
        matchScore: match.matchScore || 85,
        verdict: match.verdict || 'Rất phù hợp',
        matchingDetails: match,
        status: 'applied',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Lỗi screenNewCandidate:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi sàng lọc ứng viên' });
  }
}

/**
 * 3. HR cập nhật trạng thái tuyển dụng và tự động gửi Email thông báo cho Ứng viên
 */
async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, interviewDetails, offerDetails, notes } = req.body;

    if (!['applied', 'reviewing', 'interviewing', 'hired', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái tuyển dụng không hợp lệ' });
    }

    let application = null;
    let job = null;

    if (getIsConnected()) {
      application = await Application.findById(id).populate('jobId');
      if (application) {
        application.status = status;
        if (notes) application.notes = notes;
        if (interviewDetails) application.interviewDetails = interviewDetails;
        if (offerDetails) application.offerDetails = offerDetails;
        await application.save();
        job = application.jobId;
      }
    }

    const candidateEmail = application ? application.candidateEmail : req.body.candidateEmail;
    const candidateName = application ? application.candidateName : req.body.candidateName;
    const jobTitle = job ? job.title : (req.body.jobTitle || 'Vị trí tuyển dụng');
    const companyName = job ? job.company : (req.body.companyName || 'Doanh nghiệp tuyển dụng');

    // Tự động điều phối gửi Email theo trạng thái
    let emailFeedback = null;
    if (candidateEmail) {
      if (status === 'interviewing' && interviewDetails) {
        emailFeedback = await sendInterviewInvitationEmail(
          candidateEmail, 
          candidateName, 
          jobTitle, 
          companyName, 
          interviewDetails
        );
      } else if (status === 'hired') {
        emailFeedback = await sendHiringOfferEmail(
          candidateEmail, 
          candidateName, 
          jobTitle, 
          companyName, 
          offerDetails || {}
        );
      } else if (status === 'rejected') {
        emailFeedback = await sendRejectionEmail(
          candidateEmail, 
          candidateName, 
          jobTitle, 
          companyName
        );
      }
    }

    res.json({
      success: true,
      message: `Đã cập nhật trạng thái thành công: [${status.toUpperCase()}]`,
      application,
      emailDispatched: emailFeedback
    });
  } catch (error) {
    console.error('Lỗi updateApplicationStatus:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái ứng tuyển' });
  }
}

module.exports = {
  getApplicationsByJob,
  screenNewCandidate,
  updateApplicationStatus
};
