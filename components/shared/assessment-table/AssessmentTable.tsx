'use client'

import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash, Upload, Plus, X } from 'lucide-react'

// Default empty assessment structure should match the dummy data structure
const DEFAULT_ASSESSMENT = {
  id: '1',
  type: '',
  clos: {
    clo1: [],
    clo2: [],
    clo3: [],
    // This will be overridden by actual data structure if initialData exists
  },
  weight: 0
};

interface Assessment {
  id: string;
  type: string;
  clos: {
    clo1: number[];
    clo2: number[];
    clo3: number[];
  };
  weight: number;
}

interface AssessmentTableProps {
  initialData: Assessment[];
  onSave: (data: Assessment[]) => void;
}

// Get CLO keys dynamically from the first assessment or default assessment
const getCLOKeys = (assessments: Assessment[]): string[] => {
  const firstAssessment = assessments[0];
  return Object.keys(firstAssessment.clos).sort();
};

export default function AssessmentTable({ initialData, onSave }: AssessmentTableProps) {
  // Use initialData if it exists, otherwise use default empty assessment
  const [assessments, setAssessments] = useState<Assessment[]>(
    initialData.length > 0 ? initialData : [DEFAULT_ASSESSMENT]
  );
  console.log((assessments),":skd");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [tempInputs, setTempInputs] = useState<{ [key: string]: string }>({});

  const removeCLONumber = (id: string, clo: string, index: number) => {
    setAssessments(prev => prev.map(assessment => {
      if (assessment.id === id) {
        const newCLOs = [...assessment.clos[clo as keyof Assessment['clos']]];
        newCLOs.splice(index, 1);
        return {
          ...assessment,
          clos: {
            ...assessment.clos,
            [clo]: newCLOs
          }
        };
      }
      return assessment;
    }));
  };

  // Get CLO keys dynamically
  const cloKeys = getCLOKeys(assessments);

  const handleCLOInput = (id: string, clo: 'clo1' | 'clo2' | 'clo3', value: string) => {
    console.log(`Handling CLO Input for ID: ${id}, CLO: ${clo}, Value: ${value}`); // Debugging log

    const number = parseInt(value.trim()); // Parse the number directly from the trimmed input value
    console.log(`Parsed Number: ${number}`); // Debugging log

    if (!isNaN(number)) {
        setAssessments(prev => {
            const updatedAssessments = prev.map(assessment => {
                if (assessment.id === id) {
                    // Check if the number already exists in the CLO array
                    if (!assessment.clos[clo].includes(number)) {
                        console.log(`Adding number ${number} to ${clo}`); // Debugging log
                        return {
                            ...assessment,
                            clos: {
                                ...assessment.clos,
                                [clo]: [...assessment.clos[clo], number] // Add the new number
                            }
                        };
                    } else {
                        console.warn(`Number ${number} already exists in ${clo}`);
                    }
                }
                return assessment;
            });
            console.log('Updated Assessments:', updatedAssessments); // Debugging log
            return updatedAssessments;
        });
        return ''; // Clear the input
    } else {
        console.warn(`Invalid number: ${value}`); // Log if the number is invalid
    }

    return value; // Return the unchanged value if not a valid input
  };

  const addNewRow = () => {
    setAssessments(prev => {
      const uniqueId = crypto.randomUUID();  // Generate unique ID
      
      if (prev.length === 0) {
        return [...prev, { ...DEFAULT_ASSESSMENT, id: uniqueId }];
      }

      const newClos: Assessment['clos'] = Object.keys(prev[0].clos).reduce((acc, cloKey) => {
        acc[cloKey as keyof Assessment['clos']] = [];
        return acc;
      }, {} as Assessment['clos']);

      return [...prev, {
        id: uniqueId,  // Use unique ID instead of array length
        type: '',
        clos: newClos,
        weight: 0
      }];
    });
  };

  const deleteSelectedRows = () => {
    setAssessments(prev => {
      const updatedAssessments = prev.filter(assessment => !selectedRows.includes(assessment.id));
      // Ensure at least one empty row remains
      if (updatedAssessments.length === 0) {
        return [DEFAULT_ASSESSMENT]; // Add a new empty assessment row
      }
      return updatedAssessments;
    });
    setSelectedRows([]);
  };

  return (
    <div className="space-y-4">
      {selectedRows.length > 0 && (
        <div className="flex justify-end">
          <Button variant="destructive" onClick={deleteSelectedRows}>
            <Trash className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedRows.length === assessments.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRows(assessments.map(a => a.id));
                    } else {
                      setSelectedRows([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Assessment Type</TableHead>
              {cloKeys.map((clo) => (
                <TableHead key={clo}>
                  {clo.toUpperCase()}
                </TableHead>
              ))}
              <TableHead>Weight (%)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.map((assessment) => (
              <TableRow key={assessment.id}>
                <TableCell className='w-10 py-1'>
                  <Checkbox 
                    checked={selectedRows.includes(assessment.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRows(prev => [...prev, assessment.id]);
                      } else {
                        setSelectedRows(prev => prev.filter(id => id !== assessment.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className='py-1'>
                  <Input 
                    className='border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0'
                    value={assessment.type}
                    onChange={(e) => setAssessments(prev => prev.map(a => 
                      a.id === assessment.id ? { ...a, type: e.target.value } : a
                    ))}
                  />
                </TableCell>
                {cloKeys.map((clo) => (
                  <TableCell key={clo} className='py-1'>
                    <div className="flex items-center flex-wrap gap-1 p-1 border-l border-r min-h-[40px]">
                      {assessment.clos[clo as keyof Assessment['clos']].map((num, idx) => (
                        <span key={idx} className="bg-blue-100 group relative h-5 w-5 rounded text-xs flex items-center justify-center gap-1">
                          {num}
                          <X 
                            className="h-3 w-3 absolute -right-1 -top-1 cursor-pointer hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={() => removeCLONumber(assessment.id, clo, idx)}
                          />
                        </span>
                      ))}
                    <Input 
    className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-1 flex-1 min-w-[60px]"
    placeholder="Enter number"
    value={tempInputs[`${assessment.id}-${clo}`] || ''}
    onChange={(e) => {
        setTempInputs(prev => ({
            ...prev,
            [`${assessment.id}-${clo}`]: e.target.value
        }));
    }}
    onKeyDown={(e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const inputValue = tempInputs[`${assessment.id}-${clo}`] || '';
            console.log(`Input Value Before Processing: '${inputValue}'`); // Debugging log
            
            // Trim the input value to remove any leading/trailing whitespace
            const trimmedInputValue = inputValue.trim();
            console.log(`Trimmed Input Value: '${trimmedInputValue}'`); // Debugging log
            
            // Parse the number directly from the trimmed input value
            const number = parseInt(trimmedInputValue);
            console.log(`Parsed Number: ${number}`); // Debugging log

            if (!isNaN(number)) {
                const result = handleCLOInput(
                    assessment.id, 
                    clo as keyof Assessment['clos'], 
                    trimmedInputValue
                );

                console.log(`Result from handleCLOInput: ${result}`); // Debugging log

                // Clear the input after processing
                if (result === '') {
                    console.log(`Clearing input for ${assessment.id}-${clo}`); // Debugging log
                    setTempInputs(prev => ({
                        ...prev,
                        [`${assessment.id}-${clo}`]: ''
                    }));
                }
            } else {
                console.warn(`Invalid number: ${trimmedInputValue}`); // Log if the number is invalid
            }
        }
    }}
/>
                    </div>
                  </TableCell>
                ))}
                <TableCell className='py-1'>
                  <Input 
                    type="number"
                    value={assessment.weight}
                    onChange={(e) => setAssessments(prev => prev.map(a => 
                      a.id === assessment.id ? { ...a, weight: Number(e.target.value) } : a
                    ))}
                  />
                </TableCell>
                <TableCell className='py-1'>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <Button onClick={addNewRow}>
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>

        <Button 
          variant="default"
          onClick={() => onSave(assessments)}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
} 