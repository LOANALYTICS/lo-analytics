"use client"

import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { addDepartment, getCollegeById, editDepartment, deleteDepartmentById, updateToolAccess, getToolAccessByCollegeId } from '@/services/collage.action';
import { EditIcon, Eye, Loader2, Mail, MoreVertical, Scan, TrashIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FormField, FormItem, FormLabel, FormControl, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import EditCollegeForm from '@/components/shared/admin/EditCollegeForm';
import { Separator } from '@/components/ui/separator';
import { assignRoleToUser, getUsersByCollegeId } from '@/services/users.actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { getRole } from '@/server/utils/helper';
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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

const departmentSchema = z.object({
    name: z.string().min(1, "Department name is required"),
    shortName: z.string().min(1, "Short name is required"),
});

const ManageDepartments = ({ params }: any) => {
    const [tab, setTab] = useState('add-department')
    const collegeParams = React.use<any>(params);
    const [USERROLE, setUSERROLE] = useState<string>("");

    const collegeId = collegeParams.collegeId;
    const form = useForm<DepartmentFormData>({
        resolver: zodResolver(departmentSchema),
    });
    const editForm = useForm<DepartmentFormData>({
        resolver: zodResolver(departmentSchema),
    });
    const [college, setCollege] = useState<College | null>(null);
    const [usersDataByCollege, setUsersDataByCollege] = useState<any>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTools, setSelectedTools] = useState<string[]>([])
    const tools = ["Item Analysis", "Question Bank", "Learning Outcome"]

    const fetchCollege = async () => {
        try {
            const collegeData = await getCollegeById(collegeId);
            setCollege(collegeData);
        } catch (error) {
            toast.error('Failed to fetch college data');
        }
    };

    const fetchCorodinators = async () => {
        try {
            const usersDataByCollegeResponse = await getUsersByCollegeId(collegeId);
            setUsersDataByCollege(usersDataByCollegeResponse);
        } catch (error) {
            toast.error('Failed to fetch college data');
        }
    };
    const getToken = async () => {
        const role = await getRole("token");
        setUSERROLE(role)
    }

    // useLayoutEffect(() => {
    //     const getToken = async () => {
    //         const role = await getRole("token");
    //         setUSERROLE(role)
    //     }
    //     getToken()

    // }, []);
    useLayoutEffect(() => {
        getToken()
    }, []);

    useEffect(() => {

        if (tab === 'edit-college') {
            fetchCollege();

        } else if (tab === 'edit-access') {
            fetchCorodinators()
        } else {
            fetchCollege();
        }
    }, [collegeId, tab]);

    useEffect(() => {
        if (currentDepartment && editDialogOpen) {
            editForm.reset({
                name: currentDepartment.name,
                shortName: currentDepartment.shortName
            });
        }
    }, [currentDepartment, editDialogOpen, editForm]);

    const fetchToolAccess = async () => {
        try {
            const result = await getToolAccessByCollegeId(collegeId);
            if (result.success) {
                setSelectedTools(result.toolAccess);
            }
        } catch (error) {
            toast.error('Failed to fetch tool access');
        }
    };

    useEffect(() => {
        if (tab === 'edit-access') {
            fetchCorodinators();
            fetchToolAccess();
        }
    }, [collegeId, tab]);

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
        await deleteDepartmentById(collegeId, id)
        toast.success('Department deleted successfully')
        fetchCollege()
    }
    const assignRole = async (role: string, userId: string, collegeId: string) => {
        const rs = await assignRoleToUser(role, userId, collegeId);
        if (rs.message === "Role is already occupied.") {
            toast.error(rs.message)
            return;
        } else if (rs.message === "Role assigned successfully.") {
            toast.success(rs.message)
            fetchCorodinators()
        } else if (rs.message === "User demoted successfully.") {
            toast.success(rs.message)
            fetchCorodinators()
        }
    }

    if (USERROLE === "") {
        return null;
    }
    const handleToolAccessUpdate = async (tools: string[]) => {
        try {
            const result = await updateToolAccess(collegeId, tools);
            if (result.success) {
                toast.success('Tool access updated successfully');
            }
        } catch (error) {
            toast.error('Failed to update tool access');
        }
    };
    return (
        <main>
            <div className='flex justify-between items-center py-2'>
                <h1 className="text-2xl font-bold ">
                    {
                        tab === 'edit-college' ? 'Edit College - ' + college?.english : 'Manage Departments - ' + college?.english
                    }
                </h1>

                <div className='flex gap-2'>
                    <Button variant={tab === "add-department" ? "default" : "outline"} onClick={() => setTab('add-department')}>Add Department</Button>
                    <Button variant={tab === "edit-college" ? "default" : "outline"} onClick={() => setTab('edit-college')}>Edit College</Button>
                    <Button variant={tab === "edit-access" ? "default" : "outline"} onClick={() => setTab('edit-access')}>Edit Access</Button>
                </div>
            </div>
            <Separator className='my-2 w-[80%] mx-auto' />
            {
                tab === 'edit-college' ? (
                    <EditCollegeForm collegeId={collegeId} />
                ) : (
                    tab === 'add-department'
                        ? (
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
                        ) : (
                            <div className='p-4'>
                                <div className="mb-4">
                                    <h3 className="mb-2">Tools Access</h3>
                                    <div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-[300px] justify-between"
                                            >
                                                {selectedTools.length > 0
                                                    ? `${selectedTools.length} tools selected`
                                                    : "Select tools..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search tools..." />
                                                <CommandEmpty>No tools found.</CommandEmpty>
                                                <CommandGroup>
                                                    {tools.map((tool) => (
                                                        <CommandItem
                                                            key={tool}
                                                            onSelect={() => {
                                                                setSelectedTools((prev) =>
                                                                    prev.includes(tool)
                                                                        ? prev.filter((t) => t !== tool)
                                                                        : [...prev, tool]
                                                                )
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedTools.includes(tool) ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {tool}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <Button className='ml-4'
                                    onClick={() => handleToolAccessUpdate(selectedTools)}
                                    >
                                        Update Access
                                    </Button>

                                    </div>
                                    
                                </div>
                                {/* users  */}
                                <div >
                                    <h3>Users</h3>
                                    <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))]  gap-2 mt-4">
                                        {
                                            usersDataByCollege && usersDataByCollege.map((user: any) => (
                                                <div key={user?.email} className='flex justify-between relative  border border-gray-300 group-hover:border-blue-400 shadow-sm p-3 rounded-md text-[13px]'
                                                >
                                                    {
                                                        user?.role === "college_admin" && (
                                                            <span className='bg-black px-2 py-0.5 rounded-md text-[10px] text-white absolute -top-2 right-2'>College Admin</span>

                                                        )
                                                    }
                                                    <div className='flex flex-col'>
                                                        <h2 className="font-medium">{user?.name}</h2>
                                                        <div className="text-gray-500 text-sm flex gap-1 items-center">
                                                            <Mail size={12} />
                                                            <h4>{user?.email}</h4>
                                                        </div>
                                                    </div>

                                                    {
                                                        USERROLE === "admin" && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className=' text-neutral-600 h-full aspect-square flex items-center justify-center cursor-pointer p-2 hover:bg-neutral-300 rounded-md'>
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent className='bg-white border p-2 z-10 rounded-md'>
                                                                    <DropdownMenuItem className='cursor-pointer py-2 px-6 hover:bg-neutral-200 rounded-md'
                                                                        onClick={() => assignRole(`${user?.role === "college_admin" ? "course_coordinator" : "college_admin"}`, user?._id, collegeId)}>
                                                                        {user?.role === "college_admin" ? "Remove Admin" : "Make Admin"}
                                                                    </DropdownMenuItem>

                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )
                                                    }

                                                </div>
                                            ))

                                        }
                                    </section>

                                </div>
                            </div>
                        )
                )

            }


        </main>

    );
};

export default ManageDepartments; 