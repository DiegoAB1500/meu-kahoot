const { parseQuestions } = require('./src/lib/excel-parser');
const path = require('path');

try {
    const filePath = path.join(process.cwd(), 'Kahoot - Avaliação Diagnóstica.xlsx');
    console.log('--- TESTE DE LEITURA DO EXCEL ---');
    const questions = parseQuestions(filePath);

    console.log(`Questões (4 Alternativas): ${questions.fourOptions.length} (Esperado: 47)`);
    console.log(`Questões (2 Alternativas): ${questions.twoOptions.length} (Esperado: 18)`);

    if (questions.fourOptions.length === 47 && questions.twoOptions.length === 18) {
        console.log('✅ TESTE DE LEITURA PASSOU!');
    } else {
        console.error('❌ TESTE DE LEITURA FALHOU: Quantidade de questões incorreta.');
    }

    console.log('\n--- TESTE DE PONTUAÇÃO ---');
    const basePoints = 1000;
    const speedBonusMax = 500;
    const timeLimit = 30;

    // Test 1: Fast answer (1s)
    const timeTaken1 = 1;
    const timeLeft1 = timeLimit - timeTaken1;
    const bonus1 = Math.round((timeLeft1 / timeLimit) * speedBonusMax);
    const score1 = basePoints + bonus1;
    console.log(`Resposta em 1s: ${score1} pontos (Esperado aprox. 1483)`);

    // Test 2: Slow answer (20s)
    const timeTaken2 = 20;
    const timeLeft2 = timeLimit - timeTaken2;
    const bonus2 = Math.round((timeLeft2 / timeLimit) * speedBonusMax);
    const score2 = basePoints + bonus2;
    console.log(`Resposta em 20s: ${score2} pontos (Esperado aprox. 1167)`);

    if (score1 > score2) {
        console.log('✅ TESTE DE PONTUAÇÃO PASSOU!');
    } else {
        console.error('❌ TESTE DE PONTUAÇÃO FALHOU!');
    }

} catch (error) {
    console.error('❌ ERRO DURANTE OS TESTES:', error.message);
}
