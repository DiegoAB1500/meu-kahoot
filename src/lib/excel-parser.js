const xlsx = require('xlsx');
const path = require('path');

function parseQuestions(filePath) {
  const workbook = xlsx.readFile(filePath);
  
  const parseSheet = (sheetName, optionsCount) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];
    
    const data = xlsx.utils.sheet_to_json(sheet);
    return data.map((row, index) => {
      const options = [];
      for (let i = 1; i <= optionsCount; i++) {
        if (row[`Answer ${i}`] !== undefined) {
          options.push(row[`Answer ${i}`]);
        }
      }
      
      return {
        id: `${sheetName}-${index}`,
        question: row['Question'],
        options: options,
        correctIndex: parseInt(row['Correct']) - 1, // 1-based to 0-based
        timeLimit: parseInt(row['Time (sec)']) || 30,
        type: optionsCount === 4 ? 'multiple' : 'boolean'
      };
    });
  };

  const fourOptions = parseSheet('Quatro Alternativas', 4);
  const twoOptions = parseSheet('Duas Alternativas', 2);

  return {
    fourOptions,
    twoOptions,
    combined: [...fourOptions, ...twoOptions]
  };
}

module.exports = { parseQuestions };
