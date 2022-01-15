import React, { useState } from "react";
import "./logins.css";

function InputComponent(props: { id: string, labelText: string, type: React.HTMLInputTypeAttribute }) {
  const [value, setValue] = useState("");
  const hasValue = value.length > 0;
  const [isFocused, setIsFocused] = useState(false);
  const moveLabelToTop = hasValue || isFocused;

  return (
    <>
    <label htmlFor={props.id} className={moveLabelToTop ? "hasText" : ""}>
    {props.labelText}
    </label>
      <input
        id={props.id}
        type={props.type}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setValue(e.target.value)
        }
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        value={value}
      />
    </>
  );
}

export default function LoginComponent(): JSX.Element {
  return (
    <div className="_loginComponent">
      <div className="userPasswordContainer">
        <div>
            <InputComponent id="_username" type={"text"} labelText="Username" />
        </div>
        <div>
            <InputComponent id="_password" type={"password"} labelText="Password" />
        </div>
        <div>
          <input type="button" className="submitButton" value="Submit" />
        </div>
      </div>
    </div>
  );
}
