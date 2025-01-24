"use client"
import React, { useState, useEffect } from 'react'
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ThumbsUp } from 'lucide-react'
import { updateCollage, getCollegeById, deleteCollageById } from '@/services/collage.action'

const formSchema = z.object({
    english: z.string(),
    regional: z.string(),
    university: z.string(),
})

interface EditCollegeFormProps {
    collegeId: string;
    onClose?: () => void;
}

export default function EditCollegeForm({ collegeId, onClose }: EditCollegeFormProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [currentLogo, setCurrentLogo] = useState('');

    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            english: "",
            regional: "",
            university: ""
        },
    })

    useEffect(() => {
        const fetchCollege = async () => {
            try {
                const college = await getCollegeById(collegeId);
                form.reset({
                    english: college.english,
                    regional: college.regional,
                    university: college.university,
                });
                setCurrentLogo(college.logo);
            } catch (error) {
                toast.error('Error fetching college details');
            }
        };
        fetchCollege();
    }, [collegeId, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            let base64Image = currentLogo;
            if (selectedFile) {
                // Convert file to base64
                const reader = new FileReader();
                base64Image = await new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(selectedFile);
                });
            }

            const collegeData = {
                english: values.english,
                regional: values.regional,
                university: values.university,
                logo: base64Image,
            };

            const response = await updateCollage(collegeId, collegeData);
            
            if (response) {
                // Fetch updated college data instead of refreshing the page
                const updatedCollege = await getCollegeById(collegeId);
                form.reset({
                    english: updatedCollege.english,
                    regional: updatedCollege.regional,
                    university: updatedCollege.university,
                });
                setCurrentLogo(updatedCollege.logo);
                setSelectedFile(null);
                setProgress(0);
                
                toast.success('College updated successfully');
                onClose && onClose();
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setLoading(true);
            setProgress(0);

            const fakeProgressInterval = setInterval(() => {
                setProgress((prevProgress) => {
                    if (prevProgress >= 100) {
                        clearInterval(fakeProgressInterval);
                        setLoading(false);
                        return 100;
                    }
                    return prevProgress + 10;
                });
            }, 50);
        }
    };
    
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        const file = e.dataTransfer.files?.[0];
        if (file && (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/jpg")) {
          setSelectedFile(file);
          setLoading(true);
          setProgress(0);
    
          const fakeProgressInterval = setInterval(() => {
            setProgress((prevProgress) => {
              if (prevProgress >= 100) {
                clearInterval(fakeProgressInterval);
                setLoading(false);
                return 100;
              }
              return prevProgress + 10;
            });
          }, 50);
        } else {
          toast.error('Please upload only image files (.png, .jpeg, .jpg)');
        }
      };

      const onDelete = async () => {
        const response = await deleteCollageById(collegeId)
        if(response){
            toast.success('College deleted successfully')
            router.push('/dashboard/admin/manage-collage')
        }else{
            toast.error('Error deleting college')
        }
      }

    return (
        <section className='shadow-sm rounded-lg py-4'>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <div className="flex flex-col w-full">
                        <h2 className='font-semibold mb-1'>Logo</h2>
                        {currentLogo && !selectedFile && (
                            <div className="mb-4">
                                <img 
                                    src={currentLogo} 
                                    alt="Current Logo" 
                                    className="h-24 object-contain mx-auto"
                                />
                            </div>
                        )}
                        {selectedFile ? (
                            loading ? (
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                                    <div
                                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            ) : (
                                progress === 100 && (
                                    <div className='flex gap-1 items-center justify-center'>
                                        <ThumbsUp size={20} />
                                        <p className='font-semibold text-center'>File uploaded successfully</p>
                                    </div>
                                )
                            )
                        ) : (
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
                            onDragOver={handleDragOver}
                    onDrop={handleDrop}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                    </svg>
                                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                </div>
                                <input id="dropzone-file" type="file" onChange={handleFileChange} className="hidden" />
                            </label>
                        )}
                    </div>

                    <FormField
                        control={form.control}
                        name="english"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>English Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="English" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="regional"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Regional Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Regional" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="university"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>University Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="University" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <div className='flex justify-end gap-10'>
                        <Button type="submit" className='w-full' style={{marginTop:"20px"}} disabled={loading}>
                            {loading ? 'Updating...' : 'Update'}
                        </Button>
                        <Button 
                        type='button'
                         onClick={onDelete} className='w-[20%] bg-red-500' style={{marginTop:"20px"}} disabled={loading}>Delete</Button>
                    </div>
                </form>
            </Form>
        </section>
    )
} 