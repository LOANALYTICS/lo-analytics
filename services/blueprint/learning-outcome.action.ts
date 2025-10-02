'use server'

import { Assessment } from "@/lib/models";
import { revalidatePath } from "next/cache";

interface AssessmentDoc {
    _id: string;
    course: string;
    cloData?: Array<{
        clo: string;
        description: string;
        ploMapping: {
            k: Array<{ [key: string]: boolean }>;
            s: Array<{ [key: string]: boolean }>;
            v: Array<{ [key: string]: boolean }>;
        };
    }>;
}

export async function getCLOData(courseId: string) {
    try {
        const assessment = await Assessment.findOne({ course: courseId }).lean() as unknown as AssessmentDoc;

        if (!assessment) {
            return null;
        }

        // If cloData exists, map it to the required format
        if (assessment.cloData && assessment.cloData.length > 0) {
            return assessment.cloData.map(clo => ({
                clo: clo.clo,
                description: clo.description,
                ploMapping: clo.ploMapping
            }));
        }

        return null;
    } catch (error) {
        console.error('Error fetching CLO data:', error);
        throw new Error('Failed to fetch CLO data');
    }
}

export async function updateCLOData(courseId: string, cloData: Array<{
    clo: string;
    description: string;
    ploMapping: {
        k: Array<{ [key: string]: boolean }>;
        s: Array<{ [key: string]: boolean }>;
        v: Array<{ [key: string]: boolean }>;
    };
}>) {
    try {
        // Transform and normalize CLO keys to stable sequential numbering ("1", "2", ...)
        const transformedCLOData = cloData.map((clo, idx) => ({
            clo: String(idx + 1),
            description: clo.description,
            ploMapping: clo.ploMapping
        }));

        // Update or create assessment with CLO data
        const assessment = await Assessment.findOneAndUpdate(
            { course: courseId },
            { $set: { cloData: transformedCLOData } },
            { new: true, upsert: true }
        ).select('indirectAssessments').lean();

        // Sync indirect assessments with updated CLO data
        if (assessment) {
            const existingIndirect = (assessment as any).indirectAssessments || [];
            const existingIndirectMap = new Map();
            
            // Map existing indirect assessments by CLO name
            existingIndirect.forEach((indirect: any) => {
                existingIndirectMap.set(indirect.clo, indirect);
            });

            // Create updated indirect assessments array
            const updatedIndirectAssessments = transformedCLOData.map((cloItem, index) => {
                // Try to match by CLO name first
                let existing = existingIndirectMap.get(cloItem.clo);
                
                // If no match by name, try to match by position/index
                if (!existing && existingIndirect[index]) {
                    existing = existingIndirect[index];
                }
                
                if (existing) {
                    return {
                        ...existing,
                        clo: cloItem.clo // Update to new CLO name
                    };
                } else {
                    // Create new empty indirect assessment
                    return {
                        clo: cloItem.clo,
                        achievementRate: 0,
                        benchmark: '80',
                        achievementPercentage: 0
                    };
                }
            });

            // Update the assessment with synced indirect assessments
            await Assessment.findOneAndUpdate(
                { course: courseId },
                { $set: { indirectAssessments: updatedIndirectAssessments } },
                { new: true }
            );
        }

        if (!assessment) {
            throw new Error('Failed to update CLO data');
        }

        revalidatePath('/dashboard/learning-outcomes/clo-mapping/[courseId]');

        return {
            success: true,
            message: 'CLO data updated successfully',
            data: JSON.parse(JSON.stringify(assessment))
        };
    } catch (error) {
        console.error('Error updating CLO data:', error);
        throw new Error('Failed to update CLO data');
    }
}
