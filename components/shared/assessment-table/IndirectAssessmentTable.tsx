'use client'

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getIndirectAssessments, updateIndirectAssessments } from '@/services/assessment.action';
import { Pencil, Check } from 'lucide-react';

interface IndirectAssessment {
  clo: string;
  achievementRate: number | string;
  benchmark: string;
  achievementPercentage: number;
}

const generateEmptyAssessments = (count: number): IndirectAssessment[] => {
  return Array.from({ length: count }, (_, index) => ({
    clo: `CLO ${index + 1}`,
    achievementRate: '',
    benchmark: '80%',
    achievementPercentage: 0
  }));
};

const calculateAchievementPercentage = (rate: number | ''): number => {
  return rate === '' ? 0 : (rate / 5) * 100; // Assuming 5 is the max rate
};

const calculateOverall = (assessments: IndirectAssessment[]) => {
  const validAssessments = assessments.filter(a => a.achievementRate !== '');
  if (validAssessments.length === 0) {
    return {
      averageRate: '',
      averagePercentage: 0
    };
  }
  const totalRate = validAssessments.reduce((sum, assessment) => sum + (assessment.achievementRate as number), 0);
  const totalPercentage = validAssessments.reduce((sum, assessment) => sum + assessment.achievementPercentage, 0);
  return {
    averageRate: (totalRate / validAssessments.length).toFixed(1),
    averagePercentage: (totalPercentage / validAssessments.length).toFixed(1),
  };
};

export default function IndirectAssessmentTable({numberOfClos, courseId}: {numberOfClos: number, courseId: string}) {
  const [assessments, setAssessments] = useState<IndirectAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBenchmark, setEditingBenchmark] = useState(false);
  const [benchmarkInput, setBenchmarkInput] = useState('80%');

  useEffect(() => {
    const fetchIndirectAssessments = async () => {
      try {
        const response = await getIndirectAssessments(courseId);
        if (response.data && response.data.length > 0) {
          setAssessments(response.data);
          setBenchmarkInput(response.data[0]?.benchmark || '80%');
        } else {
          setAssessments(generateEmptyAssessments(numberOfClos));
          setBenchmarkInput('80%');
        }
      } catch (error) {
        console.error('Error fetching indirect assessments:', error);
        setAssessments(generateEmptyAssessments(numberOfClos));
        setBenchmarkInput('80%');
      }
    };
    fetchIndirectAssessments();
  }, [numberOfClos, courseId]);
