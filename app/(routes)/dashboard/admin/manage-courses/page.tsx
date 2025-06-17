"use client"

import React, { useState, useEffect } from "react"
import { DynamicDropdownMenu } from '@/components/shared/MultiSelect'
// import { IUser } from '@/server/models/user.model'
import { getUsersByRole } from '@/services/users.actions'
import { toast } from "sonner"
import { assignCoordinatorsToCourse, deleteCourseTemplateById, getCoursesTemplates, getCoursesTemplatesByRole } from "@/services/courseTemplate.action"
import { getCollageByRole } from "@/services/collage.action"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function ManageCoordinators() {
  const USER = JSON.parse(localStorage.getItem('user') || '{}')
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [coordinators, setCoordinators] = useState<any>([])
  const [dropdownState, setDropdownState] = useState<Record<string, Record<string, boolean>>>({})
  const [colleges, setColleges] = useState<any[]>([])
  const [selectedCollege, setSelectedCollege] = useState<string | null>("all")
  const [loading, setLoading] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const fetchData = async () => {
    setLoading(true);
    const courseData = await getCoursesTemplatesByRole(USER?._id);
    const coordinatorData = await getUsersByRole("course_coordinator");
    const collegeData = await getCollageByRole(USER?._id);

    setCourses(courseData)
    setCoordinators(coordinatorData)
    setColleges(collegeData)

    const initialState = courseData.reduce((acc: Record<string, Record<string, boolean>>, course: any) => {
      if (Array.isArray(course.coordinator)) {
        acc[course._id] = course.coordinator.reduce(
          (coordinatorAcc: Record<string, boolean>, coordinator: any) => {
            coordinatorAcc[coordinator.name] = true
            return coordinatorAcc
          },
          {}
        )
      } else {
        acc[course._id] = {}
      }
      return acc
    }, {})

    setDropdownState(initialState)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])
  const [isOpen, setIsOpen] = useState(false)
  const setIsOpenHandler = () => {
    setIsOpen((prev) => !prev)
  }

  const filteredCourses = selectedCollege !== "all"
    ? courses.filter(course => course.college?._id === selectedCollege)
    : courses 

  const handleCheckedChange = async (courseId: string, coordinatorName: string, checked: boolean) => {
    setDropdownState(prevState => ({
      ...prevState,
      [courseId]: {
        ...prevState[courseId],
        [coordinatorName]: checked,
      },
    }))

    const updatedState = {
      ...dropdownState,
      [courseId]: {
        ...dropdownState[courseId],
        [coordinatorName]: checked,
      },
    }

    const selectedCoordinators = Object.keys(updatedState[courseId]).filter(key => updatedState[courseId][key])
    const selectedCoordinatorIds = coordinators
      .filter((coordinator: any) => selectedCoordinators.includes(coordinator.name))
      .map((coordinator: any) => coordinator._id)

    try {
      if (selectedCoordinatorIds.length > 0) {
        await assignCoordinatorsToCourse(courseId, selectedCoordinatorIds)
        toast.success(`Successfully assigned coordinators to course ${courseId}`)
      } else {
        await assignCoordinatorsToCourse(courseId, [])
        toast.success(`Cleared coordinators for course ${courseId}`)
      }
    } catch (error) {
      toast.error(`Failed to update coordinators for course ${courseId}`)
    }
  }

  const courseCoordinators = (course: any) => {
    const filteredCoordinators = coordinators
      .filter((coordinator: any) =>
        coordinator.collage && course.college &&
        coordinator.collage._id === course.college._id
      );
    return filteredCoordinators.map((coordinator: any) => coordinator.name); // Return only names
  }

  const handleDeleteCourse = async (courseId: string) => {
    try {
      setIsDeleting(true)
      await deleteCourseTemplateById(courseId)
      toast.success(`Successfully deleted course ${courseId}`)

      await fetchData()
      setIsDeleting(false)
      setIsOpenHandler()
    } catch (error) {
      toast.error(`Failed to delete course ${courseId}`)
      setIsDeleting(false)
    
    }
  }

  return (
    <main className="px-2">
        <div className="flex justify-between">

      <h1 className="font-semibold text-lg">Manage Courses - ( {filteredCourses.length} )</h1>
      <Select onValueChange={setSelectedCollege} defaultValue={selectedCollege || ""}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select College" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colleges</SelectItem>
              {colleges.map((college) => (
                <SelectItem key={college._id} value={college._id}>
                  {college.english}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <>
         

          <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))]  gap-2 mt-4">
            {filteredCourses.map((course) => (
              <div key={course._id} className="flex justify-between items-center border border-gray-300 shadow-sm px-3 rounded-md p-2">
                <div className="flex flex-col ">
                  <h2>{course?.course_name}</h2>
                  
                  <div className="text-xs text-gray-500">
                  <p className="font-semibold">{course?.course_code}</p>
                    <p>{course?.college?.english}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                  <DynamicDropdownMenu
                    options={courseCoordinators(course)} // Pass the filtered list of coordinators to the dropdown
                    state={dropdownState[course._id] || {}} // Pass the state for this course
                    handleCheckedChangeAction={(name, checked) =>
                      handleCheckedChange(course._id, name, checked) // Handle state changes for this course
                    }
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className=' text-neutral-600 h-full aspect-square flex items-center justify-center cursor-pointer p-3 hover:bg-neutral-200 rounded-md'>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent >
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => router.push(`/dashboard/admin/edit-course/${course._id}`)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-500"
                        onClick={() => {
                          setSelectedCourse(course)
                          setIsOpenHandler()
                        }}>
                        Delete
                      </DropdownMenuItem>

                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

              </div>
            ))}
          </section>
        </>
      )}
      <Dialog open={isOpen} onOpenChange={setIsOpenHandler}>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          <div>
            Are you sure you want to delete this course?
            {selectedCourse && <p className="font-bold">`{selectedCourse?.course_name}`</p>}
            <p className="text-sm"><b>Note:</b> This action cannot be undone. </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={setIsOpenHandler}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDeleteCourse(selectedCourse?._id)}>
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>

          </div>

        </DialogContent>
      </Dialog>
    </main>
  )
}