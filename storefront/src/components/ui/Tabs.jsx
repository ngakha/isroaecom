import { clsx } from 'clsx';

export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex items-center gap-0 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'px-4 py-2.5 text-sm font-medium transition-colors relative',
            activeTab === tab.id
              ? 'text-primary-900'
              : 'text-muted hover:text-primary-700'
          )}
        >
          <span className="flex items-center gap-2">
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-xs bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-md">
                {tab.count}
              </span>
            )}
          </span>
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-900" />
          )}
        </button>
      ))}
    </div>
  );
}
