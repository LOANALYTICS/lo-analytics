"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, ThumbsUp } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface QuestionUploadProps {
    courseId: string;
    topic: string;
}

export function QuestionUpload({ courseId, topic }: QuestionUploadProps) {
    const [open, setOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setLoading(true)
            setProgress(0)

            const fakeProgressInterval = setInterval(() => {
                setProgress((prevProgress) => {
                    if (prevProgress >= 100) {
                        clearInterval(fakeProgressInterval)
                        setLoading(false)
                        return 100
                    }
                    return prevProgress + 10
                })
            }, 50)
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select a file before uploading.")
            return
        }

        setIsUploading(true)
        try {
            // Implement your file upload logic here
            await new Promise(resolve => setTimeout(resolve, 2000))
            toast.success("File uploaded successfully")
            setOpen(false)
            setSelectedFile(null)
            setProgress(0)
        } catch (error) {
            toast.error("Failed to upload file")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                Upload Questions
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Upload Questions</DialogTitle>
                    </DialogHeader>
                    {selectedFile ? (
                        loading ? (
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                                <div
                                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
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
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                    </svg>
                                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                </div>
                                <input id="dropzone-file" type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                    )}

                    <DialogFooter className='w-full'>
                        <Button className='w-full' variant={'outline'} onClick={() => setOpen(false)}>Cancel</Button>
                        <Button 
                            className='w-full' 
                            disabled={!selectedFile || isUploading} 
                            onClick={handleUpload}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                "Add File"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
} 