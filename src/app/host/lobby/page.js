'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSocket } from '@/lib/useSocket';

function LobbyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pin = searchParams.get('pin');
    const [players, setPlayers] = useState([]);
    const { socket } = useSocket();

    useEffect(() => {
        if (socket) {
            socket.on('playerJoined', (updatedPlayers) => {
                setPlayers(updatedPlayers);
            });

            socket.on('newQuestion', () => {
                router.push('/host/game');
            });
        }
        return () => {
            if (socket) {
                socket.off('playerJoined');
                socket.off('newQuestion');
            }
        };
    }, [socket, router]);

    const handleStart = () => {
        if (socket) {
            socket.emit('startGame');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--kahoot-blue)] flex flex-col">
            <div className="bg-white p-6 shadow-md flex justify-between items-center px-12">
                <div className="flex flex-col">
                    <span className="text-gray-500 font-bold uppercase text-sm">PIN do Jogo:</span>
                    <span className="text-6xl font-black text-[var(--kahoot-purple)]">{pin}</span>
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold italic uppercase tracking-tighter">Arena do Conhecimento</h2>
                </div>
                <div>
                    <button
                        onClick={handleStart}
                        disabled={players.length === 0}
                        className={`kahoot-button btn-purple text-2xl py-6 px-12 ${players.length === 0 ? 'opacity-50' : ''}`}
                    >
                        INICIAR
                    </button>
                </div>
            </div>

            <div className="flex-1 p-12 overflow-y-auto">
                <div className="flex justify-between items-baseline mb-8">
                    <h3 className="text-3xl font-bold text-white uppercase italic">{players.length} Jogadores</h3>
                </div>

                <div className="flex flex-wrap gap-4">
                    {players.map((player) => (
                        <div key={player.id} className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-lg text-white font-bold text-2xl border border-white/30 animate-in zoom-in duration-300">
                            {player.name}
                        </div>
                    ))}
                    {players.length === 0 && (
                        <div className="w-full text-center mt-20">
                            <p className="text-white text-3xl font-medium animate-pulse">Aguardando jogadores entrarem...</p>
                            <p className="text-white/70 text-xl mt-4">Acesse http://(IP-DO-SERVIÇO):3000 no seu navegador!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function HostLobby() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <LobbyContent />
        </Suspense>
    );
}
