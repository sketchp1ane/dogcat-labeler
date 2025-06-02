import { useEffect, useState } from 'react';
import { api } from '../api/http';
import Button from '../components/Button';

export default function Annotate() {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchTask = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/images/pending');
      setTask(data);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, []);

  const handleSubmit = async (label) => {
    if (!task) return;
    setSubmitting(true);
    setError('');
    try {
      await api('/annotations', 'POST', {
        imageId: task.id,
        label
      });
      await fetchTask();
    } catch (err) {
      setError(err.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-8 text-center text-gray-500">加载中…</p>;
  if (error) return <p className="p-8 text-center text-red-500">{error}</p>;
  if (!task) return <p className="p-8 text-center text-green-600">暂无待标注任务 🎉</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 p-8">
      <img
        src={`http://localhost:3000/uploads/${task.file}`}
        alt="待标注"
        className="max-w-xs rounded shadow"
        onError={(e) => (e.target.style.display = 'none')}
      />
      <div className="flex gap-4">
        <Button
          onClick={() => handleSubmit('cat')}
          disabled={submitting}
          className="bg-pink-500 hover:bg-pink-600"
        >
          Cat
        </Button>
        <Button
          onClick={() => handleSubmit('dog')}
          disabled={submitting}
          className="bg-indigo-500 hover:bg-indigo-600"
        >
          Dog
        </Button>
      </div>
      {submitting && <p className="text-sm text-gray-400">提交中…</p>}
    </div>
  );
}
