// src/utils/excelUtils.ts
export function extractQuestionAnswerKeys(data: Array<Array<string | number>>, startCol: number = 6) {
    const questionKeys: Record<string, string> = {};

    // Extract column names from the first row (index 0)
    const columnNames: (string | number)[] = data[0];

    // Extract the answers from the second row (index 1) dynamically
    const answersRow: (string | number)[] = data[1];

    // Dynamically iterate over columns starting from the specified start column
    for (let col = startCol; col < columnNames.length; col++) {
        const questionKey = (columnNames[col] as string).trim(); // Q1, Q2, ..., Q80
        const answer = answersRow[col];

        // Store the question and answer mapping
        if (questionKey.startsWith('Q')) {
            questionKeys[questionKey] = answer ? String(answer) : ''; // Ensure answer is a string
        }
    }

    return questionKeys;
}

export function calculatePValues(data: Array<Array<string | number>>, questionKeys: Record<string, string>): Array<{ question: string; p_value: number }> {
    const p_values: Array<{ question: string; p_value: number }> = [];

    // Calculate the number of students based on the rows of data
    const numStudents = data.length - 2; // Subtracting 2 for header and keys row

    // Iterate over each question key
    for (const questionKey in questionKeys) {
        if (Object.prototype.hasOwnProperty.call(questionKeys, questionKey)) {
            let correctAnswersCount = 0;

            // Check each student's answer in the respective column
            for (let row = 2; row < data.length; row++) { // Starting from the third row
                const studentAnswer = data[row][data[0].indexOf(questionKey)]; // Get the student's answer for the current question

                // Check if the answer matches the correct answer
                if (String(studentAnswer) === String(questionKeys[questionKey])) {
                    correctAnswersCount++; // Increment if the answer is correct
                }
            }

            // Calculate p_value
            const p_value = numStudents > 0 ? correctAnswersCount / numStudents : 0; // Avoid division by zero
            p_values.push({ question: questionKey, p_value }); // No toFixed
        }
    }

    return p_values;
}

export function calculateQValues(p_values: Array<{ question: string; p_value: number }>): Array<{ question: string; q_value: number }> {
    return p_values.map(({ question, p_value }) => ({
        question,
        q_value: 1 - p_value // No toFixed
    }));
}

export function calculatePQValues(p_values: Array<{ question: string; p_value: number }>, q_values: Array<{ question: string; q_value: number }>): Array<{ question: string; pq_value: number }> {
    return p_values.map(({ question, p_value }) => {
        const correspondingQValue = q_values.find(q => q.question === question);
        return {
            question,
            pq_value: p_value * (correspondingQValue ? correspondingQValue.q_value : 0) // No toFixed
        };
    });
}

// Function to calculate the total summation of pq_values
export function calculateTotalPQValue(pq_values: Array<{ question: string; pq_value: number }>): number {
    return pq_values.reduce((sum, item) => sum + item.pq_value, 0); // Summation of pq_value
}

// Function to retrieve scores for each student based on the "Score" column
export function extractStudentScores(data: Array<Array<string | number>>): Array<{ idx: number; score: number; percentage: number }> {
    const studentScores: Array<{ idx: number; score: number; percentage: number }> = [];

    // Locate the "Score" column by finding its index in the first row
    const scoreColIndex = data[0].findIndex((colName) => colName === "Score");

    if (scoreColIndex === -1) {
        throw new Error("Score column not found in the data.");
    }

    // Set the index for the percentage column directly to the third column (C column)
    const percentageColIndex = 2; // 0-based index for column C

    // Loop through each student's row starting from the third row
    for (let row = 2; row < data.length; row++) { // Starting from the third row for student data
        const score = data[row][scoreColIndex];
        let percentage = data[row][percentageColIndex];

        // Parse the score as a number
        const numericScore = typeof score === "number" ? score : Number(score) || 0;

        // Handle percentage as a string with "%" sign
        const numericPercentage = typeof percentage === "string"
            ? parseFloat(percentage.toString().replace('%', ''))
            : typeof percentage === "number"
            ? percentage
            : 0;

        // Add student index (idx), score, and percentage to the array
        studentScores.push({
            idx: row - 1, // Temporary index as student ID
            score: numericScore,
            percentage: numericPercentage
        });
    }

    return studentScores;
}
const GRADING_CRITERIA = [
    { min: 95, max: 100, grade: "A+" },
    { min: 90, max: 94.99, grade: "A" },
    { min: 85, max: 89.99, grade: "B+" },
    { min: 80, max: 84.99, grade: "B" },
    { min: 75, max: 79.99, grade: "C+" },
    { min: 70, max: 74.99, grade: "C" },
    { min: 65, max: 69.99, grade: "D+" },
    { min: 60, max: 64.99, grade: "D" },
    { min: 0, max: 59.99, grade: "F" }
];

