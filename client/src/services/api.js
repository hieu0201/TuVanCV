const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Lấy token xác thực từ localStorage
 */
function getAuthHeader() {
  const token = localStorage.getItem('smartrecruit_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * 1. Phân tích CV qua API Backend
 */
export async function analyzeCV(cvText, cvFile = null, metadata = {}) {
  try {
    if (cvFile) {
      const formData = new FormData();
      formData.append('cvFile', cvFile);
      if (cvText) formData.append('cvText', cvText);
      if (metadata.userId) formData.append('userId', metadata.userId);
      if (metadata.candidateEmail) formData.append('candidateEmail', metadata.candidateEmail);
      if (metadata.candidateName) formData.append('candidateName', metadata.candidateName);

      const response = await fetch(`${API_BASE_URL}/cv/analyze`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
        body: formData,
      });
      return await response.json();
    } else {
      const response = await fetch(`${API_BASE_URL}/cv/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ cvText, ...metadata }),
      });
      return await response.json();
    }
  } catch (err) {
    console.error("API analyzeCV error:", err);
    throw err;
  }
}

/**
 * Lấy lịch sử phân tích CV của người dùng
 */
export async function getCVHistory(userId, email) {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (email) params.append('email', email);

    const response = await fetch(`${API_BASE_URL}/cv/history?${params.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    return await response.json();
  } catch (err) {
    console.error("API getCVHistory error:", err);
    throw err;
  }
}

/**
 * Gửi báo cáo đánh giá CV về email cá nhân
 */
export async function sendCVReportEmail(email, candidateName, reportData) {
  try {
    const response = await fetch(`${API_BASE_URL}/cv/send-email-report`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ email, candidateName, reportData }),
    });
    return await response.json();
  } catch (err) {
    console.error("API sendCVReportEmail error:", err);
    throw err;
  }
}

/**
 * 2. Đánh giá độ phù hợp Matching giữa CV và JD
 */
export async function evaluateMatch(cvText, jobDescription) {
  try {
    const response = await fetch(`${API_BASE_URL}/match/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvText, jobDescription }),
    });
    return await response.json();
  } catch (err) {
    console.error("API evaluateMatch error:", err);
    throw err;
  }
}

/**
 * 3. Sinh bộ câu hỏi phỏng vấn cá nhân hóa
 */
export async function generateInterviewQuestions(cvText, jobDescription) {
  try {
    const response = await fetch(`${API_BASE_URL}/interview/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvText, jobDescription }),
    });
    return await response.json();
  } catch (err) {
    console.error("API generateInterviewQuestions error:", err);
    throw err;
  }
}

/**
 * 4. Lấy danh sách việc làm công khai
 */
export async function getJobs() {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs`);
    return await response.json();
  } catch (err) {
    console.error("API getJobs error:", err);
    throw err;
  }
}

/**
 * Lấy danh sách việc làm riêng của Nhà tuyển dụng (Scoping riêng)
 */
export async function getRecruiterJobs() {
  try {
    const response = await fetch(`${API_BASE_URL}/recruiter/jobs`, {
      headers: { ...getAuthHeader() }
    });
    return await response.json();
  } catch (err) {
    console.error("API getRecruiterJobs error:", err);
    throw err;
  }
}

/**
 * Thêm việc làm mới
 */
export async function createJob(jobData) {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(jobData),
    });
    return await response.json();
  } catch (err) {
    console.error("API createJob error:", err);
    throw err;
  }
}

/**
 * Xóa việc làm
 */
export async function deleteJob(jobId) {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return await response.json();
  } catch (err) {
    console.error("API deleteJob error:", err);
    throw err;
  }
}

/**
 * Ứng tuyển vào vị trí việc làm
 */
export async function applyToJob(applicationData) {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/apply`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(applicationData)
    });
    return await response.json();
  } catch (err) {
    console.error("API applyToJob error:", err);
    throw err;
  }
}

/**
 * 5. AUTHENTICATION & EMAIL
 */
export async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi loginUser:", err);
    throw err;
  }
}

export async function registerUser(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi registerUser:", err);
    throw err;
  }
}

