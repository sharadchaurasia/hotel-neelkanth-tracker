interface StatCardProps {
  label: string;
  value: string;
  color: 'blue' | 'red' | 'green' | 'orange';
}

export default function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
