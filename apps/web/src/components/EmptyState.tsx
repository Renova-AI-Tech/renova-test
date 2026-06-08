type EmptyStateProps = {
  title: string;
};

export function EmptyState({ title }: EmptyStateProps) {
  return <div className="state-box">{title}</div>;
}
