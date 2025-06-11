"use client"

import React, { useState, useEffect } from "react"
import { DynamicDropdownMenu } from "@/components/shared/MultiSelect"
import { IUser } from "@/server/models/user.model"
import { deleteCoordinator, editCoordinator, getUsersByRole, getUsersForManage, updatePermissions } from "@/services/users.actions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCollage, getCollageByRole } from "@/services/collage.action"
import { Loader2, Mail, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function ManageCoordinators() {
  const [updatedName, setUpdatedName] = useState<string>('')
  const USER = JSON.parse(localStorage.getItem('user') || '{}')
  const [coordinators, setCoordinators] = useState<IUser[]>([])
  const [colleges, setColleges] = useState<{ _id: string; english: string }[]>([])
  const [selectedCollege, setSelectedCollege] = useState<string>('all'); // State for selected college
  const [dropdownState, setDropdownState] = useState<Record<string, Record<string, boolean>>>({})
  const [loading, setLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  const [isOpen, setIsOpen] = useState({
    isOpen: false,
    type: "",
  })
  const setIsOpenHandler = () => {
    console.log('s')
  }

  const closeModal = () => {
    setIsOpen((prev) => ({ ...prev, isOpen: false }));
  };

  const openModal = (type = "") => {
    setIsOpen({ isOpen: true, type });
  };
  const [selectedCoordinator, setSelectedCoordinator] = useState<any>(null)
  const fetchData = async () => {
    setLoading(true);
    const coordinatorData = await getUsersForManage(USER?._id);
    const collegeData = await getCollageByRole(USER?._id);

    setCoordinators(coordinatorData);
    setColleges(collegeData);




    // Initialize dropdown state for each coordinator based on their permissions
    const initialState = coordinatorData.reduce((acc, coordinator) => {
      acc[coordinator._id] = {
        "Item Analysis": coordinator.permissions.includes("Item Analysis"),
        "Question Bank": coordinator.permissions.includes("Question Bank"),
        "Learning Outcome": coordinator.permissions.includes("Learning Outcome"),
      }
      return acc
    }, {} as Record<string, Record<string, boolean>>)

    setDropdownState(initialState);
    setLoading(false);
  }
  useEffect(() => {
    fetchData();
  }, []);

  // Filter coordinators based on selected college
  const filteredCoordinators = selectedCollege === 'all'
    ? coordinators
    : coordinators.filter((coordinator: any) => coordinator.collage?._id?.toString() === selectedCollege);

  // Handle changes in the dropdown menu
  const handleCheckedChange = async (coordinatorId: string, option: string, checked: boolean) => {
    // Update local state
    const updatedState = {
      ...dropdownState,
      [coordinatorId]: {
        ...dropdownState[coordinatorId],
        [option]: checked,
      },
    }

    setDropdownState(updatedState)

    // Extract selected permissions
    const selectedPermissions = Object.entries(updatedState[coordinatorId])
      .filter(([, isSelected]) => isSelected)
      .map(([permission]) => permission)

    // Update permissions on the server
    try {
      await updatePermissions(coordinatorId, selectedPermissions)
    } catch (error) {
      console.error("Failed to update permissions:", error)
    }
  };

  const handleDeleteCoordinator = async () => {
    if (!selectedCoordinator) return;
    setIsDeleting(true)
    try {
      const rs = await deleteCoordinator(selectedCoordinator?._id)
      if (!rs.success) {
        toast.error('Something went wrong')
        closeModal()
      }
      toast.success('Co-ordinator deleted successfully')
      fetchData()
      setIsDeleting(false)
      closeModal()
    } catch (error) {
      setIsDeleting(false)
      console.error("Failed to update permissions:", error)
    }
  }

  const handleEditCoordinator = async () => {
    if (!selectedCoordinator) return;
    try {
      const rs = await editCoordinator(selectedCoordinator?._id, { name: updatedName })
      if (!rs.success) {
        toast.error('Something went wrong')
        closeModal()
      }
      toast.success('Co-ordinator updated successfully')
      fetchData()
      closeModal()
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong')
    }
  }
 console.log(filteredCoordinators)

  return (
    <main className="px-2">
      <h1 className="font-semibold text-lg">Manage Coordinators - ( {filteredCoordinators.length} )</h1>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Select
              value={selectedCollege}
              onValueChange={(value) => setSelectedCollege(value)} // Update selected college
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by College" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                {colleges.map(college => (
                  <SelectItem key={college._id} value={college._id}>
                    {college.english}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))]  gap-2 mt-4">
            {filteredCoordinators.map((coordinator: any) => (
              <div
                key={coordinator._id}
                className="flex relative justify-between items-center border border-gray-300 shadow-sm px-3 rounded-md p-2"
              >
                {
                  coordinator?.role === "college_admin" && (
                    <span className='bg-black px-2 py-0.5 rounded-md text-[10px] text-white absolute -top-2 right-2'>College Admin</span>

                  )
                }
                <div className="flex flex-col ">
                  <h2 className="font-medium">{coordinator.name}</h2>
                  <div className="text-gray-500 text-sm flex gap-1 items-center">
                    <Mail size={12} />
                    <h4>{coordinator.email}</h4>
                  </div>
                  <p className="text-xs text-gray-500">Accociated with college: {coordinator.collage?.english}</p>
                </div>
                <div className="flex gap-3 items-center">
                  <DynamicDropdownMenu
                  type={'tools'}
                    options={coordinator.collage?.toolAccess || []}
                    state={dropdownState[coordinator._id] || {}} // Pass the state for this coordinator
                    handleCheckedChangeAction={(option, checked) =>
                      handleCheckedChange(coordinator._id, option, checked) // Call the handler with the coordinator ID
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
                        onClick={() => {
                          setSelectedCoordinator(coordinator)
                          setUpdatedName(coordinator?.name)
                          openModal('edit')
                        }}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-500"
                        onClick={() => {
                          setSelectedCoordinator(coordinator)
                          openModal('delete')
                        }}>
                        Delete
                      </DropdownMenuItem>

                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>


              </div>
            ))}
            <Dialog open={isOpen?.isOpen} onOpenChange={() => setIsOpen((prev) => ({ ...prev, isOpen: !isOpen }))} >

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isOpen.type === "delete" ? "Delete Co-ordinator" : "Edit Co-ordinator"}</DialogTitle>
                </DialogHeader>
                {
                  selectedCoordinator && isOpen?.type === 'delete' ? (
                    <>
                      <div>
                        Are you sure you want to delete this Co-ordinator?
                        {selectedCoordinator && <p className="font-bold"> `Co-ordinator : {selectedCoordinator?.name}`</p>}
                        <p className="text-sm"><b>Note:</b> This action cannot be undone. </p>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteCoordinator}>
                          {isDeleting ? "Deleting..." : "Yes, Delete"}
                        </Button>
                      </div>

                    </>
                  ) : (
                    <>
                      <div className="border rounded-lg p-2">
                        <p className="text-sm text-gray-500">Name: {selectedCoordinator?.name}</p>
                        <p className="text-sm text-gray-500">Email: {selectedCoordinator?.email}</p>
                        <p className="text-sm text-gray-500">Accociated with college: {selectedCoordinator?.collage?.english as string}</p>
                        <p className="text-sm text-gray-500"><span className="font-bold">Note: you can only edit name</span></p>
                      </div>
                      <div>
                        <label className="mt-4 font-semibold" htmlFor="updateName">Name to update</label>
                        <Input
                          id="updateName"
                          type="text"
                          placeholder="Enter Name"
                          value={updatedName}
                          onChange={(e) => setUpdatedName(e.target.value)}
                        />
                      </div>

                      <Button className="" onClick={handleEditCoordinator}>

                        Update
                      </Button>
                    </>



                  )
                }



              </DialogContent>
            </Dialog>
          </section>
        </>
      )}
    </main>
  )
}
