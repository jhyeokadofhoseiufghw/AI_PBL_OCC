"use client";
export function ConfirmSubmitButton({
  children,
  className,
  confirmMessage,
}: {
  children: React.ReactNode;
  className?: string;
  confirmMessage: string;
}) {
  return (
    <button
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
      type="submit"
    >
      {children}
    </button>
  );
}