console.log(assessments)
  const { averageRate, averagePercentage } = calculateOverall(assessments);

  const handleRateChange = (index: number, value: string) => {
    // Remove any leading zeros and handle empty input
    let processedValue = value.replace(/^0+(\d)/, '$1');
    
    // If the input is just "0", keep it
    if (value === "0") {
      processedValue = "0";
    }

    // Convert to number or keep empty
    const rate = processedValue === '' ? '' : parseFloat(processedValue);

    // Check if the rate is valid (between 0 and 5) or empty
    if ((typeof rate === 'number' && !isNaN(rate) && rate >= 0 && rate <= 5) || rate === '') {
      const updatedAssessments = assessments.map((assessment, i) => 
        i === index ? {
          ...assessment,
          achievementRate: rate,
          achievementPercentage: calculateAchievementPercentage(rate)
        } : assessment
      );
      setAssessments(updatedAssessments);
    }
  };

  const handleBenchmarkEdit = () => {
    setEditingBenchmark(true);
  };

  const handleBenchmarkSave = () => {
    setEditingBenchmark(false);
    setAssessments(assessments => assessments.map(a => ({ ...a, benchmark: benchmarkInput })));
  };

  const handleSave = async () => {
    // Check if any rate is empty
    const hasEmptyRates = assessments.some(assessment => assessment.achievementRate === '');
    
    if (hasEmptyRates) {
      toast.error("Please fill in all achievement rates before saving");
      return;
    }

    setLoading(true);
    try {
      // Convert all rates to numbers before saving
      const dataToSave = assessments.map(assessment => ({
        ...assessment,
        achievementRate: Number(assessment.achievementRate)
      }));

      const response = await updateIndirectAssessments(courseId, dataToSave);
      if (response.success) {
        toast.success(response.message);
      } else if (response.message.includes('Assessment not found')) {
        toast.error("Assessment Plan Not Found", {
          description: "Please initialize assessment plan first by adding assessment types.",
          action: {
            label: "Add student",
            onClick: () => window.location.href = `/dashboard/learning-outcomes/student-details/${courseId}`
          }
        });
      } else {
        toast.error("Failed to save", {
          description: response.message
        });
      }
    } catch (error) {
      console.error('Error saving indirect assessments:', error);
      toast.error("An unexpected error occurred", {
        description: "Please try again later"
      });
    } finally {
      setLoading(false);
    }
  };

  // const handleGenerate = async () => {
  //   try {
  //     const response = await fetch(`/api/generate-indirect-report/${courseId}`);
      
  //     if (!response.ok) {
  //       throw new Error('Failed to generate report');
  //     }

  //     const html = await response.text();
      
  //     // Generate PDF from HTML
  //     const html2pdf = (await import("html2pdf.js")).default;
  //     const fileName = `indirect-assessment-report-${courseId}`;
      
  //     const opt = {
  //       margin: [0.5, 0.5, 0.5, 0.5],  // Increased margins [top, left, bottom, right] in inches
  //       filename: `${fileName}.pdf`,
  //       image: { type: "jpeg", quality: 0.98 },
  //       html2canvas: { 
  //           scale: 2,  // Increased scale for better quality
  //           useCORS: true,
  //           logging: true
  //       },
  //       jsPDF: { 
  //           unit: "in", 
  //           format: "a4", 
  //           orientation: "portrait",
  //           hotfixes: ["px_scaling"]  // Better handling of pixel scaling
  //       }
  //     };

  //     // Create container for HTML
  //     const container = document.createElement("div");
  //     container.innerHTML = html;
  //     document.body.appendChild(container);

  //     // Generate and save PDF
  //     await html2pdf().set(opt).from(container).save();
      
  //     // Cleanup
  //     document.body.removeChild(container);
  //   } catch (error) {
  //     console.error('Error generating report:', error);
  //     toast.error("Failed to generate report");
  //   }
  // };

  return (
    <div className="border-2 border-black rounded-lg mt-4">
      <div className="sticky -top-[7px] z-10 bg-background rounded-lg flex justify-between items-center px-4 py-2 border-b-2 border-black">
        <h2 className="font-bold text-lg">Indirect Assessment</h2>
        <div className='flex gap-2'>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
          {/* <Button onClick={handleGenerate} variant="secondary">
            Generate Report
          </Button> */}
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>CLOs</TableHead>
            <TableHead>Achievement Rate</TableHead>
            <TableHead className="flex items-center gap-2">
              {editingBenchmark ? (
                <>
                  <Input
                    value={benchmarkInput}
                    onChange={e => setBenchmarkInput(e.target.value)}
                    className="w-20"
                  />
                  <Button size="icon" variant="ghost" onClick={handleBenchmarkSave}>
                    <Check size={16} />
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{benchmarkInput} %</span>
                  <Button size="icon" variant="ghost" onClick={handleBenchmarkEdit}>
                    <Pencil size={16} />
                  </Button>
                </div>
              )}
            </TableHead>
            <TableHead>Achievement Percentage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessments.map((assessment, index) => (
            <TableRow key={assessment.clo}>
              <TableCell>{assessment.clo}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={assessment.achievementRate}
                  onChange={(e) => handleRateChange(index, e.target.value)}
                  min={0}
                  max={5}
                  step="0.1"
                  placeholder="Enter rate"
                />
              </TableCell>
              <TableCell>{assessment.benchmark} %</TableCell>
              <TableCell>{assessment.achievementPercentage.toFixed(1)}%</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell>Overall</TableCell>
            <TableCell>{averageRate || '-'}</TableCell>
            <TableCell>{benchmarkInput} %</TableCell>
            <TableCell>{averagePercentage || '0'}%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}