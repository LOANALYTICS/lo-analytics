// src/app/api/upload-excel/route.ts
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { 
    extractQuestionAnswerKeys, 
    calculatePValues, 
    calculateQValues, 
    calculatePQValues, 
    calculateTotalPQValue, 
    extractStudentScores, 
    calculateStudentScoreVariance, 
    extractItemAnalysisData
} from '@/server/utils/kr-utils';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    // Convert the Blob to ArrayBuffer
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);

    // Check if "Result Grid" sheet exists
    const ResultsGridsheetName = 'Results Grid';
    const itemAnalysisSheetName = 'Item Analysis';
    if (!workbook.Sheets[ResultsGridsheetName]) {
      return NextResponse.json({ message: `Sheet "${ResultsGridsheetName}" not found` }, { status: 404 });
    }

    if (!workbook.Sheets[itemAnalysisSheetName]) {
        return NextResponse.json({ message: `Sheet "${itemAnalysisSheetName}" not found` }, { status: 404 });
    }

   

    // Get the data from the "Result Grid" sheet
    const sheet = workbook.Sheets[ResultsGridsheetName];
    const data: Array<Array<string | number>> = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const itemAnalysisSheet = workbook.Sheets[itemAnalysisSheetName];
    const itemAnalysisData: Array<Array<string | number>> = XLSX.utils.sheet_to_json(itemAnalysisSheet, { header: 1 });

    // Process the data to extract answers
    if (data.length < 3) {
      return NextResponse.json({ message: 'Not enough data in the sheet' }, { status: 400 });
    }

    // Extract question-answer key mapping
    const questionKeys = extractQuestionAnswerKeys(data);
    const totalQuestions = Object.keys(questionKeys).length; // Calculate total number of questions

    // Calculate p_values, q_values, pq_values, total PQ value, and student scores variance
    const p_values = calculatePValues(data, questionKeys);
    const q_values = calculateQValues(p_values);
    const pq_values = calculatePQValues(p_values, q_values);
    const totalPQValue = calculateTotalPQValue(pq_values);
    const studentScores = extractStudentScores(data);
    const variance = calculateStudentScoreVariance(studentScores);
    console.log('itemAnalysisData:', itemAnalysisData);
    const itemAnalysisResults = extractItemAnalysisData(itemAnalysisData);
    const KR_20 = (totalQuestions / (totalQuestions - 1)) * (1 - totalPQValue / variance);

    // Return the results, including the total number of questions
    return NextResponse.json(
      { 

        KR_20,
        itemAnalysisResults,
        variance, 
        questionKeys, 
        totalQuestions, 
        p_values, 
        q_values, 
        pq_values, 
        totalPQValue, 
        studentScores 
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing Excel file:', error);
    return NextResponse.json(
      { 
        message: 'Error processing Excel file', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
