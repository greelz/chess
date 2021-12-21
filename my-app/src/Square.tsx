import React from "react";
import { ChessPiece } from "./Enums";

export interface ISquareProps { 
    color: "dark" | "light";
    occupiedPiece?: ChessPiece;
    rowNumber: number;
    columnName: string;
}

// This is a stateless component because it just displays what it is sent in via props
export function Square(props: ISquareProps): JSX.Element {


    function handleClick() {
        if (props.occupiedPiece) {
            // let the user do something...
        }
        else {
            alert("You don't have a piece on this square, so don't click here you scrub");
        }
    }

    return <>
        <div className={`_square ${props.color}`} onClick={() => handleClick()}>
            {props.columnName}
            {props.rowNumber}
            {props.occupiedPiece}
        </div>
    </>;

}