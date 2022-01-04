import React from "react";
import { getBoardSpotFromPiece } from "./Helpers";
import { ISquareCoreProps, Square } from "./Square";

export interface IBoardProps {
  squares: ISquareCoreProps[][];
  selectedBoardSpot?: string;
  // onClick: Function;
  possibleMoves: string[] | undefined;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, spot: string) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>, spot: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, spot: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, spot: string) => void;
  onRightClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  grabbyCursor: boolean;
  bRef: React.LegacyRef<HTMLDivElement> | undefined;
}

export default function Board({
  squares,
  selectedBoardSpot,
  possibleMoves,
  onDragOver,
  onDragStart,
  onDrop,
  onDragEnter,
  onRightClick,
  grabbyCursor,
  bRef,
}: IBoardProps): JSX.Element {
  return (
      <div
        className={`_chessBoard ${grabbyCursor ? "_dragging" : ""}`}
        onContextMenu={onRightClick}
        ref={bRef}
      >
        {squares.map((row, i) => {
          return (
            <div key={"row" + i} className="_boardRow">
              {row.map((square) => {
                const spot = getBoardSpotFromPiece(square);
                return (
                  <Square
                    {...square}
                    selected={spot === selectedBoardSpot}
                    key={square.columnName + square.rowNumber}
                    canBeMovedTo={possibleMoves?.includes(spot)}
                    // onClick={() => onClick(spot)}
                    onDrop={(e) => onDrop(e, spot)}
                    onDragOver={(e) => onDragOver(e, spot)}
                    onDragStart={(e) => onDragStart(e, spot)}
                    onDragEnter={(e) => onDragEnter(e, spot)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
  );
}
