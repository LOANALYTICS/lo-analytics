'use client'

import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash, Upload, Plus, X, Loader2Icon } from 'lucide-react'
import { AssessmentSpreadsheet } from './AssessmentSpreadsheet'
import { updateBenchmark, getAssessmentByCourse } from '@/services/assessment.action'

interface Assessment {
  id: string;
  type: string;
  clos: {
    [key: string]: number[];
  };
  weight: number;
}

interface AssessmentTableProps {
  onSave: (data: Assessment[]) => void;
  saving: boolean;
  onUpload: (type: string) => void;
  numberOfClos: number;
  courseId: string;
}

// Modify the DEFAULT_ASSESSMENT to be a function that creates dynamic CLOs
const createDefaultAssessment = (numberOfClos: number) => {
  const clos = Array.from({ length: numberOfClos }, (_, i) => `clo${i + 1}`)
    .reduce((acc, clo) => {
      acc[clo] = [];
      return acc;
    }, {} as Record<string, number[]>);

  return {
    id: crypto.randomUUID(),
    type: '',
    clos,
    weight: 0
  };
};

// Modify the getCLOKeys function
const getCLOKeys = (assessments: Assessment[], numberOfClos: number): string[] => {
  // Simply create CLO keys based on numberOfClos
  return Array.from({ length: numberOfClos }, (_, i) => `clo${i + 1}`);
};

