'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/useSocket';

export default function PlayerWaiting() {
    const [name, setName] = useState('');
    const router = useRouter();
    const { socket } = useSocket();

    useEffect(() => {
        setName(localStorage.getItem('playerName') || 'Jogador');

        if (socket) {
            socket.on('newQuestion', () => {
                router.push('/play/game');
            });
        }

        return () => {
            if (socket) socket.off('newQuestion');
        };
    }, [socket, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--kahoot-blue)] p-4 text-white text-center">
            <h2 className="text-3xl font-bold mb-4 italic uppercase">Você está dentro!</h2>
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 mb-8 w-full max-w-sm">
                <p className="text-xl font-medium mb-2">Seu nome:</p>
                <p className="text-4xl font-black">{name}</p>
            </div>
            <p className="text-xl animate-pulse">Aguardando o professor iniciar o jogo...</p>

            <div className="mt-12">
                <div className="flex justify-center gap-2">
                    <div className="w-4 h-4 bg-white/40 rounded-full animate-bounce delay-100"></div>
                    <div className="w-4 h-4 bg-white/40 rounded-full animate-bounce delay-200"></div>
                    <div className="w-4 h-4 bg-white/40 rounded-full animate-bounce delay-300"></div>
                </div>
            </div>
        </div>
    );
}
