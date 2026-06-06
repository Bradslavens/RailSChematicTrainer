import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  block?: boolean;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  block,
  loading,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant} ${block ? "btn--block" : ""} ${className}`.trim()}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "…" : children}
    </button>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function Field({ label, id, ...rest }: FieldProps) {
  const inputId = id ?? rest.name;
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} className="input" {...rest} />
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div className="alert alert--error" role="alert">
      {children}
    </div>
  );
}

export function Spinner() {
  return <div className="spinner spinner--center" role="status" aria-label="Loading" />;
}
