import React, { useState, useEffect, useMemo } from 'react';
import { Diamond, Trash2, Save, Activity } from 'lucide-react';
import { RaceType, SpiritType, SubAttrType } from '../types';
import { RACE_FACTORS } from '../constants';

const SpiritAccessoryTool = () => {
  const [race, setRace] = useState<RaceType>('human');
  const [spiritType, setSpiritType] = useState<SpiritType>('ring');
  const [mainAttr, setMainAttr] = useState({ type: 'damage', value: 0 });
  const [subAttrs, setSubAttrs] = useState<{ type: SubAttrType; value: number }[]>([
    { type: 'damage', value: 0 },
    { type: 'damage', value: 0 }
  ]);
  const [gemLevel, setGemLevel] = useState(0);
  const [price, setPrice] = useState(0);
  const [savedItems, setSavedItems] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('spirit_calc_items');
    if (saved) setSavedItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('spirit_calc_items', JSON.stringify(savedItems));
  }, [savedItems]);

  const results = useMemo(() => {
    const factor = RACE_FACTORS[race];
    let totalDmg = (mainAttr.type === 'damage' ? mainAttr.value : 0);
    let totalDef = (mainAttr.type === 'defense' ? mainAttr.value : 0);
    let totalSpd = 0;

    subAttrs.forEach(attr => {
      if (attr.type === 'damage') totalDmg += attr.value + (gemLevel * 4);
      else if (attr.type === 'speed') totalSpd += attr.value + (gemLevel * 3);
    });

    const eqStr = totalDmg / factor.strToDmg;
    const eqAgi = totalSpd / factor.agiToSpd;
    const eqEnd = totalDef / factor.endToDef;
    const totalPoints = eqStr + eqAgi + eqEnd;
    const pricePerPoint = (price > 0 && totalPoints > 0) ? price / totalPoints : 0;

    return { totalDmg, totalSpd, totalDef, eqStr, eqAgi, eqEnd, totalPoints, pricePerPoint, factor };
  }, [race, mainAttr, subAttrs, gemLevel, price]);

  const saveItem = () => {
    if (results.totalPoints <= 0) return;
    const newItem = {
      id: Date.now(),
      timestamp: Date.now(),
      race,
      spiritType,
      mainAttr: { ...mainAttr },
      subAttrs: subAttrs.map(a => ({ ...a })),
      gemLevel,
      price,
      totalPoints: results.totalPoints,
      pricePerPoint: results.pricePerPoint
    };
    setSavedItems([newItem, ...savedItems]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2">
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8 h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-black text-gray-800 flex items-center gap-3 text-lg">
                <Diamond className="w-6 h-6 text-purple-600" />
                灵饰属性配置
              </h3>
              <select 
                value={race} 
                onChange={e => setRace(e.target.value as RaceType)} 
                className="pl-4 pr-8 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold outline-none border border-indigo-100 appearance-none text-sm min-w-[160px]"
              >
                <option value="human">人族 (Str:0.67)</option>
                <option value="demon">魔族 (Str:0.77)</option>
                <option value="immortal">仙族 (Str:0.57)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">部位选择</label>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                  {['ring', 'earring'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => {
                        setSpiritType(t as SpiritType);
                        setMainAttr({ type: t === 'ring' ? 'damage' : 'm-dmg', value: 0 });
                      }} 
                      className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${spiritType === t ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {t === 'ring' ? '戒指' : '耳饰'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">星辉石等级</label>
                <select 
                  value={gemLevel} 
                  onChange={e => setGemLevel(parseInt(e.target.value))} 
                  className="w-full px-4 py-3.5 bg-gray-100 border-none rounded-2xl font-mono text-base font-bold outline-none appearance-none hover:bg-gray-200 transition-colors"
                >
                  {Array.from({length: 13}).map((_, i) => <option key={i} value={i}>{i} 级星辉石</option>)}
                </select>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-3xl border-2 border-dashed border-gray-200 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">上排主属性</span>
                <select 
                  value={mainAttr.type} 
                  onChange={e => setMainAttr({...mainAttr, type: e.target.value})} 
                  className="pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none shadow-sm min-w-[140px]"
                >
                  {spiritType === 'ring' ? (
                    <>
                      <option value="damage">伤害 (Damage)</option>
                      <option value="defense">防御 (Defense)</option>
                    </>
                  ) : (
                    <>
                      <option value="m-dmg">法术伤害</option>
                      <option value="m-def">法术防御</option>
                    </>
                  )}
                </select>
              </div>
              <input 
                type="number" 
                value={mainAttr.value || ''} 
                onChange={e => setMainAttr({...mainAttr, value: parseFloat(e.target.value) || 0})} 
                className="w-full bg-transparent text-5xl font-black font-mono text-gray-800 outline-none placeholder:text-gray-100 tracking-tighter" 
                placeholder="0" 
              />
            </div>

            <div className="space-y-5">
               <div className="flex items-center justify-between">
                 <span className="text-xs font-black text-gray-400 uppercase tracking-widest">下排附加属性</span>
                 <button onClick={() => {
                   if (subAttrs.length < 3) setSubAttrs([...subAttrs, { type: 'damage', value: 0 }]);
                 }} disabled={subAttrs.length >= 3} className="px-3 py-1.5 bg-indigo-50 text-[11px] font-black text-indigo-600 rounded-lg hover:bg-indigo-100 uppercase">+ 新增属性</button>
               </div>
               <div className="space-y-4">
                 {subAttrs.map((attr, idx) => (
                   <div key={idx} className="flex gap-4 items-center group">
                      <select 
                        value={attr.type} 
                        onChange={e => {
                          const newAttrs = [...subAttrs];
                          newAttrs[idx].type = e.target.value as SubAttrType;
                          setSubAttrs(newAttrs);
                        }} 
                        className="bg-gray-100 px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-none min-w-[100px]"
                      >
                        <option value="damage">伤害</option>
                        <option value="speed">速度</option>
                      </select>
                      <input 
                        type="number" 
                        value={attr.value || ''} 
                        onChange={e => {
                          const newAttrs = [...subAttrs];
                          newAttrs[idx].value = parseFloat(e.target.value) || 0;
                          setSubAttrs(newAttrs);
                        }} 
                        className="flex-1 px-5 py-3.5 bg-gray-100 rounded-2xl font-mono text-xl font-bold outline-none" 
                        placeholder="0" 
                      />
                      {subAttrs.length > 2 && (
                        <button onClick={() => setSubAttrs(subAttrs.filter((_, i) => i !== idx))} className="p-3 text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                   </div>
                 ))}
               </div>
            </div>

            <input 
              type="number" 
              value={price || ''} 
              onChange={e => setPrice(parseFloat(e.target.value) || 0)} 
              className="w-full px-6 py-4 bg-amber-50 border border-amber-100 rounded-3xl text-3xl font-mono font-black text-amber-900 outline-none" 
              placeholder="预算价格 RMB" 
            />

            <button 
              onClick={saveItem} 
              className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Save className="w-6 h-6" />
              保存当前分析
            </button>
          </section>
        </div>

        <div className="lg:w-1/2">
           <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-10 flex items-center gap-3">
                <Activity className="w-5 h-5 text-indigo-500" />
                实时评估面板
              </h2>
              
              <div className="flex flex-col items-center justify-center py-12 space-y-6 border-b border-gray-50 mb-10 bg-gradient-to-b from-gray-50/50 to-transparent rounded-3xl">
                <div className="flex items-baseline gap-3">
                  <span className="text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-900 font-mono leading-none">
                    {results.totalPoints.toFixed(2)}
                  </span>
                  <span className="text-2xl font-black text-indigo-300">PTS</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div className="flex justify-between p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                    <span className="text-xs font-black text-orange-700">物理贡献</span>
                    <span className="text-lg font-black font-mono text-orange-600">+{results.eqStr.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-cyan-50/50 rounded-2xl border border-cyan-100">
                    <span className="text-xs font-black text-cyan-700">敏捷贡献</span>
                    <span className="text-lg font-black font-mono text-cyan-600">+{results.eqAgi.toFixed(1)}</span>
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-3xl p-8 flex flex-col justify-center text-center">
                   <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2">单位得分价格</span>
                   <div className="flex items-baseline justify-center gap-1">
                     <span className="text-sm font-bold text-indigo-600">¥</span>
                     <span className="text-5xl font-black font-mono text-indigo-700 leading-none">{results.pricePerPoint.toFixed(2)}</span>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SpiritAccessoryTool;
