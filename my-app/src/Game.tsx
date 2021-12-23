import Board from "./Board";
import { useState } from "react";

interface IGameProps {
  startingFen: string;
}

export default function Game(props: IGameProps): JSX.Element {
  function doSomethingFun() {
    let modified: string = "";
    let x = false;
    for (let i = 0; i < current.length; ++i) {
      if (!x && current[i].toLowerCase() === "r") {
        modified += "1";
        x = true;
      } else {
        modified += current[i];
      }
    }

    setGameHistory((prev) => [...prev, modified]);
  }

  function goBackToPrevGameState() {
    if (gameHistory.length > 1) {
      setGameHistory((prev) => {
        prev.pop();
        return prev;
      });
    }
  }

  const [gameHistory, setGameHistory] = useState<string[]>([props.startingFen]);
  const current = gameHistory[gameHistory.length - 1];

  return (
    <>
      <Board fenNotation={current} />
      <button onClick={() => doSomethingFun()}>Do something fun</button>
      <button onClick={() => goBackToPrevGameState()}>Do something fun</button>
      <div style={{ display: "block" }}>
        {gameHistory.map((h) => (
          <p>{h}</p>
        ))}
      </div>
    </>
  );
}
