import React from "react";
import logo from "./logo.svg";
import "./App.css";
import Board from "./Board";

function App() {
  return (
    <div className="_container">
      <Board fenNotation="8/5k2/3p4/1p1Pp2p/pP2Pp1P/P4P1K/8/8" />
    </div>
  );
}

export default App;
