import React from "react";
import Input from "./Input";

const PasswordInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement>
> = ({ value, ...props }) => {
  const [show, setShow] = React.useState(false);

  const hasValue = typeof value === "string" && value.length > 0;

  return (
    <Input
      {...props}
      value={value}
      type={show ? "text" : "password"}
      rightIcon={
        hasValue ? (
          <button
            type="button"
            onClick={() => setShow((prev) => !prev)}
            tabIndex={-1}
            className="
              bg-transparent
              border-0
              p-0
              text-sm
              font-medium
              text-blue-600
              hover:text-blue-700
              focus:outline-none
              focus:ring-0
              select-none
            "
          >
            {show ? "Hide" : "Show"}
          </button>
        ) : null
      }
    />
  );
};

export default PasswordInput;
