import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Calculator, Settings, RotateCcw, Activity, Coins, Save, Trash2, 
  ArrowDownUp, ArrowUp, ArrowDown, Shirt, Watch, Wind, Download, 
  Upload, Home, LayoutDashboard, Sparkles, BookOpen, ChevronRight,
  Menu, X, ExternalLink, Gem, Diamond, Swords, ShieldCheck, Users, HelpCircle, Eye, History as HistoryIcon,
  RefreshCcw, TrendingUp, Layers, Info, Wallet, AlertCircle, Edit3, Sigma
} from 'lucide-react';

// --- Types & Interfaces ---

type ItemType = 'armor' | 'collar' | 'bracer';
type RaceType = 'human' | 'demon' | 'immortal';
type SpiritType = 'ring' | 'earring';
type SubAttrType = 'damage' | 'speed';
type GemMode = 'normal' | 'starshine' | 'soul' | 'colored';

// --- Constants ---

const RACE_FACTORS = {
  human: { strToDmg: 0.67, agiToSpd: 0.7, endToDef: 1.5, label: '人族' },
  demon: { strToDmg: 0.77, agiToSpd: 0.7, endToDef: 1.4, label: '魔族' },
  immortal: { strToDmg: 0.57, agiToSpd: 0.7, endToDef: 1.6, label: '仙族' }
};

const MAIN_ATTR_LABELS: Record<string, string> = {
  'damage': '伤害',
  'defense': '防御',
  'm-dmg': '法术伤害',
  'm-def': '法术防御'
};

// Extra requirements for Normal Gems (12-20)
const NORMAL_EXTRAS: Record<number, number[]> = {
  12: [3, 5, 6],
  13: [9],
  14: [9, 10],
  15: [9, 12],
  16: [11, 12, 13],
  17: [15],
  18: [13, 14, 16],
  19: [15, 16, 17],
  20: [17, 18, 18]
};

// Extra requirements for Starshine Stones (9-11)
const STARSHINE_EXTRAS: Record<number, number[]> = {
  9: [5],
  10: [6, 7],
  11: [9]
};

// Extra requirements for Soul Spirit Stones (8-10)
const SOUL_EXTRAS: Record<number, number[]> = {
  8: [3],
  9: [6],
  10: [8]
};

// --- Sub-Components ---

