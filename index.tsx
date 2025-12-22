import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Calculator, Settings, RotateCcw, Activity, Coins, Save, Trash2, 
  ArrowDownUp, ArrowUp, ArrowDown, Shirt, Watch, Wind, Download, 
  Upload, Home, LayoutDashboard, Sparkles, BookOpen, ChevronRight,
  Menu, X, ExternalLink, Gem, Diamond, Swords, ShieldCheck, Users, HelpCircle, Eye, History as HistoryIcon
} from 'lucide-react';

// --- Types & Interfaces ---

type ItemType = 'armor' | 'collar' | 'bracer';
type RaceType = 'human' | 'demon' | 'immortal';
type SpiritType = 'ring' | 'earring';
type SubAttrType = 'damage' | 'speed';

interface SavedItem {
  id: number;
  timestamp: number;
  growth: number;
  speedQual: number;
  stats: {
    damage: number; defense: number; hp: number; speed: number;
    str: number; end: number; con: number; agi: number;
  };
  price: number;
  totalPoints: number;
  pricePerPoint: number;
  type: ItemType;
}

interface SavedSpiritItem {
  id: number;
  timestamp: number;
  race: RaceType;
  spiritType: SpiritType;
  mainAttr: { type: string; value: number };
  subAttrs: { type: SubAttrType; value: number }[];
  gemLevel: number;
  price: number;
  totalPoints: number;
  pricePerPoint: number;
}

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
  const [savedItems, setSavedItems] = useState<SavedSpiritItem[]>([]);
  
  // New States for History
  const [historyTab, setHistoryTab] = useState<SpiritType>('ring');
  const [sortOrder, setSortOrder] = useState<'time' | 'points'>('time');
  const [hoveredId, setHoveredId] = useState<number | null>(null);

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
    const newItem: SavedSpiritItem = {
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
    setHistoryTab(spiritType);
  };

  const filteredAndSortedHistory = useMemo(() => {
    let list = savedItems.filter(item => item.spiritType === historyTab);
    if (sortOrder === 'points') {
      list.sort((a, b) => b.totalPoints - a.totalPoints);
    } else {
      list.sort((a, b) => b.timestamp - a.timestamp);
    }
    return list;
  }, [savedItems, historyTab, sortOrder]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Input */}
        <div className="lg:w-1/2">
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8 h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-black text-gray-800 flex items-center gap-3 text-lg">
                <Diamond className="w-6 h-6 text-purple-600" />
                灵饰属性配置
              </h3>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <select 
                  value={race} 
                  onChange={e => setRace(e.target.value as RaceType)} 
                  className="pl-9 pr-8 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold outline-none border border-indigo-100 hover:border-indigo-300 transition-all appearance-none text-sm min-w-[160px]"
                >
                  <option value="human">人族 (Str:0.67)</option>
                  <option value="demon">魔族 (Str:0.77)</option>
                  <option value="immortal">仙族 (Str:0.57)</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <ArrowDown className="w-3 h-3 text-indigo-400" />
                </div>
              </div>
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
                <div className="relative">
                  <select 
                    value={gemLevel} 
                    onChange={e => setGemLevel(parseInt(e.target.value))} 
                    className="w-full pl-4 pr-10 py-3.5 bg-gray-100 border-none rounded-2xl font-mono text-base font-bold outline-none appearance-none hover:bg-gray-200 transition-colors"
                  >
                    {Array.from({length: 12}).map((_, i) => <option key={i} value={i}>{i} 级星辉石</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <Gem className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-3xl border-2 border-dashed border-gray-200 relative group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">上排主属性</span>
                <div className="relative">
                  <select 
                    value={mainAttr.type} 
                    onChange={e => setMainAttr({...mainAttr, type: e.target.value})} 
                    className="pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none shadow-sm hover:border-indigo-400 transition-all appearance-none min-w-[140px]"
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
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <ArrowDownUp className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
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
                 }} disabled={subAttrs.length >= 3} className="px-3 py-1.5 bg-indigo-50 text-[11px] font-black text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:bg-gray-50 disabled:text-gray-300 transition-all uppercase">+ 新增属性</button>
               </div>
               <div className="space-y-4">
                 {subAttrs.map((attr, idx) => (
                   <div key={idx} className="flex gap-4 items-center group animate-in slide-in-from-right-2">
                      <select 
                        value={attr.type} 
                        onChange={e => {
                          const newAttrs = [...subAttrs];
                          newAttrs[idx].type = e.target.value as SubAttrType;
                          setSubAttrs(newAttrs);
                        }} 
                        className="bg-gray-100 px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-none min-w-[100px] hover:bg-gray-200 transition-colors"
                      >
                        <option value="damage">伤害</option>
                        <option value="speed">速度</option>
                      </select>
                      <div className="flex-1 relative">
                        <input 
                          type="number" 
                          value={attr.value || ''} 
                          onChange={e => {
                            const newAttrs = [...subAttrs];
                            newAttrs[idx].value = parseFloat(e.target.value) || 0;
                            setSubAttrs(newAttrs);
                          }} 
                          className="w-full px-5 py-3.5 bg-gray-100 rounded-2xl font-mono text-xl font-bold outline-none border-none hover:bg-gray-200 transition-colors" 
                          placeholder="0" 
                        />
                        {gemLevel > 0 && (
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-green-500 bg-white/80 backdrop-blur px-2 py-1 rounded-lg border border-green-100 shadow-sm">
                            +{gemLevel * (attr.type === 'damage' ? 4 : 3)}
                          </div>
                        )}
                      </div>
                      {subAttrs.length > 2 && (
                        <button onClick={() => setSubAttrs(subAttrs.filter((_, i) => i !== idx))} className="p-3 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 bg-red-50 rounded-xl">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                   </div>
                 ))}
               </div>
            </div>

            <div className="pt-6 space-y-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">预算价格 (RMB)</label>
              </div>
              <input 
                type="number" 
                value={price || ''} 
                onChange={e => setPrice(parseFloat(e.target.value) || 0)} 
                className="w-full px-6 py-4 bg-amber-50 border border-amber-100 rounded-3xl text-3xl font-mono font-black text-amber-900 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all" 
                placeholder="0" 
              />
            </div>

            <button 
              onClick={saveItem} 
              disabled={results.totalPoints <= 0} 
              className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] disabled:bg-gray-200 disabled:shadow-none transition-all flex items-center justify-center gap-3"
            >
              <Save className="w-6 h-6" />
              保存当前灵饰记录
            </button>
          </section>
        </div>

        {/* Right: Analysis */}
        <div className="lg:w-1/2">
           <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden h-full flex flex-col">
              <div className="relative z-10 flex-1">
                 <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-10 flex items-center gap-3">
                   <Activity className="w-5 h-5 text-indigo-500" />
                   实时价值评估数据
                 </h2>
                 
                 <div className="flex flex-col items-center justify-center py-12 space-y-6 border-b border-gray-50 mb-10 bg-gradient-to-b from-gray-50/50 to-transparent rounded-3xl">
                    <div className="flex items-baseline gap-3">
                      <span className="text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-900 font-mono leading-none">
                        {results.totalPoints.toFixed(2)}
                      </span>
                      <span className="text-2xl font-black text-indigo-300">PTS</span>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold text-gray-800">当前种族综合属性点贡献</p>
                      <p className="text-[11px] text-gray-400 font-medium">包含宝石加成后的最终等效属性</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 px-4 mb-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                        <span className="text-xs font-black text-orange-700 flex items-center gap-2"><Swords className="w-4 h-4"/> 物理潜力</span>
                        <span className="text-lg font-black font-mono text-orange-600">+{results.eqStr.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-cyan-50/50 rounded-2xl border border-cyan-100">
                        <span className="text-xs font-black text-cyan-700 flex items-center gap-2"><Wind className="w-4 h-4"/> 敏捷潜力</span>
                        <span className="text-lg font-black font-mono text-cyan-600">+{results.eqAgi.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <span className="text-xs font-black text-blue-700 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> 防御潜力</span>
                        <span className="text-lg font-black font-mono text-blue-600">+{results.eqEnd.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 flex flex-col justify-center text-center shadow-inner border border-indigo-100/50">
                       <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-3">性价比 (单价)</span>
                       <div className="flex items-baseline justify-center gap-1">
                         <span className="text-sm font-bold text-indigo-600">¥</span>
                         <span className="text-5xl font-black font-mono text-indigo-700 leading-none">{results.pricePerPoint.toFixed(2)}</span>
                       </div>
                       <span className="text-[10px] text-indigo-300 font-bold mt-3">每点属性人民币价值</span>
                    </div>
                 </div>

                 <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <HelpCircle className="w-3 h-3" /> 计算公式详情 (Formula Details)
                    </h4>
                    <div className="space-y-3 font-mono text-[11px]">
                      <div className="flex justify-between items-center text-gray-600">
                        <span className="font-bold">力量(Str):</span>
                        <span>(Σ总伤害 {results.totalDmg}) / {results.factor.strToDmg} = {results.eqStr.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600">
                        <span className="font-bold">敏捷(Agi):</span>
                        <span>(Σ总速度 {results.totalSpd}) / 0.7 = {results.eqAgi.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600">
                        <span className="font-bold">耐力(End):</span>
                        <span>(Σ总防御 {results.totalDef}) / {results.factor.endToDef} = {results.eqEnd.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200 mt-2 flex justify-between items-center font-black text-indigo-700">
                        <span>总分(Total):</span>
                        <span>{results.eqStr.toFixed(2)} + {results.eqAgi.toFixed(2)} + {results.eqEnd.toFixed(2)} = {results.totalPoints.toFixed(2)}</span>
                      </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* History Section Moved to Bottom for Balance */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-gray-50 pb-6">
          <div className="flex items-center gap-3">
             <HistoryIcon className="w-5 h-5 text-indigo-500" />
             <h3 className="text-lg font-black text-gray-800">历史对比记录</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              {['ring', 'earring'].map(t => (
                <button key={t} onClick={() => setHistoryTab(t as SpiritType)} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${historyTab === t ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500'}`}>
                  {t === 'ring' ? '戒指库' : '耳饰库'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSortOrder(sortOrder === 'time' ? 'points' : 'time')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border ${sortOrder === 'points' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-400'}`}
              >
                <ArrowDownUp className="w-3 h-3" />
                {sortOrder === 'points' ? '高分优先' : '最新优先'}
              </button>
              <button onClick={() => setSavedItems([])} className="p-2.5 bg-red-50 text-red-300 hover:text-red-500 rounded-xl transition-colors" title="清空历史"><Trash2 className="w-5 h-5"/></button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
           {filteredAndSortedHistory.map(item => (
             <div 
                key={item.id} 
                className="relative group cursor-help animate-in slide-in-from-bottom-4 duration-300"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl transition-all group-hover:bg-white group-hover:shadow-xl group-hover:ring-2 group-hover:ring-indigo-100">
                  <div className="flex items-center gap-4">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black shadow-sm ${item.spiritType === 'ring' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                        {item.spiritType === 'ring' ? '戒' : '耳'}
                     </div>
                     <div>
                       <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.gemLevel}级星辉 · {RACE_FACTORS[item.race].label}</div>
                       <div className="text-xl font-black font-mono text-indigo-600 leading-tight">{item.totalPoints.toFixed(1)} <span className="text-[11px] text-gray-300 ml-1">PTS</span></div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">性价比单价</div>
                     <div className="text-base font-black font-mono text-green-600">¥{item.pricePerPoint.toFixed(2)}</div>
                  </div>
                </div>

                {/* Tooltip Popup */}
                {hoveredId === item.id && (
                  <div className="absolute bottom-full left-0 mb-4 w-80 p-6 bg-white/95 backdrop-blur-2xl border border-indigo-100 rounded-3xl shadow-2xl z-50 animate-in zoom-in-95 fade-in duration-200 pointer-events-none">
                    <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                      <span className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Eye className="w-3 h-3"/> 原始数据回溯</span>
                      <span className="text-xs font-mono font-black text-amber-600">¥{item.price.toLocaleString()}</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm bg-gray-50 p-3 rounded-xl">
                        <span className="text-gray-500 font-bold">主属性 - {MAIN_ATTR_LABELS[item.mainAttr.type]}</span>
                        <span className="font-mono font-black text-gray-800">{item.mainAttr.value}</span>
                      </div>
                      <div className="space-y-2 px-1">
                        {item.subAttrs.map((sa, si) => (
                          <div key={si} className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-medium">附加条目 {si + 1}: {sa.type === 'damage' ? '伤害' : '速度'}</span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="font-bold text-gray-600">{sa.value}</span>
                              <span className="text-green-500 font-black px-1.5 py-0.5 bg-green-50 rounded">+{item.gemLevel * (sa.type === 'damage' ? 4 : 3)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                         <span className="text-[10px] text-gray-300 italic">保存于 {new Date(item.id).toLocaleTimeString()}</span>
                         <span className="text-[10px] font-bold text-indigo-300">数据仅供参考</span>
                      </div>
                    </div>
                  </div>
                )}
             </div>
           ))}
           {filteredAndSortedHistory.length === 0 && (
             <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                <HistoryIcon className="w-10 h-10 text-gray-100 mx-auto mb-4" />
                <p className="text-sm font-black text-gray-300 uppercase tracking-widest">该类别暂无对比记录</p>
             </div>
           )}
        </div>
      </section>
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

  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [sortConfig, setSortConfig] = useState<{key: keyof SavedItem | null, direction: 'asc' | 'desc'}>({ key: 'totalPoints', direction: 'desc' });
  const [activeTab, setActiveTab] = useState<ItemType>('armor');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('summoned_beast_calc_items');
    if (saved) {
      try {
        setSavedItems(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
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
    let type: ItemType = stats.defense > 0 ? 'armor' : stats.speed > 0 ? 'collar' : 'bracer';
    const newItem: SavedItem = {
      id: Date.now(), timestamp: Date.now(), growth, speedQual,
      stats: { ...stats }, price, totalPoints: results.totalPoints,
      pricePerPoint: results.pricePerPoint, type
    };
    setSavedItems(prev => [newItem, ...prev]);
    setActiveTab(type);
  };

  const sortedItems = useMemo(() => {
    let filtered = savedItems.filter(item => item.type === activeTab);
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key!] as number;
        const bVal = b[sortConfig.key!] as number;
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }
    return filtered;
  }, [savedItems, sortConfig, activeTab]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Input Panel */}
        <div className="lg:w-5/12 space-y-6">
           <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Settings className="w-4 h-4 text-indigo-500"/>核心设置</h3>
                <div className="flex gap-2">
                   <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors" title="导入"><Upload className="w-4 h-4"/></button>
                   <button onClick={() => {
                     const data = JSON.stringify(savedItems);
                     const blob = new Blob([data], {type: 'application/json'});
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url; a.download = 'backup.json'; a.click();
                   }} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors" title="导出"><Download className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const r = new FileReader();
                  r.onload = (ev) => setSavedItems(JSON.parse(ev.target?.result as string));
                  r.readAsText(file);
                }} />
                <div>
                  <label className="text-xs text-gray-400 block mb-1">召唤兽成长</label>
                  <input type="number" step="0.001" value={growth} onChange={e => setGrowth(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-gray-50 border rounded-lg font-mono outline-none focus:border-indigo-500"/>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">速度资质</label>
                  <input type="number" value={speedQual} onChange={e => setSpeedQual(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-gray-50 border rounded-lg font-mono outline-none focus:border-indigo-500"/>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">价格 (RMB)</label>
                <input type="number" value={price === 0 ? '' : price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-gray-50 border rounded-lg font-mono outline-none focus:border-indigo-500" placeholder="0"/>
              </div>
           </section>

           <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2"><div className="w-1.5 h-4 bg-yellow-400 rounded-full"/>基础属性 (黄)</h3>
                <div className="grid grid-cols-2 gap-4">
                   <StatInput label="伤害" value={stats.damage} onChange={(v:any) => setStats({...stats, damage: parseFloat(v)||0})} colorClass="bg-yellow-50/30 border-yellow-100" />
                   <StatInput label="防御" value={stats.defense} onChange={(v:any) => setStats({...stats, defense: parseFloat(v)||0})} colorClass="bg-yellow-50/30 border-yellow-100" />
                   <StatInput label="气血" value={stats.hp} onChange={(v:any) => setStats({...stats, hp: parseFloat(v)||0})} colorClass="bg-yellow-50/30 border-yellow-100" />
                   <StatInput label="速度" value={stats.speed} onChange={(v:any) => setStats({...stats, speed: parseFloat(v)||0})} colorClass="bg-yellow-50/30 border-yellow-100" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2"><div className="w-1.5 h-4 bg-green-400 rounded-full"/>附加属性 (绿)</h3>
                <div className="grid grid-cols-2 gap-4">
                   <StatInput label="力量" value={stats.str} onChange={(v:any) => setStats({...stats, str: parseFloat(v)||0})} colorClass="bg-green-50/30 border-green-100" />
                   <StatInput label="耐力" value={stats.end} onChange={(v:any) => setStats({...stats, end: parseFloat(v)||0})} colorClass="bg-green-50/30 border-green-100" />
                   <StatInput label="体质" value={stats.con} onChange={(v:any) => setStats({...stats, con: parseFloat(v)||0})} colorClass="bg-green-50/30 border-green-100" />
                   <StatInput label="敏捷" value={stats.agi} onChange={(v:any) => setStats({...stats, agi: parseFloat(v)||0})} colorClass="bg-green-50/30 border-green-100" />
                </div>
              </div>
              <button onClick={saveCurrentItem} disabled={results.totalPoints <= 0} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:bg-gray-200 disabled:shadow-none transition-all flex items-center justify-center gap-2">
                <Save className="w-4 h-4"/>保存记录
              </button>
           </section>
        </div>

        {/* Results Panel */}
        <div className="lg:w-7/12">
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-indigo-100 text-sm mb-1 uppercase tracking-widest font-bold">综合属性值</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-7xl font-black font-mono tracking-tighter">{results.totalPoints.toFixed(2)}</span>
                      <span className="text-xl opacity-70">点</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-indigo-200 mb-1 uppercase tracking-widest">单点价值</p>
                    <p className="text-3xl font-bold font-mono">¥{results.pricePerPoint.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-white/10">
                   {[
                     { label: '物理贡献', val: (stats.str + results.strFromDmg).toFixed(1), color: 'text-orange-300' },
                     { label: '耐力贡献', val: (stats.end + results.endFromDef).toFixed(1), color: 'text-blue-300' },
                     { label: '气血贡献', val: (stats.con + results.conFromHp).toFixed(1), color: 'text-rose-300' },
                     { label: '敏捷贡献', val: (stats.agi + results.agiFromSpeed).toFixed(1), color: 'text-cyan-300' }
                   ].map((t) => (
                     <div key={t.label}>
                       <p className="text-[10px] text-white/50 uppercase mb-1 tracking-widest">{t.label}</p>
                       <p className={`text-2xl font-black font-mono ${t.color}`}>{t.val}</p>
                     </div>
                   ))}
                </div>
              </div>
              
              <div className="relative z-10 mt-12 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                 <p className="text-[10px] text-white/40 uppercase mb-2 font-black tracking-widest">反推公式说明</p>
                 <div className="text-[11px] font-mono text-white/70 space-y-1">
                   <p>伤害 → 力量: (伤害 * 4/3) / 成长</p>
                   <p>防御 → 耐力: 防御 / (成长 * 4/3)</p>
                   <p>气血 → 体质: 气血 / (成长 * 6)</p>
                   <p>速度 → 敏捷: 速度 / (资历 / 1000)</p>
                 </div>
              </div>

              <Activity className="absolute bottom-[-20px] right-[-20px] w-64 h-64 opacity-5 pointer-events-none rotate-12" />
           </div>
        </div>
      </div>

      {/* History Panel for BB Tool */}
      <section className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm min-h-[400px]">
          <div className="p-6 bg-gray-50 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <HistoryIcon className="w-5 h-5 text-indigo-500" />
               <h3 className="font-black text-gray-800">装备对比记录</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-200/50 p-1.5 rounded-xl">
                {[
                  {id: 'armor', icon: <Shirt className="w-4 h-4"/>, label: '铠甲'},
                  {id: 'collar', icon: <Wind className="w-4 h-4"/>, label: '项圈'},
                  {id: 'bracer', icon: <Watch className="w-4 h-4"/>, label: '护腕'}
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black transition-all ${activeTab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-gray-400 font-mono font-black uppercase">Count: {sortedItems.length}</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-white text-gray-400 uppercase border-b">
                <tr>
                  <th className="px-6 py-4 font-black tracking-widest">成长</th>
                  <th className="px-6 py-4 font-black tracking-widest cursor-pointer hover:text-indigo-600" onClick={() => setSortConfig({key: 'totalPoints', direction: sortConfig.direction === 'desc' ? 'asc' : 'desc'})}>综合属性点</th>
                  <th className="px-6 py-4 font-black tracking-widest cursor-pointer hover:text-indigo-600" onClick={() => setSortConfig({key: 'price', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>价格 (RMB)</th>
                  <th className="px-6 py-4 font-black tracking-widest">单价 / PTS</th>
                  <th className="px-6 py-4 text-right font-black tracking-widest">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedItems.map(item => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold">{item.growth.toFixed(3)}</td>
                    <td className="px-6 py-4 font-black text-indigo-600 text-sm font-mono">{item.totalPoints.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-gray-600">¥{item.price.toLocaleString()}</td>
                    <td className="px-6 py-4 font-black text-green-600 font-mono text-sm">¥{item.pricePerPoint.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => setSavedItems(prev => prev.filter(p => p.id !== item.id))} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedItems.length === 0 && <div className="py-32 text-center text-gray-200 font-black uppercase tracking-widest">暂无对比记录</div>}
          </div>
      </section>
    </div>
  );
};

// --- Dashboard Component ---

const Dashboard = ({ onSelectTool }: { onSelectTool: (id: string) => void }) => {
  const tools = [
    { 
      id: 'beast-equip', 
      name: 'BB装价值计算器', 
      desc: '精准计算装备综合属性，根据属性公式反推价值，支持多分类记录对比。', 
      icon: <Activity className="w-8 h-8 text-indigo-500" />,
      color: 'bg-indigo-50',
      active: true
    },
    { 
      id: 'spirit-calc', 
      name: '物理系灵饰计算器', 
      desc: '支持星辉石属性加成计算，根据不同种族转换属性点收益。', 
      icon: <Gem className="w-8 h-8 text-purple-500" />,
      color: 'bg-purple-50',
      active: true
    },
    { 
      id: 'summon-sim', 
      name: '炼妖概率模拟器', 
      desc: '模拟炼妖合宠，计算翻页宠、神宠产出概率。', 
      icon: <Sparkles className="w-8 h-8 text-amber-500" />,
      color: 'bg-amber-50',
      active: false
    },
    { 
      id: 'attr-sim', 
      name: '属性点模拟器', 
      desc: '全等级段召唤兽属性点模拟，计算潜能果、加点收益。', 
      icon: <LayoutDashboard className="w-8 h-8 text-emerald-500" />,
      color: 'bg-emerald-50',
      active: false
    },
    { 
      id: 'market-trend', 
      name: '藏宝阁价格趋势', 
      desc: '分析跨服物价走势，定位装备合理价格区间。', 
      icon: <Coins className="w-8 h-8 text-rose-500" />,
      color: 'bg-rose-50',
      active: false
    }
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map(tool => (
          <div 
            key={tool.id}
            onClick={() => tool.active && onSelectTool(tool.id)}
            className={`p-6 rounded-3xl border transition-all relative overflow-hidden group ${
              tool.active 
                ? 'bg-white border-gray-100 hover:shadow-xl hover:-translate-y-1 cursor-pointer' 
                : 'bg-gray-50 border-transparent opacity-60 grayscale cursor-not-allowed'
            }`}
          >
            <div className={`p-4 rounded-2xl w-fit mb-4 transition-transform group-hover:scale-110 ${tool.color}`}>
              {tool.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{tool.name}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">{tool.desc}</p>
            <div className="flex items-center text-xs font-bold text-indigo-600">
              {tool.active ? '立即进入' : '敬请期待'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
            {!tool.active && (
              <div className="absolute top-4 right-4 bg-gray-200 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold">SOON</div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-indigo-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-indigo-200">
         <div className="flex-1 space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-black">欢迎使用梦幻高级工具箱</h2>
            <p className="text-indigo-200 text-sm leading-relaxed max-w-xl">
              我们致力于为梦幻西游玩家提供最专业的数据支持与价值评估工具。在这里，每一个数据都有据可查，每一次决策都有理可依。
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
               <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10"><BookOpen className="w-4 h-4"/> 查阅公式库</div>
               <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10"><ExternalLink className="w-4 h-4"/> 访问藏宝阁</div>
            </div>
         </div>
         <div className="w-48 h-48 bg-white/5 rounded-full flex items-center justify-center border border-white/10 relative">
            <Activity className="w-24 h-24 text-indigo-300 animate-pulse" />
            <div className="absolute inset-0 border-2 border-indigo-400/20 rounded-full animate-ping" />
         </div>
      </div>
    </div>
  );
};

// --- Main App Wrapper ---

const App = () => {
  const [currentTool, setCurrentTool] = useState<string>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Toggle sidebar for smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: 'home', icon: <Home className="w-5 h-5"/>, label: '概览主页' },
    { id: 'beast-equip', icon: <Activity className="w-5 h-5"/>, label: 'BB装价值计算' },
    { id: 'spirit-calc', icon: <Gem className="w-5 h-5"/>, label: '灵饰价值计算' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out transform lg:relative ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-gray-50">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><Activity className="w-6 h-6"/></div>
            <h1 className="font-black text-xl text-gray-800 tracking-tight">梦幻高级工具箱</h1>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">主菜单 / Tools</div>
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentTool(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group ${
                  currentTool === item.id 
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={`transition-colors ${currentTool === item.id ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {item.icon}
                </span>
                {item.label}
                {currentTool === item.id && <div className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-50">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">当前版本</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">v1.4.1-Alpha</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-gray-500">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg lg:hidden">
              {isSidebarOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
            </button>
            <div className="flex items-center text-sm font-medium text-gray-500">
               <span className="hover:text-gray-900 cursor-pointer" onClick={() => setCurrentTool('home')}>主页</span>
               {currentTool !== 'home' && (
                 <>
                   <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
                   <span className="text-gray-900">{menuItems.find(m => m.id === currentTool)?.label}</span>
                 </>
               )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] font-bold text-gray-400 leading-none">SERVER</span>
              <span className="text-xs font-bold text-gray-600">长安城 / 华南区</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs">
              M
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
           <div className="max-w-7xl mx-auto">
              {currentTool === 'home' ? (
                <Dashboard onSelectTool={setCurrentTool} />
              ) : currentTool === 'spirit-calc' ? (
                <SpiritAccessoryTool />
              ) : (
                <SummonedBeastEquipTool />
              )}
           </div>
        </div>
        
        {/* Footer */}
        <footer className="py-4 px-8 border-t border-gray-100 text-center text-gray-400 text-[10px] font-medium tracking-widest uppercase">
           &copy; 2024 梦幻高级工具箱 - 玩家数据研究中心
        </footer>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);