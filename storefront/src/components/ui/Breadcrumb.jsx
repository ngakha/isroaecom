import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted py-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="text-primary-300" />}
          {item.href ? (
            <Link to={item.href} className="hover:text-primary-900 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-primary-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
