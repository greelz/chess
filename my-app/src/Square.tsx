import React from "react";
import { ChessPiece } from "./Enums";

export interface ISquareProps { 
    color?: "dark" | "light";
    occupiedPiece?: ChessPiece;
    rowNumber?: number;
    columnName?: string;
}

// This is a stateless component because it just displays what it is sent in via props
export function Square(props: ISquareProps): JSX.Element {


    return <>
        <div className={`_square ${props.color}`}>
            {props.columnName}
            {props.rowNumber}
            {props.occupiedPiece}
        </div>
    </>;

}