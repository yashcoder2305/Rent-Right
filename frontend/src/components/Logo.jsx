import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', linkTo = '/' }) {
  const isLarge = size === 'lg';

  const content = (
    <div className="flex items-center gap-2.5 group">
      {/* Brand Icon Badge */}
      <div
        className={`bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform ${
          isLarge ? 'w-11 h-11' : 'w-9 h-9'
        }`}
      >
        <svg
          className={isLarge ? 'w-6 h-6' : 'w-5 h-5'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* House outline */}
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
          {/* Person silhouette inside */}
          <circle cx="12" cy="9.5" r="1.75" fill="#ffffff" />
          <path d="M9.5 16.5a2.5 2.5 0 0 1 5 0" />
        </svg>
      </div>

      {/* Brand Text */}
      <span className={`font-outfit font-extrabold tracking-tight text-slate-900 ${isLarge ? 'text-2xl' : 'text-xl'}`}>
        RentRight
      </span>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="inline-block focus:outline-none">{content}</Link>;
  }

  return content;
}
