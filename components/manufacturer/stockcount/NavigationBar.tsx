import React from 'react';
import { BarChart3, Table, Warehouse, Package, History, ArrowRightLeft, Package2 } from 'lucide-react';

interface NavigationBarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'table', label: 'Table View', icon: Table },
    { id: 'charts', label: 'Chart View', icon: BarChart3 },
    { id: 'godowns', label: 'Warehouses', icon: Warehouse },
    { id: 'balance', label: 'Stock Balance', icon: Package },
    { id: 'movements', label: 'Movements', icon: History },
    { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
    { id: 'items', label: 'Stock Items', icon: Package2 },
  ];

  return (
    <nav className="mb-6 border-b border-blue-400 pb-0">
      <div className="flex gap-2 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`px-4 py-3 rounded-t-lg flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeView === item.id
                  ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                  : 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
              }`}
              onClick={() => setActiveView(item.id)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavigationBar;