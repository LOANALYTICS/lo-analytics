'use client'
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash, Save, X, PlusCircle } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { updateAssessmentStudents } from '@/services/assessment.action'

export type Student = {
  id: string
  studentId: string
  studentName: string
}

export default function StudentTable({data, courseId} : {data: any, courseId: string}) {
  const initialState = data.length === 0 
    ? [{ id: uuidv4(), studentId: '', studentName: '' }] 
    : data;

  const [students, setStudents] = useState<Student[]>(initialState)
  const [editingId, setEditingId] = useState<string | null>(
    data.length === 0 ? initialState[0].id : null
  )
  const [editingStudent, setEditingStudent] = useState<Student | null>(
    data.length === 0 ? initialState[0] : null
  )
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  const addNewRow = () => {
    const newStudent = { id: uuidv4(), studentId: '', studentName: '' };
    setStudents([...students, newStudent]);
    setEditingId(newStudent.id);
    setEditingStudent(newStudent);
  };

  const deleteRow = async (id: string) => {
    const remainingStudents = students.filter(student => student.id !== id);
    
    try {
      if (remainingStudents.length === 0) {
        const newStudent = { id: uuidv4(), studentId: '', studentName: '' };
        setStudents([newStudent]);
        setEditingId(newStudent.id);
        setEditingStudent(newStudent);
        await saveToDatabase([newStudent]);
      } else {
        setStudents(remainingStudents);
        await saveToDatabase(remainingStudents);
      }
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  const editRow = (student: Student) => {
    setEditingId(student.id)
    setEditingStudent({ ...student })
  }

  const saveToDatabase = async (updatedStudents: Student[]) => {
    try {
      console.log(updatedStudents, "updatedCourseStudent")
      await updateAssessmentStudents(courseId, updatedStudents);
      toast.success('Changes saved successfully');
    } catch (error) {
      toast.error('Failed to save changes');
      console.error('Error saving students:', error);
    }
  };

  const saveChanges = async () => {
    if (!editingStudent) return;

    const trimmedId = editingStudent.studentId.trim();
    const trimmedName = editingStudent.studentName.trim();

    if (!trimmedId || !trimmedName) {
      toast.error("Student ID and Name cannot be empty");
      return;
    }

    const updatedStudents = students.map(student => 
      student.id === editingStudent.id 
        ? { ...editingStudent, studentId: trimmedId, studentName: trimmedName }
        : student
    );

    try {
      setStudents(updatedStudents);
      setEditingId(null);
      setEditingStudent(null);
      await saveToDatabase(updatedStudents);
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };


  const cancelEdit = () => {
    const studentBeingEdited = students.find(s => s.id === editingId);
    
    if (studentBeingEdited && !studentBeingEdited.studentId && !studentBeingEdited.studentName) {
      setStudents(prevStudents => prevStudents.filter(student => student.id !== editingId));
    }
    
    setEditingId(null);
    setEditingStudent(null);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Student) => {
    if (editingStudent) {
      if (field === 'studentId') {
        // Only allow numeric input for studentId
        if (!/^\d*$/.test(e.target.value)) {
          toast.error("Student ID must contain only numbers");
          return;
        }
      }
      setEditingStudent({ ...editingStudent, [field]: e.target.value })
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData.getData('text');
    const rows = clipboardData.split('\n').filter(row => row.trim());

    if (rows.length === 0) return;

    const newStudents: Student[] = [];
    
    for (const row of rows) {
      const [studentId, studentName] = row.split('\t').map(cell => cell.trim());
      
      // Validate studentId is numeric
      if (!/^\d+$/.test(studentId)) {
        toast.error(`Invalid Student ID: ${studentId}. Student IDs must contain only numbers`);
        return;
      }

      newStudents.push({
        id: uuidv4(),
        studentId: studentId || '',
        studentName: studentName || ''
      });
    }

    if (newStudents.length === 0) return;

    try {
      const currentStudents = students.filter(student => 
        student.studentId.trim() !== '' || student.studentName.trim() !== ''
      );

      const updatedStudents = [...currentStudents, ...newStudents];
      setStudents(updatedStudents);
      setEditingId(null);
      setEditingStudent(null);
      
      await saveToDatabase(updatedStudents);
      toast.success(`${newStudents.length} students added successfully`);
    } catch (error) {
      toast.error('Failed to add pasted students');
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) 
        ? prev.filter(studentId => studentId !== id)
        : [...prev, id]
    );
  };

  const deleteSelectedStudents = async () => {
    const remainingStudents = students.filter(student => !selectedStudents.includes(student.id));
    
    try {
      if (remainingStudents.length === 0) {
        const newStudent = { id: uuidv4(), studentId: '', studentName: '' };
        setStudents([newStudent]);
        setEditingId(newStudent.id);
        setEditingStudent(newStudent);
        await saveToDatabase([newStudent]);
      } else {
        setStudents(remainingStudents);
        await saveToDatabase(remainingStudents);
      }
      
      setSelectedStudents([]);
      toast.success('Selected students deleted successfully');
    } catch (error) {
      toast.error('Failed to delete selected students');
    }
  };

  return (
    <section className='pb-60'>
      <div className="container mx-auto border-2 border-black rounded-lg">
        {selectedStudents.length > 0 && (
          <div className="p-2 bg-gray-50 flex justify-between items-center">
            <span>{selectedStudents.length} selected</span>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={deleteSelectedStudents}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        )}

        <Table className='text-xs '>
          <TableHeader>
            <TableRow className='p-0 border-b border-black'>
              <TableHead className='w-10 py-2'>
                {students.length === 1 && !students[0].studentId && !students[0].studentName ? (
                  <span></span>
                ) : (
                  <Checkbox 
                    checked={selectedStudents.length === students.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                )}
              </TableHead>
              <TableHead className='w-16 py-2 text-black font-bold'>S.No</TableHead>
              <TableHead className='w-[300px] max-w-[300px] min-[300px] py-2 text-black font-bold'>Student ID</TableHead>
              <TableHead className='w-[300px] max-w-[300px] min-[300px] py-2 text-black font-bold'>Student Name</TableHead>
              <TableHead className="text-right py-2 text-black font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student, index) => (
              <TableRow key={student.id} className='border-t border-b border-black'>
                <TableCell className='w-10 py-2'>
                  {!(students.length === 1 && !student.studentId && !student.studentName) && (
                    <Checkbox 
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => toggleSelectStudent(student.id)}
                      aria-label={`Select ${student.studentName}`}
                    />
                  )}
                </TableCell>
                <TableCell className='w-16 py-2'>{index + 1}</TableCell>
                <TableCell className='w-[300px] max-w-[300px] min-[300px] py-2'>
                  {editingId === student.id ? (
                    <Input 
                      value={editingStudent?.studentId} 
                      className='w-fit'
                      onChange={(e) => handleInputChange(e, 'studentId')}
                      onPaste={handlePaste}
                      placeholder="Enter Student ID"
                      aria-label="Student ID"
                    />
                  ) : student.studentId}
                </TableCell>
                <TableCell className='w-[300px] max-w-[300px] min-[300px] py-2'>
                  {editingId === student.id ? (
                    <Input 
                      value={editingStudent?.studentName} 
                      onChange={(e) => handleInputChange(e, 'studentName')}
                      onPaste={handlePaste}
                      placeholder="Enter Student Name"
                      aria-label="Student Name"
                    />
                  ) : student.studentName}
                </TableCell>
                <TableCell className="text-right py-2">
                  {editingId === student.id ? (
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={saveChanges} aria-label="Save changes">
                        <Save className="h-4 w-4" />
                      </Button>
                      {!(students.length === 1 && !student.studentId && !student.studentName) && (
                        <Button variant="ghost" size="icon" onClick={cancelEdit} aria-label="Cancel edit">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
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
                        {students.length > 1 && (
                          <DropdownMenuItem onClick={() => deleteRow(student.id)}>
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        )}
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
    </section>
  )
}