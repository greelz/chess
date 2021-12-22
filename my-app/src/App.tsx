import React from "react";
import logo from "./logo.svg";
import "./App.css";
import Board from "./Board";

function App() {
  return (
    <div className="_container">
      <Board fenNotation="4k2r/6r1/8/8/8/8/3R4/R3K3 w Qk - 0 1" />
    </div>
  );
}

export default App;