export default function AssessmentTable({ onSave, saving, onUpload, numberOfClos, courseId }: AssessmentTableProps) {
  const [spreadsheetType, setSpreadsheetType] = useState<string | null>(null);
  const [spreadsheetWeight, setSpreadsheetWeight] = useState<number | null>(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  
  // Benchmark state
  const [isEditingBenchmark, setIsEditingBenchmark] = useState(false);
  const [benchmarkValue, setBenchmarkValue] = useState('');
  const [currentBenchmark, setCurrentBenchmark] = useState(0);
  const [isSavingBenchmark, setIsSavingBenchmark] = useState(false);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);

  // Load assessment data and benchmark
  useEffect(() => {
    const loadAssessmentData = async () => {
      try {
        setLoading(true);
        const result = await getAssessmentByCourse(courseId);
        console.log(result, "result");
        setExists(result.exists);
        
        if (result.success && result.data) {
          // Load benchmark
          if (result.data.benchmark) {
            setCurrentBenchmark(result.data.benchmark);
          }
          
          // Load assessments
          if (result.data.assessments && result.data.assessments.length > 0) {
            const formattedData = result.data.assessments.map((item: any) => {
              const updatedClos = { ...item.clos };
              // Ensure all CLOs up to numberOfClos exist
              for (let i = 1; i <= numberOfClos; i++) {
                const cloKey = `clo${i}`;
                if (!updatedClos[cloKey]) {
                  updatedClos[cloKey] = [];
                }
              }
              return {
                id: item.id || item._id?.toString(),
                type: item.type,
                clos: updatedClos,
                weight: item.weight
              };
            });
            setAssessments(formattedData);
          } else {
            setAssessments([createDefaultAssessment(numberOfClos)]);
          }
        } else {
          setAssessments([createDefaultAssessment(numberOfClos)]);
        }
      } catch (error) {
        console.error('Error loading assessment data:', error);
        setAssessments([createDefaultAssessment(numberOfClos)]);
      } finally {
        setLoading(false);
      }
    };
    
    if (courseId) {
      loadAssessmentData();
    }
  }, [courseId, numberOfClos]);
  console.log((assessments), ":skd");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [tempInputs, setTempInputs] = useState<{ [key: string]: string }>({});
  const [spreadsheetOpen, setSpreadsheetOpen] = useState(false);

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

  const cloKeys = getCLOKeys(assessments, numberOfClos);

  const handleCLOInput = (id: string, clo: string, value: string) => {

    const number = parseInt(value.trim()); 

    if (!isNaN(number)) {
      setAssessments(prev => {
        const updatedAssessments = prev.map(assessment => {
          if (assessment.id === id) {
            if (!assessment.clos[clo].includes(number)) {
              console.log(`Adding number ${number} to ${clo}`); 
              return {
                ...assessment,
                clos: {
                  ...assessment.clos,
                  [clo]: [...assessment.clos[clo], number] 
                }
              };
            } else {
              console.warn(`Number ${number} already exists in ${clo}`);
            }
          }
          return assessment;
        });
        console.log('Updated Assessments:', updatedAssessments);
        return updatedAssessments;
      });
      return ''; 
    } else {
      console.warn(`Invalid number: ${value}`); 
    }

    return value;
  };

  const addNewRow = () => {
    setAssessments(prev => {
      const uniqueId = crypto.randomUUID();
      return [...prev, createDefaultAssessment(numberOfClos)];
    });
  };

  const deleteSelectedRows = () => {
    setAssessments(prev => {
      const updatedAssessments = prev.filter(assessment => !selectedRows.includes(assessment.id));
      if (updatedAssessments.length === 0) {
        return [createDefaultAssessment(numberOfClos)]; 
      }
      return updatedAssessments;
    });
    setSelectedRows([]);
  };

  // Benchmark validation and handlers
  const isValidBenchmark = benchmarkValue !== '' && 
    !isNaN(Number(benchmarkValue)) && 
    Number(benchmarkValue) >= 0 && 
    Number(benchmarkValue) <= 100;

  const handleSaveBenchmark = async () => {
    if (isValidBenchmark) {
      setIsSavingBenchmark(true);
      try {
        const result = await updateBenchmark(courseId, Number(benchmarkValue));
        if (result.success) {
          setCurrentBenchmark(Number(benchmarkValue));
          setBenchmarkValue('');
          setIsEditingBenchmark(false);
        } else {
          console.error('Failed to save benchmark:', result.message);
        }
      } catch (error) {
        console.error('Error saving benchmark:', error);
      } finally {
        setIsSavingBenchmark(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2Icon className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="">
    {
      exists ? (
        <>
        <div className='flex justify-between items-center mb-2'>
       <div className="flex items-center gap-4">
         <div className="flex items-center gap-2">
           <span className="text-sm font-medium">Benchmark:</span>
           {isEditingBenchmark ? (
             <div className="flex items-center gap-2">
               <input
                 type="number"
                 value={benchmarkValue}
                 onChange={(e) => setBenchmarkValue(e.target.value)}
                 min="0"
                 max="100"
                 className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                 placeholder="0-100"
               />
               <button
                 onClick={handleSaveBenchmark}
                 className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                 disabled={!isValidBenchmark || isSavingBenchmark}
               >
                 {isSavingBenchmark ? (
                   <Loader2Icon className="w-4 h-4 animate-spin" />
                 ) : (
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                 )}
               </button>
               <button
                 onClick={() => setIsEditingBenchmark(false)}
                 className="p-1 text-gray-500 hover:text-gray-700"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
           ) : (
             <div className="flex items-center gap-2">
               <span className="text-sm font-semibold text-blue-600">{currentBenchmark}%</span>
               <button
                 onClick={() => setIsEditingBenchmark(true)}
                 className="p-1 text-gray-500 hover:text-gray-700"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                 </svg>
               </button>
             </div>
           )}
         </div>
       </div>
     <Button
           variant="default"
           className='w-28 text-[13px] p-1'
           size="xs"
           onClick={() => onSave(assessments)}
         >
           {saving ? <Loader2Icon className='animate-spin text-white h-6 w-6' /> : 'Save Changes'}
         </Button>
 
     </div>
 
      
         <div className="border-2 border-black rounded-lg">
           <Table>
           <TableHeader>
             <TableRow>
               <TableHead className="w-[50px] border-b border-black">
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
               <TableHead className='border-b border-r border-black'>Assessment Type</TableHead>
               {cloKeys.map((clo) => (
                 <TableHead key={clo} className='border-b border-r border-black'>
                   {clo.toUpperCase()}
                 </TableHead>
               ))}
               <TableHead className='border-b border-r border-black'>Weight (%)</TableHead>
               <TableHead className='border-b border-black'>Actions</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {assessments.map((assessment) => (
               <TableRow key={assessment.id} className='border-b border-black'>
                 <TableCell className='w-10 py-0 '>
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
                 <TableCell className='py-0  border-r border-black'>
                   <Input
                     className='h-8 border-none bg-transparent focus-visible:ring-0  focus-visible:ring-offset-0'
                     value={assessment.type}
                     placeholder='Enter Assessment Type'
                     onChange={(e) => setAssessments(prev => prev.map(a =>
                       a.id === assessment.id ? { ...a, type: e.target.value } : a
                     ))}
                   />
                 </TableCell>
                 {cloKeys.map((clo) => (
                   <TableCell key={clo} className='py-0 border-b border-r border-black'>
                     <div className="flex items-center flex-wrap gap-1 p-1  min-h-[40px]">
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
                         className=" h-8 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-0 flex-1 min-w-[60px]"
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
 
                             const trimmedInputValue = inputValue.trim();
 
                             const number = parseInt(trimmedInputValue);
 
                             if (!isNaN(number)) {
                               const result = handleCLOInput(
                                 assessment.id,
                                 clo,
                                 trimmedInputValue
                               );
 
                               if (result === '') {
                                 setTempInputs(prev => ({
                                   ...prev,
                                   [`${assessment.id}-${clo}`]: ''
                                 }));
                               }
                             } else {
                               console.warn(`Invalid number: ${trimmedInputValue}`);
                             }
                           }
                         }}
                       />
                     </div>
                   </TableCell>
                 ))}
                 <TableCell className='py-0 border-r border-black '>
                   <Input
                         className="h-8 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-0 flex-1 min-w-12 "
 
                     type="number"
                     value={assessment.weight}
                     onChange={(e) => setAssessments(prev => prev.map(a =>
                       a.id === assessment.id ? { ...a, weight: Number(e.target.value) } : a
                     ))}
                   />
                 </TableCell>
                 <TableCell className='py-0'>
                   <div className="flex gap-2">
                     <Button className='border-none p-2' variant="outline" size="xs" onClick={() => onUpload(assessment.type)}>
                       <Upload className="h-3 w-3 " />
                     </Button>
                     <Button 
                       variant="outline" 
                       className='border-none p-2'
                       size="xs" 
                       onClick={() => {
                         setSpreadsheetOpen(true)
                         setSpreadsheetType(assessment.type)
                         setSpreadsheetWeight(assessment.weight)
                         setSelectedAssessmentId(assessment.id)
                       }}
                     >
                       <Plus className="h-2 w-2" />
                     </Button>
                   </div>
                 </TableCell>
               </TableRow>
             ))}
             <TableRow className='border-b  border-black font-semibold'>
               <TableCell colSpan={cloKeys.length + 2} className='py-4 border-r border-black'>
                 Total
               </TableCell>
               <TableCell colSpan={2} className='py-0 font-semibold '>
                 <span className=' px-3 py-2 rounded-lg -ml-2 font-bold'>
                 {assessments.reduce((sum, assessment) => sum + assessment.weight, 0)}
                 </span>
               </TableCell>
             </TableRow>
           </TableBody>
         </Table>
         </div>
 
       <div className="flex justify-between items-center mt-2">
         <div className='flex gap-2 items-center'>
         <Button onClick={addNewRow} variant="outline" size="xs" className='flex items-center gap-1' >
           <Plus className="h-3 w-3 p-px" />
           <p className='text-xs mt-0.5 font-semibold'>Add Row</p>
         </Button>
           
               {selectedRows.length > 0 && (
                 <div className="flex justify-end">
                   <Button variant="destructive" onClick={deleteSelectedRows} size="xs" className='flex items-center gap-1'>
                     <Trash className="h-3 w-3 p-px " />
                     <p className='text-xs mt-0.5 font-semibold'>Delete Selected</p>
                   </Button>
                 </div>
               )}
           
 
         </div>
      
 
 
       
       </div>
 
       <AssessmentSpreadsheet
         open={spreadsheetOpen}
         onOpenChange={setSpreadsheetOpen}
         onSave={(data) => {
           console.log('Spreadsheet data:', data)
           setSpreadsheetOpen(false)
         }}
         
         courseId={courseId}
         type={spreadsheetType || ''}
         weight={spreadsheetWeight || 0}
         numberOfQuestions={
           selectedAssessmentId 
             ? Object.values(assessments.find(a => a.id === selectedAssessmentId)?.clos || {}).flat().length 
             : 0
         }
       />
        </>
       ): (
        <div className="flex justify-center items-center py-8">
          <p className="text-sm text-gray-500">Please configure the students and CLO mappings first</p>
        </div>
      ) 
    }
    </div>
  );
} 