import React from "react";
import { IChessPiece } from "./Enums";

export interface ISquareProps {
  color?: "dark" | "light";
  occupiedPiece?: IChessPiece;
  rowNumber: number;
  columnName: string;
}

// This is a stateless component because it just displays what it is sent in via props
export function Square({
  color,
  occupiedPiece,
  rowNumber,
  columnName,
}: ISquareProps): JSX.Element {
  const pieceColor = occupiedPiece?.color;
  return (
    <>
      <div key={columnName + rowNumber} className={`_square ${color}`}>
        {occupiedPiece ? (
          <div
            style={{
              stroke: "black",
              color: pieceColor === "white" ? "white" : "black",
            }}
            dangerouslySetInnerHTML={{ __html: occupiedPiece.piece.iconSvg }}
          ></div>
        ) : null}
        {columnName === "A" ? <div className="_rowNumber">{rowNumber}</div> : null }
        {rowNumber === 1 ? <div className="_columnName">{columnName}</div> : null }
      </div>
    </>
  );
}
