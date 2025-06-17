"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { bulkUploadCourseTemplates } from "@/services/courseTemplate.action"
import { toast } from "sonner"

interface UploadDialogProps {
  isOpen: boolean
  onClose: () => void
  colleges: any[]
}

export default function UploadDialog({ isOpen, onClose, colleges }: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [selectedCollege, setSelectedCollege] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile || !selectedCollege) {
      toast.error("Please select both a file and a college")
      return
    }

    setIsLoading(true)
    try {
      const result = await bulkUploadCourseTemplates(selectedFile, selectedCollege)
      if (result.success) {
        toast.success(result.message)
        onClose()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to upload course templates")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Course Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select College</label>
            <Select value={selectedCollege} onValueChange={setSelectedCollege}>
              <SelectTrigger>
                <SelectValue placeholder="Select College" />
              </SelectTrigger>
              <SelectContent>
                {colleges.map((college: any) => (
                  <SelectItem key={college._id} value={college._id}>
                    {college.english}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload JSON File</label>
            <Input 
              type="file" 
              accept=".json"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 