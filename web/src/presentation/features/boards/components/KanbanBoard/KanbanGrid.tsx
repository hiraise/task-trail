import { boardColumns } from "./KanbanBoard.mocks";

interface KabanGridProps {
  columns?: number;
  children: React.ReactNode;
}

export function KanbanGrid({ columns = boardColumns.length, children }: KabanGridProps) {
  const gridStyle: React.CSSProperties = {
    display: "inline-grid",
    gridTemplateColumns: `repeat(${columns}, 220px)`,
    gap: "8px",
    paddingLeft: "8px",
    paddingRight: "8px",
  };

  return <div style={gridStyle}>{children}</div>;
}
