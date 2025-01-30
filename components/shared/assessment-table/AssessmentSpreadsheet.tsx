'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { getAssessmentStudents } from "@/services/assessment.action"
import { HotTable } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import 'handsontable/dist/handsontable.full.min.css'
import { toast } from "sonner"


// Register Handsontable modules
registerAllModules()

interface AssessmentSpreadsheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
  courseId: string
  type: string
  numberOfQuestions: number
}

export function AssessmentSpreadsheet({ 
  open, 
  onOpenChange, 
  onSave, 
  courseId, 
  type,
  numberOfQuestions 
}: AssessmentSpreadsheetProps) {
  const [students, setStudents] = useState<any[]>([])
  const hotRef = useRef<any>(null)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await getAssessmentStudents(courseId)
        const spreadsheetData = [
          ['Student ID', 'Student Name', '%perc', 'score', '#correct', 'Blank', ...Array(numberOfQuestions).fill('Qn')], // Custom headers
          ['Keys', 'Keys', 'Keys', 'Keys', 'Keys', 'Keys', ...Array(numberOfQuestions).fill('sc')], // Buffer row
          ...data.data.map((student: any) => [
            student.studentId,
            student.studentName,
            '',
            '',
            '',
            '',
            ...Array(numberOfQuestions).fill('')
          ])
        ]
        setStudents(spreadsheetData)
      } catch (error) {
        console.error('Failed to fetch students:', error)
      }
    }

    if (open) {
      fetchStudents()
    }
  }, [courseId, open, numberOfQuestions])

  // Custom column headers
  const customHeaders = [
    'Student ID',
    'Student Name',
    '%perc',
    'score',
    '#correct',
    'Blank',
    ...Array(numberOfQuestions).fill(0).map((_, i) => `Qn`)
  ]

  const settings = {
    data: students,
    colHeaders: true,  // This will show A,B,C... automatically
    rowHeaders: true,
    height: 'auto',
    maxHeight: 500,
    width: '100%',
    maxWidth: '60vw',    // Limit spreadsheet width to 60% of viewport
    licenseKey: 'non-commercial-and-evaluation',
    readOnly: false,
    rowHeaderWidth: 50,
    colWidths: 150,
    manualColumnResize: true,
    manualRowResize: true,
    renderAllRows: true,
    fixedRowsTop: 1,
    autoColumnSize: true,
    autoRowSize: true,
    columnSorting: false,
    contextMenu: true,
    cells: function(row: number, col: number) {
      const cellProperties: any = {}
      
      // First row (headers) styling
      if (row === 0) {
        cellProperties.readOnly = true
        cellProperties.className = 'buffer-row'
      }
      
      // Style first 6 columns (A-F)
      if (col < 6) {
        if (row > 0) { // For data rows
          cellProperties.readOnly = true
          if (col < 2) { // Only Student ID and Name columns
            cellProperties.className = 'student-data'
          }
        }
      }
      
      return cellProperties
    },
    afterGetColHeader: function(col: number, TH: HTMLTableCellElement) {
      TH.className = 'black-header'
    },
    afterGetRowHeader: function(row: number, TH: HTMLTableCellElement) {
      TH.className = 'row-header'
    }
  }

  const handleSave = async () => {
    const hot = hotRef.current?.hotInstance
    const data = hot?.getData()
    
    try {
      const response = await fetch('/api/assessment-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          type,
          data
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save assessment data')
      }

      const result = await response.json()
      console.log('Save successful:', result)
      onOpenChange(false)  // Close dialog on success
      toast.success("Assessment data saved successfully")
    } catch (error) {
      console.error('Save error:', error)
      toast.error("Failed to save assessment data")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw]">  {/* Limit dialog width to 70% of viewport */}
        <DialogHeader>
          <DialogTitle>{type} Results Entry</DialogTitle>
        </DialogHeader>
        
        <div className="spreadsheet-container">
          <style jsx global>{`
            .black-header {
              background: black !important;
              color: white !important;
              font-weight: bold !important;
            }
            .buffer-row {
              background: #f5f5f5 !important;
              font-weight: bold !important;
            }
            .student-data {
              background: #f0f7ff !important;
            }
            .handsontable td {
              font-size: 14px;
            }
          `}</style>
          
          <HotTable {...settings} ref={hotRef} />
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