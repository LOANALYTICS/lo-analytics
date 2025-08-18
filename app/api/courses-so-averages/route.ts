import { connectToMongoDB } from "@/lib/db";
import { Assessment, Course } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";
import { IAssessment } from "@/server/models/assessment.model";
import { generateGradeDistributionHTML } from "@/templates/grade-distribution-report";

interface CourseData {
    _id: string;
    course_name: string;
    course_code: string;
    level: number;
    department: string;
}

interface GradeData {
    value: number;
    percentage: number;
}

interface GradeDistribution {
    'A': GradeData;
    'B': GradeData;
    'C': GradeData;
    'D': GradeData;
    'F': GradeData;
}

interface CourseSOAverage {
    _id: string;
    course_name: string;
    course_code: string;
    level: number;
    department: string;
    grades: GradeDistribution;
    totalStudents: number;
}

interface GroupTotal {
    totalStudents: number;
    grades: GradeDistribution;
}

interface LevelGroup {
    level: number;
    courses: CourseSOAverage[];
    total: GroupTotal;
    overall: {
        totalPassing: number;
        totalFailing: number;
        overallPassPercentage: string;
        overallFailPercentage: string;
    };
}

interface DepartmentGroup {
    department: string;
    courses: CourseSOAverage[];
    total: GroupTotal;
    overall: {
        totalPassing: number;
        totalFailing: number;
        overallPassPercentage: string;
        overallFailPercentage: string;
    };
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectToMongoDB();

        const { searchParams } = new URL(request.url);
        const academic_year = searchParams.get('academic_year');
        const semester = searchParams.get('semester');
        const section = searchParams.get('section');

        if (!academic_year || !semester || !section) {
            return NextResponse.json({
                message: 'academic_year, semester, and section are required'
            }, { status: 400 });
        }

        // Build the filter query
        let filterQuery: any = {
            semister: parseInt(semester),
            academic_year: academic_year,
            examType: "final"
        };

        // Handle section filtering
        if (section === 'all') {
            filterQuery.section = { $in: ['male', 'female'] };
        } else {
            filterQuery.section = section;
        }

        // Get courses
        const courses = await Course.find(filterQuery)
            .select('course_name course_code _id level department')
            .lean() as unknown as CourseData[];

