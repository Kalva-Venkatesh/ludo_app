
import React, { useState, useEffect } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCw, Trophy } from 'lucide-react';
import LudoBoard from './components/LudoBoard';
import { GameState, PlayerColor, Piece, PieceState } from './types';
import { COLORS, START_INDICES, GLOBAL_PATH, SAFE_ZONES } from './constants';
import { getGameCommentary } from './services/geminiService';

const INITIAL_PIECES = (color: PlayerColor): Piece[] => [
  { id: 1, color, state: PieceState.BASE, position: -1, travelDistance: 0 },
  { id: 2, color, state: PieceState.BASE, position: -1, travelDistance: 0 },
  { id: 3, color, state: PieceState.BASE, position: -1, travelDistance: 0 },
  { id: 4, color, state: PieceState.BASE, position: -1, travelDistance: 0 },
];

const INITIAL_STATE: GameState = {
  players: {
    [PlayerColor.BLUE]: { color: PlayerColor.BLUE, pieces: INITIAL_PIECES(PlayerColor.BLUE), hasWon: false },
    [PlayerColor.YELLOW]: { color: PlayerColor.YELLOW, pieces: INITIAL_PIECES(PlayerColor.YELLOW), hasWon: false },
    [PlayerColor.GREEN]: { color: PlayerColor.GREEN, pieces: INITIAL_PIECES(PlayerColor.GREEN), hasWon: false },
    [PlayerColor.RED]: { color: PlayerColor.RED, pieces: INITIAL_PIECES(PlayerColor.RED), hasWon: false },
  },
  currentPlayer: PlayerColor.BLUE,
  diceValue: null,
  isDiceRolling: false,
  waitingForMove: false,
  commentary: "Welcome to Gemini Ludo! Blue starts.",
  gameLog: [],
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [winner, setWinner] = useState<PlayerColor | null>(null);

  const DiceIcons = [null, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

  const rollDice = async () => {
    if (gameState.isDiceRolling || gameState.waitingForMove || winner) return;

    setGameState(prev => ({ ...prev, isDiceRolling: true }));

    // Simulate rolling delay
    await new Promise(r => setTimeout(r, 600));

    const newValue = Math.floor(Math.random() * 6) + 1;

    setGameState(prev => {
      const player = prev.players[prev.currentPlayer];
      
      // Check valid moves
      const hasMoves = player.pieces.some(p => {
        if (p.state === PieceState.BASE) return newValue === 6;
        if (p.state === PieceState.HOME) return false;
        // Max position 56 (Home Goal)
        return p.position + newValue <= 56;
      });

      if (!hasMoves) {
         setTimeout(() => nextTurn(prev.currentPlayer, newValue), 1000);
         return {
           ...prev,
           diceValue: newValue,
           isDiceRolling: false,
           waitingForMove: false,
           gameLog: [...prev.gameLog, `${prev.currentPlayer} rolled ${newValue}: No moves.`]
         };
      }

      return {
        ...prev,
        diceValue: newValue,
        isDiceRolling: false,
        waitingForMove: true,
      };
    });
  };

  const nextTurn = (current: PlayerColor, lastRoll: number | null) => {
    // Rule: 6 gives an extra turn.
    if (lastRoll === 6) {
       setGameState(prev => ({
         ...prev,
         diceValue: null,
         waitingForMove: false,
         commentary: `${current} rolled a 6! Roll again.`,
       }));
       return;
    }

    // Standard Clockwise: Blue -> Yellow -> Green -> Red
    const order = [PlayerColor.BLUE, PlayerColor.YELLOW, PlayerColor.GREEN, PlayerColor.RED];
    const currentIndex = order.indexOf(current);
    const nextPlayer = order[(currentIndex + 1) % 4];

    setGameState(prev => ({
      ...prev,
      currentPlayer: nextPlayer,
      diceValue: null,
      waitingForMove: false,
      commentary: `${nextPlayer}'s turn!`,
    }));
  };

  const handlePieceClick = (piece: Piece) => {
    if (!gameState.waitingForMove || !gameState.diceValue) return;
    if (piece.color !== gameState.currentPlayer) return;

    const roll = gameState.diceValue;
    
    // 1. Validate Move
    if (piece.state === PieceState.BASE && roll !== 6) return;
    if (piece.state === PieceState.HOME) return;
    if (piece.state === PieceState.ACTIVE && piece.position + roll > 56) return;

    // 2. Calculate New State
    let newState: PieceState = piece.state;
    let newPosition = piece.position;

    if (piece.state === PieceState.BASE) {
      newState = PieceState.ACTIVE;
      newPosition = 0; // Move to Start Square (Index 0 relative to player)
    } else {
      newPosition += roll;
      if (newPosition === 56) {
        newState = PieceState.HOME;
      }
    }

    // 3. Check Captures & Updates
    let capturedOpponent = false;
    let newPlayersState = { ...gameState.players };
    
    // Capture logic only applies on the main track (0-50)
    if (newState === PieceState.ACTIVE && newPosition < 51) {
       const myStartIdx = START_INDICES[piece.color];
       const myGlobalPosIndex = (myStartIdx + newPosition) % 52;
       const myGlobalCoord = GLOBAL_PATH[myGlobalPosIndex];

       // Iterate opponents
       Object.keys(newPlayersState).forEach(key => {
         const pColor = key as PlayerColor;
         if (pColor === piece.color) return;

         newPlayersState[pColor].pieces = newPlayersState[pColor].pieces.map(opp => {
            if (opp.state !== PieceState.ACTIVE) return opp;
            if (opp.position >= 51) return opp; // Opponent in home stretch is safe

            const oppStartIdx = START_INDICES[pColor];
            const oppGlobalPosIndex = (oppStartIdx + opp.position) % 52;

            if (oppGlobalPosIndex === myGlobalPosIndex) {
               // Check if it's a Safe Zone
               const isSafe = SAFE_ZONES.some(z => z.x === myGlobalCoord.x && z.y === myGlobalCoord.y);
               
               if (!isSafe) {
                  capturedOpponent = true;
                  // Send to Base
                  return { ...opp, state: PieceState.BASE, position: -1, travelDistance: 0 };
               }
            }
            return opp;
         });
       });
    }

    // Update Current Piece
    newPlayersState[piece.color].pieces = newPlayersState[piece.color].pieces.map(p => 
      p.id === piece.id ? { ...p, state: newState, position: newPosition } : p
    );

    // 4. Check Win
    const playerWon = newPlayersState[piece.color].pieces.every(p => p.state === PieceState.HOME);
    if (playerWon) {
       setWinner(piece.color);
       setGameState(prev => ({ ...prev, players: newPlayersState, waitingForMove: false }));
       return;
    }

    // 5. AI Commentary
    const actionDescription = capturedOpponent 
        ? `captured ${gameState.currentPlayer === PlayerColor.BLUE ? 'Red/Yellow/Green' : 'an opponent'}!` 
        : (roll === 6 ? "rolled a 6!" : "moved forward.");
    
    // Optimistic update for speed
    setGameState(prev => {
        const msg = `${piece.color} moved ${roll}. ${capturedOpponent ? 'CAPTURE!' : ''}`;
        return {
            ...prev,
            players: newPlayersState,
            waitingForMove: false,
            gameLog: [...prev.gameLog, msg],
            diceValue: null, // Clear dice to prevent double click
        };
    });

    getGameCommentary({ ...gameState, players: newPlayersState }, actionDescription).then(comment => {
       setGameState(prev => ({ ...prev, commentary: comment }));
    });

    // 6. Turn Management
    // Extra turn for rolling 6 or Capturing or Reaching Goal
    if (roll === 6 || capturedOpponent || newState === PieceState.HOME) {
        const reason = capturedOpponent ? "Capture Bonus!" : (roll === 6 ? "Rolled 6!" : "Goal Reached!");
        setTimeout(() => {
             setGameState(prev => ({ 
                 ...prev, 
                 diceValue: null, 
                 waitingForMove: false, 
                 commentary: `${reason} Roll again, ${piece.color}!` 
             }));
        }, 500);
    } else {
        nextTurn(piece.color, roll);
    }
  };

  const CurrentDice = gameState.diceValue ? DiceIcons[gameState.diceValue] : RotateCw;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* Left Panel */}
      <div className="md:w-1/3 p-4 flex flex-col items-center justify-start space-y-6 border-r border-gray-300 bg-white shadow-xl z-10">
        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-blue-600 via-purple-500 to-red-500 bg-clip-text text-transparent drop-shadow-sm">
          LUDO MASTER
        </h1>

        <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
          <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Commentary Box</h2>
          <p className="text-lg text-slate-700 font-semibold leading-snug min-h-[3rem]">{gameState.commentary}</p>
        </div>

        {winner ? (
          <div className="flex flex-col items-center animate-bounce text-yellow-500">
             <Trophy size={80} strokeWidth={1.5} />
             <h2 className="text-3xl font-bold mt-2">{winner} WINS!</h2>
             <button onClick={() => window.location.reload()} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all">
                New Game
             </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6 w-full">
            
            {/* Player Indicator */}
            <div className={`
              w-full py-3 px-6 rounded-2xl flex items-center justify-between shadow-sm transition-colors duration-300
              ${COLORS[gameState.currentPlayer].light} border-2 ${COLORS[gameState.currentPlayer].border}
            `}>
              <span className={`text-xs font-bold uppercase tracking-widest ${COLORS[gameState.currentPlayer].text}`}>Current Turn</span>
              <span className={`text-xl font-black ${COLORS[gameState.currentPlayer].text}`}>{gameState.currentPlayer}</span>
            </div>

            {/* Dice Control */}
            <div className="relative group">
                <button 
                onClick={rollDice}
                disabled={gameState.isDiceRolling || gameState.waitingForMove}
                className={`
                    relative w-36 h-36 rounded-3xl bg-white shadow-[0_15px_35px_-5px_rgba(0,0,0,0.15)] 
                    border-4 flex items-center justify-center transform transition-all duration-200
                    ${gameState.waitingForMove 
                        ? 'border-gray-100 opacity-60 cursor-default scale-95' 
                        : 'border-indigo-50 hover:scale-105 active:scale-95 cursor-pointer hover:shadow-indigo-200/50'}
                `}
                >
                {gameState.isDiceRolling ? (
                    <RotateCw className="w-16 h-16 text-indigo-500 animate-spin duration-700" />
                ) : (
                    CurrentDice && <CurrentDice className={`w-20 h-20 ${gameState.diceValue ? COLORS[gameState.currentPlayer].text : 'text-slate-300'}`} strokeWidth={1.5} />
                )}
                
                {!gameState.diceValue && !gameState.isDiceRolling && (
                    <span className="absolute -bottom-8 text-xs font-bold text-slate-400 tracking-widest">TAP TO ROLL</span>
                )}
                </button>
                
                {/* Status Badge */}
                {gameState.diceValue && gameState.waitingForMove && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap animate-pulse">
                        MOVE A PIECE
                    </div>
                )}
            </div>

          </div>
        )}

        <div className="w-full mt-auto">
            <div className="flex justify-between items-baseline mb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase">Game Log</h3>
            </div>
            <div className="h-32 overflow-y-auto text-xs space-y-2 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                {gameState.gameLog.slice().reverse().map((log, i) => (
                    <div key={i} className="text-slate-500 border-b border-slate-50 pb-1 last:border-0">
                        <span className="font-mono opacity-50 mr-2">[{gameState.gameLog.length - i}]</span>
                        {log}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Right Panel: The Board */}
      <div className="md:w-2/3 p-2 md:p-8 flex items-center justify-center bg-slate-200/50 overflow-auto">
        <LudoBoard gameState={gameState} onPieceClick={handlePieceClick} />
      </div>
      
    </div>
  );
}
