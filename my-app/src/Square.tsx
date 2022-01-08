import { ChessPiece, IChessPiece } from "./Interfaces";

import { ReactComponent as Bishop } from "./images/Bishop.svg";
import { ReactComponent as Pawn } from "./images/Pawn.svg";
import { ReactComponent as King } from "./images/King.svg";
import { ReactComponent as Queen } from "./images/Queen.svg";
import { ReactComponent as Rook } from "./images/Rook.svg";
import { ReactComponent as Knight } from "./images/Knight.svg";

export interface ISquareUIProps extends ISquareCoreProps {
  // onClick: Function;
  selected?: boolean;
  canBeMovedTo?: boolean;
  onDragStart: React.DragEventHandler<HTMLDivElement>;
  onDragEnter: React.DragEventHandler<HTMLDivElement>;
  onDragOver: React.DragEventHandler<HTMLDivElement>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
}

export const colLettersArray = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export interface ISquareCoreProps {
  color: "dark" | "light";
  occupiedPiece?: IChessPiece;
  rowNumber: number;
  columnName: typeof colLettersArray[number];
}

export interface ISquareProps extends ISquareUIProps {}

function getSvgFromPieceName(name: ChessPiece) {
  switch(name) {
    case ChessPiece.King:
      return <King />;
    case ChessPiece.Pawn:
      return <Pawn />;
    case ChessPiece.Rook:
      return <Rook />;
    case ChessPiece.Knight:
      return <Knight />;
    case ChessPiece.Queen:
      return <Queen />;
    case ChessPiece.Bishop:
      return <Bishop />;
    default: 
      return <Pawn />;
  }
}

// This is a stateless component because it just displays what it is sent in via props
export function Square({
  color,
  occupiedPiece,
  rowNumber,
  columnName,
  canBeMovedTo,
  selected,
  onDragStart,
  onDragOver,
  onDrop,
}: ISquareProps): JSX.Element {
  const pieceColor = occupiedPiece?.color;

  let backgroundColorClass = color;
  if (selected) backgroundColorClass += " _selected";
  if (canBeMovedTo) {
    if (occupiedPiece) {
      backgroundColorClass += " _canBeMovedToOccupied";
    }
    else { backgroundColorClass += " _canBeMovedTo"; }
  }

  let content = null;
  if (occupiedPiece) {
    content = (
      <div
        style={{
          stroke: "black",
          color: pieceColor === "white" ? "white" : "black",
          height: "80%",
          width: "80%",
        }}
      >
        {getSvgFromPieceName(occupiedPiece.piece.name)}
      </div>
    );
  } else {
    if (canBeMovedTo) {
      content = <div className="_canBeMovedTo"></div>;
    }
  }

  return (
    <>
      <div
        draggable={occupiedPiece !== undefined}
        onMouseDown={onDragStart}
        onMouseMove={onDragOver}
        onMouseUp={onDrop}
        onMouseOver={onDragOver}
        onClick={onDrop}
        key={columnName + rowNumber}
        className={`_square ${backgroundColorClass}`}
      >
        {content}
        {columnName === "a" ? (
          <div className="_rowNumber">{rowNumber}</div>
        ) : null}
        {rowNumber === 1 ? (
          <div className="_columnName">{columnName.toUpperCase()}</div>
        ) : null}
      </div>
    </>
  );
}
