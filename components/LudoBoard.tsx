
import React from 'react';
import { PlayerColor, Piece, PieceState, GameState, Player } from '../types';
import { BOARD_SIZE, COLORS, GLOBAL_PATH, HOME_PATHS, START_INDICES, SAFE_ZONES } from '../constants';
import { Star, Trophy } from 'lucide-react';

interface LudoBoardProps {
  gameState: GameState;
  onPieceClick: (piece: Piece) => void;
}

const LudoBoard: React.FC<LudoBoardProps> = ({ gameState, onPieceClick }) => {

  const renderCell = (x: number, y: number) => {
    // 1. Render Base Areas (Corners 6x6)
    if (x < 6 && y < 6) return renderBase(PlayerColor.BLUE, x, y);
    if (x > 8 && y < 6) return renderBase(PlayerColor.YELLOW, x, y);
    if (x < 6 && y > 8) return renderBase(PlayerColor.RED, x, y);
    if (x > 8 && y > 8) return renderBase(PlayerColor.GREEN, x, y);

    // 2. Render Center (3x3 in middle)
    if (x >= 6 && x <= 8 && y >= 6 && y <= 8) return renderCenter(x, y);

    // 3. Render Tracks
    return renderTrack(x, y);
  };

  const renderBase = (color: PlayerColor, x: number, y: number) => {
    // Slot mapping for pieces in base
    const slotMap: Record<string, number> = {
      'BLUE-1-1': 0, 'BLUE-1-4': 1, 'BLUE-4-1': 2, 'BLUE-4-4': 3,
      'YELLOW-10-1': 0, 'YELLOW-10-4': 1, 'YELLOW-13-1': 2, 'YELLOW-13-4': 3,
      'RED-1-10': 0, 'RED-1-13': 1, 'RED-4-10': 2, 'RED-4-13': 3,
      'GREEN-10-10': 0, 'GREEN-10-13': 1, 'GREEN-13-10': 2, 'GREEN-13-13': 3,
    };

    const key = `${color}-${x}-${y}`;
    const slotIndex = slotMap[key];

    if (slotIndex !== undefined) {
       const piece = gameState.players[color].pieces.find((p, i) => i === slotIndex && p.state === PieceState.BASE);
       return (
         <div className={`w-full h-full bg-white rounded-full border-4 ${COLORS[color].border} flex items-center justify-center shadow-inner`}>
            {piece && renderPiece(piece)}
         </div>
       );
    }

    // Background rendering
    let isColoredArea = false;
    if (color === PlayerColor.BLUE && x <= 5 && y <= 5) isColoredArea = true;
    if (color === PlayerColor.YELLOW && x >= 9 && y <= 5) isColoredArea = true;
    if (color === PlayerColor.RED && x <= 5 && y >= 9) isColoredArea = true;
    if (color === PlayerColor.GREEN && x >= 9 && y >= 9) isColoredArea = true;
    
    if (isColoredArea) {
       const isInnerWhite = (
         (color === PlayerColor.BLUE && x >= 1 && x <= 4 && y >= 1 && y <= 4) ||
         (color === PlayerColor.YELLOW && x >= 10 && x <= 13 && y >= 1 && y <= 4) ||
         (color === PlayerColor.RED && x >= 1 && x <= 4 && y >= 10 && y <= 13) ||
         (color === PlayerColor.GREEN && x >= 10 && x <= 13 && y >= 10 && y <= 13)
       );
       if (isInnerWhite) return <div className="w-full h-full bg-white" />;
       return <div className={`w-full h-full ${COLORS[color].base}`} />;
    }
    return null;
  };

  const renderCenter = (x: number, y: number) => {
    // The very center square
    if (x === 7 && y === 7) return <div className="w-full h-full bg-slate-100 flex items-center justify-center shadow-inner"><Trophy size={20} className="text-yellow-500 drop-shadow-sm"/></div>;
    
    // Triangles leading to center
    // Simpler approach for grid: Just color the path entrance.
    if (x >= 6 && x <= 8 && y === 6) { // Top Row of center (Yellow finish)
       if (x === 7) return <div className={`w-full h-full ${COLORS[PlayerColor.YELLOW].base}`} />; // Yellow Home End
    }
    if (x >= 6 && x <= 8 && y === 8) { // Bottom Row of center (Red finish)
       if (x === 7) return <div className={`w-full h-full ${COLORS[PlayerColor.RED].base}`} />; 
    }
    if (y >= 6 && y <= 8 && x === 6) { // Left Col of center (Blue finish)
       if (y === 7) return <div className={`w-full h-full ${COLORS[PlayerColor.BLUE].base}`} />;
    }
    if (y >= 6 && y <= 8 && x === 8) { // Right Col of center (Green finish)
       if (y === 7) return <div className={`w-full h-full ${COLORS[PlayerColor.GREEN].base}`} />;
    }

    // Diagonals (Fillers) - Make them white with a subtle diagonal line or just white
    return <div className="w-full h-full bg-white" />;
  };

  const renderTrack = (x: number, y: number) => {
    let bgClass = "bg-white";
    const isSafe = SAFE_ZONES.some(s => s.x === x && s.y === y);

    // Start Arrows Colors
    if (x === 1 && y === 6) bgClass = COLORS[PlayerColor.BLUE].base;
    if (x === 8 && y === 1) bgClass = COLORS[PlayerColor.YELLOW].base;
    if (x === 13 && y === 8) bgClass = COLORS[PlayerColor.GREEN].base;
    if (x === 6 && y === 13) bgClass = COLORS[PlayerColor.RED].base;

    // Home Paths
    if (HOME_PATHS[PlayerColor.BLUE].some(c => c.x === x && c.y === y)) bgClass = COLORS[PlayerColor.BLUE].base;
    if (HOME_PATHS[PlayerColor.YELLOW].some(c => c.x === x && c.y === y)) bgClass = COLORS[PlayerColor.YELLOW].base;
    if (HOME_PATHS[PlayerColor.GREEN].some(c => c.x === x && c.y === y)) bgClass = COLORS[PlayerColor.GREEN].base;
    if (HOME_PATHS[PlayerColor.RED].some(c => c.x === x && c.y === y)) bgClass = COLORS[PlayerColor.RED].base;

    // Render Pieces
    const allPieces = (Object.values(gameState.players) as Player[]).flatMap(p => p.pieces);
    const piecesHere = allPieces.filter(p => {
       if (p.state !== PieceState.ACTIVE && p.state !== PieceState.HOME) return false;
       
       let coords;
       if (p.state === PieceState.HOME) {
           // Visual cleanup: if position is 56, they are in the cup (center)
           if (p.position === 56 && x === 7 && y === 7) return true;
           return false; 
       }

       if (p.position < 51) {
          const startIdx = START_INDICES[p.color];
          const globalIdx = (startIdx + p.position) % 52;
          coords = GLOBAL_PATH[globalIdx];
       } else {
          const homeIdx = p.position - 51; // 0 to 5
          if (homeIdx < 6) coords = HOME_PATHS[p.color][homeIdx];
       }
       
       return coords && coords.x === x && coords.y === y;
    });

    return (
       <div className={`w-full h-full border-[0.5px] border-slate-400 relative flex items-center justify-center ${bgClass} shadow-[inset_0_0_4px_rgba(0,0,0,0.05)]`}>
          {isSafe && <Star className="absolute w-full h-full p-1 text-slate-400/30" fill="currentColor" />}
          
          {/* Stack Logic */}
          <div className="relative w-full h-full flex items-center justify-center">
            {piecesHere.map((p, idx) => {
                const count = piecesHere.length;
                let transform = '';
                if (count > 1) {
                    // Spread them out slightly
                    const angle = (360 / count) * idx;
                    const offset = count === 2 ? 4 : 6;
                    const xOff = Math.cos(angle * Math.PI / 180) * offset;
                    const yOff = Math.sin(angle * Math.PI / 180) * offset;
                    transform = `translate(${xOff}px, ${yOff}px) scale(${count > 2 ? 0.6 : 0.8})`;
                }

                return (
                    <div key={`${p.color}-${p.id}`} className="absolute z-10 transition-all duration-300 ease-out" style={{ transform }}>
                        {renderPiece(p)}
                    </div>
                );
            })}
          </div>
       </div>
    );
  };

  const renderPiece = (piece: Piece) => {
     const isCurrentPlayer = gameState.currentPlayer === piece.color;
     const canMove = isCurrentPlayer && 
                     gameState.diceValue !== null && 
                     gameState.waitingForMove &&
                     (
                       (piece.state === PieceState.BASE && gameState.diceValue === 6) ||
                       (piece.state === PieceState.ACTIVE && piece.position + gameState.diceValue <= 56)
                     );
     
     const isWinner = piece.state === PieceState.HOME;

     return (
        <div 
          onClick={(e) => { e.stopPropagation(); onPieceClick(piece); }}
          className={`
             w-6 h-6 md:w-8 md:h-8 rounded-full shadow-[2px_2px_5px_rgba(0,0,0,0.3)] border-2 border-white cursor-pointer
             ${COLORS[piece.color].dark}
             ${canMove ? 'animate-bounce ring-4 ring-yellow-400 ring-opacity-50' : ''}
             ${isWinner ? 'opacity-0' : ''} 
             hover:scale-110 transition-transform
          `}
        >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white/30 to-transparent" />
        </div>
     );
  };

  const grid = [];
  for(let y=0; y<BOARD_SIZE; y++){
     for(let x=0; x<BOARD_SIZE; x++){
        grid.push(renderCell(x,y));
     }
  }

  return (
    <div className="w-full max-w-[650px] aspect-square bg-white border-8 border-slate-800 rounded-lg shadow-2xl overflow-hidden select-none">
      <div 
        className="w-full h-full bg-white"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(15, 1fr)',
          gridTemplateRows: 'repeat(15, 1fr)',
        }}
      >
         {grid.map((cell, i) => <div key={i} className="w-full h-full">{cell}</div>)}
      </div>
    </div>
  );
};

export default LudoBoard;
