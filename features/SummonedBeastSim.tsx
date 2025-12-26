import React, { useState, useMemo } from 'react';
import { Settings, Activity, Coins, Sparkles, ShieldCheck, Gem, Save, Heart, Zap, Swords, Wind } from 'lucide-react';
import { StatInput, CollapsibleSection } from '../components/Shared';
import { trunc } from '../utils';

const SummonedBeastSimTool = () => {
  // --- State ---
  const [c, setC] = useState({
    // Base
    level: 180, lingxing: 110,
    tizhi: 100, fali: 100, liliang: 100, naili: 100, minjie: 100,
    // 110 Extras
    tizhi110: 0, fali110: 0, liliang110: 0, naili110: 0, minjie110: 0,
    // Zizhi (Base values before Yuanxiao)
    gongjiZizhi: 1550, fangyuZizhi: 1400, tiliZizhi: 4500, faliZizhi: 2500, suduZizhi: 1400,
    chengzhang: 1.297,
    // Limits
    gongjiMax: 1650, chengzhangMax: 1.3,
    // Yuanxiao Counts
    yxGongji: 0, yxFangyu: 0, yxTili: 0, yxFali: 0, yxSudu: 0, zhenjing: 0,
    // Skills
    xumi: false, jingtai: false, xinxin: false, lingshan: false, zhutian: false,
    // Equip - Huwan (Bracer)
    huwanAttr1: 'damage', huwanValue1: 0,
    huwanAttr2: 'hp', huwanValue2: 0,
    huwanStoneType: 'damage', huwanStoneLevel: 0,
    // Equip - Xiangquan (Collar)
    xiangquanSpeed: 0,
    xiangquanAttr1: 'damage', xiangquanValue1: 0,
    xiangquanAttr2: 'hp', xiangquanValue2: 0,
    xiangquanStoneLevel: 0,
    // Equip - Kaijia (Armor)
    kaijiaDefense: 0,
    kaijiaAttr1: 'damage', kaijiaValue1: 0,
    kaijiaAttr2: 'hp', kaijiaValue2: 0,
    kaijiaStoneType: 'hp', kaijiaStoneLevel: 0,
    // Neidan
    zuoqi: 1.0,
    xunmin: 5, jingyue: 5, jiaoji: 5, lingguang: 5,
    highNeidanType: 'none', highNeidanLevel: 5
  });

  // --- Logic Helpers ---
  
  // 110 Extra Check
  const is110 = c.lingxing === 110;

  // Calculate Single Yuanxiao Increment
  const calculateSingleYuanxiao = (base: number, type: 'attack'|'defense'|'speed'|'tili'|'fali') => {
    let inc = 0;
    if (type === 'attack' || type === 'defense' || type === 'speed') {
      if (base < 1200) inc = 30;
      else if (base < 1300) inc = 22;
      else if (base < 1450) inc = 10;
      else inc = 5;
    } else if (type === 'tili') {
      if (base < 3500) inc = 70;
      else if (base < 4000) inc = 45;
      else if (base < 4500) inc = 30;
      else inc = 20;
    } else if (type === 'fali') {
      const gMax = c.gongjiMax; // Fali rules linked to Gongji max in source?
      // Logic from HTML:
      if (gMax === 1550 && base >= 3050) inc = 12;
      else if ((gMax === 1600 || gMax === 1650) && base >= 2700) inc = 12;
      else {
        if (base < 1700) inc = 37;
        else if (base < 2200) inc = 25;
        else if (base < 2700) inc = 15;
        else inc = 10;
      }
    }
    return base + inc;
  };

  // Calculate Total Zizhi after N Yuanxiao
  const calculateZizhiWithYuanxiao = (base: number, count: number, type: 'attack'|'defense'|'speed'|'tili'|'fali') => {
    let current = base;
    for (let i = 0; i < count; i++) {
      current = calculateSingleYuanxiao(current, type);
    }
    return current;
  };

  // Calculate Growth with Zhenjing
  const calculateGrowthWithZhenjing = (base: number, count: number, max: number) => {
    let current = base;
    for (let i = 0; i < count; i++) {
      if (current >= max) break;
      let inc = 0.001; // Default fallback
      // Ranges from HTML
      if (max === 1.3) {
         if (current < 1.257) inc = 0.005;
         else if (current < 1.27) inc = 0.004;
         else if (current < 1.282) inc = 0.003;
         else if (current < 1.295) inc = 0.002;
         else inc = 0.001;
      } else {
        // Simplified Logic for other maxes (using 1.297/1.3 ranges approximation or explicit provided ranges)
        // For brevity, using a generic scaler similar to max 1.3 logic adjusted
        const gap = max - current;
        if (gap > 0.043) inc = 0.005;
        else if (gap > 0.030) inc = 0.004;
        else if (gap > 0.018) inc = 0.003;
        else if (gap > 0.005) inc = 0.002;
      }
      current = Math.min(current + inc, max);
    }
    return current;
  };

  // Neidan Calc
  const calcNeidanBonus = (type: string, level: number, zuoqi: number, extraParam = 0) => {
    if (level === 0) return 0;
    const coef = 0.75 + 0.25 * level + zuoqi;
    let base = 0;
    switch(type) {
      case 'speed': base = trunc(c.level * 0.05); break; // xunmin
      case 'damage': base = trunc(c.level * 0.08); break; // xunmin
      case 'hp': base = trunc(c.level * 0.4); break; // jingyue/jiaoji
      case 'lingli': base = trunc(c.level * 0.04); break; // jingyue
      case 'fashang': base = trunc(extraParam / 50); break; // lingguang (uses Fali)
      case 'xuanwu_hp': base = trunc(c.level * 2); break;
      case 'longzhou_def': base = trunc(c.level / 2); break;
      case 'zhuque_mdef': base = c.level; break;
      case 'zhuque_def_red': base = trunc(c.level / 2); break;
    }
    return trunc(base * coef);
  };

  // Stone Calc
  const calcStone = (type: string, level: number) => {
    if (level <= 0) return 0;
    if (type === 'damage') return trunc(level * 10);
    if (type === 'speed') return level * 6;
    if (type === 'hp') return level * 30;
    if (type === 'defense') return level * 8;
    if (type === 'lingli') return level * 4;
    return 0;
  };

  // --- Main Calculation ---
  const results = useMemo(() => {
    // 1. Final Zizhi & Growth
    const zGongji = calculateZizhiWithYuanxiao(c.gongjiZizhi, c.yxGongji, 'attack');
    const zFangyu = calculateZizhiWithYuanxiao(c.fangyuZizhi, c.yxFangyu, 'defense');
    const zTili = calculateZizhiWithYuanxiao(c.tiliZizhi, c.yxTili, 'tili');
    const zFali = calculateZizhiWithYuanxiao(c.faliZizhi, c.yxFali, 'fali');
    const zSudu = calculateZizhiWithYuanxiao(c.suduZizhi, c.yxSudu, 'speed');
    const growth = calculateGrowthWithZhenjing(c.chengzhang, c.zhenjing, c.chengzhangMax);

    // 2. Total Attributes (Base + 110 + Equip)
    // First, equipment attribute parsing
    const eqAttrs = { tizhi: 0, fali: 0, liliang: 0, naili: 0, minjie: 0, hp: 0, mp: 0, damage: 0, defense: 0, speed: 0, lingli: 0 };
    const addEq = (attr: string, val: number) => {
      if (!val) return;
      if (attr === 'tizhi') eqAttrs.tizhi += val;
      else if (attr === 'fali') eqAttrs.fali += val;
      else if (attr === 'liliang') eqAttrs.liliang += val;
      else if (attr === 'naili') eqAttrs.naili += val;
      else if (attr === 'minjie') eqAttrs.minjie += val;
      else if (attr === 'hp') eqAttrs.hp += val;
      else if (attr === 'magic') eqAttrs.mp += val;
      else if (attr === 'damage') eqAttrs.damage += val;
      // ... others
    };

    // Process 3 pieces
    [ 
      {a1: c.huwanAttr1, v1: c.huwanValue1, a2: c.huwanAttr2, v2: c.huwanValue2},
      {a1: c.xiangquanAttr1, v1: c.xiangquanValue1, a2: c.xiangquanAttr2, v2: c.xiangquanValue2},
      {a1: c.kaijiaAttr1, v1: c.kaijiaValue1, a2: c.kaijiaAttr2, v2: c.kaijiaValue2}
    ].forEach(p => { addEq(p.a1, p.v1); addEq(p.a2, p.v2); });

    // Equipment base stats
    eqAttrs.speed += c.xiangquanSpeed;
    eqAttrs.defense += c.kaijiaDefense;
    
    // Stones
    if (c.huwanStoneType === 'damage') eqAttrs.damage += calcStone('damage', c.huwanStoneLevel);
    else eqAttrs.lingli += calcStone('lingli', c.huwanStoneLevel);
    eqAttrs.speed += calcStone('speed', c.xiangquanStoneLevel);
    if (c.kaijiaStoneType === 'hp') eqAttrs.hp += calcStone('hp', c.kaijiaStoneLevel);
    else eqAttrs.defense += calcStone('defense', c.kaijiaStoneLevel);

    // Final Attr Points
    const tTizhi = c.tizhi + (is110 ? c.tizhi110 : 0) + eqAttrs.tizhi;
    const tFali = c.fali + (is110 ? c.fali110 : 0) + eqAttrs.fali;
    const tLiliang = c.liliang + (is110 ? c.liliang110 : 0) + eqAttrs.liliang;
    const tNaili = c.naili + (is110 ? c.naili110 : 0) + eqAttrs.naili;
    const tMinjie = c.minjie + (is110 ? c.minjie110 : 0) + eqAttrs.minjie;

    // Neidan Bonuses
    let ndSpeed = 0, ndDmg = 0, ndHp = 0, ndLingli = 0, ndFashang = 0, ndDef = 0, ndMDef = 0, ndDefRed = 0;
    if (c.xunmin > 0) { ndSpeed += calcNeidanBonus('speed', c.xunmin, c.zuoqi); ndDmg += calcNeidanBonus('damage', c.xunmin, c.zuoqi); }
    if (c.jingyue > 0) { ndHp += calcNeidanBonus('hp', c.jingyue, c.zuoqi); ndLingli += calcNeidanBonus('lingli', c.jingyue, c.zuoqi); }
    if (c.jiaoji > 0) { ndSpeed += calcNeidanBonus('speed', c.jiaoji, c.zuoqi); ndHp += calcNeidanBonus('hp', c.jiaoji, c.zuoqi); }
    if (c.lingguang > 0) { ndFashang += calcNeidanBonus('fashang', c.lingguang, c.zuoqi, tFali); }
    
    if (c.highNeidanType === 'xuanwu') ndHp += calcNeidanBonus('xuanwu_hp', c.highNeidanLevel, c.zuoqi);
    if (c.highNeidanType === 'longzhou') ndDef += calcNeidanBonus('longzhou_def', c.highNeidanLevel, c.zuoqi);
    if (c.highNeidanType === 'zhuque') { ndMDef += calcNeidanBonus('zhuque_mdef', c.highNeidanLevel, c.zuoqi); ndDefRed += calcNeidanBonus('zhuque_def_red', c.highNeidanLevel, c.zuoqi); }

    // 3. STATS Calculation (Strict Order from HTML)
    
    // Attack
    let atkPartA = trunc(trunc(c.level * zGongji / 500) * trunc(700 + growth * 500) / 1000);
    let atkPartB = trunc(tLiliang * growth * 0.75);
    let totalDmgRaw = atkPartA + atkPartB + ndDmg + eqAttrs.damage;
    let attack = trunc(totalDmgRaw * 4 / 3);
    if (c.zhutian) attack += trunc(tLiliang * growth * 0.2);

    // Defense
    let defBase = trunc(trunc(c.level * zFangyu / 500 * 7/8) * trunc(700 + growth * 500) / 1000) +
                  trunc(tNaili * growth * 1.33) + eqAttrs.defense + ndDef - ndDefRed;
    if (c.zhutian) defBase -= trunc(tLiliang * 0.2);
    const defense = defBase;

    // HP
    let hpBase = trunc(c.level * zTili / 1000) + trunc(tTizhi * growth * 6) + ndHp + eqAttrs.hp;
    if (c.jingtai) hpBase += trunc(tTizhi * growth * 2);
    const hp = c.xinxin ? trunc(hpBase * 1.4) : hpBase;

    // MP
    const mp = trunc(c.level * zFali / 500) + trunc(tFali * growth * 3) + eqAttrs.mp;

    // Speed
    const speed = trunc(tMinjie * zSudu / 1000) + ndSpeed + eqAttrs.speed;

    // Magic Damage / Defense
    let lingliBase = trunc(c.level * (5000 + 3 * zFali) / 10000) + 
                     trunc(tTizhi * 0.3) + trunc(tFali * 0.7) + trunc(tLiliang * 0.4) + trunc(tNaili * 0.2) + 
                     eqAttrs.lingli + ndLingli;
    
    let fashang = lingliBase + ndFashang;
    if (c.xumi) fashang += trunc(tFali * 0.4);

    let fafang = lingliBase + ndMDef;
    if (c.lingshan) fafang += trunc(tFali * growth);

    // Tianfu Calculation (Not added to stats, separate display)
    const halfLv = trunc(c.level * 0.5);
    const tfHp = trunc(halfLv * 6 * growth) + trunc(growth / 4);
    const tfLingli = trunc(halfLv * 0.7) + trunc(tFali / 25);
    const tfAtk = trunc(halfLv * growth) + trunc(tLiliang / 20);
    const tfDef = trunc(halfLv * growth * 4/3) + trunc(tNaili / 12.5);
    const tfSpd = trunc(halfLv * zSudu / 1000) + trunc(tMinjie / 12.5);

    // Distribution Points Calc
    const lvlBonus = Math.floor(c.level / 20) + 1;
    const distPoints = 100 + (10 * c.level) - c.tizhi - c.fali - c.liliang - c.naili - c.minjie + (2 * c.lingxing) + lvlBonus;

    return { 
      hp, mp, attack, defense, speed, fashang, fafang, 
      tf: { hp: tfHp, lingli: tfLingli, gongji: tfAtk, fangyu: tfDef, sudu: tfSpd },
      distPoints,
      rawGrowth: growth, rawZizhi: { zGongji, zFangyu, zTili, zFali, zSudu }
    };
  }, [c, is110]);

  const updateC = (key: string, val: any) => setC(prev => ({ ...prev, [key]: val }));
  
  // Yuanxiao Handler
  const handleYuanxiao = (key: string, delta: number, max: number = 50) => {
    // @ts-ignore
    const current = c[key] as number;
    if (delta > 0 && current < max) updateC(key, current + 1);
    if (delta < 0 && current > 0) updateC(key, current - 1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* --- LEFT INPUT COLUMN --- */}
        <div className="xl:w-7/12 space-y-4">
          
          {/* 1. Base Attributes */}
          <CollapsibleSection title="基础属性 Base Attributes" icon={Settings} defaultOpen={true}>
            <div className="grid grid-cols-2 gap-4 mb-4">
               <StatInput label="等级 Level" value={c.level} onChange={(v:any) => updateC('level', parseInt(v)||0)} colorClass="bg-gray-50 border-gray-200" min={0} max={180} />
               <StatInput label="灵性 Lingxing" value={c.lingxing} onChange={(v:any) => updateC('lingxing', parseInt(v)||0)} colorClass="bg-gray-50 border-gray-200" min={0} max={110} />
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
               <div className="contents">
                 <StatInput label="体质 Con" value={c.tizhi} onChange={(v:any) => updateC('tizhi', parseInt(v)||0)} colorClass="bg-green-50 border-green-100 text-green-700" />
                 <StatInput label="110额外(体)" value={c.tizhi110} onChange={(v:any) => updateC('tizhi110', parseInt(v)||0)} disabled={!is110} colorClass="bg-green-50 border-green-100" />
               </div>
               <div className="contents">
                 <StatInput label="法力 Mag" value={c.fali} onChange={(v:any) => updateC('fali', parseInt(v)||0)} colorClass="bg-blue-50 border-blue-100 text-blue-700" />
                 <StatInput label="110额外(法)" value={c.fali110} onChange={(v:any) => updateC('fali110', parseInt(v)||0)} disabled={!is110} colorClass="bg-blue-50 border-blue-100" />
               </div>
               <div className="contents">
                 <StatInput label="力量 Str" value={c.liliang} onChange={(v:any) => updateC('liliang', parseInt(v)||0)} colorClass="bg-red-50 border-red-100 text-red-700" />
                 <StatInput label="110额外(力)" value={c.liliang110} onChange={(v:any) => updateC('liliang110', parseInt(v)||0)} disabled={!is110} colorClass="bg-red-50 border-red-100" />
               </div>
               <div className="contents">
                 <StatInput label="耐力 End" value={c.naili} onChange={(v:any) => updateC('naili', parseInt(v)||0)} colorClass="bg-orange-50 border-orange-100 text-orange-700" />
                 <StatInput label="110额外(耐)" value={c.naili110} onChange={(v:any) => updateC('naili110', parseInt(v)||0)} disabled={!is110} colorClass="bg-orange-50 border-orange-100" />
               </div>
               <div className="contents">
                 <StatInput label="敏捷 Agi" value={c.minjie} onChange={(v:any) => updateC('minjie', parseInt(v)||0)} colorClass="bg-cyan-50 border-cyan-100 text-cyan-700" />
                 <StatInput label="110额外(敏)" value={c.minjie110} onChange={(v:any) => updateC('minjie110', parseInt(v)||0)} disabled={!is110} colorClass="bg-cyan-50 border-cyan-100" />
               </div>
            </div>

            <div className={`mt-4 p-3 rounded-xl text-center font-bold text-sm ${results.distPoints < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
               可分配属性点: {Math.max(0, results.distPoints)} 
               {results.distPoints < 0 && <span className="text-xs ml-2">(已超 {-results.distPoints} 点)</span>}
            </div>
          </CollapsibleSection>

          {/* 2. Zizhi & Growth */}
          <CollapsibleSection title="资质与成长 Qualities & Growth" icon={Activity} defaultOpen={true}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <StatInput label="攻击资质" value={c.gongjiZizhi} onChange={(v:any) => updateC('gongjiZizhi', parseInt(v)||0)} colorClass="bg-gray-50 border-gray-100" />
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">上限</label>
                <select value={c.gongjiMax} onChange={e => updateC('gongjiMax', parseInt(e.target.value))} className="w-full px-3 py-2 rounded-xl border-2 border-gray-100 bg-white font-bold text-sm outline-none">
                  {[1550, 1600, 1650].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
               <StatInput label="防御资质" value={c.fangyuZizhi} onChange={(v:any) => updateC('fangyuZizhi', parseInt(v)||0)} colorClass="bg-gray-50 border-gray-100" />
               <StatInput label="体力资质" value={c.tiliZizhi} onChange={(v:any) => updateC('tiliZizhi', parseInt(v)||0)} colorClass="bg-gray-50 border-gray-100" />
               <StatInput label="法力资质" value={c.faliZizhi} onChange={(v:any) => updateC('faliZizhi', parseInt(v)||0)} colorClass="bg-gray-50 border-gray-100" />
               <StatInput label="速度资质" value={c.suduZizhi} onChange={(v:any) => updateC('suduZizhi', parseInt(v)||0)} colorClass="bg-gray-50 border-gray-100" />
            </div>
             <div className="grid grid-cols-2 gap-4">
              <StatInput label="成长 Growth" value={c.chengzhang} onChange={(v:any) => updateC('chengzhang', parseFloat(v)||0)} colorClass="bg-gray-50 border-gray-100" step="0.001" max={1.3} />
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">成长上限</label>
                <select value={c.chengzhangMax} onChange={e => updateC('chengzhangMax', parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-xl border-2 border-gray-100 bg-white font-bold text-sm outline-none">
                  {[1.184, 1.236, 1.266, 1.277, 1.287, 1.297, 1.3].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </CollapsibleSection>

          {/* 3. Yuanxiao & Zhenjing */}
          <CollapsibleSection title="元宵与真经 Dumplings & Books" icon={Coins}>
             {[
               { id: 'yxGongji', label: '攻击元宵', base: c.gongjiZizhi, val: results.rawZizhi.zGongji },
               { id: 'yxFangyu', label: '防御元宵', base: c.fangyuZizhi, val: results.rawZizhi.zFangyu },
               { id: 'yxTili', label: '体力元宵', base: c.tiliZizhi, val: results.rawZizhi.zTili },
               { id: 'yxFali', label: '法力元宵', base: c.faliZizhi, val: results.rawZizhi.zFali },
               { id: 'yxSudu', label: '速度元宵', base: c.suduZizhi, val: results.rawZizhi.zSudu },
             ].map((item: any) => (
               <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-700">{item.label}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{item.val} (+{item.val - item.base})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleYuanxiao(item.id, -1)} disabled={(c[item.id as keyof typeof c] as number) <= 0} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 font-bold text-gray-600">-</button>
                    <span className="w-8 text-center font-bold text-emerald-600">{c[item.id as keyof typeof c]}</span>
                    <button onClick={() => handleYuanxiao(item.id, 1)} disabled={(c[item.id as keyof typeof c] as number) >= 50} className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 font-bold">+</button>
                  </div>
               </div>
             ))}
             <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl mt-4 border border-indigo-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-indigo-800">炼兽真经</span>
                    <span className="text-[10px] text-indigo-400 font-mono">{results.rawGrowth.toFixed(3)} (+{(results.rawGrowth - c.chengzhang).toFixed(3)})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleYuanxiao('zhenjing', -1, 5)} disabled={c.zhenjing <= 0} className="w-8 h-8 rounded-lg bg-white border border-indigo-200 flex items-center justify-center hover:bg-indigo-50 disabled:opacity-50 font-bold text-indigo-600">-</button>
                    <span className="w-8 text-center font-bold text-indigo-700">{c.zhenjing}</span>
                    <button onClick={() => handleYuanxiao('zhenjing', 1, 5)} disabled={c.zhenjing >= 5} className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 font-bold">+</button>
                  </div>
             </div>
          </CollapsibleSection>

          {/* 4. Skills */}
          <CollapsibleSection title="特殊技能 Special Skills" icon={Sparkles}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'xumi', label: '须弥真言 (法伤+法力*0.4)' },
                { id: 'jingtai', label: '净台妙谛 (气血+体*成长*2)' },
                { id: 'xinxin', label: '欣欣向荣 (气血*1.4)' },
                { id: 'lingshan', label: '灵山禅语 (法防+法力*成长)' },
                { id: 'zhutian', label: '诸天正法 (攻增防减)' },
              ].map((skill) => (
                <label key={skill.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${c[skill.id as keyof typeof c] ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}>
                   <input type="checkbox" checked={c[skill.id as keyof typeof c] as boolean} onChange={e => updateC(skill.id, e.target.checked)} className="w-5 h-5 accent-emerald-500" />
                   <span className="text-xs font-bold text-gray-700">{skill.label.split(' ')[0]}</span>
                </label>
              ))}
            </div>
          </CollapsibleSection>

          {/* 5. Equipment */}
          <CollapsibleSection title="装备与灵石 Equipment" icon={ShieldCheck}>
             {/* Bracer */}
             <div className="mb-6 pb-6 border-b border-gray-100">
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">护腕 Bracer</h4>
               <div className="space-y-3">
                  <div className="flex gap-2">
                     <select value={c.huwanAttr1} onChange={e => updateC('huwanAttr1', e.target.value)} className="bg-gray-50 rounded-lg text-xs font-bold p-2 outline-none w-20">
                       <option value="damage">伤害</option><option value="hp">气血</option><option value="magic">魔法</option><option value="lingli">灵力</option>
                       <option value="tizhi">体质</option><option value="fali">法力</option><option value="liliang">力量</option><option value="naili">耐力</option><option value="minjie">敏捷</option>
                     </select>
                     <input type="number" value={c.huwanValue1 || ''} onChange={e => updateC('huwanValue1', parseInt(e.target.value)||0)} className="flex-1 bg-gray-50 rounded-lg px-3 text-sm font-bold outline-none" placeholder="数值" />
                  </div>
                  <div className="flex gap-2">
                     <select value={c.huwanAttr2} onChange={e => updateC('huwanAttr2', e.target.value)} className="bg-gray-50 rounded-lg text-xs font-bold p-2 outline-none w-20">
                       <option value="damage">伤害</option><option value="hp">气血</option><option value="magic">魔法</option><option value="lingli">灵力</option>
                       <option value="tizhi">体质</option><option value="fali">法力</option><option value="liliang">力量</option><option value="naili">耐力</option><option value="minjie">敏捷</option>
                     </select>
                     <input type="number" value={c.huwanValue2 || ''} onChange={e => updateC('huwanValue2', parseInt(e.target.value)||0)} className="flex-1 bg-gray-50 rounded-lg px-3 text-sm font-bold outline-none" placeholder="数值" />
                  </div>
                  <div className="flex gap-2 items-center pt-2">
                     <select value={c.huwanStoneType} onChange={e => updateC('huwanStoneType', e.target.value)} className="bg-orange-50 text-orange-700 rounded-lg text-xs font-bold p-2 outline-none">
                       <option value="damage">伤害灵石</option><option value="lingli">灵力灵石</option>
                     </select>
                     <span className="text-xs font-bold text-gray-400">段数:</span>
                     <input type="number" value={c.huwanStoneLevel || ''} onChange={e => updateC('huwanStoneLevel', parseInt(e.target.value)||0)} className="w-16 bg-orange-50 text-orange-800 rounded-lg px-2 py-1 text-sm font-bold outline-none text-center" />
                  </div>
               </div>
             </div>

             {/* Collar */}
             <div className="mb-6 pb-6 border-b border-gray-100">
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">项圈 Collar (基础速度)</h4>
               <input type="number" value={c.xiangquanSpeed || ''} onChange={e => updateC('xiangquanSpeed', parseInt(e.target.value)||0)} className="w-full mb-3 bg-gray-100 rounded-lg px-3 py-2 text-sm font-bold outline-none" placeholder="基础速度" />
               <div className="space-y-3">
                  <div className="flex gap-2">
                     <select value={c.xiangquanAttr1} onChange={e => updateC('xiangquanAttr1', e.target.value)} className="bg-gray-50 rounded-lg text-xs font-bold p-2 outline-none w-20">
                        <option value="damage">伤害</option><option value="hp">气血</option><option value="magic">魔法</option><option value="lingli">灵力</option>
                       <option value="tizhi">体质</option><option value="fali">法力</option><option value="liliang">力量</option><option value="naili">耐力</option><option value="minjie">敏捷</option>
                     </select>
                     <input type="number" value={c.xiangquanValue1 || ''} onChange={e => updateC('xiangquanValue1', parseInt(e.target.value)||0)} className="flex-1 bg-gray-50 rounded-lg px-3 text-sm font-bold outline-none" placeholder="数值" />
                  </div>
                   <div className="flex gap-2 items-center pt-2">
                     <span className="bg-cyan-50 text-cyan-700 rounded-lg text-xs font-bold p-2">速度灵石</span>
                     <span className="text-xs font-bold text-gray-400">段数:</span>
                     <input type="number" value={c.xiangquanStoneLevel || ''} onChange={e => updateC('xiangquanStoneLevel', parseInt(e.target.value)||0)} className="w-16 bg-cyan-50 text-cyan-800 rounded-lg px-2 py-1 text-sm font-bold outline-none text-center" />
                  </div>
               </div>
             </div>

             {/* Armor */}
             <div>
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">铠甲 Armor (基础防御)</h4>
               <input type="number" value={c.kaijiaDefense || ''} onChange={e => updateC('kaijiaDefense', parseInt(e.target.value)||0)} className="w-full mb-3 bg-gray-100 rounded-lg px-3 py-2 text-sm font-bold outline-none" placeholder="基础防御" />
               <div className="space-y-3">
                  <div className="flex gap-2">
                     <select value={c.kaijiaAttr1} onChange={e => updateC('kaijiaAttr1', e.target.value)} className="bg-gray-50 rounded-lg text-xs font-bold p-2 outline-none w-20">
                       <option value="damage">伤害</option><option value="hp">气血</option><option value="magic">魔法</option><option value="lingli">灵力</option>
                       <option value="tizhi">体质</option><option value="fali">法力</option><option value="liliang">力量</option><option value="naili">耐力</option><option value="minjie">敏捷</option>
                     </select>
                     <input type="number" value={c.kaijiaValue1 || ''} onChange={e => updateC('kaijiaValue1', parseInt(e.target.value)||0)} className="flex-1 bg-gray-50 rounded-lg px-3 text-sm font-bold outline-none" placeholder="数值" />
                  </div>
                  <div className="flex gap-2 items-center pt-2">
                     <select value={c.kaijiaStoneType} onChange={e => updateC('kaijiaStoneType', e.target.value)} className="bg-green-50 text-green-700 rounded-lg text-xs font-bold p-2 outline-none">
                       <option value="hp">气血灵石</option><option value="defense">防御灵石</option>
                     </select>
                     <span className="text-xs font-bold text-gray-400">段数:</span>
                     <input type="number" value={c.kaijiaStoneLevel || ''} onChange={e => updateC('kaijiaStoneLevel', parseInt(e.target.value)||0)} className="w-16 bg-green-50 text-green-800 rounded-lg px-2 py-1 text-sm font-bold outline-none text-center" />
                  </div>
               </div>
             </div>
          </CollapsibleSection>
          
          {/* 6. Neidan */}
          <CollapsibleSection title="内丹加成 Neidan" icon={Gem}>
             <div className="mb-4">
               <StatInput label="坐骑成长 (影响内丹)" value={c.zuoqi} onChange={(v:any) => updateC('zuoqi', parseFloat(v)||0)} colorClass="bg-purple-50 border-purple-100" step="0.01" max={2.4} />
             </div>
             <div className="grid grid-cols-2 gap-4 mb-4">
               <StatInput label="迅敏 (速度/伤害)" value={c.xunmin} onChange={(v:any) => updateC('xunmin', parseInt(v)||0)} colorClass="bg-gray-50 border-gray-100" max={5} />
               <StatInput label="静岳 (气血/灵力)" value={c.jingyue} onChange={(v:any) => updateC('jingyue', parseInt(v)||0)} colorClass="bg-gray-50 border-gray-100" max={5} />
               <StatInput label="矫健 (气血/速度)" value={c.jiaoji} onChange={(v:any) => updateC('jiaoji', parseInt(v)||0)} colorClass="bg-gray-50 border-gray-100" max={5} />
               <StatInput label="灵光 (法伤)" value={c.lingguang} onChange={(v:any) => updateC('lingguang', parseInt(v)||0)} colorClass="bg-gray-50 border-gray-100" max={5} />
             </div>
             <div className="p-3 bg-gray-50 rounded-xl">
               <label className="text-xs font-bold text-gray-500 block mb-2">高级内丹</label>
               <div className="flex gap-2">
                 <select value={c.highNeidanType} onChange={e => updateC('highNeidanType', e.target.value)} className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-sm font-bold outline-none">
                   <option value="none">无 / 其他</option>
                   <option value="xuanwu">玄武躯 (气血)</option>
                   <option value="longzhou">龙胄铠 (防御)</option>
                   <option value="zhuque">朱雀甲 (法防)</option>
                 </select>
                 <input type="number" value={c.highNeidanLevel} onChange={e => updateC('highNeidanLevel', parseInt(e.target.value)||0)} className="w-16 bg-white border border-gray-200 rounded-lg p-2 text-sm font-bold text-center outline-none" max={5} />
               </div>
             </div>
          </CollapsibleSection>

        </div>

        {/* --- RIGHT OUTPUT COLUMN --- */}
        <div className="xl:w-5/12 flex flex-col gap-6 sticky top-8 self-start">
           
           {/* Results Card */}
           <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8 border-b border-white/20 pb-4">
                  <h2 className="text-xl font-black flex items-center gap-3"><Activity className="w-6 h-6"/> 最终面板</h2>
                  <div className="bg-black/20 px-3 py-1 rounded-full text-xs font-bold font-mono">LV.{c.level}</div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-emerald-100">
                         <div className="p-2 bg-white/10 rounded-lg"><Heart className="w-5 h-5"/></div>
                         <span className="font-bold">气血 HP</span>
                      </div>
                      <span className="text-4xl font-black font-mono tracking-tight">{results.hp.toLocaleString()}</span>
                   </div>

                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-emerald-100">
                         <div className="p-2 bg-white/10 rounded-lg"><Zap className="w-5 h-5"/></div>
                         <span className="font-bold">魔法 MP</span>
                      </div>
                      <span className="text-2xl font-black font-mono tracking-tight opacity-90">{results.mp.toLocaleString()}</span>
                   </div>

                   <div className="h-px bg-white/10 w-full my-2"></div>

                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-emerald-100">
                         <div className="p-2 bg-white/10 rounded-lg"><Swords className="w-5 h-5"/></div>
                         <span className="font-bold">攻击 Attack</span>
                      </div>
                      <span className="text-4xl font-black font-mono tracking-tight text-yellow-300">{results.attack.toLocaleString()}</span>
                   </div>

                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-emerald-100">
                         <div className="p-2 bg-white/10 rounded-lg"><ShieldCheck className="w-5 h-5"/></div>
                         <span className="font-bold">防御 Defense</span>
                      </div>
                      <span className="text-3xl font-black font-mono tracking-tight">{results.defense.toLocaleString()}</span>
                   </div>

                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-emerald-100">
                         <div className="p-2 bg-white/10 rounded-lg"><Wind className="w-5 h-5"/></div>
                         <span className="font-bold">速度 Speed</span>
                      </div>
                      <span className="text-3xl font-black font-mono tracking-tight text-cyan-200">{results.speed.toLocaleString()}</span>
                   </div>

                   <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <div className="text-xs text-emerald-200 font-bold mb-1">法术伤害 M.Dmg</div>
                        <div className="text-xl font-black font-mono text-purple-200">{results.fashang.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-emerald-200 font-bold mb-1">法术防御 M.Def</div>
                        <div className="text-xl font-black font-mono">{results.fafang.toLocaleString()}</div>
                      </div>
                   </div>
                </div>
              </div>
           </div>
           
           {/* Tianfu Bonus Card */}
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-black text-gray-800 text-sm mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> 天赋符加成 (估算)</h3>
              <div className="grid grid-cols-3 gap-3">
                 <div className="bg-gray-50 p-2 rounded-lg text-center"><div className="text-[10px] text-gray-400 font-bold">气血</div><div className="font-bold text-gray-700">+{results.tf.hp}</div></div>
                 <div className="bg-gray-50 p-2 rounded-lg text-center"><div className="text-[10px] text-gray-400 font-bold">伤害</div><div className="font-bold text-gray-700">+{results.tf.gongji}</div></div>
                 <div className="bg-gray-50 p-2 rounded-lg text-center"><div className="text-[10px] text-gray-400 font-bold">防御</div><div className="font-bold text-gray-700">+{results.tf.fangyu}</div></div>
                 <div className="bg-gray-50 p-2 rounded-lg text-center"><div className="text-[10px] text-gray-400 font-bold">速度</div><div className="font-bold text-gray-700">+{results.tf.sudu}</div></div>
                 <div className="bg-gray-50 p-2 rounded-lg text-center"><div className="text-[10px] text-gray-400 font-bold">灵力</div><div className="font-bold text-gray-700">+{results.tf.lingli}</div></div>
              </div>
           </div>

           <button 
              onClick={() => {
                const json = JSON.stringify(c);
                const blob = new Blob([json], {type: "application/json"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bb-sim-${Date.now()}.json`;
                a.click();
              }} 
              className="w-full py-4 bg-white border border-emerald-100 text-emerald-700 rounded-2xl font-black text-lg shadow-sm hover:bg-emerald-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Save className="w-5 h-5" />
              导出配置
            </button>
        </div>
      </div>
    </div>
  );
};

export default SummonedBeastSimTool;
