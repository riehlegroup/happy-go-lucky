import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "success";
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => {
    const baseClasses =
      "rounded-md shadow-md px-4 py-2 text-center font-medium transition-colors cursor-pointer";

    const variantClasses = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary-dark disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed",
      secondary:
        "bg-secondary text-white hover:bg-secondary-dark disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed",
      success:
        "bg-success text-white hover:bg-emerald-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed",
    };

    const finalClassName = `${baseClasses} ${variantClasses[variant]} ${className}`;

    return (
      <button ref={ref} className={finalClassName} {...props} />
    );
  }
);

Button.displayName = "Button";

export default Button;
