import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Calculator, Settings, Info, RotateCcw, Shield, Sword, Heart, Zap, Wind, Star } from 'lucide-react';

// Types for our state
interface PetParams {
  growth: number;
  speedApt: number;
  physiqueApt: number;
}

interface EquipStats {
  // Base Stats (Green)
  damage: number;
  defense: number;
  hp: number;
  mp: number;
  speed: number;
  spirit: number;
  // Added Stats (Yellow)
  str: number;
  con: number;
  mag: number;
  end: number;
  agi: number;
}

const DEFAULT_PARAMS: PetParams = {
  growth: 1.265,
  speedApt: 1400,
  physiqueApt: 4500,
};

const DEFAULT_EQUIP: EquipStats = {
  damage: 0,
  defense: 0,
  hp: 0,
  mp: 0,
  speed: 0,
  spirit: 0,
  str: 0,
  con: 0,
  mag: 0,
  end: 0,
  agi: 0,
};

const App = () => {
  const [params, setParams] = useState<PetParams>(DEFAULT_PARAMS);
  const [equip, setEquip] = useState<EquipStats>(DEFAULT_EQUIP);
  const [results, setResults] = useState<{
    equivStr: number;
    equivCon: number;
    equivMag: number; // Based on Spirit
    equivMagFromMp: number; // Based on MP (less common)
    equivEnd: number;
    equivAgi: number;
  }>({
    equivStr: 0,
    equivCon: 0,
    equivMag: 0,
    equivMagFromMp: 0,
    equivEnd: 0,
    equivAgi: 0,
  });

  // Calculation Logic
  useEffect(() => {
    // 1. Strength Conversion
    // Attack = Str * Growth + EquipDamage * 4/3
    // Equivalent Str = (EquipDamage * 4/3) / Growth
    const strFromDmg = (equip.damage * (4/3)) / params.growth;
    const totalStr = equip.str + strFromDmg;

    // 2. Constitution Conversion
    // HP = Con * Growth * 6 + EquipHP
    // Equivalent Con = EquipHP / (Growth * 6)
    const conFromHp = equip.hp / (params.growth * 6);
    const totalCon = equip.con + conFromHp;

    // 3. Endurance Conversion
    // Def = End * Growth * 4/3 + EquipDef
    // Equivalent End = EquipDef / (Growth * 4/3)
    const endFromDef = equip.defense / (params.growth * (4/3));
    const totalEnd = equip.end + endFromDef;

    // 4. Agility Conversion
    // Speed = Agi * SpeedApt / 1000 + EquipSpeed
    // Equivalent Agi = EquipSpeed / (SpeedApt / 1000)
    const agiFromSpeed = equip.speed / (params.speedApt / 1000);
    const totalAgi = equip.agi + (isFinite(agiFromSpeed) ? agiFromSpeed : 0);

    // 5. Magic Conversion (Primary: Spirit)
    // Spirit = Mag * 0.7 + EquipSpirit
    // Equivalent Mag = EquipSpirit / 0.7
    const magFromSpirit = equip.spirit / 0.7;
    const totalMag = equip.mag + magFromSpirit;

    // 5b. Magic Conversion (Secondary: Mana - usually ignored but calculated for completeness)
    // MP = Mag * Growth * 3 + EquipMP
    // Equivalent Mag = EquipMP / (Growth * 3)
    const magFromMp = equip.mp / (params.growth * 3);
    const totalMagFromMp = equip.mag + magFromMp;

    setResults({
      equivStr: totalStr,
      equivCon: totalCon,
      equivEnd: totalEnd,
      equivAgi: totalAgi,
      equivMag: totalMag,
      equivMagFromMp: totalMagFromMp,
    });
  }, [params, equip]);

  const handleParamChange = (key: keyof PetParams, value: string) => {
    const num = parseFloat(value);
    setParams(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  const handleEquipChange = (key: keyof EquipStats, value: string) => {
    const num = parseFloat(value);
    setEquip(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  const resetAll = () => {
    setParams(DEFAULT_PARAMS);
    setEquip(DEFAULT_EQUIP);
  };

  const ResultCard = ({ 
    title, 
    value, 
    detail, 
    icon: Icon, 
    colorClass, 
    bgColorClass 
  }: { 
    title: string; 
    value: number; 
    detail: string; 
    icon: any; 
    colorClass: string; 
    bgColorClass: string;
  }) => (
    <div className={`p-4 rounded-xl border ${bgColorClass} ${colorClass.replace('text-', 'border-').replace('600', '200')} shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-gray-700">{title}</span>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <div className="flex items-end items-baseline gap-2">
        <span className={`text-3xl font-bold ${colorClass}`}>
          {value.toFixed(2)}
        </span>
        <span className="text-sm text-gray-500 font-medium">属性点</span>
      </div>
      <div className="mt-2 text-xs text-gray-500 bg-white/50 p-1.5 rounded">
        {detail}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-lg text-white">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">召唤兽装备价值计算器</h1>
              <p className="text-sm text-gray-500">梦幻西游 Summoned Beast Equipment Calculator</p>
            </div>
          </div>
          <button 
            onClick={resetAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重置数据
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Settings & Inputs */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Global Settings */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <Settings className="w-5 h-5 text-gray-400" />
                <h2 className="font-bold text-gray-700">召唤兽参数设置</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">成长 (Growth)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={params.growth}
                    onChange={(e) => handleParamChange('growth', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="input-label">速度资质 (Speed Apt)</label>
                  <input
                    type="number"
                    value={params.speedApt}
                    onChange={(e) => handleParamChange('speedApt', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                  />
                </div>
                <div className="col-span-2">
                   <div className="flex justify-between">
                    <label className="input-label">体力资质 (Physique Apt)</label>
                    <span className="text-xs text-gray-400 font-normal">注：仅影响等级血量，不影响装备换算</span>
                   </div>
                   <input
                    type="number"
                    value={params.physiqueApt}
                    onChange={(e) => handleParamChange('physiqueApt', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                  />
                </div>
              </div>
              
              {/* Conversion Factors Preview */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700 space-y-1">
                <p className="font-semibold mb-1">当前参数换算参考：</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p>1 力量 ≈ {(params.growth).toFixed(3)} 攻击</p>
                  <p>1 耐力 ≈ {(params.growth * 4/3).toFixed(3)} 防御</p>
                  <p>1 体质 ≈ {(params.growth * 6).toFixed(3)} 气血</p>
                  <p>1 敏捷 ≈ {(params.speedApt / 1000).toFixed(3)} 速度</p>
                </div>
              </div>
            </section>

            {/* 2. Equipment Inputs */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <Shield className="w-5 h-5 text-gray-400" />
                <h2 className="font-bold text-gray-700">装备属性输入</h2>
              </div>
              
              <div className="space-y-5">
                {/* Base Stats */}
                <div>
                  <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-3">基础属性 (绿色属性)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: '伤害 (Damage)', key: 'damage', placeholder: '如: 60' },
                      { label: '防御 (Defense)', key: 'defense', placeholder: '如: 90' },
                      { label: '气血 (Health)', key: 'hp', placeholder: '如: 120' },
                      { label: '魔法 (Mana)', key: 'mp', placeholder: '如: 50' },
                      { label: '速度 (Speed)', key: 'speed', placeholder: '如: 45' },
                      { label: '灵力 (Spirit)', key: 'spirit', placeholder: '如: 10' },
                    ].map((item) => (
                      <div key={item.key}>
                        <label className="text-xs text-gray-500 mb-1 block">{item.label}</label>
                        <input
                          type="number"
                          value={equip[item.key as keyof EquipStats] || ''}
                          placeholder="0"
                          onChange={(e) => handleEquipChange(item.key as keyof EquipStats, e.target.value)}
                          className="w-full px-3 py-2 bg-green-50/50 border border-green-200 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none text-sm text-gray-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Added Stats */}
                <div>
                  <h3 className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-3">附加属性 (黄字属性)</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '力量 (Str)', key: 'str' },
                      { label: '耐力 (End)', key: 'end' },
                      { label: '体质 (Con)', key: 'con' },
                      { label: '法力 (Mag)', key: 'mag' },
                      { label: '敏捷 (Agi)', key: 'agi' },
                    ].map((item) => (
                      <div key={item.key}>
                        <label className="text-xs text-gray-500 mb-1 block">{item.label}</label>
                        <input
                          type="number"
                          value={equip[item.key as keyof EquipStats] || ''}
                          placeholder="0"
                          onChange={(e) => handleEquipChange(item.key as keyof EquipStats, e.target.value)}
                          className="w-full px-3 py-2 bg-yellow-50/50 border border-yellow-200 rounded-md focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm text-gray-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Right Column: Analysis */}
          <div className="lg:col-span-7 space-y-6">
            
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
              <div className="flex items-center gap-2 mb-6 border-b pb-4">
                <Info className="w-5 h-5 text-gray-400" />
                <h2 className="font-bold text-gray-800 text-lg">属性价值评估 (Attribute Valuation)</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Physical Attack */}
                <ResultCard
                  title="物理系价值 (Str)"
                  value={results.equivStr}
                  icon={Sword}
                  colorClass="text-orange-600"
                  bgColorClass="bg-orange-50"
                  detail={`基础力量 ${equip.str} + 转化 ${(results.equivStr - equip.str).toFixed(2)} (来自 ${equip.damage} 伤害)`}
                />

                {/* Magical */}
                <ResultCard
                  title="法术系价值 (Mag)"
                  value={results.equivMag}
                  icon={Star}
                  colorClass="text-purple-600"
                  bgColorClass="bg-purple-50"
                  detail={`基础法力 ${equip.mag} + 转化 ${(results.equivMag - equip.mag).toFixed(2)} (来自 ${equip.spirit} 灵力)`}
                />

                {/* Defense */}
                <ResultCard
                  title="防御系价值 (End)"
                  value={results.equivEnd}
                  icon={Shield}
                  colorClass="text-yellow-600"
                  bgColorClass="bg-yellow-50"
                  detail={`基础耐力 ${equip.end} + 转化 ${(results.equivEnd - equip.end).toFixed(2)} (来自 ${equip.defense} 防御)`}
                />

                {/* Health */}
                <ResultCard
                  title="气血系价值 (Con)"
                  value={results.equivCon}
                  icon={Heart}
                  colorClass="text-red-600"
                  bgColorClass="bg-red-50"
                  detail={`基础体质 ${equip.con} + 转化 ${(results.equivCon - equip.con).toFixed(2)} (来自 ${equip.hp} 气血)`}
                />

                {/* Speed */}
                <ResultCard
                  title="速度系价值 (Agi)"
                  value={results.equivAgi}
                  icon={Wind}
                  colorClass="text-cyan-600"
                  bgColorClass="bg-cyan-50"
                  detail={`基础敏捷 ${equip.agi} + 转化 ${(results.equivAgi - equip.agi).toFixed(2)} (来自 ${equip.speed} 速度)`}
                />
                
                {/* Mana Pool (Secondary) */}
                <ResultCard
                  title="魔法池价值 (Mag from MP)"
                  value={results.equivMagFromMp}
                  icon={Zap}
                  colorClass="text-blue-600"
                  bgColorClass="bg-blue-50"
                  detail={`基础法力 ${equip.mag} + 转化 ${(results.equivMagFromMp - equip.mag).toFixed(2)} (来自 ${equip.mp} 魔法)`}
                />

              </div>

              {/* Summary / Interpretation */}
              <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-2">如何分析？</h3>
                <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4">
                  <li><span className="font-semibold text-orange-600">攻宠</span>：主要看 <span className="font-bold">物理系价值</span>。如果需要速度，可将速度价值按比例折算（通常攻宠也会加敏捷）。</li>
                  <li><span className="font-semibold text-purple-600">法宠</span>：主要看 <span className="font-bold">法术系价值</span>（基于灵力）。注意：力量属性也会增加灵力 (1力=0.4灵)，此处未合并计算，需手动评估综合收益。</li>
                  <li><span className="font-semibold text-yellow-600">耐攻/耐法</span>：将 <span className="font-bold">物理/法术价值</span> 与 <span className="font-bold">防御价值</span> 相加评估总属性点。</li>
                  <li>此计算器核心逻辑是将所有“绿字属性”（如伤害、气血）根据当前召唤兽的成长与资质，反推回对应的“属性点数”。</li>
                </ul>
              </div>

            </section>
          </div>

        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
