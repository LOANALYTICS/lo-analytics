"use client"

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { addDepartment, getCollegeById } from '@/services/collage.action';

interface Props {
    params: {
        collegeId: string;
    };
}

interface DepartmentFormData {
    name: string;
    shortName: string;
}

interface Department {
    _id: string;
    name: string;
    shortName: string;
}

interface College {
    _id: string;
    english: string;
    departments: Department[];
}

const ManageDepartments= ({ params }: any) => {
    const collegeParams = React.use<any>(params); // Unwrap the params Promise  
  
    const collegeId = collegeParams.collegeId;  
    const form = useForm<DepartmentFormData>();
    const [college, setCollege] = useState<College | null>(null);

    const fetchCollege = async () => {
        try {
            const collegeData = await getCollegeById(collegeId);
            console.log(collegeData,"collegeData");
            setCollege(collegeData);
        } catch (error) {
            toast.error('Failed to fetch college data');
        }
    };

    useEffect(() => {
        fetchCollege();
    }, [collegeId]);

    const onSubmit: SubmitHandler<DepartmentFormData> = async (data) => {
        try {
            await addDepartment(collegeId, data);
            toast.success('Department added successfully');
            form.reset();
            fetchCollege(); // Refresh departments list
        } catch (error) {
            toast.error('Failed to add department');
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">
                Manage Departments - {college?.english}
            </h1>
            
            {/* Department Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-8">
                <div className="flex gap-4">
                    <input 
                        {...form.register('name')} 
                        placeholder="Department Name" 
                        className="border p-2 rounded"
                        required 
                    />
                    <input 
                        {...form.register('shortName')} 
                        placeholder="Short Name" 
                        className="border p-2 rounded"
                        required 
                    />
                    <Button type="submit">Add Department</Button>
                </div>
            </form>

            {/* Departments List */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold mb-4">Existing Departments</h2>
                {college?.departments && college.departments.length > 0 ? (
                    college.departments.map((dept) => (
                        <div key={dept._id} className="flex justify-between items-center p-3 border rounded">
                            <div>
                                <h3 className="font-medium">{dept.name}</h3>
                                <p className="text-sm text-gray-600">{dept.shortName}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No departments found.</p>
                )}
            </div>
        </div>
    );
};

export default ManageDepartments; 