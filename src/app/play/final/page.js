'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PlayerFinal() {
    const [name, setName] = useState('');
    const router = useRouter();

    useEffect(() => {
        setName(localStorage.getItem('playerName') || 'Jogador');
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--kahoot-purple)] p-8 text-white text-center">
            <h1 className="text-6xl font-black mb-12 italic uppercase tracking-tighter">Fim de Jogo!</h1>
            <div className="bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/20 mb-12 w-full max-w-sm">
                <p className="text-2xl font-medium mb-4">Parabéns,</p>
                <p className="text-5xl font-black mb-8 text-[var(--kahoot-yellow)]">{name}</p>
                <p className="text-xl opacity-80 leading-relaxed">Confira sua posição no ranking projetado na tela!</p>
            </div>

            <button
                onClick={() => router.push('/')}
                className="kahoot-button bg-white text-[var(--kahoot-purple)] text-2xl px-12 py-4 shadow-xl"
            >
                SAIR
            </button>
        </div>
    );
}
