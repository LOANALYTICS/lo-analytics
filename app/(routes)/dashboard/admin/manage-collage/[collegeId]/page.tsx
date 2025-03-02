"use client"

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { addDepartment, getCollegeById, editDepartment, deleteDepartmentById } from '@/services/collage.action';
import { EditIcon, Loader2, TrashIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FormField, FormItem, FormLabel, FormControl, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AddCollegeForm from '@/components/shared/admin/AddCollegeForm';
import EditCollegeForm from '@/components/shared/admin/EditCollegeForm';
import { Separator } from '@/components/ui/separator';

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

// Define the Zod schema for department form data
const departmentSchema = z.object({
    name: z.string().min(1, "Department name is required"),
    shortName: z.string().min(1, "Short name is required"),
});

const ManageDepartments = ({ params }: any) => {
    const [tab, setTab] = useState('add-department')
    const collegeParams = React.use<any>(params); // Unwrap the params Promise  
  
    const collegeId = collegeParams.collegeId;  
    const form = useForm<DepartmentFormData>({
        resolver: zodResolver(departmentSchema), // Integrate Zod with React Hook Form
    });
    const editForm = useForm<DepartmentFormData>({
        resolver: zodResolver(departmentSchema),
    });
    const [college, setCollege] = useState<College | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCollege = async () => {
        try {
            const collegeData = await getCollegeById(collegeId);
            setCollege(collegeData);
        } catch (error) {
            toast.error('Failed to fetch college data');
        }
    };

    useEffect(() => {
        fetchCollege();
    }, [collegeId]);

    useEffect(() => {
        if (currentDepartment && editDialogOpen) {
            editForm.reset({
                name: currentDepartment.name,
                shortName: currentDepartment.shortName
            });
        }
    }, [currentDepartment, editDialogOpen, editForm]);

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

    const onEditSubmit: SubmitHandler<DepartmentFormData> = async (data) => {
        if (currentDepartment) {
            setIsLoading(true);
            try {
                await editDepartment(collegeId, currentDepartment._id, data);
                toast.success('Department updated successfully');
                fetchCollege(); // Refresh departments list
                setEditDialogOpen(false);
            } catch (error) {
                toast.error('Failed to update department');
            } finally {
                setIsLoading(false);
            }
        }
    };
    const onDeleteDepartment = async (id: string) => {
        await deleteDepartmentById(collegeId,id)
        toast.success('Department deleted successfully')
        fetchCollege()
    }

    return (
        <main>
            <div className='flex justify-between items-center py-2'>
            <h1 className="text-2xl font-bold ">
               {
                tab === 'edit-college' ? 'Edit College - '+ college?.english : 'Manage Departments - ' + college?.english
               }
            </h1>
          
            <div className='flex gap-2'>
                <Button onClick={() => setTab('add-department')}>Add Department</Button>
                <Button onClick={() => setTab('edit-college')}>Edit College</Button>
            </div>
            </div>
            <Separator className='my-2 w-[80%] mx-auto'/>
{
     tab === 'edit-college' ? (
                <EditCollegeForm collegeId={collegeId} />
            ): (
                    <div className="p-4">
          
            
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
                            <div className='flex gap-2'>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setCurrentDepartment(dept);
                                    setEditDialogOpen(true);
                                }}
                            >
                                <EditIcon className="w-4 h-4" />
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    onDeleteDepartment(dept._id)
                                }}
                            >
                                    <TrashIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No departments found.</p>
                )}
            </div>

            {/* Edit Department Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Department</DialogTitle>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Department Name" className="border p-2 rounded" required />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="shortName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Short Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Short Name" className="border p-2 rounded" required />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        'Update Department'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>  
            )
       
}
           
        </main>
       
    );
};

export default ManageDepartments; 