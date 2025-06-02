export default function Button({ children, className = '', ...rest }) {
  return (
    <button
      {...rest}
      className={
        'px-4 py-2 rounded font-medium transition shadow-sm ' +
        'bg-blue-500 hover:bg-blue-600 text-white ' +
        className
      }
    >
      {children}
    </button>
  );
}
