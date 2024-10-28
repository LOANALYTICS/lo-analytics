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
export function extractStudentScores(data: Array<Array<string | number>>): Array<{ idx: number; score: number }> {
    const studentScores: Array<{ idx: number; score: number }> = [];

    // Locate the "Score" column by finding its index in the first row
    const scoreColIndex = data[0].findIndex((colName) => colName === "Score");
    if (scoreColIndex === -1) {
        throw new Error("Score column not found in the data.");
    }

    // Loop through each student's row starting from the third row
    for (let row = 2; row < data.length; row++) { // Starting from the third row
        const score = data[row][scoreColIndex];

        // Add student index (idx) and their score to the array
        studentScores.push({
            idx: row - 1, // Important: Temporary index as student ID
            score: typeof score === "number" ? score : Number(score) || 0 // Parse score as a number
        });
    }

    return studentScores;
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
