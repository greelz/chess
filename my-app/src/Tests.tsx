import {
    gatherAdditionalMoveData,
  generateStateFromFen,
  getPieceFromBoardSpot,
  moveToSquare,
} from "./Helpers";

export default function Tests(props: any) {
  const defaultSquares =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const state = generateStateFromFen(defaultSquares);

  let totalMoves = state.allPossibleMoves!.possibleMoves;

  for (let [
    initSquareSpot,
    targetSquareSpot,
  ] of state.allPossibleMoves!.allMoves.entries()) {
    let init = getPieceFromBoardSpot(initSquareSpot, state.squares);
    console.log(init);
    for (let i = 0; i < targetSquareSpot.length; ++i) {
      let target = getPieceFromBoardSpot(targetSquareSpot[i], state.squares);
      console.log(target);
      const fenString = moveToSquare(
        target!,
        init!,
        state.squares,
        state.isWhitesTurn!,
        state.enPassantTarget!
      );
      var {
        nextTurn,
        newCastleRights,
        newEnPassantString,
        newHalfmoveClock,
        newFullMoveNumber,
      } = gatherAdditionalMoveData(target!, init!, state.isWhitesTurn!, state.castlingRights!, state.halfmoveClock!, state.fullmoveNumber!);

      let newFen = `${fenString} ${nextTurn} ${newCastleRights} ${newEnPassantString} ${newHalfmoveClock} ${newFullMoveNumber}`;
      totalMoves += generateStateFromFen(newFen!).allPossibleMoves!
        .possibleMoves;
    }
  }

  console.log(totalMoves);
  return <></>;
}
