import mongoose from 'mongoose';
import { IUser, userSchema } from '@/server/models/user.model';
import { ICollage, collageSchema } from '@/server/models/collage.model';
import { ICourse, courseSchema } from '@/server/models/course.model';
import { IKRValue, krValueSchema } from '@/server/models/kr-value.model';
import  { IQuestionBank, questionBankSchema } from '@/server/models/questionBank.model';
import { IQuestion, questionSchema } from '@/server/models/question.model';
import { IQuestionPaper, questionPaperSchema } from '@/server/models/questionPaper.model';
import { IAssessment, assessmentSchema } from '@/server/models/assessment.model';

// Ensure models are registered only once
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const Collage = mongoose.models.Collage || mongoose.model<ICollage>('Collage', collageSchema);
export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);
export const KRValue = mongoose.models.KRValue || mongoose.model<IKRValue>('KRValue', krValueSchema);
export const QuestionBank = mongoose.models.QuestionBank || mongoose.model<IQuestionBank>('QuestionBank', questionBankSchema);
export const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', questionSchema);
export const QuestionPaper = mongoose.models.QuestionPaper || mongoose.model<IQuestionPaper>('QuestionPaper', questionPaperSchema);
export const Assessment = mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', assessmentSchema);

// Type-safe model exports
export type UserModel = mongoose.Model<IUser>;
export type CollageModel = mongoose.Model<ICollage>;
export type CourseModel = mongoose.Model<ICourse>;
export type KRValueModel = mongoose.Model<IKRValue>;
export type QuestionBankModel = mongoose.Model<IQuestionBank>;
export type QuestionModel = mongoose.Model<IQuestion>;
export type QuestionPaperModel = mongoose.Model<IQuestionPaper>;
export type AssessmentModel = mongoose.Model<IAssessment>; 