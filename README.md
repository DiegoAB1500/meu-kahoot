# Kahoot Clone LAN Edition

Aplicação de Quiz em tempo real para rede local, carregando perguntas diretamente de um arquivo Excel.

## Como Executar

### Pré-requisitos
- Node.js instalado (v18 ou superior recomendado).
- Celulares e o PC do professor devem estar na **mesma rede Wi-Fi/LAN**.

### Instalação
1. Abra o terminal na pasta do projeto.
2. Instale as dependências:
   ```bash
   npm install
   ```

### Rodando o Servidor
Para desenvolvimento:
```bash
npm run dev
```

Para produção local (mais estável para 40+ alunos):
```bash
npm run build
npm start
```

## Como Descobrir o IP Local

Para que os alunos acessem, você deve fornecer o IP do seu computador na rede local:

- **Windows**: Abra o terminal e digite `ipconfig`. Procure por "Endereço IPv4" (Ex: `192.168.0.10`).
- **Mac/Linux**: Digite `hostname -I` ou `ifconfig`.

**Acesso do Aluno:** No navegador do celular, digite `http://SEU-IP:3000` (ex: `http://192.168.0.10:3000`).

## Gerenciamento de Perguntas

O sistema lê o arquivo `Kahoot - Avaliação Diagnóstica.xlsx` na raiz do projeto.

### Formato do Excel:
- **Aba "Quatro Alternativas"**: Colunas `Question`, `Answer 1`, `Answer 2`, `Answer 3`, `Answer 4`, `Correct` (1-4), `Time (sec)`.
- **Aba "Duas Alternativas"**: Colunas `Question`, `Answer 1`, `Answer 2`, `Correct` (1-2), `Time (sec)`.

> [!TIP]
> Se você alterar o Excel enquanto o servidor estiver rodando, reinicie o servidor ou crie uma "Nova Partida" no painel do professor para recarregar.

## Configurações (.env)
- `TEACHER_PASSWORD`: Senha para acessar a área do host (Padrão: `professor123`).
- `PORT`: Porta do servidor (Padrão: `3000`).

## Pontuação
- **Acerto**: 1000 pontos base.
- **Bônus de Velocidade**: até +500 pontos extras dependendo de quão rápido o aluno respondeu (linear).
- **Desempate**: Maior número de acertos totais e, em seguida, menor tempo médio de resposta.
