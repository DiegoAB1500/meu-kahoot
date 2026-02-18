'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/useSocket';

export default function HostDashboard() {
    const [config, setConfig] = useState({
        mode: 'misto',
        enableSpeedBonus: true,
        basePoints: 1000,
        speedBonusMax: 500
    });
    const router = useRouter();
    const { socket, connected } = useSocket();

    useEffect(() => {
        if (socket) {
            socket.on('gameCreated', ({ pin }) => {
                router.push(`/host/lobby?pin=${pin}`);
            });
        }
        return () => {
            if (socket) socket.off('gameCreated');
        };
    }, [socket, router]);

    const handleCreate = () => {
        if (socket) {
            socket.emit('createGame', config);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--kahoot-purple)] p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-black text-white mb-8 text-center uppercase italic">Configuração da Partida</h1>

                <div className="kahoot-card grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4">Modo de Jogo</h3>
                        <div className="flex flex-col gap-3">
                            <label className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${config.mode === 'quatro' ? 'border-[var(--kahoot-purple)] bg-purple-50' : 'border-gray-100'}`}>
                                <input type="radio" name="mode" value="quatro" checked={config.mode === 'quatro'} onChange={() => setConfig({ ...config, mode: 'quatro' })} className="hidden" />
                                <span className="font-bold">Quatro Alternativas (47 questões)</span>
                            </label>
                            <label className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${config.mode === 'duas' ? 'border-[var(--kahoot-purple)] bg-purple-50' : 'border-gray-100'}`}>
                                <input type="radio" name="mode" value="duas" checked={config.mode === 'duas'} onChange={() => setConfig({ ...config, mode: 'duas' })} className="hidden" />
                                <span className="font-bold">Duas Alternativas (18 questões)</span>
                            </label>
                            <label className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${config.mode === 'misto' ? 'border-[var(--kahoot-purple)] bg-purple-50' : 'border-gray-100'}`}>
                                <input type="radio" name="mode" value="misto" checked={config.mode === 'misto'} onChange={() => setConfig({ ...config, mode: 'misto' })} className="hidden" />
                                <span className="font-bold">Misto (Todas as questões)</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <h3 className="text-xl font-bold">Configurações de Pontos</h3>
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={config.enableSpeedBonus} onChange={(e) => setConfig({ ...config, enableSpeedBonus: e.target.checked })} className="w-5 h-5 accent-[var(--kahoot-purple)]" />
                                <span className="font-medium">Bônus por Velocidade (até +500)</span>
                            </label>
                        </div>
                        <div className="mt-8">
                            <button
                                onClick={handleCreate}
                                disabled={!connected}
                                className={`kahoot-button btn-green w-full text-2xl py-6 ${!connected ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {connected ? 'CRIAR PARTIDA' : 'CONECTANDO...'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
