import Board from "./Board";
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  calculateNewCastleRights,
  calculatePgn,
  generateStateFromFen,
  getBoardSpotFromPiece,
  getColumnAndRowFromBoardSpot,
  IGameState,
  moveToSquare,
} from "./Helpers";
import { ISquareCoreProps } from "./Square";
import { ChessPiece } from "./Interfaces";
import HistoryNavigator from "./HistoryNavigator";
import FieldAndLabel from "./FieldAndLabel";

interface IGameProps {
  startingFen?: string;
}

export default function Game(props: IGameProps): JSX.Element {
  //#region Game Functions
  function doNewMove(newFen: string): void {
    const moveData = generateStateFromFen(newFen);
    setGameHistory([...gameState, moveData]);
    setCurrentPointInHistory(gameState.length);
    setGamePgn([...gamePgn, calculatePgn(gameState[gameState.length - 1], moveData)]);
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
    if (currentPointInHistory !== gameState.length - 1) return false;
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
    const newFullMoveNumber = (fullmoveNumber || 1) + inc;

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

  function doFullMove(squareClicked: ISquareCoreProps) {
    if (!selectedSquare) return;
    const newFenInit = moveToSquare(
      squareClicked,
      selectedSquare,
      squares,
      isWhitesTurn || false,
      enPassantTarget || ""
    );
    deselectSelectedSquare();
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
    if (isWhitesTurn === undefined) return; // If we are sent an incomplete starting FEN notation, do nothing.
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

  function changeCurrentPointInHistory(point: number) {
    if (point > -1 && point <= gameState.length - 1) {
      setCurrentPointInHistory(point);
    }
  }

  // Game management via FEN
  const [gameState, setGameHistory] = useState<IGameState[]>([
    generateStateFromFen(
      props.startingFen ||
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    ),
  ]);

  const [gamePgn, setGamePgn] = useState<string[]>([]);
  const [currentPointInHistory, setCurrentPointInHistory] = useState<number>(0);
  const [selectedSquare, setSelectedSquare] = useState<ISquareCoreProps>();
  const [dragging, setDragging] = useState(false);

  const dragRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Calculated properties from state
  const gamePgnString = gamePgn.map((val, idx) => {
    const number = (idx % 2 === 0) ? ` ${idx / 2 + 1}.` : "";
    return `${number} ${val}`;
  }).join("");

  const currentGameHistory = gameState[currentPointInHistory];
  const {
    squares,
    isWhitesTurn,
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
    isInCheck,
    allPossibleMoves,
  } = currentGameHistory;

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
        squares={currentGameHistory.squares}
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
        goBack={() => changeCurrentPointInHistory(currentPointInHistory - 1)}
        goForward={() => changeCurrentPointInHistory(currentPointInHistory + 1)}
        goBackToBeginning={() => changeCurrentPointInHistory(0)}
        goToEnd={() => changeCurrentPointInHistory(gameState.length - 1)}
        jumpToPosition={(pos: number) => changeCurrentPointInHistory(pos + 1)}
      />
      <table className="_fenPgnTable">
        <tr>
          <td>FEN</td>
          <td className="_tableData">{gameState[currentPointInHistory].fen}</td>
        </tr>
        <tr>
          <td>PGN</td>
          <td className="_tableData">{gamePgnString}</td>
        </tr>
      </table>
    </div>
  );
}