        if (!courses.length) {
            return new NextResponse(`
                <html>
                    <body>
                        <h1>No Data Found</h1>
                        <p>No courses found for the given criteria:</p>
                        <ul>
                            <li>Academic Year: ${academic_year}</li>
                            <li>Semester: ${semester}</li>
                            <li>Section: ${section}</li>
                        </ul>
                    </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html' }
            });
        }

        // Process each course to get SO averages
        const coursesSOAverages = await Promise.all(
            courses.map(async (course): Promise<CourseSOAverage> => {
                const assessment = await Assessment.findOne({ course: course._id })
                    .select('assessmentResults')
                    .lean() as unknown as IAssessment;

                // Initialize grade counts
                const gradeCounts = {
                    'A': 0,
                    'B': 0,
                    'C': 0,
                    'D': 0,
                    'F': 0
                };

                if (!assessment || !assessment.assessmentResults) {
                    const grades: GradeDistribution = {
                        'A': { value: 0, percentage: 0 },
                        'B': { value: 0, percentage: 0 },
                        'C': { value: 0, percentage: 0 },
                        'D': { value: 0, percentage: 0 },
                        'F': { value: 0, percentage: 0 }
                    };

                    return {
                        _id: course._id,
                        course_name: course.course_name,
                        course_code: course.course_code,
                        level: course.level,
                        department: course.department,
                        grades,
                        totalStudents: 0
                    };
                }

                // Calculate overall grades for students
                const overallScores = new Map<string, { scored: number, total: number }>();

                assessment.assessmentResults.forEach(result => {
                    result.results.forEach(({ studentId, studentName, totalScore }) => {
                        const actualStudentId = /^\d+$/.test(studentId) ? studentId : studentName;
                        const current = overallScores.get(actualStudentId) || { scored: 0, total: 0 };
                        overallScores.set(actualStudentId, {
                            scored: current.scored + totalScore.marksScored,
                            total: current.total + totalScore.totalMarks
                        });
                    });
                });

                // Calculate grade distribution
                overallScores.forEach((scores) => {
                    const percentage = (scores.scored / scores.total) * 100;
                    if (percentage >= 90) gradeCounts['A']++;
                    else if (percentage >= 80) gradeCounts['B']++;
                    else if (percentage >= 70) gradeCounts['C']++;
                    else if (percentage >= 60) gradeCounts['D']++;
                    else gradeCounts['F']++;
                });

                const totalStudents = overallScores.size;
                const grades: GradeDistribution = {
                    'A': {
                        value: gradeCounts['A'],
                        percentage: totalStudents > 0 ? Number(((gradeCounts['A'] / totalStudents) * 100).toFixed(2)) : 0
                    },
                    'B': {
                        value: gradeCounts['B'],
                        percentage: totalStudents > 0 ? Number(((gradeCounts['B'] / totalStudents) * 100).toFixed(2)) : 0
                    },
                    'C': {
                        value: gradeCounts['C'],
                        percentage: totalStudents > 0 ? Number(((gradeCounts['C'] / totalStudents) * 100).toFixed(2)) : 0
                    },
                    'D': {
                        value: gradeCounts['D'],
                        percentage: totalStudents > 0 ? Number(((gradeCounts['D'] / totalStudents) * 100).toFixed(2)) : 0
                    },
                    'F': {
                        value: gradeCounts['F'],
                        percentage: totalStudents > 0 ? Number(((gradeCounts['F'] / totalStudents) * 100).toFixed(2)) : 0
                    }
                };

                return {
                    _id: course._id,
                    course_name: course.course_name,
                    course_code: course.course_code,
                    level: course.level,
                    department: course.department,
                    grades,
                    totalStudents
                };
            })
        );

        // Helper function to calculate group totals
        const calculateGroupTotal = (courses: CourseSOAverage[]): GroupTotal => {
            const totalCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
            let totalStudents = 0;

            courses.forEach(course => {
                totalCounts.A += course.grades.A.value;
                totalCounts.B += course.grades.B.value;
                totalCounts.C += course.grades.C.value;
                totalCounts.D += course.grades.D.value;
                totalCounts.F += course.grades.F.value;
                totalStudents += course.totalStudents;
            });

            return {
                totalStudents,
                grades: {
                    A: {
                        value: totalCounts.A,
                        percentage: totalStudents > 0 ? Number(((totalCounts.A / totalStudents) * 100).toFixed(2)) : 0
                    },
                    B: {
                        value: totalCounts.B,
                        percentage: totalStudents > 0 ? Number(((totalCounts.B / totalStudents) * 100).toFixed(2)) : 0
                    },
                    C: {
                        value: totalCounts.C,
                        percentage: totalStudents > 0 ? Number(((totalCounts.C / totalStudents) * 100).toFixed(2)) : 0
                    },
                    D: {
                        value: totalCounts.D,
                        percentage: totalStudents > 0 ? Number(((totalCounts.D / totalStudents) * 100).toFixed(2)) : 0
                    },
                    F: {
                        value: totalCounts.F,
                        percentage: totalStudents > 0 ? Number(((totalCounts.F / totalStudents) * 100).toFixed(2)) : 0
                    }
                }
            };
        };

        // Group by level
        const levelGroups = new Map<number, CourseSOAverage[]>();
        coursesSOAverages.forEach(course => {
            if (!levelGroups.has(course.level)) {
                levelGroups.set(course.level, []);
            }
            levelGroups.get(course.level)!.push(course);
        });

        const levelGroupsData: LevelGroup[] = Array.from(levelGroups.entries())
            .sort(([a], [b]) => a - b)
            .map(([level, courses]) => {
                const total = calculateGroupTotal(courses);
                const totalPassing = total.grades.A.value + total.grades.B.value + total.grades.C.value + total.grades.D.value;
                const totalFailing = total.grades.F.value;
                const overallPassPercentage = total.totalStudents > 0 ?
                    ((totalPassing / total.totalStudents) * 100).toFixed(1) : '0.0';
                const overallFailPercentage = total.totalStudents > 0 ?
                    ((totalFailing / total.totalStudents) * 100).toFixed(1) : '0.0';

                return {
                    level,
                    courses: courses.sort((a, b) => a.course_name.localeCompare(b.course_name)),
                    total,
                    overall: {
                        totalPassing,
                        totalFailing,
                        overallPassPercentage,
                        overallFailPercentage
                    }
                };
            });

        // Group by department
        const departmentGroups = new Map<string, CourseSOAverage[]>();
        coursesSOAverages.forEach(course => {
            if (!departmentGroups.has(course.department)) {
                departmentGroups.set(course.department, []);
            }
            departmentGroups.get(course.department)!.push(course);
        });

        const departmentGroupsData: DepartmentGroup[] = Array.from(departmentGroups.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([department, courses]) => {
                const total = calculateGroupTotal(courses);
                const totalPassing = total.grades.A.value + total.grades.B.value + total.grades.C.value + total.grades.D.value;
                const totalFailing = total.grades.F.value;
                const overallPassPercentage = total.totalStudents > 0 ?
                    ((totalPassing / total.totalStudents) * 100).toFixed(1) : '0.0';
                const overallFailPercentage = total.totalStudents > 0 ?
                    ((totalFailing / total.totalStudents) * 100).toFixed(1) : '0.0';

                return {
                    department,
                    courses: courses.sort((a, b) => a.course_name.localeCompare(b.course_name)),
                    total,
                    overall: {
                        totalPassing,
                        totalFailing,
                        overallPassPercentage,
                        overallFailPercentage
                    }
                };
            });

        // Calculate level summary
        const levelSummaryTotals = { A: 0, B: 0, C: 0, D: 0, F: 0, totalStudents: 0 };
        levelGroupsData.forEach(level => {
            levelSummaryTotals.A += level.total.grades.A.value;
            levelSummaryTotals.B += level.total.grades.B.value;
            levelSummaryTotals.C += level.total.grades.C.value;
            levelSummaryTotals.D += level.total.grades.D.value;
            levelSummaryTotals.F += level.total.grades.F.value;
            levelSummaryTotals.totalStudents += level.total.totalStudents;
        });
        const levelOverallPassing = levelSummaryTotals.A + levelSummaryTotals.B + levelSummaryTotals.C + levelSummaryTotals.D;
        const levelOverallPassPercentage = levelSummaryTotals.totalStudents > 0 ?
            ((levelOverallPassing / levelSummaryTotals.totalStudents) * 100).toFixed(1) : '0.0';
        const levelOverallFailPercentage = levelSummaryTotals.totalStudents > 0 ?
            ((levelSummaryTotals.F / levelSummaryTotals.totalStudents) * 100).toFixed(1) : '0.0';

        // Calculate department summary
        const departmentSummaryTotals = { A: 0, B: 0, C: 0, D: 0, F: 0, totalStudents: 0 };
        departmentGroupsData.forEach(dept => {
            departmentSummaryTotals.A += dept.total.grades.A.value;
            departmentSummaryTotals.B += dept.total.grades.B.value;
            departmentSummaryTotals.C += dept.total.grades.C.value;
            departmentSummaryTotals.D += dept.total.grades.D.value;
            departmentSummaryTotals.F += dept.total.grades.F.value;
            departmentSummaryTotals.totalStudents += dept.total.totalStudents;
        });
        const departmentOverallPassing = departmentSummaryTotals.A + departmentSummaryTotals.B + departmentSummaryTotals.C + departmentSummaryTotals.D;
        const departmentOverallPassPercentage = departmentSummaryTotals.totalStudents > 0 ?
            ((departmentOverallPassing / departmentSummaryTotals.totalStudents) * 100).toFixed(1) : '0.0';
        const departmentOverallFailPercentage = departmentSummaryTotals.totalStudents > 0 ?
            ((departmentSummaryTotals.F / departmentSummaryTotals.totalStudents) * 100).toFixed(1) : '0.0';

        // Generate HTML report
        const htmlContent = generateGradeDistributionHTML({
            data: {
                byLevel: levelGroupsData,
                byDepartment: departmentGroupsData,
                levelSummary: {
                    ...levelSummaryTotals,
                    overallPassing: levelOverallPassing,
                    overallPassPercentage: levelOverallPassPercentage,
                    overallFailPercentage: levelOverallFailPercentage
                },
                departmentSummary: {
                    ...departmentSummaryTotals,
                    overallPassing: departmentOverallPassing,
                    overallPassPercentage: departmentOverallPassPercentage,
                    overallFailPercentage: departmentOverallFailPercentage
                }
            },
            academic_year,
            semester: parseInt(semester),
            section,
            college: {
                logo: '/logo.png',
                english: 'College of Dentistry',
                regional: 'كلية طب الأسنان',
                university: 'University Name'
            }
        });

        return new NextResponse(htmlContent, {
            headers: {
                'Content-Type': 'text/html',
            },
        });

    } catch (error) {
        console.error('Error generating grade distribution report:', error);
        return NextResponse.json({
            message: 'Error generating grade distribution report',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}