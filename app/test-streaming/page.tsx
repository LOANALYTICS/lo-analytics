"use client"
import AssessmentCard from '@/components/shared/assessment-table/AssessmentCard';
import StreamingAssessmentCard from '@/components/shared/assessment-table/StreamingAssessmentCard';

// Mock course data for testing
const mockCourse = {
  _id: "your-course-id",
  course_name: "Test Course",
  course_code: "TEST101",
  section: "A",
  examType: "Final",
  semister: 1,
  academic_year: "2024-2025"
};

export default function TestStreamingPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">AI Streaming Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Original (External Server)</h2>
          <p className="text-sm text-gray-600">
            Calls external Render server - may timeout on Vercel
          </p>
          <AssessmentCard 
            href="#" 
            course={mockCourse} 
            standalone={true} 
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Streaming (Vercel AI SDK)</h2>
          <p className="text-sm text-gray-600">
            Uses streaming to bypass 10s timeout - runs on Vercel
          </p>
          <StreamingAssessmentCard 
            href="#" 
            course={mockCourse} 
            standalone={true} 
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "S.O - Report" on the left (External Server approach)</li>
          <li>Click "S.O - Report (Stream)" on the right (Streaming approach)</li>
          <li>Compare which one works better and faster</li>
          <li>Streaming should bypass Vercel's 10s timeout limit</li>
        </ol>
      </div>

      <div className="mt-4 p-4 bg-green-50 rounded-lg">
        <h3 className="font-semibold mb-2">Expected Results:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>External Server:</strong> May work but depends on Render cold starts</li>
          <li><strong>Streaming:</strong> Should work consistently and bypass timeout</li>
          <li><strong>Performance:</strong> Streaming might be faster (no external network call)</li>
          <li><strong>Reliability:</strong> Streaming should be more reliable on Vercel</li>
        </ul>
      </div>
    </div>
  );
}