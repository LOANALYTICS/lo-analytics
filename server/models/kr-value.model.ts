import mongoose from 'mongoose';

const krValueSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  KR_20: {
    type: Number,
    required: true
  },
  groupedItemAnalysisResults: [{
    classification: String,
    questions: [{
      question: String,
      // Add other question fields if needed
    }]
  }],
  gradeDistribution: [{
    grade: String,
    count: Number,
    studentPercentage: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const KRValueModel = mongoose.models.KRValue || mongoose.model('KRValue', krValueSchema);
export default KRValueModel; 