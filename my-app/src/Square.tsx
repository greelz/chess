import { IChessPiece } from "./Interfaces";

export interface ISquareUIProps extends ISquareCoreProps {
  onClick: Function;
}

export interface ISquareCoreProps {
  color: "dark" | "light";
  occupiedPiece?: IChessPiece;
  canBeMovedTo?: boolean;
  selected?: boolean;
  rowNumber: number;
  columnName: string;
}

export interface ISquareProps extends ISquareUIProps {}

// This is a stateless component because it just displays what it is sent in via props
export function Square({
  color,
  occupiedPiece,
  rowNumber,
  columnName,
  canBeMovedTo,
  selected,
  onClick,
}: ISquareProps): JSX.Element {
  const pieceColor = occupiedPiece?.color;

  const backgroundColorClass = selected ? "_selected" : (canBeMovedTo ? "_canBeMovedTo" : color);

  let content = null;
  if (occupiedPiece) {
    const classStyle = canBeMovedTo ? "_canBeMovedToOccupied" : "";
    content = (
      <div
        className={`${classStyle}`}
        style={{
          stroke: "black",
          color: pieceColor === "white" ? "white" : "black",
        }}
        dangerouslySetInnerHTML={{ __html: occupiedPiece.piece.iconSvg }}
      ></div>
    );
  } else {
    if (canBeMovedTo) {
      content = <div className="_canBeMovedTo"></div>;
    }
  }

  return (
    <>
      <div
        onClick={() => onClick()}
        key={columnName + rowNumber}
        className={`_square ${backgroundColorClass}`}
      >
        {content}
        {columnName === "A" ? (
          <div className="_rowNumber">{rowNumber}</div>
        ) : null}
        {rowNumber === 1 ? (
          <div className="_columnName">{columnName}</div>
        ) : null}
      </div>
    </>
  );
}
