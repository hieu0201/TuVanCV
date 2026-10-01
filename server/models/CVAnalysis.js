const mongoose = require('mongoose');

const cvAnalysisSchema = new mongoose.Schema({
  userId: {
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
  detectedTitle: {
    type: String,
    default: 'Chuyên viên'
  },
  overallScore: {
    type: Number,
    required: true
  },
  scores: {
    technical: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    education: { type: Number, default: 0 },
    presentation: { type: Number, default: 0 },
    atsCompatibility: { type: Number, default: 0 }
  },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  improvements: [{ type: String }],
  technicalSkills: [{ type: String }],
  softSkills: [{ type: String }],
  summary: { type: String, default: '' },
  recommendedRoles: [{ type: String }],
  rawCvText: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('CVAnalysis', cvAnalysisSchema);
