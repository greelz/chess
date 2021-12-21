import { Square, ISquareProps } from "./Square";
import { ChessPiece } from "./Enums";

export interface IBoardProps {
  fenNotation: string;
}

export default function Board(props: IBoardProps) {
  function translateFenToSquaresArray(f: string) {
    let ret: ISquareProps[] = [];
    for (let i = 0; i < f.length; ++i) {
      let piece = undefined;
      switch (f[i].toLowerCase()) {
        case "r":
          piece = ChessPiece.Rook;
          break;
        case "n":
          piece = ChessPiece.Knight;
          break;
        case "b":
          piece = ChessPiece.Bishop;
          break;
        case "k":
          piece = ChessPiece.King;
          break;
        case "q":
          piece = ChessPiece.Queen;
          break;
        case "p":
          piece = ChessPiece.Pawn;
          break;
        default:
          break;
      }

      ret.push( { occupiedPiece: piece, color: "light" })
    }

      return ret;
  }

  const squares = translateFenToSquaresArray(props.fenNotation);

  if (squares) {
    return (
      <>
        {squares.map((square) => {
          return (
            <Square
              color={square.color}
              occupiedPiece={square.occupiedPiece}
              rowNumber={square.rowNumber}
              columnName={square.columnName}
            />
          );
        })}
      </>
    );
  } else {
    return <>"Nothing to display."</>;
  }
}
