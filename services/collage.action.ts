"use server"

import { Collage } from "@/lib/models"
import { ICollage, IDepartment } from "@/server/models/collage.model"
import { Types } from "mongoose"




export async function getCollage() {
    const collage = await Collage.find()
    return collage.map((collage:any)=>({
        _id: collage._id.toString(),
        logo:collage.logo,
        english:collage.english,
        regional:collage.regional,
        university:collage.university
    }))
}

export async function createCollage(collage: any) {
    const existingCollage = await Collage.findOne({ 
        english: collage.english,
        university: collage.university // Check for duplicates based on both fields
    });

    if (existingCollage) {
        throw new Error('A collage with this name already exists in the specified university');
    }

    const newCollage = await Collage.create(collage);
    return newCollage ? true : false;
}

export async function addDepartment(collegeId: string, department: { name: string; shortName: string }) {
    await Collage.updateOne(
        { _id: collegeId },
        { $push: { departments: department } }
    );
}

export async function getCollegeById(id: string): Promise<any> {
    try {
        const college = await Collage.findById(id)
            .populate('departments')
            .lean() as ICollage;

        if (!college) {
            throw new Error('College not found');
        }

        return {
            ...college,
            _id: college._id.toString(),
            departments: college.departments ? college.departments.map((dept: IDepartment) => ({
                _id: dept._id.toString(),
                name: dept.name,
                shortName: dept.shortName
            })) : [],
        };
    } catch (error) {
        console.error('Error fetching college:', error);
        throw error;
    }
}

export async function editDepartment(collegeId: string, departmentId: string, updatedDepartment: { name?: string; shortName?: string }) {
    await Collage.updateOne(
        { _id: collegeId, "departments._id": departmentId },
        { $set: { "departments.$": updatedDepartment } }
    );
}

export async function updateCollage(id: string, collage: any) {
    const existingCollage = await Collage.findOne({ 
        english: collage.english,
        university: collage.university,
        _id: { $ne: id } // Exclude current college from duplicate check
    });

    if (existingCollage) {
        throw new Error('A college with this name already exists in the specified university');
    }

    const updatedCollage = await Collage.findByIdAndUpdate(id, collage, { new: true });
    return updatedCollage ? true : false;
}
export async function deleteCollageById(id: string) {
    try {
        await Collage.findByIdAndDelete(id);
        return true
    } catch (error) {
        console.error('Error deleting collage:', error);
        return false
    }
}

export async function deleteDepartmentById(collegeId: string, departmentId: string) {
    try {
        await Collage.updateOne(
            { _id: collegeId },
            { $pull: { departments: { _id: new Types.ObjectId(departmentId) } } }
        );
        return true;
    } catch (error) {
        console.error('Error deleting department:', error);
        throw error;
    }
}

