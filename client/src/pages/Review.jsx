import { useEffect, useState } from 'react';
import { api } from '../api/http';
import Button from '../components/Button';

export default function Review() {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchTask = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/reviews');
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

  const decide = async (pass) => {
    if (!task) return;
    setSubmitting(true);
    setError('');
    try {
      await api('/reviews', 'POST', {
        annotationId: task.annotationId,
        pass
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
  if (!task) return <p className="p-8 text-center text-green-600">暂无待审核任务 🎉</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 p-8">
      <img
        src={`http://localhost:3000/uploads/${task.file}`}
        alt="待审核"
        className="max-w-xs rounded shadow"
        onError={(e) => (e.target.style.display = 'none')}
      />
      <p className="text-xl text-gray-800">
        标注结果：<strong className="text-indigo-600">{task.label}</strong>
      </p>
      <div className="flex gap-4">
        <Button
          onClick={() => decide(true)}
          disabled={submitting}
          className="bg-green-500 hover:bg-green-600"
        >
          通过
        </Button>
        <Button
          onClick={() => decide(false)}
          disabled={submitting}
          className="bg-red-500 hover:bg-red-600"
        >
          打回
        </Button>
      </div>
      {submitting && <p className="text-sm text-gray-400">提交中…</p>}
    </div>
  );
}
