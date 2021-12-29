import { ISquareCoreProps, Square } from "./Square";

export interface IBoardProps {
  squares: ISquareCoreProps[][];
  onClick: Function;
}

export default function Board({ onClick, squares }: IBoardProps): JSX.Element {
  return (
    <>
      <div className="_chessBoard">
        {squares.map((row, i) => {
          return (
            <div key={"row" + i} className="_boardRow">
              {row.map((square) => {
                return (
                  <Square {...square}
                    key={square.columnName + square.rowNumber}
                    onClick={() => onClick(square.columnName + square.rowNumber)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}
