"use client"
import React from 'react'
import { z } from "zod"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select"

import { Input } from "@/components/ui/input"
import { getCollage, getCollageByRole, getCollegeById } from "@/services/collage.action";
import axios from 'axios'
import { useRouter } from "next/navigation"
import { toast } from 'sonner'
import UploadDialog from "@/components/shared/admin/upload-dialog"

const formSchema = z.object({
  course_name: z.string(),
  course_code: z.string().min(4, { message: "Course code must be at least 4 characters" }),
  credit_hours: z.string(),
  department: z.string(),
  sem: z.number(),
  level: z.number(),
  college: z.string(),
})

export default function CreateCoursePage() {

    const [USER, setUSER] = React.useState<any>({})
    const router = useRouter()

    React.useEffect(() => {
        const userData = localStorage.getItem('user')
        console.log('Raw userData from localStorage:', userData);
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                console.log('Parsed user data:', parsedUser);
                setUSER(parsedUser);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        } else {
            console.log('No user data found in localStorage');
        }
    }, [])
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          course_name: "",
          course_code: "",
          credit_hours: "",
          department: "",
          sem: 1,
          level: 1,
          college: "",
        },
    })

    const [colleges, setColleges] = React.useState<any>([]);
    const [departments, setDepartments] = React.useState<any>([]);
    const [selectedCollege, setSelectedCollege] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [isUploadOpen,setIsUploadOpen] = React.useState(false)

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const response = await axios.post("/api/course-template/create-course-template", values)

            if (response.status === 201) {
                toast("Course template created successfully");
                form.reset();
                setSelectedCollege("");  
                setDepartments([]);     
                router.refresh();
            }
        } catch (error: any) {
            if (error.response?.status === 409) {
                toast("A course with this name or code already exists");
            } else {
                toast("Something went wrong. Please try again.");
                console.error("Error details:", error.response?.data);
            }
        } finally {
            setIsLoading(false);
        }
    }
    React.useEffect(() => {
        const fetchColleges = async () => {
            console.log('USER object:', USER);
            if (USER?._id) {
                try {
                    console.log('Fetching colleges for user:', USER._id);
                    const collegeData = await getCollageByRole(USER._id);
                    console.log('College data received:', collegeData);
                    setColleges(collegeData || []);
                } catch (error) {
                    console.error('Error fetching colleges:', error);
                    setColleges([]);
                }
            } else {
                console.log('No USER._id found, USER:', USER);
            }
        };
        fetchColleges();
    }, [USER]);

    const handleCollegeChange = async (value: string) => {
        setSelectedCollege(value);
        form.setValue("college", value); // Set the college value in the form
        if (value) {
            const collegeData = await getCollegeById(value);
            setDepartments(collegeData?.departments || []); // Set departments based on selected college
        } else {
            setDepartments([]); // Reset departments if no college is selected
        }
    };

    return (
        <section className='min-w-[400px] shadow-sm rounded-lg px-2'>
            <div className='flex justify-between w-full mb-8'>
                <h1 className="font-semibold text-lg">Manage Collage</h1>
                <div onClick={() => setIsUploadOpen((prev) => !prev)} className={`px-4 py-2 border border-gray-300 curs hover:bg-blue-50 rounded-md flex items-center gap-2 text-sm`}>
                    Upload
                </div>
            </div>
            <UploadDialog 
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                colleges={colleges}
            />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <div className='grid grid-cols-3 gap-2'>
                      
                        <FormField
                            control={form.control}
                            name="course_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Course Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Course Name" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="course_code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Course Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Course code" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="credit_hours"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Credit Hours</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Credit hours" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                            control={form.control}
                            name="college"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>College</FormLabel>
                                    <Select onValueChange={(value) => handleCollegeChange(value)} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select College" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {colleges.map((college:  any) => (
                                                <SelectItem key={college._id} value={college._id}>
                                                    {college.english}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    <div className='grid grid-cols-2 gap-2'>
                        <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCollege}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {departments.map((dept: any) => (
                                                <SelectItem key={dept._id} value={dept.name}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sem"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Semester</FormLabel>
                                    <Select 
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        value={field.value?.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Semester" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="1">Semester 1</SelectItem>
                                            <SelectItem value="2">Semester 2</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                        <FormField
                            control={form.control}
                            name="level"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Level</FormLabel>
                                    <Select 
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        value={field.value?.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Level" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Array.from({ length: 10 }, (_, i) => i * 2 + (form.watch('sem') === 1 ? 1 : 2)).map((level) => (
                                                <SelectItem key={level} value={level.toString()}>
                                                    Level {level}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button type="submit" className='w-full' style={{ marginTop: "20px" }} disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create"}
                    </Button>
                </form>
            </Form>
        </section>
      )
}


// <FormField
// control={form.control}
// name="collage_name"
// render={({ field }) => (
//   <FormItem>
//     <FormLabel>Collage</FormLabel>
//     <Select onValueChange={field.onChange} defaultValue={field.value}>
//       <FormControl>
//         <SelectTrigger>
//           <SelectValue placeholder="Select Collage" />
//         </SelectTrigger>
//       </FormControl>
//       <SelectContent>
//         <SelectItem value="collage_092">Collage 092</SelectItem>
//         <SelectItem value="collage_82">Collage 82</SelectItem>
//         <SelectItem value="collage_23">Collage 23</SelectItem>
//       </SelectContent>
//     </Select>
 
//     <FormMessage />
//   </FormItem>
// )}
// />
