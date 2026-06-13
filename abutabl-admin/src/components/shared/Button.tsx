import React, { useState } from "react";
import Loading from "./Loading";

type Props = {
  className?: string;
  label?: string;
  onClick?: () => any;
  icon?: any;
  type?: string;
  disabled?: boolean;
};

const Button = ({
  className,
  label,
  onClick,
  icon: Icon,
  type = "normal",
  disabled = false,
}: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      disabled={disabled}
      onClick={async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        if (onClick) await onClick();
        setIsLoading(false);
      }}
      className={`py-2 px-4 relative rounded flex flex-row items-center gap-2 justify-center  ${
        type === "bordered"
          ? "border border-grayDarkHoverd text-primary"
          : type === "danger"
          ? "border border-grayDarkHoverd text-red"
          : "bg-primary text-white"
      } ${className}`}
    >
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {Icon && <Icon />}{" "}
          {label && (
            <span className={`${disabled && "text-gray"}`}>{label}</span>
          )}
        </>
      )}
    </button>
  );
};

export default Button;
