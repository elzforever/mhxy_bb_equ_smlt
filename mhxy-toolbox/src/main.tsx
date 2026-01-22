import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Activity, Home, Menu, Calculator, Gem, Diamond } from 'lucide-react';
import Dashboard from './features/Dashboard';
import SummonedBeastSimTool from './features/SummonedBeastSim';
import SpiritAccessoryTool from './features/SpiritAccessoryCalculator';
import GemPriceTool from './features/GemPriceCalculator';
import SummonedBeastEquipTool from './features/SummonedBeastEquipCalculator';

// --- App Wrapper ---

const App = () => {
  const [currentTool, setCurrentTool] = useState<string>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'home', icon: <Home className="w-5 h-5"/>, label: '主页概览' },
    { id: 'beast-sim', icon: <Calculator className="w-5 h-5"/>, label: '属性模拟' },
    { id: 'beast-equip', icon: <Activity className="w-5 h-5"/>, label: 'BB装分析' },
    { id: 'spirit-calc', icon: <Gem className="w-5 h-5"/>, label: '灵饰分析' },
    { id: 'gem-calc', icon: <Diamond className="w-5 h-5"/>, label: '宝石推算' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      <aside className={`w-64 bg-white border-r border-gray-100 flex flex-col transition-all ${isSidebarOpen ? '' : '-ml-64'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-gray-50">
          <Activity className="w-6 h-6 text-indigo-600"/>
          <h1 className="font-black text-xl text-gray-800">梦幻工具箱</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentTool(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${currentTool === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg">
            <Menu className="w-6 h-6"/>
          </button>
          <div className="flex items-center gap-4">
             <span className="text-xs font-bold text-gray-400">SERVER: 长安城</span>
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">M</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           <div className="max-w-7xl mx-auto">
              {currentTool === 'home' && <Dashboard onSelectTool={setCurrentTool} />}
              {currentTool === 'beast-sim' && <SummonedBeastSimTool />}
              {currentTool === 'spirit-calc' && <SpiritAccessoryTool />}
              {currentTool === 'gem-calc' && <GemPriceTool />}
              {currentTool === 'beast-equip' && <SummonedBeastEquipTool />}
           </div>
        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
