import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Save, Trash2, History, RotateCcw, ArrowRight } from 'lucide-react';
import { StatInput } from '../components/Shared';

const SummonedBeastEquipTool = () => {
  const [growth, setGrowth] = useState<number>(1.297);
  const [speedQual, setSpeedQual] = useState<number>(1400);
  const [price, setPrice] = useState<number>(0);
  
  // Expanded stats state
  const [stats, setStats] = useState({
    damage: 0, defense: 0, hp: 0, mp: 0, speed: 0,
    str: 0, end: 0, con: 0, mag: 0, agi: 0
  });

  const [savedItems, setSavedItems] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('summoned_beast_calc_items');
    if (saved) setSavedItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('summoned_beast_calc_items', JSON.stringify(savedItems));
  }, [savedItems]);

  const resetStats = () => {
    setStats({
      damage: 0, defense: 0, hp: 0, mp: 0, speed: 0,
      str: 0, end: 0, con: 0, mag: 0, agi: 0
    });
    setPrice(0);
  };

  const results = useMemo(() => {
    // Standard Conversion Formulas
    // Str = Damage / Growth
    const strFromDmg = growth > 0 ? stats.damage / growth : 0;
    
    // End = Defense / (Growth * 1.333)
    const endFromDef = growth > 0 ? stats.defense / (growth * (4/3)) : 0;
    
    // Con = HP / (Growth * 6)
    const conFromHp = growth > 0 ? stats.hp / (growth * 6) : 0;
    
    // Mag = MP / (Growth * 3) (Approximate MP formula for Summoned Beasts)
    const magFromMp = growth > 0 ? stats.mp / (growth * 3) : 0;

    // Agi = Speed / (SpeedQual / 1000)
    const agiFromSpeed = speedQual > 0 ? stats.speed / (speedQual / 1000) : 0;

    const totalPoints = 
      (stats.str + strFromDmg) + 
      (stats.end + endFromDef) + 
      (stats.con + conFromHp) + 
      (stats.mag + magFromMp) + 
      (stats.agi + agiFromSpeed);

    const pricePerPoint = (price > 0 && totalPoints > 0) ? price / totalPoints : 0;

    return { 
      strFromDmg, endFromDef, conFromHp, magFromMp, agiFromSpeed, 
      totalPoints, pricePerPoint 
    };
  }, [growth, speedQual, stats, price]);

  const saveCurrentItem = () => {
    if (results.totalPoints <= 0) return;
    const newItem = {
      id: Date.now(), timestamp: Date.now(), growth, speedQual,
      stats: { ...stats }, price, totalPoints: results.totalPoints,
      pricePerPoint: results.pricePerPoint
    };
    setSavedItems(prev => [newItem, ...prev]);
  };

  const deleteItem = (id: number) => {
    setSavedItems(prev => prev.filter(i => i.id !== id));
  };

  const loadItem = (item: any) => {
    setGrowth(item.growth);
    setSpeedQual(item.speedQual);
    setStats(item.stats);
    setPrice(item.price);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* --- LEFT: Inputs --- */}
        <div className="lg:w-5/12 space-y-6">
           <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Settings className="w-4 h-4 text-indigo-500"/>核心参数</h3>
                <button onClick={resetStats} className="text-xs font-bold text-gray-400 hover:text-indigo-500 flex items-center gap-1 transition-colors">
                  <RotateCcw className="w-3 h-3"/> 重置
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatInput label="成长 Growth" value={growth} onChange={(v:any) => setGrowth(parseFloat(v)||0)} step={0.001} colorClass="bg-gray-50 border-gray-200" />
                <StatInput label="速度资质 Speed Qual" value={speedQual} onChange={(v:any) => setSpeedQual(parseFloat(v)||0)} colorClass="bg-gray-50 border-gray-200" />
              </div>
              <div>
                <StatInput label="装备价格 (RMB)" value={price} onChange={(v:any) => setPrice(parseFloat(v)||0)} placeholder="输入价格计算性价比" colorClass="bg-indigo-50 border-indigo-100 text-indigo-700" />
              </div>
           </section>

           <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest mb-4">装备属性录入</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatInput label="伤害 Damage" value={stats.damage} onChange={(v:any) => setStats({...stats, damage: parseFloat(v)||0})} colorClass="bg-yellow-50 border-yellow-100 text-yellow-800" />
                  <StatInput label="防御 Defense" value={stats.defense} onChange={(v:any) => setStats({...stats, defense: parseFloat(v)||0})} colorClass="bg-orange-50 border-orange-100 text-orange-800" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StatInput label="气血 HP" value={stats.hp} onChange={(v:any) => setStats({...stats, hp: parseFloat(v)||0})} colorClass="bg-red-50 border-red-100 text-red-800" />
                  <StatInput label="魔法 MP" value={stats.mp} onChange={(v:any) => setStats({...stats, mp: parseFloat(v)||0})} colorClass="bg-blue-50 border-blue-100 text-blue-800" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <StatInput label="速度 Speed" value={stats.speed} onChange={(v:any) => setStats({...stats, speed: parseFloat(v)||0})} colorClass="bg-cyan-50 border-cyan-100 text-cyan-800" />
                </div>
                
                <div className="h-px bg-gray-100 my-2"></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <StatInput label="力量 Str" value={stats.str} onChange={(v:any) => setStats({...stats, str: parseFloat(v)||0})} colorClass="bg-gray-50 border-gray-200" />
                  <StatInput label="耐力 End" value={stats.end} onChange={(v:any) => setStats({...stats, end: parseFloat(v)||0})} colorClass="bg-gray-50 border-gray-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StatInput label="体质 Con" value={stats.con} onChange={(v:any) => setStats({...stats, con: parseFloat(v)||0})} colorClass="bg-gray-50 border-gray-200" />
                  <StatInput label="法力 Mag" value={stats.mag} onChange={(v:any) => setStats({...stats, mag: parseFloat(v)||0})} colorClass="bg-gray-50 border-gray-200" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <StatInput label="敏捷 Agi" value={stats.agi} onChange={(v:any) => setStats({...stats, agi: parseFloat(v)||0})} colorClass="bg-gray-50 border-gray-200" />
                </div>
              </div>

              <button onClick={saveCurrentItem} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <Save className="w-5 h-5"/> 保存当前分析结果
              </button>
           </section>
        </div>

        {/* --- RIGHT: Results & History --- */}
        <div className="lg:w-7/12 flex flex-col gap-6">
           
           {/* Results Card */}
           <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                <div>
                  <h4 className="text-indigo-200 text-xs mb-2 uppercase tracking-widest font-bold">综合属性总值 (折合属性点)</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black font-mono tracking-tighter">{results.totalPoints.toFixed(1)}</span>
                    <span className="text-xl opacity-70 font-bold">Points</span>
                  </div>
                </div>
                
                {price > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 min-w-[140px]">
                     <p className="text-[10px] text-indigo-200 uppercase font-bold mb-1">单点属性性价比</p>
                     <p className="text-3xl font-bold font-mono">¥{results.pricePerPoint.toFixed(2)}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2">
                 <div className="space-y-1">
                   <div className="text-[10px] text-indigo-300 uppercase">力量 Str</div>
                   <div className="font-mono font-bold flex items-center gap-2">
                     <span>{stats.str}</span>
                     {results.strFromDmg > 0 && <span className="text-xs bg-white/20 px-1.5 rounded text-white">+ {results.strFromDmg.toFixed(1)}</span>}
                   </div>
                 </div>
                 <div className="space-y-1">
                   <div className="text-[10px] text-indigo-300 uppercase">耐力 End</div>
                   <div className="font-mono font-bold flex items-center gap-2">
                     <span>{stats.end}</span>
                     {results.endFromDef > 0 && <span className="text-xs bg-white/20 px-1.5 rounded text-white">+ {results.endFromDef.toFixed(1)}</span>}
                   </div>
                 </div>
                 <div className="space-y-1">
                   <div className="text-[10px] text-indigo-300 uppercase">体质 Con</div>
                   <div className="font-mono font-bold flex items-center gap-2">
                     <span>{stats.con}</span>
                     {results.conFromHp > 0 && <span className="text-xs bg-white/20 px-1.5 rounded text-white">+ {results.conFromHp.toFixed(1)}</span>}
                   </div>
                 </div>
                 <div className="space-y-1">
                   <div className="text-[10px] text-indigo-300 uppercase">敏捷 Agi</div>
                   <div className="font-mono font-bold flex items-center gap-2">
                     <span>{stats.agi}</span>
                     {results.agiFromSpeed > 0 && <span className="text-xs bg-white/20 px-1.5 rounded text-white">+ {results.agiFromSpeed.toFixed(1)}</span>}
                   </div>
                 </div>
                 <div className="space-y-1">
                   <div className="text-[10px] text-indigo-300 uppercase">法力 Mag</div>
                   <div className="font-mono font-bold flex items-center gap-2">
                     <span>{stats.mag}</span>
                     {results.magFromMp > 0 && <span className="text-xs bg-white/20 px-1.5 rounded text-white">+ {results.magFromMp.toFixed(1)}</span>}
                   </div>
                 </div>
              </div>
           </div>

           {/* Conversion Details */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h4 className="font-bold text-gray-800 text-sm mb-4">属性折算明细</h4>
             <div className="space-y-3 text-xs text-gray-600 font-mono">
                {results.strFromDmg > 0 && (
                  <div className="flex justify-between items-center border-b border-dashed border-gray-100 pb-2">
                    <span>伤害 {stats.damage} ÷ 成长 {growth}</span>
                    <span className="font-bold text-gray-800">= {results.strFromDmg.toFixed(2)} 力量</span>
                  </div>
                )}
                {results.endFromDef > 0 && (
                  <div className="flex justify-between items-center border-b border-dashed border-gray-100 pb-2">
                    <span>防御 {stats.defense} ÷ (成长 × 4/3)</span>
                    <span className="font-bold text-gray-800">= {results.endFromDef.toFixed(2)} 耐力</span>
                  </div>
                )}
                {results.conFromHp > 0 && (
                  <div className="flex justify-between items-center border-b border-dashed border-gray-100 pb-2">
                    <span>气血 {stats.hp} ÷ (成长 × 6)</span>
                    <span className="font-bold text-gray-800">= {results.conFromHp.toFixed(2)} 体质</span>
                  </div>
                )}
                {results.magFromMp > 0 && (
                  <div className="flex justify-between items-center border-b border-dashed border-gray-100 pb-2">
                    <span>魔法 {stats.mp} ÷ (成长 × 3)</span>
                    <span className="font-bold text-gray-800">= {results.magFromMp.toFixed(2)} 法力</span>
                  </div>
                )}
                {results.agiFromSpeed > 0 && (
                  <div className="flex justify-between items-center border-b border-dashed border-gray-100 pb-2">
                    <span>速度 {stats.speed} ÷ (速资 ÷ 1000)</span>
                    <span className="font-bold text-gray-800">= {results.agiFromSpeed.toFixed(2)} 敏捷</span>
                  </div>
                )}
             </div>
           </div>

           {/* History List */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500"/> 历史记录
                </h3>
                <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded-full text-gray-500 font-bold">{savedItems.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 max-h-[300px] space-y-2">
                 {savedItems.length === 0 && (
                   <div className="text-center py-10 text-gray-300 text-xs">暂无保存的计算记录</div>
                 )}
                 {savedItems.map(item => (
                   <div key={item.id} className="group p-3 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all flex items-center justify-between">
                      <div className="flex flex-col gap-1 cursor-pointer flex-1" onClick={() => loadItem(item)}>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-700 font-black font-mono text-lg">{item.totalPoints.toFixed(1)} Pts</span>
                          {item.price > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded font-bold">¥{item.price}</span>}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-2">
                          <span>成长 {item.growth}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => loadItem(item)} className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200" title="Load">
                           <ArrowRight className="w-4 h-4"/>
                         </button>
                         <button onClick={() => deleteItem(item.id)} className="p-2 bg-white text-red-500 rounded-lg shadow-sm border border-gray-100 hover:border-red-200" title="Delete">
                           <Trash2 className="w-4 h-4"/>
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default SummonedBeastEquipTool;