export async function verifyOtp(email, otp) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi verifyOtp:", err);
    throw err;
  }
}

export async function resendOtp(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi resendOtp:", err);
    throw err;
  }
}

export async function forgotPassword(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi forgotPassword:", err);
    throw err;
  }
}

export async function resetPassword(token, newPassword) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi resetPassword:", err);
    throw err;
  }
}

export async function getMeUser(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi getMeUser:", err);
    throw err;
  }
}

/**
 * 6. ADMIN PORTAL APIS
 */
export async function getAdminStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: { ...getAuthHeader() }
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi getAdminStats:", err);
    throw err;
  }
}

export async function getAdminUsers(search = '', role = '') {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);

    const response = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi getAdminUsers:", err);
    throw err;
  }
}

export async function updateAdminUserRole(userId, newRole) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ role: newRole })
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi updateAdminUserRole:", err);
    throw err;
  }
}

export async function deleteAdminUser(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi deleteAdminUser:", err);
    throw err;
  }
}

export async function getAdminAnalyses() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/analyses`, {
      headers: { ...getAuthHeader() }
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi getAdminAnalyses:", err);
    throw err;
  }
}

export async function updateRecruiterCompanyStatus(userId, companyStatus) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/company-status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ companyStatus })
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi updateRecruiterCompanyStatus:", err);
    throw err;
  }
}

export async function getAdminApplications() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/applications`, {
      headers: { ...getAuthHeader() }
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi getAdminApplications:", err);
    throw err;
  }
}

/**
 * 7. USER PROFILE & PASSWORD MANAGEMENT
 */
export async function updateProfile(profileData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(profileData)
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi updateProfile:", err);
    throw err;
  }
}

export async function changePassword(currentPassword, newPassword) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi changePassword:", err);
    throw err;
  }
}

/**
 * 8. RECRUITER CANDIDATE PIPELINE APIS
 */
export async function getApplicationsByJob(jobId) {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/job/${jobId}`, {
      headers: { ...getAuthHeader() }
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi getApplicationsByJob:", err);
    throw err;
  }
}

export async function screenCandidateForJob(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/screen-cv`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi screenCandidateForJob:", err);
    throw err;
  }
}

export async function updateApplicationStatus(id, updateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(updateData)
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi updateApplicationStatus:", err);
    throw err;
  }
}

/**
 * Gợi ý việc làm phù hợp cho ứng viên
 */
export async function getRecommendedJobs(profileData) {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendations/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(profileData)
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi getRecommendedJobs:", err);
    return { success: false, recommendations: [] };
  }
}

/**
 * Gợi ý ứng viên tiềm năng cho nhà tuyển dụng theo Job
 */
export async function getRecommendedCandidates(jobId) {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendations/candidates/${jobId}`, {
      headers: { ...getAuthHeader() }
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi getRecommendedCandidates:", err);
    return { success: false, candidates: [] };
  }
}

/**
 * Phân tích mô tả công việc (JD) bằng Gemini 2.5 Flash
 */
export async function analyzeJobDescription(jdText) {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/analyze-jd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ jdText })
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi analyzeJobDescription:", err);
    throw err;
  }
}

/**
 * Lấy danh sách hồ sơ ứng tuyển của chính ứng viên hiện tại
 */
export async function getMyApplications() {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/my`, {
      headers: { ...getAuthHeader() }
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi getMyApplications:", err);
    return { success: false, applications: [] };
  }
}

/**
 * Cập nhật thông tin hồ sơ doanh nghiệp (HR / Recruiter)
 */
export async function updateCompanyProfile(companyData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/company-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(companyData)
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi updateCompanyProfile:", err);
    throw err;
  }
}

/**
 * Bật/tắt trạng thái tin tuyển dụng (active / closed)
 */
export async function toggleJobStatus(jobId, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status })
    });
    return await response.json();
  } catch (err) {
    console.error("Lỗi toggleJobStatus:", err);
    throw err;
  }
}

/**
 * Lấy danh mục ngành nghề việc làm
 */
export async function getCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    return await response.json();
  } catch (err) {
    console.error("Lỗi getCategories:", err);
    return { success: false, categories: [] };
  }
}



