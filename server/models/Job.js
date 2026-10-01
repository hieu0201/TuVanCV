const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    default: 'Toàn quốc'
  },
  salary: {
    type: String,
    default: 'Thoả thuận'
  },
  type: {
    type: String,
    default: 'Toàn thời gian'
  },
  experience: {
    type: String,
    default: 'Không yêu cầu'
  },
  description: {
    type: String,
    required: true
  },
  requiredSkills: [{
    type: String
  }],
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  applicantsCount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    default: 'Công nghệ thông tin'
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