const StatInput = ({ label, value, onChange, colorClass, placeholder }: any) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
      {label}
    </label>
    <input
      type="number"
      min="0"
      value={value === 0 ? '' : value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 rounded-lg border-2 outline-none transition-all font-mono text-lg ${colorClass}`}
      onWheel={(e) => e.currentTarget.blur()}
    />
  </div>
);

// --- Tool 3: Gem Price Calculator ---

const GemPriceTool = () => {
  const [mode, setMode] = useState<GemMode>('normal');
  const [seedValueW, setSeedValueW] = useState<number>(8.5); // Initial seed value
  const [seedLevel, setSeedLevel] = useState<number>(1);
  const [maxLevel, setMaxLevel] = useState<number>(15);
  const [exchangeRateRmb, setExchangeRateRmb] = useState<number>(200);
  
  // Track local string being edited to avoid toFixed conflicts
  const [editingCell, setEditingCell] = useState<{ level: number, value: string } | null>(null);

  const STAMINA_PER_POINT_VALUE = 100;

  const handleModeChange = (newMode: GemMode) => {
    setMode(newMode);
    if (newMode === 'starshine') setMaxLevel(12);
    else if (newMode === 'soul') setMaxLevel(10);
    else if (newMode === 'colored') setMaxLevel(15);
    else setMaxLevel(15);

    if (newMode === 'starshine' && seedLevel > 12) setSeedLevel(1);
    if (newMode === 'soul' && seedLevel > 10) setSeedLevel(1);
    if (newMode === 'colored' && seedLevel > 15) setSeedLevel(1);
    
    setEditingCell(null);
  };

  const gemData = useMemo(() => {
    const baseStats: Record<number, { count: number; stamina: number }> = {
      1: { count: 1, stamina: 0 }
    };
    
    const extrasConfig = mode === 'normal' ? NORMAL_EXTRAS : (mode === 'starshine' ? STARSHINE_EXTRAS : (mode === 'soul' ? SOUL_EXTRAS : {}));
    const synthesisRule = mode === 'starshine' ? 3 : 2;

    const computeBaseStats = (level: number): { count: number; stamina: number } => {
      if (baseStats[level]) return baseStats[level];
      
      let jumpStamina = 0;
      if (mode === 'starshine') {
        jumpStamina = (60 + (level - 2) * 30);
      } else if (mode === 'colored') {
        // Colored dust: Level 2 = 90, Level 3 = 120, etc.
        jumpStamina = 90 + (level - 2) * 30;
      } else {
        // Normal and Soul: Linear (n-1)*10
        jumpStamina = (level - 1) * 10;
      }

      const prev = computeBaseStats(level - 1);
      let totalCount = synthesisRule * prev.count;
      let totalStamina = (synthesisRule * prev.stamina) + jumpStamina;
      
      // Handle extras
      let levelExtras: number[] = [];
      if (mode === 'colored' && level >= 3) {
        // Colored Spirit Dust Rule: Level n needs 2 of Level n-1 + 1 of Level n-2
        levelExtras = [level - 2];
      } else if (extrasConfig[level]) {
        levelExtras = extrasConfig[level];
      }

      if (levelExtras.length > 0) {
        levelExtras.forEach(extraLvl => {
          const extra = computeBaseStats(extraLvl);
          totalCount += extra.count;
          totalStamina += extra.stamina;
        });
      }

      baseStats[level] = { count: totalCount, stamina: totalStamina };
      return baseStats[level];
    };

    const prefillCap = 20; // Safe upper bound for calculation
    for (let i = 1; i <= prefillCap; i++) computeBaseStats(i);

    const seedPriceTotal = seedValueW * 10000;
    const seedStats = baseStats[seedLevel] || baseStats[1];
    
    const implicitLv1Price = Math.max(0, (seedPriceTotal - (seedStats.stamina * STAMINA_PER_POINT_VALUE)) / seedStats.count);

    const results = [];
    let cumulativeRmb = 0;
    for (let i = 1; i <= maxLevel; i++) {
      const stats = baseStats[i];
      const staminaValue = stats.stamina * STAMINA_PER_POINT_VALUE;
      const totalCoins = (stats.count * implicitLv1Price) + staminaValue;
      const rmbValue = (totalCoins / 30000000) * exchangeRateRmb;
      cumulativeRmb += rmbValue;

      // Extract dynamic extra info
      const dynamicExtras = (mode === 'colored' && i >= 3) ? [i - 2] : (extrasConfig[i] || null);

      results.push({ 
        level: i, 
        count: stats.count, 
        staminaValue,
        totalCoins,
        rmbValue,
        cumulativeRmb,
        isSeed: i === seedLevel,
        extras: dynamicExtras
      });
    }
    return results;
  }, [mode, seedValueW, seedLevel, maxLevel, exchangeRateRmb]);

  const handleRowPriceEdit = (level: number, valueW: string) => {
    setEditingCell({ level, value: valueW });
    const val = parseFloat(valueW);
    if (!isNaN(val)) {
      setSeedLevel(level);
      setSeedValueW(val);
    } else if (valueW === "") {
      setSeedLevel(level);
      setSeedValueW(0);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3 space-y-6">
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8">
            <h3 className="font-black text-gray-800 flex items-center gap-3 text-lg">
              <Coins className="w-6 h-6 text-amber-500" />
              全局配置
            </h3>

            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-4">宝石类型</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-2xl">
                {[
                  { id: 'normal', label: '普通', color: 'text-amber-600' },
                  { id: 'starshine', label: '星辉石', color: 'text-purple-600' },
                  { id: 'soul', label: '精魄灵石', color: 'text-cyan-600' },
                  { id: 'colored', label: '五色灵尘', color: 'text-rose-600' }
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => handleModeChange(item.id as GemMode)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all ${mode === item.id ? 'bg-white shadow-md ' + item.color : 'text-gray-500'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 p-5 bg-amber-50 rounded-2xl border border-amber-100">
               <label className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                 <Wallet className="w-4 h-4" /> 汇率折算 (3000万 : RMB)
               </label>
               <div className="flex items-center gap-3">
                 <div className="flex-1 px-4 py-3 bg-white rounded-xl font-mono font-bold text-amber-900 border border-amber-200 text-center">3,000 W</div>
                 <div className="text-amber-400 font-black">:</div>
                 <div className="relative flex-1">
                   <input 
                    type="number"
                    value={exchangeRateRmb}
                    onChange={(e) => setExchangeRateRmb(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white rounded-xl font-mono font-bold text-amber-900 outline-none border border-amber-200 focus:border-amber-500"
                   />
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 font-black">¥</div>
                 </div>
               </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex justify-between">
                <span>展示最高等级</span>
                <span className="text-amber-600 font-mono font-black">{maxLevel} 级</span>
              </label>
              <input 
                type="range"
                min="1"
                max={mode === 'normal' ? 20 : (mode === 'starshine' ? 12 : (mode === 'soul' ? 10 : 15))}
                value={maxLevel}
                onChange={(e) => setMaxLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
              <div className="flex gap-2">
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-[11px] text-blue-600 leading-relaxed font-bold uppercase">当前模式规则</p>
              </div>
              <div className="text-[10px] text-blue-500/80 leading-relaxed space-y-2">
                {mode === 'colored' ? (
                  <>
                    <p>• <b>合成基准</b>：2级=2个L1；3级及以上=2个(n-1)+1个(n-2)。</p>
                    <p>• <b>体力规则</b>：2级消耗90点，之后每级增加30点体力。</p>
                    <p>• <b>等级上限</b>：最高支持15级计算。</p>
                  </>
                ) : mode === 'soul' ? (
                  <>
                    <p>• <b>合成基准</b>：1-7级灵石每2个合成1个高级。</p>
                    <p>• <b>额外消耗</b>：8级+L3，9级+L6，10级+L8。</p>
                    <p>• <b>体力规则</b>：合成体力消耗 (n-1)*10。</p>
                  </>
                ) : mode === 'starshine' ? (
                  <>
                    <p>• <b>合成基准</b>：每3个星辉石合成1个高级。</p>
                    <p>• <b>体力规则</b>：非线性体力公式 [60+(n-2)*30]。</p>
                  </>
                ) : (
                  <>
                    <p>• <b>合成基准</b>：每2个宝石合成1个高级。</p>
                    <p>• <b>额外消耗</b>：12-20级合成需要副宝石辅助。</p>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="lg:w-2/3">
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-black text-gray-800 flex items-center gap-3 text-lg uppercase">
                <TrendingUp className={`w-6 h-6 ${mode === 'soul' ? 'text-cyan-500' : mode === 'starshine' ? 'text-purple-500' : mode === 'colored' ? 'text-rose-500' : 'text-amber-500'}`} />
                {mode === 'soul' ? '精魄灵石' : mode === 'starshine' ? '星辉石' : mode === 'colored' ? '五色灵尘' : '普通宝石'} 价值全景
              </h3>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-black text-gray-400 uppercase border border-gray-100">自动同步联动</div>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left min-w-[850px]">
                <thead className="sticky top-0 bg-white shadow-sm z-10 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">等级</th>
                    <th className="px-6 py-4">消耗1级总量</th>
                    <th className="px-6 py-4">体力总成本</th>
                    <th className="px-6 py-4">单颗价格(万)</th>
                    <th className="px-6 py-4">单颗RMB</th>
                    <th className="px-6 py-4 text-right">累计预算(RMB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {gemData.map((row) => {
                    const isEditing = editingCell?.level === row.level;
                    const displayVal = isEditing 
                      ? editingCell.value 
                      : (row.totalCoins === 0 ? '' : (row.totalCoins / 10000).toFixed(2));

                    return (
                      <tr key={row.level} className={`transition-colors group ${row.isSeed ? 'bg-indigo-50/40' : 'hover:bg-gray-50/50'}`}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm relative ${
                               mode === 'normal' ? 'bg-amber-100 text-amber-700' : 
                               mode === 'starshine' ? 'bg-purple-100 text-purple-700' : 
                               mode === 'soul' ? 'bg-cyan-100 text-cyan-700' : 
                               'bg-rose-100 text-rose-700'
                             }`}>
                               {row.level}
                               {row.extras && (
                                 <div className="absolute -top-1 -right-1 group-hover:scale-110 transition-transform">
                                    <div className={`w-4 h-4 ${mode === 'soul' ? 'bg-cyan-500' : mode === 'colored' ? 'bg-rose-500' : 'bg-indigo-500'} rounded-full flex items-center justify-center text-[8px] text-white ring-2 ring-white`}>!</div>
                                 </div>
                               )}
                             </div>
                             <div className="flex flex-col">
                               <span className="font-bold text-gray-700">{
                                mode === 'soul' ? '灵石' : 
                                mode === 'starshine' ? '星辉' : 
                                mode === 'colored' ? '灵尘' : '宝石'}
                               </span>
                               {row.extras && <span className="text-[9px] text-indigo-400 font-black uppercase">副石:L{row.extras.join('/L')}</span>}
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-mono text-xs text-gray-500 font-black">{row.count.toLocaleString()}个</td>
                        <td className="px-6 py-5 text-[11px] font-bold text-gray-400">{(row.staminaValue / 10000).toFixed(2)}w</td>
                        <td className="px-6 py-5">
                          <div className="relative max-w-[140px]">
                             <input 
                              type="number"
                              value={displayVal}
                              onFocus={(e) => { e.target.select(); setEditingCell({ level: row.level, value: displayVal }); }}
                              onBlur={() => setEditingCell(null)}
                              onChange={(e) => handleRowPriceEdit(row.level, e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl font-mono text-base font-black outline-none border-2 transition-all ${
                                row.isSeed 
                                  ? 'bg-white border-indigo-400 text-indigo-700 shadow-md ring-4 ring-indigo-500/10' 
                                  : 'bg-gray-50 border-transparent hover:border-gray-200 focus:bg-white focus:border-indigo-300 text-gray-800'
                              }`}
                             />
                             <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 pointer-events-none">W</div>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-mono text-base font-black text-green-600">¥{row.rmbValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-5 text-right font-mono text-xl font-black text-indigo-600">¥{row.cumulativeRmb.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// --- Tool 2: Spirit Accessory Calculator ---

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
              保存当前设置
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

// --- Tool 1: BB Equipment Calculator ---

const SummonedBeastEquipTool = () => {
  const [growth, setGrowth] = useState<number>(1.297);
  const [speedQual, setSpeedQual] = useState<number>(1400);
  const [price, setPrice] = useState<number>(0);
  const [stats, setStats] = useState({
    damage: 0, defense: 0, hp: 0, speed: 0,
    str: 0, end: 0, con: 0, agi: 0
  });

  const [savedItems, setSavedItems] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('summoned_beast_calc_items');
    if (saved) setSavedItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('summoned_beast_calc_items', JSON.stringify(savedItems));
  }, [savedItems]);

  const results = useMemo(() => {
    const strFromDmg = growth > 0 ? (stats.damage * (4/3)) / growth : 0;
    const endFromDef = growth > 0 ? stats.defense / (growth * (4/3)) : 0;
    const conFromHp = growth > 0 ? stats.hp / (growth * 6) : 0;
    const agiFromSpeed = speedQual > 0 ? stats.speed / (speedQual / 1000) : 0;
    const totalPoints = (stats.str + strFromDmg) + (stats.end + endFromDef) + (stats.con + conFromHp) + (stats.agi + agiFromSpeed);
    const pricePerPoint = (price > 0 && totalPoints > 0) ? price / totalPoints : 0;
    return { strFromDmg, endFromDef, conFromHp, agiFromSpeed, totalPoints, pricePerPoint };
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-5/12 space-y-6">
           <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Settings className="w-4 h-4 text-indigo-500"/>核心设置</h3>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.001" value={growth} onChange={e => setGrowth(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-gray-50 border rounded-lg font-mono outline-none" placeholder="成长"/>
                <input type="number" value={speedQual} onChange={e => setSpeedQual(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-gray-50 border rounded-lg font-mono outline-none" placeholder="速资"/>
              </div>
              <input type="number" value={price === 0 ? '' : price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-gray-50 border rounded-lg font-mono outline-none" placeholder="价格 RMB"/>
           </section>

           <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <StatInput label="伤害" value={stats.damage} onChange={(v:any) => setStats({...stats, damage: parseFloat(v)||0})} colorClass="bg-yellow-50/30 border-yellow-100" />
                <StatInput label="防御" value={stats.defense} onChange={(v:any) => setStats({...stats, defense: parseFloat(v)||0})} colorClass="bg-yellow-50/30 border-yellow-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatInput label="力量" value={stats.str} onChange={(v:any) => setStats({...stats, str: parseFloat(v)||0})} colorClass="bg-green-50/30 border-green-100" />
                <StatInput label="敏捷" value={stats.agi} onChange={(v:any) => setStats({...stats, agi: parseFloat(v)||0})} colorClass="bg-green-50/30 border-green-100" />
              </div>
              <button onClick={saveCurrentItem} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                <Save className="w-4 h-4"/>保存当前分析
              </button>
           </section>
        </div>

        <div className="lg:w-7/12">
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl text-white shadow-xl h-full flex flex-col justify-between">
              <div>
                <h4 className="text-indigo-100 text-sm mb-1 uppercase tracking-widest font-bold">综合属性点值</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black font-mono tracking-tighter">{results.totalPoints.toFixed(2)}</span>
                  <span className="text-xl opacity-70">点</span>
                </div>
              </div>
              <div className="mt-8 border-t border-white/10 pt-8">
                <p className="text-xs text-indigo-200 mb-1">单点价值分析</p>
                <p className="text-3xl font-bold font-mono">¥{results.pricePerPoint.toFixed(2)}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Dashboard ---

const Dashboard = ({ onSelectTool }: { onSelectTool: (id: string) => void }) => {
  const tools = [
    { id: 'beast-equip', name: '召唤兽装备计算器', desc: '精准计算BB装综合属性，量化装备点数价值。', icon: <Activity className="w-8 h-8 text-indigo-500" />, color: 'bg-indigo-50' },
    { id: 'spirit-calc', name: '灵饰价值分析', desc: '支持各部位主属性及多条副属性收益计算。', icon: <Gem className="w-8 h-8 text-purple-500" />, color: 'bg-purple-50' },
    { id: 'gem-calc', name: '宝石全景计算器', desc: '支持普通宝石/星辉石/精魄灵石/五色灵尘全推算。', icon: <Diamond className="w-8 h-8 text-amber-500" />, color: 'bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

// --- App Wrapper ---

const App = () => {
  const [currentTool, setCurrentTool] = useState<string>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'home', icon: <Home className="w-5 h-5"/>, label: '主页概览' },
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