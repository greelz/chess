import Board from "./Board";
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  calculateNewCastleRights,
  calculatePgn,
  deepCopyFunction,
  doEverything,
  getBoardSpotFromPiece,
  getColumnAndRowFromBoardSpot,
  getRowAndColumnFromPiece,
  translateSquaresToFen,
} from "./Helpers";
import { ISquareCoreProps } from "./Square";
import { ChessPiece, IChessPiece } from "./Interfaces";
import HistoryNavigator from "./HistoryNavigator";

interface IGameProps {
  startingFen: string;
}

export default function Game(props: IGameProps): JSX.Element {
  function doNewMove(newFen: string) {
    // Todo -- add to PGN list, keep in sync
    setGamePGN([
      ...gamePgn,
      calculatePgn(
        gameHistory[gameHistory.length - 1],
        newFen,
        isWhitesTurn || false
      ),
    ]);
    setGameHistory([...gameHistory, newFen]);
    setCurrentPointInHistory(gameHistory.length);
  }

  function deselectSelectedSquare() {
    setSelectedSquare(undefined);
    setDragging(false);
    if (dragRef.current) {
      dragRef.current.style.top = "0px";
      dragRef.current.style.left = "0px";
      dragRef.current.innerHTML = "";
    }
  }

  function trySelectBoardSpot(boardSpot?: string) {
    if (boardSpot && boardSpot.length === 2) {
      const { row, column, success } = getColumnAndRowFromBoardSpot(boardSpot);
      if (success) {
        if (!trySelectSquare(squares[row][column], isWhitesTurn || false)) {
          deselectSelectedSquare();
          return false;
        }
        return true;
      }
    }
  }

  function trySelectSquare(
    squareClicked: ISquareCoreProps,
    isWhitesTurn: boolean
  ): boolean {
    if (currentPointInHistory !== gameHistory.length - 1) return false;
    if (squareClicked.occupiedPiece && squareClicked !== selectedSquare) {
      if (
        (isWhitesTurn && squareClicked.occupiedPiece.color === "white") ||
        (!isWhitesTurn && squareClicked.occupiedPiece.color === "black")
      ) {
        selectSquare(squareClicked);
        return true;
      }
    }
    return false;
  }

  function selectSquare(squareClicked: ISquareCoreProps) {
    // deselect currently selected square
    deselectSelectedSquare();
    setSelectedSquare(squareClicked);
  }

  function gatherAdditionalMoveData(squareClicked: ISquareCoreProps) {
    const nameOfPieceThatIsMoving = selectedSquare!.occupiedPiece?.piece.name;

    let newEnPassantString = "-";
    if (nameOfPieceThatIsMoving === ChessPiece.Pawn) {
      if (squareClicked.columnName === selectedSquare!.columnName) {
        if (
          Math.abs(squareClicked.rowNumber - selectedSquare!.rowNumber) === 2
        ) {
          newEnPassantString =
            selectedSquare!.columnName.toLowerCase() +
            (squareClicked.rowNumber + selectedSquare!.rowNumber) / 2;
        }
      }
    }

    const nextTurn = isWhitesTurn ? "b" : "w";

    // Castle rights
    // They stay the same unless a king or rook moved
    // KQkq is original castling rights
    let castleRights = castlingRights;
    castleRights = calculateNewCastleRights(
      castlingRights,
      nameOfPieceThatIsMoving,
      castleRights,
      isWhitesTurn || false,
      selectedSquare!
    );

    // Moves since last pawn advance or piece capture
    let newHalfmoveClock = (halfmoveClock || 0) + 1;
    const isCapture = (
      square1: ISquareCoreProps,
      square2: ISquareCoreProps
    ): boolean => {
      return (
        square1.occupiedPiece !== undefined &&
        square2.occupiedPiece !== undefined
      );
    };

    if (
      nameOfPieceThatIsMoving === ChessPiece.Pawn ||
      isCapture(selectedSquare!, squareClicked)
    ) {
      newHalfmoveClock = 0;
    }

    // Fullmove number
    const inc = isWhitesTurn ? 0 : 1;
    const newFullMoveNumber = (fullmoveNumber || 0) + inc;

    return {
      nextTurn,
      castleRights,
      newEnPassantString,
      newHalfmoveClock,
      newFullMoveNumber,
    };
  }

  function moveToSquareFromSpot(targetSpot: string, initialSpot: string) {
    const { row, column, success } = getColumnAndRowFromBoardSpot(targetSpot);
    if (success) {
      doFullMove(squares[row][column]);
    }
  }

  function moveToSquare(
    targetSquare: ISquareCoreProps,
    movingSquare: ISquareCoreProps
  ): string | undefined {
    const squaresCopy: ISquareCoreProps[][] = deepCopyFunction(squares);
    if (!movingSquare.occupiedPiece) return;
    const {
      row: targetRow,
      column: targetCol,
      success,
    } = getRowAndColumnFromPiece(targetSquare);
    const {
      row: movingRow,
      column: movingCol,
      success: success2,
    } = getRowAndColumnFromPiece(movingSquare);

    const pieceCopy: IChessPiece = deepCopyFunction(movingSquare.occupiedPiece);

    // Deal with special cases

    // Help with castling if we're doing it
    if (movingSquare.occupiedPiece.piece.name === ChessPiece.King) {
      if (Math.abs(movingCol - targetCol) === 2) {
        // We need to also move the rook to the square next to the king
        let rookColumn = 0,
          castlingLong = true;
        if (targetCol === 6) {
          rookColumn = 7;
          castlingLong = false;
        }

        const rookPiece: IChessPiece = deepCopyFunction(
          squaresCopy[movingRow][rookColumn].occupiedPiece
        );
        const columnToMoveTo = Math.abs(castlingLong ? 3 : 2 - rookColumn);
        squaresCopy[movingRow][columnToMoveTo].occupiedPiece = rookPiece;
        squaresCopy[movingRow][rookColumn].occupiedPiece = undefined;
      }
    }

    // Promote a pawn to a queen if it hits the last row
    if (
      movingSquare.occupiedPiece.piece.name === ChessPiece.Pawn &&
      ((targetRow === 7 && !isWhitesTurn) || (targetRow === 0 && isWhitesTurn))
    ) {
      pieceCopy.piece.name = ChessPiece.Queen;
    }

    // Remove the pawn captured via en passant if that's what we did
    if (
      movingSquare.occupiedPiece.piece.name === ChessPiece.Pawn &&
      getBoardSpotFromPiece(targetSquare).toLowerCase() ===
        enPassantTarget?.toLowerCase()
    ) {
      squaresCopy[movingRow][targetCol].occupiedPiece = undefined;
    }

    if (success && success2) {
      squaresCopy[targetRow][targetCol].occupiedPiece = pieceCopy;
      squaresCopy[movingRow][movingCol].occupiedPiece = undefined;
      deselectSelectedSquare();
      return translateSquaresToFen(squaresCopy);
    }
  }

  function doFullMove(squareClicked: ISquareCoreProps) {
    if (!selectedSquare) return;
    const newFenInit = moveToSquare(squareClicked, selectedSquare);
    if (!newFenInit) return;

    var {
      nextTurn,
      castleRights,
      newEnPassantString,
      newHalfmoveClock,
      newFullMoveNumber,
    } = gatherAdditionalMoveData(squareClicked);

    let newFen = `${newFenInit} ${nextTurn} ${castleRights} ${newEnPassantString} ${newHalfmoveClock} ${newFullMoveNumber}`;
    doNewMove(newFen);
  }

  function dragHandler(e: React.DragEvent<HTMLDivElement>, boardSpot?: string) {
    if (!boardSpot) return;
    if (e.type === "mousedown") {
      e.preventDefault();
      if (e.button !== 0) {
        deselectSelectedSquare();
        return;
      }
      if (selectedBoardSpot && allPossibleCurrentMoves?.includes(boardSpot)) {
        moveToSquareFromSpot(boardSpot, selectedBoardSpot);
      } else {
        if (trySelectBoardSpot(boardSpot)) {
          const targetElem = e.currentTarget.getElementsByTagName("div")[0];
          const newNode = targetElem.cloneNode(true);
          if (dragRef.current && newNode) {
            setDragLocation(dragRef.current, e);
            dragRef.current.appendChild(newNode);
            dragRef.current.style.height = e.currentTarget.clientHeight + "px";
            dragRef.current.style.width = e.currentTarget.clientWidth + "px";
          }
          setDragging(true);
        }
      }
    } else if (e.type === "mouseup") {
      e.preventDefault();
      if (dragRef.current) dragRef.current.innerHTML = "";
      setDragging(false);
      if (!selectedBoardSpot) return; // If nothing is selected do nothing
      if (boardSpot === selectedBoardSpot) return; // Do nothing if we are releasing on the same square
      if (allPossibleCurrentMoves?.includes(boardSpot)) {
        // Try to move to the square, otherwise deselect
        moveToSquareFromSpot(boardSpot, selectedBoardSpot);
      } else {
        deselectSelectedSquare();
      }
    }
  }
  function setDragLocation(elem: HTMLDivElement | null, e: any) {
    if (elem) {
      const topPos = e.clientY - 40 + "px";
      const leftPos = e.clientX - 20 + "px";
      if (elem.style.top !== topPos) elem.style.top = topPos;
      if (elem.style.left !== leftPos) elem.style.left = leftPos;
    }
  }

  function changeCurrentPIH(point: number) {
    if (point > -1 && point <= gameHistory.length - 1) {
      setCurrentPointInHistory(point);
    }
  }

  // Game management via FEN
  const [currentPointInHistory, setCurrentPointInHistory] = useState<number>(0);
  const [gameHistory, setGameHistory] = useState<string[]>([props.startingFen]);
  const [gamePgn, setGamePGN] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<ISquareCoreProps>();
  const [dragging, setDragging] = useState(false);

  const dragRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Calculated properties from state

  const currentFen = gameHistory[currentPointInHistory];
  const fenTranslation = useMemo(() => doEverything(currentFen), [currentFen]);
  const {
    squares,
    isWhitesTurn,
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
    isInCheck,
    allPossibleMoves,
  } = fenTranslation;

  const selectedBoardSpot = selectedSquare
    ? getBoardSpotFromPiece(selectedSquare)
    : undefined;
  const allPossibleCurrentMoves =
    allPossibleMoves && selectedBoardSpot
      ? allPossibleMoves.allMoves.get(selectedBoardSpot)
      : undefined;
  const isCheckmate = isInCheck && allPossibleMoves?.possibleMoves === 0;
  const isStalemate = !isInCheck && allPossibleMoves?.possibleMoves === 0;

  useEffect(() => {
    window.addEventListener("mouseup", (e: MouseEvent) => {
      if (!boardRef.current) return;
      const b = boardRef.current;
      if (
        e.x < b.clientLeft ||
        e.y < b.clientTop ||
        e.x > b.clientWidth ||
        e.y > b.clientHeight
      ) {
        deselectSelectedSquare();
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (dragRef.current && dragRef.current.innerHTML) {
        setDragLocation(dragRef.current, e);
      }
    });
  }, []);

  return (
    <div className="_container">
      <div id="_dragImage" ref={dragRef} />
      {isCheckmate || isStalemate ? (
        <div className="_checkmate">
          {isCheckmate
            ? `Checkmate! ${isWhitesTurn ? "Black" : "White"} wins!`
            : "Stalemate!"}
        </div>
      ) : null}
      <Board
        bRef={boardRef}
        grabbyCursor={dragging}
        squares={squares}
        selectedBoardSpot={selectedBoardSpot}
        possibleMoves={allPossibleCurrentMoves || []}
        onDragOver={(e, s) => dragHandler(e, s)}
        onDragStart={(e, s) => dragHandler(e, s)}
        onDragEnter={(e, s) => dragHandler(e, s)}
        onDrop={(e, s) => dragHandler(e, s)}
        onRightClick={(e) => {
          e.preventDefault();
        }}
      />
      <HistoryNavigator
        myName="greelz"
        opponentName="jordantas21"
        moveList={gamePgn}
        currentPosition={currentPointInHistory}
        goBack={() => changeCurrentPIH(currentPointInHistory - 1)}
        goForward={() => changeCurrentPIH(currentPointInHistory + 1)}
        goBackToBeginning={() => changeCurrentPIH(0)}
        goToEnd={() => changeCurrentPIH(gameHistory.length - 1)}
        jumpToPosition={(pos: number) => changeCurrentPIH(pos + 1)}
      />
    </div>
  );
}
