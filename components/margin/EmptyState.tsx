type Props = {title: string; detail: string; action: string; onAction: () => void};

export default function EmptyState({title, detail, action, onAction}: Props) {
  return <div className="empty-state"><h2>{title}</h2><p>{detail}</p><button className="button button-outline" onClick={onAction}>{action}</button></div>;
}