export function calculateStudentGrades(
    studentScores: Array<{ idx: number; score: number; percentage: number }>
): Array<{ idx: number; score: number; percentage: number; grade: string }> {
    return studentScores.map(student => {
        const grade = GRADING_CRITERIA.find(
            criteria => student.percentage >= criteria.min && student.percentage <= criteria.max
        )?.grade || "F"; // Default to "F" if no match found

        return {
            ...student,
            grade
        };
    });
}


export function calculateStudentScoreVariance(studentScores: Array<{ idx: number; score: number }>): number {
    const scores = studentScores.map((student) => student.score);
    const numStudents = scores.length;

    if (numStudents === 0) return 0; // Guard against division by zero

    // Calculate the mean of the scores
    const mean = scores.reduce((sum, score) => sum + score, 0) / numStudents;

    // Calculate the variance
    const variance =
        scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / numStudents;

    return variance; // No toFixed
}


// src/utils/excelUtils.ts


// src/utils/excelUtils.ts

// src/utils/excelUtils.ts

// src/utils/excelUtils.ts

// src/utils/excelUtils.ts

export function extractItemAnalysisData(data: Array<Array<string | number>>): Array<{ question: string; discIndex: number; incorrectPercentage: number; correctPercentage: number }> {
    const itemAnalysisData: Array<{ question: string; discIndex: number; incorrectPercentage: number; correctPercentage: number }> = [];

    const questionCol = 0;       // 1st column for question numbers (e.g., Q1, Q2)
    const discIndexCol = 9;      // J column for Disc. Index
    const incorrectPctCol = 11;  // L column for Pct. Incorrect

    // Start iterating from the 6th row (index 5) onward to get each question
    for (let row = 5; row < data.length; row++) {
        const questionKey = data[row][questionCol];
        const discIndex = data[row][discIndexCol];
        const incorrectPercentage = data[row][incorrectPctCol];

        // Check if questionKey is valid and matches the expected format (e.g., "Q1", "Q2")
        if (typeof questionKey === 'string' && questionKey.startsWith("Q")) {
            const incorrectPct = typeof incorrectPercentage === "number" ? incorrectPercentage * 100 : 0;
            const correctPercentage = 100 - incorrectPct;

            // Push data to array if question and metrics are valid
            itemAnalysisData.push({
                question: questionKey.trim(),
                discIndex: typeof discIndex === "number" ? discIndex : 0,
                incorrectPercentage: incorrectPct,
                correctPercentage
            });
        }
    }

    return itemAnalysisData;
}

interface QuestionObject {
    question: string;
    discIndex: number;
    incorrectPercentage: number;
    correctPercentage: number;
}

interface GroupedQuestions {
    classification: string;
    questions: QuestionObject[];
}

export function groupByClassification(rows: QuestionObject[]): GroupedQuestions[] {
    const classificationMap: Record<string, QuestionObject[]> = {
        "Poor (Bad) Questions": [],
        "Very Difficult Questions": [],
        "Difficult Questions": [],
        "Good Questions": [],
        "Easy Questions": [],
        "Very Easy Questions": [],
    };

    // Calculate total number of questions
    const totalQuestions = rows.length;

    // Classify questions based on the given conditions
    rows.forEach(row => {
        const { discIndex, correctPercentage } = row;
        let classification = "";

        if (discIndex < 0.199 && correctPercentage >= 0 && correctPercentage <= 100) {
            classification = "Poor (Bad) Questions";
        } else{
            if (correctPercentage >= 0 && correctPercentage <= 20.99) {
                classification = "Very Difficult Questions";
            } else if (correctPercentage >= 21 && correctPercentage <= 30.99) {
                classification = "Difficult Questions";
            } else if (correctPercentage >= 31 && correctPercentage <= 70.99) {
                classification = "Good Questions";
            } else if (correctPercentage >= 71 && correctPercentage <= 80.99) {
                classification = "Easy Questions";
            } else if (correctPercentage >= 81 && correctPercentage <= 100) {
                classification = "Very Easy Questions";
            }
        }

        // Add row to the appropriate classification group
        if (classification) {
            classificationMap[classification].push({ ...row });
        }
    });

    // Collect groups with their question count
    const groups = Object.entries(classificationMap).map(([classification, questions]) => ({
        classification,
        questions,
        perc: questions.length > 0 ? (questions.length / totalQuestions) * 100 : 0, // Calculate percentage or set to 0 if no questions
    }));

    // Calculate the sum of percentages
    const totalPerc = groups.reduce((sum, group) => sum + group.perc, 0);

    // Adjust percentages to ensure they sum to 100%
    if (totalPerc !== 100) {
        const correctionFactor = 100 / totalPerc;
        groups.forEach(group => {
            group.perc = parseFloat((group.perc * correctionFactor).toFixed(2)); // Adjust and round
        });
    }

    return groups;
}








