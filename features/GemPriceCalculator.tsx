import React, { useState, useMemo } from 'react';
import { Coins, Wallet, Info, TrendingUp } from 'lucide-react';
import { GemMode } from '../types';
import { NORMAL_EXTRAS, STARSHINE_EXTRAS, SOUL_EXTRAS } from '../constants';

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
    else if (newMode === 'normal' && maxLevel < 15) setMaxLevel(15);

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
      let totalCount = 0;
      let totalStamina = 0;

      if (mode === 'colored') {
        // Special case for level 2
        if (level === 2) {
          jumpStamina = 90;
          const prev = computeBaseStats(1);
          totalCount = 2 * prev.count;
          totalStamina = (2 * prev.stamina) + jumpStamina;
        } else {
          // Level n = 2*L(n-1) + 1*L(n-2)
          jumpStamina = 90 + (level - 2) * 30;
          const prev1 = computeBaseStats(level - 1);
          const prev2 = computeBaseStats(level - 2);
          totalCount = (2 * prev1.count) + prev2.count;
          totalStamina = (2 * prev1.stamina) + prev2.stamina + jumpStamina;
        }
      } else {
        // Starshine has unique stamina progression, Normal and Soul are linear (n-1)*10
        jumpStamina = mode === 'starshine' 
          ? (60 + (level - 2) * 30) 
          : (level - 1) * 10;

        const prev = computeBaseStats(level - 1);
        totalCount = synthesisRule * prev.count;
        totalStamina = (synthesisRule * prev.stamina) + jumpStamina;
        
        const levelExtras = extrasConfig[level] || [];
        if (levelExtras.length > 0) {
          levelExtras.forEach(extraLvl => {
            const extra = computeBaseStats(extraLvl);
            totalCount += extra.count;
            totalStamina += extra.stamina;
          });
        }
      }

      baseStats[level] = { count: totalCount, stamina: totalStamina };
      return baseStats[level];
    };

    const prefillCap = 20; 
    for (let i = 1; i <= prefillCap; i++) computeBaseStats(i);

    const seedPriceTotal = seedValueW * 10000;
    const seedStats = baseStats[seedLevel] || baseStats[1];
    
    const implicitLv1Price = Math.max(0, (seedPriceTotal - (seedStats.stamina * STAMINA_PER_POINT_VALUE)) / seedStats.count);

    const results = [];
    let cumulativeRmb = 0;
    for (let i = 1; i <= maxLevel; i++) {
      const stats = baseStats[i] || computeBaseStats(i);
      const staminaValue = stats.stamina * STAMINA_PER_POINT_VALUE;
      const totalCoins = (stats.count * implicitLv1Price) + staminaValue;
      const rmbValue = (totalCoins / 30000000) * exchangeRateRmb;
      cumulativeRmb += rmbValue;

      // Extract extra info for display (Special: Hide LX display for Colored mode)
      const displayExtras = mode === 'colored' ? null : (extrasConfig[i] || null);

      results.push({ 
        level: i, 
        count: stats.count, 
        staminaValue,
        totalCoins,
        rmbValue,
        cumulativeRmb,
        isSeed: i === seedLevel,
        extras: displayExtras
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
                    <p>• <b>合成基准</b>：2级消耗2个L1；3级及以后每级需要2个(n-1)级+1个(n-2)级。</p>
                    <p>• <b>体力公式</b>：2级消耗90点，之后每级增加30点 [90+(n-2)*30]。</p>
                    <p>• <b>累计统计</b>：最后一列展示从1级一路打到当前等级的总RMB预算。</p>
                  </>
                ) : mode === 'soul' ? (
                  <>
                    <p>• <b>合成基准</b>：1-7级灵石每2个宝石合成1个高级。</p>
                    <p>• <b>额外消耗</b>：8级+L3，9级+L6，10级+L8。</p>
                  </>
                ) : mode === 'starshine' ? (
                  <>
                    <p>• <b>合成基准</b>：每3个星辉石合成1个高级。</p>
                    <p>• <b>体力公式</b>：非线性 [60+(n-2)*30]。</p>
                  </>
                ) : (
                  <>
                    <p>• <b>合成基准</b>：每2个宝石合成1个高级。</p>
                    <p>• <b>额外消耗</b>：高级宝石(12级+)需要副石参与合成。</p>
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
                <div className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-black text-gray-400 uppercase border border-gray-100">联动自动计算</div>
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
                                    <div className={`w-4 h-4 ${mode === 'soul' ? 'bg-cyan-500' : 'bg-indigo-500'} rounded-full flex items-center justify-center text-[8px] text-white ring-2 ring-white`}>!</div>
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

export default GemPriceTool;
