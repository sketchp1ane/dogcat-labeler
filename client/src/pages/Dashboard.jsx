import { useEffect, useState } from 'react';
import { api } from '../api/http';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/stats').then(setData);
  }, []);

  if (!data) return <p className="p-8">Loading…</p>;

  const color = {
    pending: 'bg-yellow-100 text-yellow-600',
    review: 'bg-purple-100 text-purple-600',
    completed: 'bg-green-100 text-green-600',
  };

  return (
    <div className="p-8 grid gap-6 grid-cols-2 max-w-xl mx-auto">
      {data.map(d => (
        <div
          key={d.status}
          className={`p-6 rounded shadow flex flex-col items-center ${color[d.status] || 'bg-gray-100 text-gray-600'}`}
        >
          <span className="text-3xl font-bold">{d.count}</span>
          <span className="mt-2">{d.status}</span>
        </div>
      ))}
    </div>
  );
}
