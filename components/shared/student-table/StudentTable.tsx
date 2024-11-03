'use client'
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash, Save, X, PlusCircle } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

export type Student = {
  id: string
  studentId: string
  studentName: string
}

export default function StudentTable() {
  const [students, setStudents] = useState<Student[]>([
    { id: '1', studentId: '001', studentName: 'John Doe' },
    { id: '2', studentId: '002', studentName: 'Jane Smith' },
  ])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  const addNewRow = () => {
    const id = uuidv4()
    const newStudent: Student = { id, studentId: '', studentName: '' }
    setStudents([...students, newStudent])
    setEditingId(id)
    setEditingStudent(newStudent)
  }

  const deleteRow = (id: string) => {
    setStudents(students.filter(student => student.id !== id))
  }

  const editRow = (student: Student) => {
    setEditingId(student.id)
    setEditingStudent({ ...student })
  }

  const saveChanges = () => {
    if (editingStudent) {
      setStudents(students.map(student => 
        student.id === editingStudent.id ? editingStudent : student
      ))
      setEditingId(null)
      setEditingStudent(null)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingStudent(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Student) => {
    if (editingStudent) {
      setEditingStudent({ ...editingStudent, [field]: e.target.value })
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student ID</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student, index) => (
            <TableRow key={student.id}>
              <TableCell>
                {editingId === student.id ? (
                  <Input 
                    value={editingStudent?.studentId} 
                    onChange={(e) => handleInputChange(e, 'studentId')}
                    placeholder="Enter Student ID"
                    aria-label="Student ID"
                  />
                ) : student.studentId}
              </TableCell>
              <TableCell>
                {editingId === student.id ? (
                  <Input 
                    value={editingStudent?.studentName} 
                    onChange={(e) => handleInputChange(e, 'studentName')}
                    placeholder="Enter Student Name"
                    aria-label="Student Name"
                  />
                ) : student.studentName}
              </TableCell>
              <TableCell className="text-right">
                {editingId === student.id ? (
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="icon" onClick={saveChanges} aria-label="Save changes">
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={cancelEdit} aria-label="Cancel edit">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => editRow(student)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteRow(student.id)}>
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                      {index === students.length - 1 && (
                        <DropdownMenuItem onClick={addNewRow}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          <span>Add Row</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}