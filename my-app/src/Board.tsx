import { Square, ISquareProps } from "./Square";
import { ChessPiece } from "./Enums";

export interface IBoardProps {
    fenNotation?: string;
}

export default function Board(props: IBoardProps) {

    function handleSquareClick(piece?: ChessPiece) {
        alert(piece);
    }

    let f = props.fenNotation;
    if (!f) {
        f = "rnbqkbnrpppppppp88888888888888888888888888888888PPPPPPPPRNBQKBNR";
    }

    let allSquares: ISquareProps[] = [];
    let numSquaresAdded = 0;
    let rowOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    for (let i = 0; i < f.length; ++i) {
        let piece = undefined;
        switch(f[i].toLowerCase()) {
            case 'r':
                piece = ChessPiece.Rook;
                break;
            case 'n':
                piece = ChessPiece.Knight;
                break;
            case 'b':
                piece = ChessPiece.Bishop;
                break;
            case 'k':
                piece = ChessPiece.King;
                break;
            case 'q':
                piece = ChessPiece.Queen;
                break;
            case 'p':
                piece = ChessPiece.Pawn;
                break;
            default: 
                break;
        }
        allSquares.push({ 
            color: (numSquaresAdded % 2 === 0 ? "light" : "dark"),
            rowNumber: (numSquaresAdded) % 8 + 1,
            columnName: rowOptions[i % 8],  
            occupiedPiece: piece,
            clickHandler: handleSquareClick });
        numSquaresAdded += 1;
    }




  return (
    <>
      {allSquares.map((square) => {
        return (
          <Square
            color={square.color}
            occupiedPiece={square.occupiedPiece}
            rowNumber={square.rowNumber}
            columnName={square.columnName}
            clickHandler={square.clickHandler}
          />
        );
      })}
    </>
  );
}
