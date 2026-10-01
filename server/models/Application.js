const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  candidateName: {
    type: String,
    default: 'Ứng viên'
  },
  candidateEmail: {
    type: String,
    default: ''
  },
  candidatePhone: {
    type: String,
    default: ''
  },
  cvAnalysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CVAnalysis',
    default: null
  },
  cvSnippet: {
    type: String,
    default: ''
  },
  matchScore: {
    type: Number,
    default: 75
  },
  verdict: {
    type: String,
    default: 'Phù hợp'
  },
  matchingDetails: {
    skillsMatch: { type: Number, default: 0 },
    experienceMatch: { type: Number, default: 0 },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    hiringRecommendation: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['applied', 'reviewing', 'interviewing', 'hired', 'rejected'],
    default: 'applied'
  },
  interviewDetails: {
    scheduledDate: { type: String, default: '' },
    meetingLink: { type: String, default: '' },
    note: { type: String, default: '' }
  },
  offerDetails: {
    salaryOffer: { type: String, default: '' },
    startDate: { type: String, default: '' },
    note: { type: String, default: '' }
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Application', applicationSchema);
