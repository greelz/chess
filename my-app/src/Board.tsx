import { Square, ISquareProps } from "./Square";
import { ChessPiece } from "./Enums";

export interface IBoardProps {}

export default function Board(props: IBoardProps) {
  let allSquares: ISquareProps[] = [];
  let rowOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      allSquares.push({ color: "light", rowNumber: 8 - i, columnName: rowOptions[j], 
        occupiedPiece: ChessPiece.Rook});
    }
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
          />
        );
      })}
    </>
  );
}
