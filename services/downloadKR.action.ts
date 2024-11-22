// import { Course } from '@/lib/models';
// import { generateHTML } from "./KR20GenerateHTML";

// interface CourseData {
//     krValues: Array<{
//         groupedItemAnalysisResults: any;
//         KR_20: number;
//         segregatedGradedStudents: any;
//     }>;
//     collegeId: any;
// }

// export async function downloadKRValues(courseId: string) {
//     try {
        
//         const courseData = await Course.findById(courseId)
//             .populate('krValues')
//             .populate('collegeId')
//             .lean().exec() as unknown as CourseData;

//         if (!courseData?.krValues?.length) {
//             throw new Error('No KR values found for this course');
//         }

//         // Get the latest KR value
//         const latestKR = courseData.krValues[courseData.krValues.length - 1];

//         const data = {
//             groupedItemAnalysisResults: latestKR.groupedItemAnalysisResults,
//             KR_20: latestKR.KR_20,
//             segregatedGradedStudents: latestKR.segregatedGradedStudents,
//             course: courseData,
//             collegeInfo: courseData.collegeId
//         };

//         const htmlContent = generateHTML(data);
//         return { success: true, htmlContent };

//     } catch (error) {
//         console.error('Error downloading KR values:', error);
//         return { success: false, error: 'Failed to download KR values' };
//     }
// } 