import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Calculator, Settings, RotateCcw, Shield, Sword, Heart, Activity, ChevronRight, Calculator as CalcIcon } from 'lucide-react';

const App = () => {
  // Only growth affects the conversion of Dmg/Def/HP to attributes
  const [growth, setGrowth] = useState<number>(1.265);
  
  // Focused stats state
  const [stats, setStats] = useState({
    damage: 0, // Green Damage
    defense: 0, // Green Defense
    hp: 0,    // Green HP
    str: 0,   // Yellow Strength
    end: 0,   // Yellow Endurance
    con: 0    // Yellow Constitution
  });

  const [results, setResults] = useState({
    strFromDmg: 0,
    endFromDef: 0,
    conFromHp: 0,
    totalPoints: 0
  });

  // Calculation Logic
  useEffect(() => {
    // 1. Strength Conversion
    // Formula: 1 Strength * Growth = 1.333 Damage
    // So: Equivalent Str = (Damage * 4/3) / Growth
    const strFromDmg = (stats.damage * (4/3)) / growth;

    // 2. Endurance Conversion
    // Formula: 1 Endurance * Growth * 1.333 = 1 Defense
    // So: Equivalent End = Defense / (Growth * 4/3)
    const endFromDef = stats.defense / (growth * (4/3));

    // 3. Constitution Conversion
    // Formula: 1 Constitution * Growth * 6 = 1 HP
    // So: Equivalent Con = HP / (Growth * 6)
    const conFromHp = stats.hp / (growth * 6);

    const totalPoints = 
      (stats.str + strFromDmg) + 
      (stats.end + endFromDef) + 
      (stats.con + conFromHp);

    setResults({
      strFromDmg,
      endFromDef,
      conFromHp,
      totalPoints
    });
  }, [growth, stats]);

  const handleStatChange = (key: keyof typeof stats, value: string) => {
    const num = parseFloat(value);
    setStats(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  const resetAll = () => {
    setGrowth(1.265);
    setStats({
      damage: 0, defense: 0, hp: 0,
      str: 0, end: 0, con: 0
    });
  };

  const StatInput = ({ 
    label, 
    valueKey, 
    colorClass,
    placeholder
  }: { 
    label: string, 
    valueKey: keyof typeof stats, 
    colorClass: string,
    placeholder: string
  }) => (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={stats[valueKey] || ''}
          onChange={(e) => handleStatChange(valueKey, e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 rounded-lg border-2 outline-none transition-all font-mono text-lg ${colorClass}`}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">召唤兽装备综合价值计算器</h1>
              <p className="text-sm text-gray-500">Comprehensive Attribute Value Calculator</p>
            </div>
          </div>
          <button 
            onClick={resetAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Global Settings */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-gray-400" />
                <h2 className="font-bold text-gray-700">基础参数</h2>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  召唤兽成长 (Growth)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={growth}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setGrowth(isNaN(val) ? 0 : val);
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-lg"
                />
                <p className="text-xs text-gray-400 mt-2">
                  * 影响所有属性的换算比例，请准确填写
                </p>
              </div>
            </section>

            {/* Equipment Inputs */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-8">
              
              {/* Green Stats */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                  <h3 className="font-bold text-gray-800 text-lg">基础属性 (绿字)</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <StatInput 
                    label="伤害 (Damage)" 
                    valueKey="damage" 
                    colorClass="bg-green-50/50 border-green-100 focus:border-green-400 focus:ring-green-200 text-green-800"
                    placeholder="0"
                  />
                  <StatInput 
                    label="防御 (Defense)" 
                    valueKey="defense" 
                    colorClass="bg-green-50/50 border-green-100 focus:border-green-400 focus:ring-green-200 text-green-800"
                    placeholder="0"
                  />
                  <StatInput 
                    label="气血 (HP)" 
                    valueKey="hp" 
                    colorClass="bg-green-50/50 border-green-100 focus:border-green-400 focus:ring-green-200 text-green-800"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Yellow Stats */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-yellow-500 rounded-full"></div>
                  <h3 className="font-bold text-gray-800 text-lg">附加属性 (黄字)</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <StatInput 
                    label="力量" 
                    valueKey="str" 
                    colorClass="bg-yellow-50/50 border-yellow-100 focus:border-yellow-400 focus:ring-yellow-200 text-yellow-800"
                    placeholder="0"
                  />
                  <StatInput 
                    label="耐力" 
                    valueKey="end" 
                    colorClass="bg-yellow-50/50 border-yellow-100 focus:border-yellow-400 focus:ring-yellow-200 text-yellow-800"
                    placeholder="0"
                  />
                  <StatInput 
                    label="体质" 
                    valueKey="con" 
                    colorClass="bg-yellow-50/50 border-yellow-100 focus:border-yellow-400 focus:ring-yellow-200 text-yellow-800"
                    placeholder="0"
                  />
                </div>
              </div>

            </section>

          </div>

          {/* Right Column: Analysis */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-indigo-100 font-medium text-lg mb-1">综合属性总值</h2>
                  <p className="text-indigo-200 text-sm opacity-80">Total Attribute Points (Str + End + Con)</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <CalcIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-6xl font-bold tracking-tight">
                  {results.totalPoints.toFixed(2)}
                </span>
                <span className="text-xl text-indigo-200 font-medium">点</span>
              </div>
              
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                <div>
                  <div className="text-indigo-200 text-xs uppercase tracking-wider mb-1">物理系贡献</div>
                  <div className="text-2xl font-bold">{(stats.str + results.strFromDmg).toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-indigo-200 text-xs uppercase tracking-wider mb-1">防御系贡献</div>
                  <div className="text-2xl font-bold">{(stats.end + results.endFromDef).toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-indigo-200 text-xs uppercase tracking-wider mb-1">气血系贡献</div>
                  <div className="text-2xl font-bold">{(stats.con + results.conFromHp).toFixed(1)}</div>
                </div>
              </div>
            </div>

            {/* Formula Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-gray-500" />
                  计算公式详解
                </h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                
                {/* Str Breakdown */}
                <div className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                      <Sword className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-700">力量 (Strength)</span>
                    <span className="ml-auto font-mono font-bold text-lg text-gray-800">
                      {(stats.str + results.strFromDmg).toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>基础力量:</span>
                      <span>{stats.str}</span>
                    </div>
                    <div className="flex justify-between items-center text-orange-600">
                      <span>伤害转化:</span>
                      <span>{stats.damage} × 1.333 ÷ {growth} = {results.strFromDmg.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-400 pt-1 border-t border-gray-200 mt-2">
                      公式: 装备伤害 × (4/3) ÷ 成长
                    </div>
                  </div>
                </div>

                {/* End Breakdown */}
                <div className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-700">耐力 (Endurance)</span>
                    <span className="ml-auto font-mono font-bold text-lg text-gray-800">
                      {(stats.end + results.endFromDef).toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>基础耐力:</span>
                      <span>{stats.end}</span>
                    </div>
                    <div className="flex justify-between items-center text-yellow-600">
                      <span>防御转化:</span>
                      <span>{stats.defense} ÷ ({growth} × 1.333) = {results.endFromDef.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-400 pt-1 border-t border-gray-200 mt-2">
                      公式: 装备防御 ÷ (成长 × 4/3)
                    </div>
                  </div>
                </div>

                {/* Con Breakdown */}
                <div className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                      <Heart className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-700">体质 (Constitution)</span>
                    <span className="ml-auto font-mono font-bold text-lg text-gray-800">
                      {(stats.con + results.conFromHp).toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>基础体质:</span>
                      <span>{stats.con}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                      <span>气血转化:</span>
                      <span>{stats.hp} ÷ ({growth} × 6) = {results.conFromHp.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-400 pt-1 border-t border-gray-200 mt-2">
                      公式: 装备气血 ÷ (成长 × 6)
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
