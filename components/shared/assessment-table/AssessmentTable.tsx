'use client'

import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash, Upload, Plus } from 'lucide-react'

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

export default function AssessmentTable({ initialData, onSave }: AssessmentTableProps) {
  const [assessments, setAssessments] = useState<Assessment[]>(initialData);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [tempInputs, setTempInputs] = useState<{ [key: string]: string }>({});

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
    setAssessments(prev => [...prev, {
      id: (prev.length + 1).toString(),
      type: '',
      clos: {
        clo1: [],
        clo2: [],
        clo3: [],
      },
      weight: 0
    }]);
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
              <TableHead>CLOs1</TableHead>
              <TableHead>CLOs2</TableHead>
              <TableHead>CLOs3</TableHead>
              <TableHead>Weight</TableHead>
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
                {(['clo1', 'clo2', 'clo3'] as const).map((clo) => (
                  <TableCell key={clo}>
                    <div className="flex flex-wrap gap-1 p-1 border rounded">
                      {assessment.clos[clo].map((num, idx) => (
                        <span key={idx} className="bg-blue-100 px-2 py-1 rounded text-sm">
                          {num}
                        </span>
                      ))}
                      <Input 
                        className="border-none focus-visible:ring-0 p-1 flex-1 min-w-[60px]"
                        placeholder="Type & press comma"
                        value={tempInputs[`${assessment.id}-${clo}`] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.endsWith(',') || value.endsWith(' ')) {
                            const number = parseInt(value.slice(0, -1));
                            if (!isNaN(number) && !assessment.clos[clo].includes(number)) {
                              setAssessments(prev => prev.map(a => 
                                a.id === assessment.id 
                                  ? {
                                      ...a,
                                      clos: {
                                        ...a.clos,
                                        [clo]: [...a.clos[clo], number]
                                      }
                                    }
                                  : a
                              ));
                              setTempInputs(prev => ({
                                ...prev,
                                [`${assessment.id}-${clo}`]: ''
                              }));
                            }
                          } else {
                            setTempInputs(prev => ({
                              ...prev,
                              [`${assessment.id}-${clo}`]: value
                            }));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const value = tempInputs[`${assessment.id}-${clo}`];
                            const number = parseInt(value);
                            if (!isNaN(number) && !assessment.clos[clo].includes(number)) {
                              setAssessments(prev => prev.map(a => 
                                a.id === assessment.id 
                                  ? {
                                      ...a,
                                      clos: {
                                        ...a.clos,
                                        [clo]: [...a.clos[clo], number]
                                      }
                                    }
                                  : a
                              ));
                              setTempInputs(prev => ({
                                ...prev,
                                [`${assessment.id}-${clo}`]: ''
                              }));
                            }
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