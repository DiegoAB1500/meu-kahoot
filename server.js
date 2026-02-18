const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const next = require('next');
const path = require('path');
const multer = require('multer');
const { parseSpecificQuestions, parseDefaultFile } = require('./src/lib/excel-parser');
require('dotenv').config();

const upload = multer({ storage: multer.memoryStorage() });

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'professor123';

// Game State
let gameState = {
    status: 'LOBBY', // LOBBY, PLAYING, RESULTS, FINAL_RANKING
    pin: null,
    players: [], // { id, name, score, lastAnswerTime, correctCount }
    questions: [],
    currentQuestionIndex: -1,
    config: {
        basePoints: 1000,
        speedBonusMax: 500,
        enableSpeedBonus: true,
        mode: 'misto' // 'quatro', 'duas', 'misto'
    },
    questionStartTime: null,
    answersCount: 0,
    answerDistribution: {}, // { optionIndex: count }
    customQuestions: {
        four: [],
        two: []
    }
};

app.prepare().then(() => {
    const server = express();
    const httpServer = http.createServer(server);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    server.use(express.json());

    // API Routes for the Host
    server.post('/api/host/login', (req, res) => {
        const { password } = req.body;
        if (password === TEACHER_PASSWORD) {
            res.json({ success: true, token: 'fake-token' });
        } else {
            res.status(401).json({ success: false });
        }
    });

    server.post('/api/host/upload', upload.single('file'), (req, res) => {
        try {
            const { type } = req.query; // 'four' or 'two'
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
            }
            if (type !== 'four' && type !== 'two') {
                return res.status(400).json({ success: false, message: 'Tipo de arquivo inválido.' });
            }

            const questions = parseSpecificQuestions(req.file.buffer, type);
            gameState.customQuestions[type] = questions;

            res.json({
                success: true,
                message: `Perguntas (${type}) carregadas com sucesso!`,
                count: questions.length
            });
        } catch (error) {
            console.error('Erro ao processar Excel:', error);
            res.status(500).json({ success: false, message: error.message || 'Erro ao processar o arquivo Excel.' });
        }
    });

    // Socket.IO Logic
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('joinRoom', ({ pin, name }) => {
            if (pin === gameState.pin && gameState.status === 'LOBBY') {
                let playerName = name;
                const exists = gameState.players.find(p => p.name === name);
                if (exists) {
                    playerName = `${name}_${Math.floor(Math.random() * 1000)}`;
                }

                const newPlayer = {
                    id: socket.id,
                    name: playerName,
                    score: 0,
                    totalTime: 0,
                    correctCount: 0,
                    answeredCurrent: false
                };

                gameState.players.push(newPlayer);
                socket.join('game-room');
                io.emit('playerJoined', gameState.players);
                socket.emit('joinedSuccess', { name: playerName });
            } else {
                socket.emit('error', 'PIN inválido ou jogo em andamento');
            }
        });

        socket.on('createGame', (config) => {
            const hasFour = gameState.customQuestions.four.length > 0;
            const hasTwo = gameState.customQuestions.two.length > 0;

            if (!hasFour && !hasTwo) {
                return socket.emit('error', { message: 'Você precisa enviar pelo menos um arquivo Excel!' });
            }

            gameState.pin = Math.floor(100000 + Math.random() * 900000).toString();
            gameState.status = 'LOBBY';
            gameState.players = [];
            gameState.config = { ...gameState.config, ...config };

            const { four, two } = gameState.customQuestions;

            if (gameState.config.mode === 'quatro') {
                if (!hasFour) return socket.emit('error', { message: 'Arquivo de 4 alternativas não carregado.' });
                gameState.questions = four;
            } else if (gameState.config.mode === 'duas') {
                if (!hasTwo) return socket.emit('error', { message: 'Arquivo de 2 alternativas não carregado.' });
                gameState.questions = two;
            } else {
                gameState.questions = [...four, ...two];
            }

            gameState.currentQuestionIndex = -1;
            io.emit('gameCreated', { pin: gameState.pin });
            console.log('Game created with PIN:', gameState.pin);
        });

        socket.on('startGame', () => {
            if (gameState.status === 'LOBBY' && gameState.questions.length > 0) {
                nextQuestion();
            }
        });

        socket.on('submitAnswer', ({ optionIndex }) => {
            const player = gameState.players.find(p => p.id === socket.id);
            if (player && gameState.status === 'PLAYING' && !player.answeredCurrent) {
                const question = gameState.questions[gameState.currentQuestionIndex];
                const now = Date.now();
                const timeTaken = (now - gameState.questionStartTime) / 1000;

                player.answeredCurrent = true;
                gameState.answersCount++;
                gameState.answerDistribution[optionIndex] = (gameState.answerDistribution[optionIndex] || 0) + 1;

                if (optionIndex === question.correctIndex) {
                    let points = gameState.config.basePoints;
                    if (gameState.config.enableSpeedBonus) {
                        const timeLeft = Math.max(0, question.timeLimit - timeTaken);
                        const bonus = Math.round((timeLeft / question.timeLimit) * gameState.config.speedBonusMax);
                        points += bonus;
                    }
                    player.score += points;
                    player.correctCount += 1;
                    player.totalTime += timeTaken;
                    socket.emit('answerFeedback', { correct: true, points, totalScore: player.score });
                } else {
                    socket.emit('answerFeedback', { correct: false, points: 0, totalScore: player.score });
                }

                io.emit('answersUpdate', { count: gameState.answersCount });

                if (gameState.answersCount === gameState.players.length) {
                    showResults();
                }
            }
        });

        socket.on('nextQuestion', () => {
            nextQuestion();
        });

        socket.on('endGame', () => {
            showFinalRanking();
        });

        socket.on('getGameState', () => {
            const currentQuestion = gameState.currentQuestionIndex >= 0 ? { ...gameState.questions[gameState.currentQuestionIndex] } : null;
            if (currentQuestion) delete currentQuestion.correctIndex;

            socket.emit('gameStateUpdate', {
                status: gameState.status,
                currentQuestion: currentQuestion,
                currentQuestionIndex: gameState.currentQuestionIndex,
                players: gameState.players.map(p => ({ name: p.name, score: p.score })),
                answersCount: gameState.answersCount,
                pin: gameState.pin
            });
        });

        socket.on('disconnect', () => {
            gameState.players = gameState.players.filter(p => p.id !== socket.id);
            io.emit('playerJoined', gameState.players);
        });
    });

    function nextQuestion() {
        gameState.currentQuestionIndex++;
        if (gameState.currentQuestionIndex < gameState.questions.length) {
            gameState.status = 'PLAYING';
            gameState.answersCount = 0;
            gameState.answerDistribution = {};
            gameState.questionStartTime = Date.now();
            gameState.players.forEach(p => p.answeredCurrent = false);

            const question = { ...gameState.questions[gameState.currentQuestionIndex] };
            // Don't send the correct index to the players!
            const playerQuestion = { ...question };
            delete playerQuestion.correctIndex;

            io.emit('newQuestion', playerQuestion);

            // Auto-end after time limit
            const currentIndex = gameState.currentQuestionIndex;
            setTimeout(() => {
                if (gameState.currentQuestionIndex === currentIndex && gameState.status === 'PLAYING') {
                    showResults();
                }
            }, question.timeLimit * 1000);

        } else {
            showFinalRanking();
        }
    }

    function showResults() {
        gameState.status = 'RESULTS';
        const question = gameState.questions[gameState.currentQuestionIndex];

        // Sort players for interim ranking
        const ranking = [...gameState.players].sort((a, b) => b.score - a.score).slice(0, 5);

        io.emit('questionResults', {
            correctIndex: question.correctIndex,
            distribution: gameState.answerDistribution,
            ranking: ranking.map(p => ({ name: p.name, score: p.score }))
        });
    }

    function showFinalRanking() {
        gameState.status = 'FINAL_RANKING';
        const ranking = [...gameState.players].sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
            return a.totalTime - b.totalTime;
        });

        io.emit('finalRanking', { ranking: ranking.slice(0, 10) });
    }

    // Handle all other requests with Next.js
    server.use((req, res) => {
        return handle(req, res);
    });

    httpServer.listen(port, '0.0.0.0', (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
        console.log(`> Accessible on your LAN IP at http://(seu-ip-local):${port}`);
    });
});
