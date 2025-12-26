import React from 'react';
import { Calculator, Activity, Gem, Diamond, ChevronRight } from 'lucide-react';

const Dashboard = ({ onSelectTool }: { onSelectTool: (id: string) => void }) => {
  const tools = [
    { id: 'beast-sim', name: '召唤兽属性模拟器', desc: '输入资质成长，精准模拟召唤兽面板属性。', icon: <Calculator className="w-8 h-8 text-emerald-500" />, color: 'bg-emerald-50' },
    { id: 'beast-equip', name: '召唤兽装备计算器', desc: '精准计算BB装综合属性，量化装备点数价值。', icon: <Activity className="w-8 h-8 text-indigo-500" />, color: 'bg-indigo-50' },
    { id: 'spirit-calc', name: '灵饰价值分析', desc: '支持各部位主属性及多条副属性收益计算。', icon: <Gem className="w-8 h-8 text-purple-500" />, color: 'bg-purple-50' },
    { id: 'gem-calc', name: '宝石全景计算器', desc: '支持普通宝石/星辉石/精魄灵石/五色灵尘全推算。', icon: <Diamond className="w-8 h-8 text-amber-500" />, color: 'bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {tools.map(tool => (
        <div 
          key={tool.id}
          onClick={() => onSelectTool(tool.id)}
          className="p-6 bg-white rounded-3xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
        >
          <div className={`p-4 rounded-2xl w-fit mb-4 ${tool.color} group-hover:scale-110 transition-transform`}>
            {tool.icon}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{tool.name}</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">{tool.desc}</p>
          <div className="flex items-center text-xs font-bold text-indigo-600">
            立即使用工具 <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
