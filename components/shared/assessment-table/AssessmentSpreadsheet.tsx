'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { getAssessmentStudents } from "@/services/assessment.action"
import { toast } from "sonner"
import * as XLSX from 'xlsx'
import { DataSheetGrid, textColumn, keyColumn } from 'react-datasheet-grid'
import 'react-datasheet-grid/dist/style.css'

interface AssessmentSpreadsheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
  courseId: string
  type: string
  numberOfQuestions: number
}

interface Student {
  id: string
  name: string
}

interface RowData {
  studentId: string
  studentName: string
  percentage: string
  score: string
  correct: string
  blank: string
  [key: string]: string // For dynamic question columns
}

export function AssessmentSpreadsheet({ 
  open, 
  onOpenChange, 
  onSave, 
  courseId, 
  type,
  numberOfQuestions 
}: AssessmentSpreadsheetProps) {
  const [data, setData] = useState<RowData[]>([])
  const [originalStudentData, setOriginalStudentData] = useState<Student[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isMultipleMode, setIsMultipleMode] = useState(false)
  const gridRef = useRef<any>(null)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const response = await getAssessmentStudents(courseId)
        
        // Store original student data for reference
        const students = response.data.map((student: any) => ({
          id: student.studentId,
          name: student.studentName
        }))
        setOriginalStudentData(students)
        
        // Helper function to get Excel column name
        const getExcelColumnName = (index: number) => {
          let columnName = ''
          let num = index
          while (num >= 0) {
            columnName = String.fromCharCode(65 + (num % 26)) + columnName
            num = Math.floor(num / 26) - 1
          }
          return columnName
        }
        
        // Create columns based on mode
        const gridColumns = isMultipleMode ? [
          {
            ...keyColumn('studentId', textColumn),
            title: 'A',
            minWidth: 120
          },
          {
            ...keyColumn('studentName', textColumn),
            title: 'B',
            minWidth: 200
          },
          {
            ...keyColumn('percentage', textColumn),
            title: 'C',
            minWidth: 80
          },
          {
            ...keyColumn('score', textColumn),
            title: 'D',
            minWidth: 80
          },
          {
            ...keyColumn('correct', textColumn),
            title: 'E',
            minWidth: 100
          },
          {
            ...keyColumn('blank', textColumn),
            title: 'F',
            minWidth: 80
          }
        ] : [
          {
            ...keyColumn('studentId', textColumn),
            title: 'Student ID',
            disabled: true,
            minWidth: 120,
            className: 'student-column'
          },
          {
            ...keyColumn('studentName', textColumn),
            title: 'Student Name',
            disabled: true,
            minWidth: 200,
            className: 'student-column'
          },
          {
            ...keyColumn('percentage', textColumn),
            title: '%',
            minWidth: 80
          },
          {
            ...keyColumn('score', textColumn),
            title: 'Score',
            minWidth: 80
          },
          {
            ...keyColumn('correct', textColumn),
            title: '#Correct',
            minWidth: 100
          },
          {
            ...keyColumn('blank', textColumn),
            title: 'Blank',
            minWidth: 80
          }
        ]
        
        // Add question columns
        for (let i = 0; i < numberOfQuestions; i++) {
          gridColumns.push({
            ...keyColumn(`q${i+1}`, textColumn),
            title: isMultipleMode ? getExcelColumnName(i + 6) : `Q${i+1}`, // Start from G (index 6)
            minWidth: 80
          })
        }
        
        setColumns(gridColumns)
        
        if (isMultipleMode) {
          // Create just 2 empty rows initially for multiple mode
          const emptyRows = Array(2).fill(null).map(() => {
            const emptyRow: RowData = {
              studentId: '',
              studentName: '',
              percentage: '',
              score: '',
              correct: '',
              blank: '',
            }
            for (let i = 0; i < numberOfQuestions; i++) {
              emptyRow[`q${i+1}`] = ''
            }
            return emptyRow
          })
          setData(emptyRows)
        } else {
          // Create row data for single mode
          const rowData = response.data.map((student: any) => {
            const row: RowData = {
              studentId: student.studentId,
              studentName: student.studentName,
              percentage: '',
              score: '',
              correct: '',
              blank: '',
            }
            
            // Add question columns
            for (let i = 0; i < numberOfQuestions; i++) {
              row[`q${i+1}`] = ''
            }
            
            return row
          })
          
          // Add key row at the top for single mode
          const keyRow: RowData = {
            studentId: 'Key',
            studentName: '',
            percentage: '40',
            score: '40',
            correct: '',
            blank: '',
          }
          
          // Add empty values for question columns in key row
          for (let i = 0; i < numberOfQuestions; i++) {
            keyRow[`q${i+1}`] = ''
          }
          
          setData([keyRow, ...rowData])
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch students:', error)
        toast.error("Failed to load student data")
        setLoading(false)
      }
    }

    if (open) {
      fetchStudents()
    }
  }, [courseId, open, numberOfQuestions, isMultipleMode])

  const restoreStudentInfo = () => {
    if (data.length < 2 || originalStudentData.length === 0) return
    
    // Create a copy of the current data
    const newData = [...data]
    
    // Skip the key row (index 0)
    for (let i = 1; i < newData.length && i - 1 < originalStudentData.length; i++) {
      const student = originalStudentData[i - 1]
      newData[i] = {
        ...newData[i],
        studentId: student.id,
        studentName: student.name
      }
    }
    
    setData(newData)
    toast.success("Student information restored")
  }

  const handleSave = async () => {
    try {
      // First restore student info to ensure it's correct
      restoreStudentInfo()
      
      // Convert to array format for Excel
      const headerRow = columns.map(col => col.title)
      
      // Convert data to array format
      const rowsData = data.map(row => {
        return columns.map(col => row[col.key])
      })
      
      // Combine header and rows
      const excelData = [headerRow, ...rowsData]
      
      // Create Excel file
      const ws = XLSX.utils.aoa_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Assessment")
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      
      const formData = new FormData()
      formData.append("file", blob, `${type}-results.xlsx`)
      formData.append("courseId", courseId)
      formData.append("type", type)
      
      const response = await fetch("/api/assessment-upload", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save assessment data")
      }
      
      toast.success("Assessment data saved successfully")
      onOpenChange(false)
      window.location.reload()
    } catch (error) {
      console.error("Failed to save data:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save data")
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    
    // Get clipboard data
    const clipboardData = e.clipboardData
    const pastedText = clipboardData.getData('text')
    
    if (!pastedText) return
    
    // Parse the pasted data
    const rows = pastedText.split(/\r?\n/).filter(row => row.trim())
    if (rows.length === 0) return

    if (isMultipleMode) {
      // In multiple mode, process all rows from Excel
      const processedRows = rows.map(row => {
        const columns = row.split('\t')
        const rowData: RowData = {
          studentId: columns[0] || '',
          studentName: columns[1] || '',
          percentage: columns[2] || '',
          score: columns[3] || '',
          correct: columns[4] || '',
          blank: columns[5] || '',
        }
        
        // Add question columns
        for (let i = 0; i < numberOfQuestions; i++) {
          rowData[`q${i+1}`] = columns[i + 6] || ''
        }
        
        return rowData
      })

      // In multiple mode, just replace all data with pasted data
      setData(processedRows)
      toast.success("Data pasted successfully")
      return
    }

    // Single mode - existing logic
    // Check if first row is a header by looking for common header terms
    const firstRow = rows[0].toLowerCase()
    const isHeader = firstRow.includes('student') || 
                    firstRow.includes('name') || 
                    firstRow.includes('id') || 
                    firstRow.includes('%') ||
                    firstRow.includes('score') ||
                    firstRow.includes('q1') ||
                    firstRow.includes('q2')

    // Process rows, skipping header if detected
    const processedRows = (isHeader ? rows.slice(1) : rows).map(row => {
      const columns = row.split('\t')
      // Only take the answer columns (Q1, Q2, etc.) - typically starting from index 6
      return columns.slice(6) // Skip everything before Q1
    }).filter(row => row.length > 0) // Ensure we only keep non-empty rows
    
    // Create a copy of the current data
    const newData = [...data]
    
    // Get the selected cell position from the grid
    const selectedCell = gridRef.current?.getSelectedCell()
    if (!selectedCell) return
    
    const { row: startRow } = selectedCell
    
    // Never paste into the key row (index 0)
    if (startRow === 0) {
      toast.error("Cannot paste into the key row. Please select a student row.")
      return
    }
    
    // Update data with pasted values, preserving all existing data except question answers
    for (let i = 0; i < processedRows.length && startRow + i < newData.length; i++) {
      const answerData = processedRows[i]
      const rowIndex = startRow + i
      
      // Skip the key row (index 0)
      if (rowIndex === 0) continue
      
      // Create a copy of the current row
      const updatedRow = { ...newData[rowIndex] }
      
      // Only update the question answer columns (Q1, Q2, etc.)
      for (let q = 1; q <= Math.min(numberOfQuestions, answerData.length); q++) {
        const qKey = `q${q}`
        updatedRow[qKey] = answerData[q-1] || ''
      }
      
      // Update the row in the data
      newData[rowIndex] = updatedRow
    }
    
    // Update the state
    setData(newData)
    toast.success("Answer data pasted successfully")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{type} Results Entry</span>
            <div className="flex items-center gap-2">
              <Button 
                variant={!isMultipleMode ? "default" : "outline"}
                onClick={() => setIsMultipleMode(false)}
                size="sm"
              >
                Single Entry
              </Button>
              <Button 
                variant={isMultipleMode ? "default" : "outline"}
                onClick={() => setIsMultipleMode(true)}
                size="sm"
              >
                Multiple Entry
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mb-3">
          <p className="font-medium text-blue-800">
            Instructions:
          </p>
          <ol className="text-sm text-gray-600 list-decimal pl-5 mt-1">
            {isMultipleMode ? (
              <>
                <li>Copy entire data from Excel including student info (Ctrl+A, Ctrl+C)</li>
                <li>Click in the empty spreadsheet below and paste (Ctrl+V)</li>
              </>
            ) : (
              <>
                <li>Copy data from Excel (Ctrl+A, Ctrl+C)</li>
                <li>Click in the spreadsheet below and paste (Ctrl+V)</li>
                <li>If student info is overwritten, click "Restore Student Info"</li>
              </>
            )}
            <li>Click "Save Results" when done</li>
          </ol>
          {!isMultipleMode && (
            <div className="mt-2">
              <Button 
                onClick={restoreStudentInfo} 
                variant="default"
                className="w-full"
              >
                Restore Student Info
              </Button>
            </div>
          )}
        </div>
        
        <div className="spreadsheet-container border border-gray-200 rounded overflow-auto" style={{ height: '500px' }}>
          <style jsx global>{`
            .student-column {
              background-color: #f0f7ff !important;
              font-weight: bold !important;
            }
            .dgc-cell--disabled {
              background-color: #f0f7ff !important;
            }
            .dgc-header-cell {
              background-color: #2c3e50 !important;
              color: white !important;
              font-weight: bold !important;
            }
          `}</style>
          
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading student data...</p>
            </div>
          ) : (
            <DataSheetGrid
              value={data}
              onChange={setData}
              columns={columns}
              lockRows={!isMultipleMode}
              rowHeight={35}
              headerRowHeight={40}
              addRowsComponent={() => null}
              autoAddRow={false}
              ref={gridRef}
            />
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Results
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 