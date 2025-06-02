import { useRef, useState } from 'react';
import Button from '../components/Button';

export default function Upload() {
  const fileRef = useRef();
  const [msg, setMsg] = useState('');

  const submit = async () => {
    if (!fileRef.current.files[0]) return alert('请选择图片');
    const fd = new FormData();
    fd.append('file', fileRef.current.files[0]);

    try {
      await fetch('/api/images/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      setMsg('上传成功 ✅');
      fileRef.current.value = '';
    } catch {
      setMsg('上传失败 ❌');
    }
  };

  return (
    <div className="p-8 flex flex-col items-center gap-4">
      <input
        type="file"
        accept="image/*"
        ref={fileRef}
        className="file:mr-4 file:px-4 file:py-2 file:border-0 file:rounded file:bg-blue-500 file:text-white"
      />
      <Button onClick={submit}>上传图片任务</Button>
      <p className="text-green-600">{msg}</p>
    </div>
  );
}
