type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return <div className="state-box state-box--error">{message}</div>;
}
