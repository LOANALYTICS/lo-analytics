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
    const lastChar = value[value.length - 1];
    
    if (lastChar === ',' || lastChar === ' ') {
      const numberStr = value.slice(0, -1).trim();
      const number = parseInt(numberStr);
      
      if (!isNaN(number)) {
        setAssessments(prev => prev.map(assessment => {
          if (assessment.id === id) {
            if (!assessment.clos[clo].includes(number)) {
              return {
                ...assessment,
                clos: {
                  ...assessment.clos,
                  [clo]: [...assessment.clos[clo], number]
                }
              };
            }
          }
          return assessment;
        }));
      }
      return '';
    }
    
    return value;
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
    setAssessments(prev => prev.filter(assessment => !selectedRows.includes(assessment.id)));
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
                <TableCell>
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
                <TableCell>
                  <Input 
                    value={assessment.type}
                    onChange={(e) => setAssessments(prev => prev.map(a => 
                      a.id === assessment.id ? { ...a, type: e.target.value } : a
                    ))}
                  />
                </TableCell>
                {cloKeys.map((clo) => (
                  <TableCell key={clo}>
                    <div className="flex flex-wrap gap-1 p-1 border rounded min-h-[40px]">
                      {assessment.clos[clo as keyof Assessment['clos']].map((num, idx) => (
                        <span key={idx} className="bg-blue-100 px-2 py-1 rounded text-sm flex items-center gap-1">
                          {num}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-red-500"
                            onClick={() => removeCLONumber(assessment.id, clo, idx)}
                          />
                        </span>
                      ))}
                      <Input 
                        className="border-none focus-visible:ring-0 p-1 flex-1 min-w-[60px]"
                        placeholder="Enter number"
                        value={tempInputs[`${assessment.id}-${clo}`] || ''}
                        onChange={(e) => {
                          setTempInputs(prev => ({
                            ...prev,
                            [`${assessment.id}-${clo}`]: e.target.value
                          }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                            e.preventDefault();
                            handleCLOInput(
                              assessment.id, 
                              clo as keyof Assessment['clos'], 
                              tempInputs[`${assessment.id}-${clo}`] || ''
                            );
                          }
                        }}
                      />
                    </div>
                  </TableCell>
                ))}
                <TableCell>
                  <Input 
                    type="number"
                    value={assessment.weight}
                    onChange={(e) => setAssessments(prev => prev.map(a => 
                      a.id === assessment.id ? { ...a, weight: Number(e.target.value) } : a
                    ))}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <Button variant="outline" size="sm">
                      Insert
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