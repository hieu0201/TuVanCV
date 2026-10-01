const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['candidate', 'recruiter', 'admin'],
    default: 'candidate'
  },
  title: {
    type: String,
    default: 'Thành viên mới'
  },
  experienceYears: {
    type: String,
    default: 'Chưa cập nhật'
  },
  phone: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  // Dành cho Nhà tuyển dụng (Recruiter)
  companyName: {
    type: String,
    default: ''
  },
  companyWebsite: {
    type: String,
    default: ''
  },
  companyAddress: {
    type: String,
    default: ''
  },
  companySize: {
    type: String,
    default: '50-150 nhân sự'
  },
  companyIndustry: {
    type: String,
    default: 'Công nghệ thông tin'
  },
  companyDescription: {
    type: String,
    default: ''
  },
  companyStatus: {
    type: String,
    enum: ['pending', 'verified', 'suspended'],
    default: 'verified' // Mặc định duyệt để dùng ngay
  },
  // Dành cho Ứng viên (Candidate)
  skills: [{
    type: String
  }],
  portfolioUrl: {
    type: String,
    default: ''
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailOtp: {
    type: String,
    default: null
  },
  emailOtpExpires: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
