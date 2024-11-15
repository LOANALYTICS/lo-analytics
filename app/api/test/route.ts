// app/api/protectedRoute/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateHTML } from '@/services/KR20GenerateHTML';
export async function GET(request: NextRequest) {
// Example data to test the HTML generation function
const htmlContent = generateHTML({
   groupedItemAnalysisResults :[
    {
      classification: "Poor (Bad) Questions",
      range: "0% to 100%",
      discriminationIndex: "DI <= 0.19",
      questions: [
        { question: "Q1", discIndex: -0.2, incorrectPercentage: 40, correctPercentage: 60 },
        { question: "Q2", discIndex: -0.3, incorrectPercentage: 50, correctPercentage: 50 }
      ]
    },
    {
      classification: "Very Difficult Questions",
      range: "0 to 20.99%",
      discriminationIndex: "DI -0.2 to >0.5",
      questions: [
        { question: "Q3", discIndex: 0.1, incorrectPercentage: 90, correctPercentage: 10 },
        { question: "Q4", discIndex: 0.15, incorrectPercentage: 85, correctPercentage: 15 }
      ]
    },
    {
      classification: "Difficult Questions",
      range: "21 to 30.99%",
      discriminationIndex: "DI -0.2 to >0.5",
      questions: [
        { question: "Q5", discIndex: 0.2, incorrectPercentage: 70, correctPercentage: 30 },
        { question: "Q6", discIndex: 0.25, incorrectPercentage: 68, correctPercentage: 32 }
      ]
    },
    {
      classification: "Good Questions",
      range: "31 to 70.99%",
      discriminationIndex: "DI -0.20 to >0.5",
      questions: [
        { question: "Q7", discIndex: 0.35, incorrectPercentage: 50, correctPercentage: 50 },
        { question: "Q8", discIndex: 0.4, incorrectPercentage: 45, correctPercentage: 55 }
      ]
    },
    {
      classification: "Easy Questions",
      range: "71 to 80.99%",
      discriminationIndex: "DI -0.2 to >0.5",
      recommendations: "Item should be revised before re-use.",
      questions: [
        { question: "Q9", discIndex: 0.45, incorrectPercentage: 20, correctPercentage: 80 },
        { question: "Q10", discIndex: 0.5, incorrectPercentage: 15, correctPercentage: 85 }
      ]
    },
    {
      classification: "Very Easy Questions",
      range: "81 to 100%",
      discriminationIndex: "0.2 to >0.5",
      recommendations: "Items should be rejected or needed to be revised.",
      questions: [
        { question: "Q11", discIndex: 0.55, incorrectPercentage: 10, correctPercentage: 90 },
        { question: "Q12", discIndex: 0.6, incorrectPercentage: 5, correctPercentage: 95 }
      ]
    },
    {
      classification: "Reliability",
      range: "",
      discriminationIndex: "",
      recommendations: "Exam is deemed to be acceptable.",
      questions: [
        { question: "KR20" }
      ]
    }
  ],
  
  KR_20: 0.85,
  gradeDistribution: [
    { grade: "A+", count: 10, studentPercentage: 20 },
    { grade: "A", count: 12, studentPercentage: 24 },
    { grade: "B+", count: 8, studentPercentage: 16 },
    { grade: "B", count: 15, studentPercentage: 30 },
    { grade: "C+", count: 7, studentPercentage: 14 },
    { grade: "C", count: 5, studentPercentage: 10 },
    { grade: "D+", count: 3, studentPercentage: 6 },
    { grade: "D", count: 4, studentPercentage: 8 },
    { grade: "F", count: 1, studentPercentage: 2 }
  ],
  course: {
    name: "Mathematics 101",
    level: "Undergraduate",
    semester: "Spring 2023",
    coordinator: "Dr. Smith",
    code: "MATH101",
    creditHours: 3,
    studentsNumber: 50,
    studentsWithdrawn: 1,
    studentsAbsent: 2,
    studentsAttended: 47,
    studentsPassed: 40
  },
  collegeInfo: {
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/a/ae/Najran_University_Logo.svg/220px-Najran_University_Logo.svg.png",
    college: {
      english: "English College Name",
      regional: "Regional College Name",
      university: "University Name"
    }
  }
});


// console.log(htmlContent);
  return new NextResponse(htmlContent);
}
