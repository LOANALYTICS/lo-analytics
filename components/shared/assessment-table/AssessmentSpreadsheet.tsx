'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { getAssessmentStudents } from "@/services/assessment.action"
import { toast } from "sonner"
import * as XLSX from 'xlsx'
import { DataSheetGrid, textColumn, keyColumn } from 'react-datasheet-grid'
import 'react-datasheet-grid/dist/style.css'
import { Loader2 } from "lucide-react"

interface AssessmentSpreadsheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
  courseId: string
  type: string
  weight: number
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
  q1: string
  [key: string]: string // For dynamic question columns
}

export function AssessmentSpreadsheet({
  open,
  onOpenChange,
  onSave,
  courseId,
  type,
  weight,
  numberOfQuestions
}: AssessmentSpreadsheetProps) {
  const [data, setData] = useState<RowData[]>([])
  const [originalStudentData, setOriginalStudentData] = useState<Student[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isMultipleMode, setIsMultipleMode] = useState(false)
  const gridRef = useRef<any>(null)
  const [rowCount, setRowCount] = useState(0)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const response = await getAssessmentStudents(courseId)


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

        // Create columns and header row for multiple mode from a single source of truth
        const multipleModeColumnsConfig: { key: string; title: string; minWidth: number }[] = [
          { key: 'studentName', title: 'Student Name', minWidth: 200 },
          { key: 'studentId', title: 'ID Number', minWidth: 120 },
          { key: 'percentage', title: '%', minWidth: 80 },
          { key: 'score', title: 'Score', minWidth: 80 },
          { key: 'correct', title: '#Correct', minWidth: 100 },
          { key: 'blank', title: 'Blank', minWidth: 80 },
        ]
        // Add question columns
        for (let i = 0; i < numberOfQuestions; i++) {
          multipleModeColumnsConfig.push({
            key: `q${i + 1}`,
            title: `Q ${i + 1}`,
            minWidth: 80
          })
        }

        const gridColumns: any[] = isMultipleMode ? multipleModeColumnsConfig.map((col, idx) => ({
          ...keyColumn(col.key, textColumn),
          title: getExcelColumnName(idx),
          minWidth: col.minWidth,
          // Make first and second columns uneditable
          disabled: col.key === 'studentName' || col.key === 'studentId',
        })) : [
          {
            ...keyColumn('studentName', textColumn),
            title: 'A',
            disabled: true,
            minWidth: 200,
            className: 'student-column'
          },
          {
            ...keyColumn('studentId', textColumn),
            title: 'B',
            disabled: true,
            minWidth: 120,
            className: 'student-column'
          },
          {
            ...keyColumn('percentage', textColumn),
            title: 'C',
            minWidth: 0,
            width: 0,
            hidden: true
          },
          {
            ...keyColumn('score', textColumn),
            title: 'D',
            minWidth: 0,
            width: 0,
            hidden: true
          },
          {
            ...keyColumn('correct', textColumn),
            title: 'E',
            minWidth: 0,
            width: 0,
            hidden: true
          },
          {
            ...keyColumn('blank', textColumn),
            title: 'F',
            minWidth: 0,
            width: 0,
            hidden: true
          },
          {
            ...keyColumn('q1', textColumn),
            title: 'G',
            minWidth: 80
          }
        ]

        // Remove the additional column adding logic for single mode

        setColumns(gridColumns)

        if (isMultipleMode) {
          // Create header row for multiple mode from config
          const headerRow: RowData = {} as RowData
          multipleModeColumnsConfig.forEach(col => {
            headerRow[col.key] = col.title
          })

          // Insert key row after header
          const keyRow: RowData = {} as RowData
          multipleModeColumnsConfig.forEach((col) => {
            if (col.key === 'studentName') keyRow[col.key] = 'Key'
            else if (col.key === 'score' || col.key === 'correct') keyRow[col.key] = String(numberOfQuestions)
            else keyRow[col.key] = ''
          })

          // Map student data to rows
          const studentRows: RowData[] = originalStudentData.map(student => {
            const row: RowData = {} as RowData
            multipleModeColumnsConfig.forEach(col => {
              if (col.key === 'studentName') row[col.key] = student.name
              else if (col.key === 'studentId') row[col.key] = student.id
              else row[col.key] = ''
            })
            return row
          })

          setData([headerRow, keyRow, ...studentRows])
        } else {
          // Create header row with Student Name first
          const headerRow: RowData = {
            studentName: 'Student Name',
            studentId: 'Student ID',
            percentage: '%',
            score: 'Score',
            correct: '#Correct',
            blank: 'Blank',
            q1: 'Q1'
          }

          // Create key row
          const keyRow: RowData = {
            studentName: '',
            studentId: 'Key',
            percentage: String(weight),
            score: String(weight),
            correct: String(weight),
            blank: String(weight),
            q1: String(weight)
          }

          // Format student data with name first
          const rowData = response.data.map((student: any) => ({
            studentName: student.studentName,
            studentId: student.studentId,
            percentage: '',
            score: '',
            correct: '',
            blank: '',
            q1: ''
          }))

          setData([headerRow, keyRow, ...rowData])
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



  const handleSave = async () => {
    try {
      setSaving(true)
      if (isMultipleMode) {
        // For multiple mode, send data directly as JSON
        const rowsData = data.map(row => {
          return [
            row.studentName,
            row.studentId,
            row.percentage,
            row.score,
            row.correct,
            row.blank,
            ...Array.from({ length: numberOfQuestions }, (_, i) => row[`q${i + 1}`] || '')
          ]
        })

        // Console log the data being sent to multiple mode API
        console.log('=== FRONTEND DATA TO ASSESSMENT-MULTIPLE ===');
        console.log('rowsData:', rowsData);
        console.log('courseId:', courseId);
        console.log('type:', type);

        // Send to new multiple mode API
        const response = await fetch("/api/assessment-multiple", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
            type,
            data: rowsData
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to save assessment data")
        }

        toast.success("Assessment data processed successfully")

      } else {
        // Format data for assessment-direct API
        const formattedData = [
          // Row 1: Headers
          ['Student Name', 'Student ID', '%', 'Score', '#Correct', 'Blank', 'Q1'],
          // Row 2: Key row with total marks (40) in Q1
          ['', 'Key', String(weight), String(weight), String(weight), String(weight), String(weight)],
          // Row 3+: Student data with ID in second column
          ...data.slice(2).map(row => [
            row.studentName,
            row.studentId,  // ID must be in second column for API
            row.percentage,
            row.score,
            row.correct,
            row.blank,
            row.q1
          ])
        ]



        const response = await fetch("/api/assessment-direct", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
            type,
            data: formattedData
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to save assessment data")
        }
      }
      toast.success("Assessment data saved successfully")

      setTimeout(() => {
        onOpenChange(false)
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error("Failed to save data:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save data")
    } finally {
      setSaving(false)
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
          q1: ''
        }

        // Add question columns
        for (let i = 0; i < numberOfQuestions; i++) {
          rowData[`q${i + 1}`] = columns[i + 6] || ''
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
        updatedRow[qKey] = answerData[q - 1] || ''
      }

      // Update the row in the data
      newData[rowIndex] = updatedRow
    }

    // Update the state
    setData(newData)
    toast.success("Answer data pasted successfully")
  }

  const loadMoreRows = () => {
    if (isMultipleMode) {
      const newRows = Array(20).fill(null).map(() => { // Load 20 more rows
        const emptyRow: RowData = {
          studentId: '',
          studentName: '',
          percentage: '',
          score: '',
          correct: '',
          blank: '',
          q1: ''
        }
        for (let i = 0; i < numberOfQuestions; i++) {
          emptyRow[`q${i + 1}`] = ''
        }
        return emptyRow
      })
      setData(prevData => [...prevData, ...newRows])
      setRowCount(prevCount => prevCount + newRows.length)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw]">
        <DialogHeader className="pr-8">
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



        <div className="spreadsheet-container border border-gray-200 rounded overflow-auto" style={{ height: '500px' }} onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          if (scrollHeight - scrollTop <= clientHeight + 10) { // Load more when near the bottom
            loadMoreRows();
          }
        }}>
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
              autoAddRow={true}
              ref={gridRef}
              height={498.5}
            />
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Results
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 