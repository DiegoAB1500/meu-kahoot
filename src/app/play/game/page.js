'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/lib/useSocket';
import { useRouter } from 'next/navigation';

const SYMBOLS = ['▲', '◆', '●', '■'];
const COLORS = ['btn-red', 'btn-blue', 'btn-yellow', 'btn-green'];

export default function PlayerGame() {
    const [question, setQuestion] = useState(null);
    const [status, setStatus] = useState('WAITING'); // WAITING, ANSWERING, SUBMITTED, FEEDBACK
    const [feedback, setFeedback] = useState(null);
    const { socket } = useSocket();
    const router = useRouter();

    useEffect(() => {
        if (socket) {
            socket.on('newQuestion', (q) => {
                setQuestion(q);
                setStatus('ANSWERING');
                setFeedback(null);
            });

            socket.on('answerFeedback', (data) => {
                setFeedback(data);
                setStatus('FEEDBACK');
            });

            socket.on('questionResults', () => {
                // If they didn't answer, they just wait for the feedback via some other event if I had one, 
                // but the current server logic sends 'answerFeedback' if they answered or 'questionResults' for all.
                // Let's ensure they see something if they didn't answer.
                if (status !== 'FEEDBACK') {
                    setStatus('TIMEOUT');
                }
            });

            socket.on('finalRanking', () => {
                router.push('/play/final');
            });

            socket.on('gameStateUpdate', (data) => {
                if (data.currentQuestion) {
                    setQuestion(data.currentQuestion);
                    if (data.status === 'PLAYING') setStatus('ANSWERING');
                    if (data.status === 'RESULTS') setStatus('FEEDBACK');
                }
            });

            socket.emit('getGameState');
        }

        return () => {
            if (socket) {
                socket.off('newQuestion');
                socket.off('answerFeedback');
                socket.off('questionResults');
                socket.off('finalRanking');
                socket.off('gameStateUpdate');
            }
        };
    }, [socket, status, router]);

    const handleAnswer = (index) => {
        if (status === 'ANSWERING' && socket) {
            socket.emit('submitAnswer', { optionIndex: index });
            setStatus('SUBMITTED');
        }
    };

    if (status === 'WAITING' || !question) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--kahoot-purple)] text-white p-4 text-center">
                <h2 className="text-3xl font-bold animate-pulse uppercase italic">Prepare-se!</h2>
            </div>
        );
    }

    if (status === 'SUBMITTED') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--kahoot-purple)] text-white p-4 text-center">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <span className="text-4xl">✔</span>
                </div>
                <h2 className="text-4xl font-black mb-2 uppercase italic tracking-tighter">Resposta enviada!</h2>
                <p className="text-xl opacity-80">Aguardando os outros jogadores...</p>
            </div>
        );
    }

    if (status === 'TIMEOUT') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-500 text-white p-4 text-center">
                <h2 className="text-4xl font-black mb-4 uppercase italic">Tempo Esgotado!</h2>
                <p className="text-xl">Você não respondeu a tempo.</p>
            </div>
        );
    }

    if (status === 'FEEDBACK' && feedback) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-4 text-white text-center transition-colors duration-500 ${feedback.correct ? 'bg-[var(--kahoot-green)]' : 'bg-[var(--kahoot-red)]'}`}>
                <h2 className="text-6xl font-black mb-4 uppercase italic tracking-tighter">
                    {feedback.correct ? 'CORRETO!' : 'INCORRETO'}
                </h2>
                <div className="text-8xl mb-6">{feedback.correct ? '🔥' : '❌'}</div>
                <div className="bg-black/20 p-6 rounded-2xl backdrop-blur-sm">
                    <p className="text-2xl font-bold">+{feedback.points} pontos</p>
                    <p className="text-lg opacity-80 mt-2">Total: {feedback.totalScore}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <div className="p-4 bg-white shadow-sm flex justify-between items-center px-8">
                <span className="font-bold text-[var(--kahoot-purple)]">Questão</span>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-black">
                    ?
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-2 p-2">
                {question.options.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        disabled={status !== 'ANSWERING'}
                        className={`option-btn ${COLORS[i]} h-full shadow-xl active:brightness-90 flex items-center justify-center`}
                    >
                        <span className="text-[12rem] md:text-[15rem] leading-none transform transition-transform hover:scale-110">
                            {SYMBOLS[i]}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
