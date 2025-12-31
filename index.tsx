import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { 
  Activity, Home, Menu, Calculator, Gem, Diamond, 
  Settings, Coins, Sparkles, ShieldCheck, Save, Heart, 
  Zap, Swords, Wind, ChevronUp, ChevronDown, Wallet, 
  Info, TrendingUp, Trash2, History, RotateCcw, ArrowRight,
  ChevronRight, X
} from 'lucide-react';

// ==========================================
// 1. TYPES & CONSTANTS
// ==========================================

type ItemType = 'armor' | 'collar' | 'bracer';
type RaceType = 'human' | 'demon' | 'immortal';
type SpiritType = 'ring' | 'earring';
type SubAttrType = 'damage' | 'speed';
type GemMode = 'normal' | 'starshine' | 'soul' | 'colored';

const RACE_FACTORS = {
  human: { strToDmg: 0.67, agiToSpd: 0.7, endToDef: 1.5, label: '人族' },
  demon: { strToDmg: 0.77, agiToSpd: 0.7, endToDef: 1.4, label: '魔族' },
  immortal: { strToDmg: 0.57, agiToSpd: 0.7, endToDef: 1.6, label: '仙族' }
};

const NORMAL_EXTRAS: Record<number, number[]> = {
  12: [3, 5, 6], 13: [9], 14: [9, 10], 15: [9, 12],
  16: [11, 12, 13], 17: [15], 18: [13, 14, 16],
  19: [15, 16, 17], 20: [17, 18, 18]
};

const STARSHINE_EXTRAS: Record<number, number[]> = {
  9: [5], 10: [6, 7], 11: [9]
};

const SOUL_EXTRAS: Record<number, number[]> = {
  8: [3], 9: [6], 10: [8]
};

// Safe floor function
const trunc = (v: number) => Math.floor(v + 1e-10);

// ==========================================
// 2. SHARED COMPONENTS
// ==========================================

const StatInput = ({ label, value, onChange, colorClass, placeholder, disabled, min, max, step }: any) => (
  <div>
    <label className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${disabled ? 'text-gray-300' : 'text-gray-400'}`}>
      {label}
    </label>
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      value={value === 0 && !disabled ? '' : value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-xl border-2 outline-none transition-all font-mono text-base font-bold 
        ${disabled 
          ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
          : `${colorClass} focus:ring-2 focus:ring-opacity-50`}`}
      onWheel={(e) => e.currentTarget.blur()}
    />
  </div>
);

// New Component: Styled Select
const StyledSelect = ({ label, value, onChange, className, children, disabled }: any) => (
  <div className="w-full">
    {label && <label className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${disabled ? 'text-gray-300' : 'text-gray-400'}`}>{label}</label>}
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3 py-2 pr-10 rounded-xl border-2 outline-none transition-all font-bold text-sm appearance-none cursor-pointer 
        ${disabled 
          ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
          : (className || 'bg-gray-50 border-gray-100 text-gray-700 hover:border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100')}`}
      >
        {children}
      </select>
      <ChevronDown className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
    </div>
  </div>
);

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-emerald-500" />}
          <h3 className="font-black text-gray-800 text-sm uppercase tracking-wide">{title}</h3>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="p-6 pt-0 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
          <div className="pt-6">{children}</div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. FEATURES
// ==========================================

// --- Feature: Dashboard ---
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

// --- Feature: Summoned Beast Sim ---
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
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
  
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
               <StatInput label="等级 Level" value={c.level} onChange={(v:any) => updateC('level', clamp(parseInt(v)||0, 0, 180))} colorClass="bg-gray-50 border-gray-200" min={0} max={180} />
               <StatInput label="灵性 Lingxing" value={c.lingxing} onChange={(v:any) => updateC('lingxing', clamp(parseInt(v)||0, 0, 110))} colorClass="bg-gray-50 border-gray-200" min={0} max={110} />
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
               <div className="contents">
                 <StatInput label="体质 Con" value={c.tizhi} onChange={(v:any) => updateC('tizhi', Math.max(parseInt(v)||0, 0))} colorClass="bg-green-50 border-green-100 text-green-700" />
                 <StatInput label="110额外(体)" value={c.tizhi110} onChange={(v:any) => updateC('tizhi110', Math.max(parseInt(v)||0, 0))} disabled={!is110} colorClass="bg-green-50 border-green-100" />
               </div>
               <div className="contents">
                 <StatInput label="法力 Mag" value={c.fali} onChange={(v:any) => updateC('fali', Math.max(parseInt(v)||0, 0))} colorClass="bg-blue-50 border-blue-100 text-blue-700" />
                 <StatInput label="110额外(法)" value={c.fali110} onChange={(v:any) => updateC('fali110', Math.max(parseInt(v)||0, 0))} disabled={!is110} colorClass="bg-blue-50 border-blue-100" />
               </div>
               <div className="contents">
                 <StatInput label="力量 Str" value={c.liliang} onChange={(v:any) => updateC('liliang', Math.max(parseInt(v)||0, 0))} colorClass="bg-red-50 border-red-100 text-red-700" />
                 <StatInput label="110额外(力)" value={c.liliang110} onChange={(v:any) => updateC('liliang110', Math.max(parseInt(v)||0, 0))} disabled={!is110} colorClass="bg-red-50 border-red-100" />
               </div>
               <div className="contents">
                 <StatInput label="耐力 End" value={c.naili} onChange={(v:any) => updateC('naili', Math.max(parseInt(v)||0, 0))} colorClass="bg-orange-50 border-orange-100 text-orange-700" />
                 <StatInput label="110额外(耐)" value={c.naili110} onChange={(v:any) => updateC('naili110', Math.max(parseInt(v)||0, 0))} disabled={!is110} colorClass="bg-orange-50 border-orange-100" />
               </div>
               <div className="contents">
                 <StatInput label="敏捷 Agi" value={c.minjie} onChange={(v:any) => updateC('minjie', Math.max(parseInt(v)||0, 0))} colorClass="bg-cyan-50 border-cyan-100 text-cyan-700" />
                 <StatInput label="110额外(敏)" value={c.minjie110} onChange={(v:any) => updateC('minjie110', Math.max(parseInt(v)||0, 0))} disabled={!is110} colorClass="bg-cyan-50 border-cyan-100" />
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
              <StatInput label="攻击资质" value={c.gongjiZizhi} onChange={(v:any) => updateC('gongjiZizhi', Math.max(parseInt(v)||0, 0))} colorClass="bg-gray-50 border-gray-100" />
              <StyledSelect label="上限" value={c.gongjiMax} onChange={(e:any) => updateC('gongjiMax', parseInt(e.target.value))}>
                 {[1550, 1600, 1650].map(v => <option key={v} value={v}>{v}</option>)}
              </StyledSelect>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
               <StatInput label="防御资质" value={c.fangyuZizhi} onChange={(v:any) => updateC('fangyuZizhi', Math.max(parseInt(v)||0, 0))} colorClass="bg-gray-50 border-gray-100" />
               <StatInput label="体力资质" value={c.tiliZizhi} onChange={(v:any) => updateC('tiliZizhi', Math.max(parseInt(v)||0, 0))} colorClass="bg-gray-50 border-gray-100" />
               <StatInput label="法力资质" value={c.faliZizhi} onChange={(v:any) => updateC('faliZizhi', Math.max(parseInt(v)||0, 0))} colorClass="bg-gray-50 border-gray-100" />
               <StatInput label="速度资质" value={c.suduZizhi} onChange={(v:any) => updateC('suduZizhi', Math.max(parseInt(v)||0, 0))} colorClass="bg-gray-50 border-gray-100" />
            </div>
             <div className="grid grid-cols-2 gap-4">
              <StatInput label="成长 Growth" value={c.chengzhang} onChange={(v:any) => updateC('chengzhang', Math.max(parseFloat(v)||0, 0))} colorClass="bg-gray-50 border-gray-100" step="0.001" max={1.3} />
              <StyledSelect label="成长上限" value={c.chengzhangMax} onChange={(e:any) => updateC('chengzhangMax', parseFloat(e.target.value))}>
                  {[1.184, 1.236, 1.266, 1.277, 1.287, 1.297, 1.3].map(v => <option key={v} value={v}>{v}</option>)}
              </StyledSelect>
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
                     <StyledSelect value={c.huwanAttr1} onChange={(e:any) => updateC('huwanAttr1', e.target.value)} className="w-24">
                       <option value="damage">伤害</option><option value="hp">气血</option><option value="magic">魔法</option><option value="lingli">灵力</option>
                       <option value="tizhi">体质</option><option value="fali">法力</option><option value="liliang">力量</option><option value="naili">耐力</option><option value="minjie">敏捷</option>
                     </StyledSelect>
                     <input type="number" value={c.huwanValue1 || ''} onChange={e => updateC('huwanValue1', Math.max(parseInt(e.target.value)||0, 0))} className="flex-1 bg-gray-50 rounded-lg px-3 text-sm font-bold outline-none" placeholder="数值" />
                  </div>
                  <div className="flex gap-2">
                     <StyledSelect value={c.huwanAttr2} onChange={(e:any) => updateC('huwanAttr2', e.target.value)} className="w-24">
                       <option value="damage">伤害</option><option value="hp">气血</option><option value="magic">魔法</option><option value="lingli">灵力</option>
                       <option value="tizhi">体质</option><option value="fali">法力</option><option value="liliang">力量</option><option value="naili">耐力</option><option value="minjie">敏捷</option>
                     </StyledSelect>
                     <input type="number" value={c.huwanValue2 || ''} onChange={e => updateC('huwanValue2', Math.max(parseInt(e.target.value)||0, 0))} className="flex-1 bg-gray-50 rounded-lg px-3 text-sm font-bold outline-none" placeholder="数值" />
                  </div>
                  <div className="flex gap-2 items-center pt-2">
                     <StyledSelect value={c.huwanStoneType} onChange={(e:any) => updateC('huwanStoneType', e.target.value)} className="w-32 bg-orange-50 text-orange-700">
                       <option value="damage">伤害灵石</option><option value="lingli">灵力灵石</option>
                     </StyledSelect>
                     <span className="text-xs font-bold text-gray-400">段数:</span>
                     <input type="number" value={c.huwanStoneLevel || ''} onChange={e => updateC('huwanStoneLevel', clamp(parseInt(e.target.value)||0, 0, 10))} className="w-16 bg-orange-50 text-orange-800 rounded-lg px-2 py-1 text-sm font-bold outline-none text-center" />
                  </div>
               </div>
             </div>

             {/* Collar */}
             <div className="mb-6 pb-6 border-b border-gray-100">
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">项圈 Collar (基础速度)</h4>
               <input type="number" value={c.xiangquanSpeed || ''} onChange={e => updateC('xiangquanSpeed', Math.max(parseInt(e.target.value)||0, 0))} className="w-full mb-3 bg-gray-100 rounded-lg px-3 py-2 text-sm font-bold outline-none" placeholder="基础速度" />
               <div className="space-y-3">
                  <div className="flex gap-2">
                     <StyledSelect value={c.xiangquanAttr1} onChange={(e:any) => updateC('xiangquanAttr1', e.target.value)} className="w-24">
                        <option value="damage">伤害</option><option value="hp">气血</option><option value="magic">魔法</option><option value="lingli">灵力</option>
                       <option value="tizhi">体质</option><option value="fali">法力</option><option value="liliang">力量</option><option value="naili">耐力</option><option value="minjie">敏捷</option>
                     </StyledSelect>
                     <input type="number" value={c.xiangquanValue1 || ''} onChange={e => updateC('xiangquanValue1', Math.max(parseInt(e.target.value)||0, 0))} className="flex-1 bg-gray-50 rounded-lg px-3 text-sm font-bold outline-none" placeholder="数值" />
                  </div>
                   <div className="flex gap-2 items-center pt-2">
                     <span className="bg-cyan-50 text-cyan-700 rounded-lg text-xs font-bold p-2">速度灵石</span>
                     <span className="text-xs font-bold text-gray-400">段数:</span>
                     <input type="number" value={c.xiangquanStoneLevel || ''} onChange={e => updateC('xiangquanStoneLevel', clamp(parseInt(e.target.value)||0, 0, 10))} className="w-16 bg-cyan-50 text-cyan-800 rounded-lg px-2 py-1 text-sm font-bold outline-none text-center" />
                  </div>
               </div>
             </div>

             {/* Armor */}
             <div>
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">铠甲 Armor (基础防御)</h4>
               <input type="number" value={c.kaijiaDefense || ''} onChange={e => updateC('kaijiaDefense', Math.max(parseInt(e.target.value)||0, 0))} className="w-full mb-3 bg-gray-100 rounded-lg px-3 py-2 text-sm font-bold outline-none" placeholder="基础防御" />
               <div className="space-y-3">
                  <div className="flex gap-2">
                     <StyledSelect value={c.kaijiaAttr1} onChange={(e:any) => updateC('kaijiaAttr1', e.target.value)} className="w-24">
                       <option value="damage">伤害</option><option value="hp">气血</option><option value="magic">魔法</option><option value="lingli">灵力</option>
                       <option value="tizhi">体质</option><option value="fali">法力</option><option value="liliang">力量</option><option value="naili">耐力</option><option value="minjie">敏捷</option>
                     </StyledSelect>
                     <input type="number" value={c.kaijiaValue1 || ''} onChange={e => updateC('kaijiaValue1', Math.max(parseInt(e.target.value)||0, 0))} className="flex-1 bg-gray-50 rounded-lg px-3 text-sm font-bold outline-none" placeholder="数值" />
                  </div>
                  <div className="flex gap-2 items-center pt-2">
                     <StyledSelect value={c.kaijiaStoneType} onChange={(e:any) => updateC('kaijiaStoneType', e.target.value)} className="w-32 bg-green-50 text-green-700">
                       <option value="hp">气血灵石</option><option value="defense">防御灵石</option>
                     </StyledSelect>
                     <span className="text-xs font-bold text-gray-400">段数:</span>
                     <input type="number" value={c.kaijiaStoneLevel || ''} onChange={e => updateC('kaijiaStoneLevel', clamp(parseInt(e.target.value)||0, 0, 10))} className="w-16 bg-green-50 text-green-800 rounded-lg px-2 py-1 text-sm font-bold outline-none text-center" />
                  </div>
               </div>
             </div>
          </CollapsibleSection>
          
          {/* 6. Neidan */}
          <CollapsibleSection title="内丹加成 Neidan" icon={Gem}>
             <div className="mb-4">
               <StatInput label="坐骑成长 (影响内丹)" value={c.zuoqi} onChange={(v:any) => updateC('zuoqi', Math.max(parseFloat(v)||0, 0))} colorClass="bg-purple-50 border-purple-100" step="0.01" max={2.4} />
             </div>
             <div className="grid grid-cols-2 gap-4 mb-4">
               <StatInput label="迅敏 (速度/伤害)" value={c.xunmin} onChange={(v:any) => updateC('xunmin', clamp(parseInt(v)||0, 0, 5))} colorClass="bg-gray-50 border-gray-100" max={5} />
               <StatInput label="静岳 (气血/灵力)" value={c.jingyue} onChange={(v:any) => updateC('jingyue', clamp(parseInt(v)||0, 0, 5))} colorClass="bg-gray-50 border-gray-100" max={5} />
               <StatInput label="矫健 (气血/速度)" value={c.jiaoji} onChange={(v:any) => updateC('jiaoji', clamp(parseInt(v)||0, 0, 5))} colorClass="bg-gray-50 border-gray-100" max={5} />
               <StatInput label="灵光 (法伤)" value={c.lingguang} onChange={(v:any) => updateC('lingguang', clamp(parseInt(v)||0, 0, 5))} colorClass="bg-gray-50 border-gray-100" max={5} />
             </div>
             <div className="p-3 bg-gray-50 rounded-xl">
               <label className="text-xs font-bold text-gray-500 block mb-2">高级内丹</label>
               <div className="flex gap-2">
                 <StyledSelect value={c.highNeidanType} onChange={(e:any) => updateC('highNeidanType', e.target.value)}>
                   <option value="none">无 / 其他</option>
                   <option value="xuanwu">玄武躯 (气血)</option>
                   <option value="longzhou">龙胄铠 (防御)</option>
                   <option value="zhuque">朱雀甲 (法防)</option>
                 </StyledSelect>
                 <input type="number" value={c.highNeidanLevel} onChange={e => updateC('highNeidanLevel', clamp(parseInt(e.target.value)||0, 0, 5))} className="w-16 bg-white border border-gray-200 rounded-lg p-2 text-sm font-bold text-center outline-none" max={5} />
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
              <StyledSelect 
                value={race} 
                onChange={(e:any) => setRace(e.target.value as RaceType)} 
                className="bg-indigo-50 text-indigo-700 border-indigo-100"
              >
                <option value="human">人族 (Str:0.67)</option>
                <option value="demon">魔族 (Str:0.77)</option>
                <option value="immortal">仙族 (Str:0.57)</option>
              </StyledSelect>
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
                <StyledSelect 
                  value={gemLevel} 
                  onChange={(e:any) => setGemLevel(parseInt(e.target.value))} 
                  className="bg-gray-100 border-none hover:bg-gray-200"
                >
                  {Array.from({length: 13}).map((_, i) => <option key={i} value={i}>{i} 级星辉石</option>)}
                </StyledSelect>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-3xl border-2 border-dashed border-gray-200 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">上排主属性</span>
                <StyledSelect 
                  value={mainAttr.type} 
                  onChange={(e:any) => setMainAttr({...mainAttr, type: e.target.value})} 
                  className="w-40 bg-white shadow-sm"
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
                </StyledSelect>
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
                      <StyledSelect 
                        value={attr.type} 
                        onChange={(e:any) => {
                          const newAttrs = [...subAttrs];
                          newAttrs[idx].type = e.target.value as SubAttrType;
                          setSubAttrs(newAttrs);
                        }} 
                        className="bg-gray-100 border-none w-32"
                      >
                        <option value="damage">伤害</option>
                        <option value="speed">速度</option>
                      </StyledSelect>
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

// --- App Component ---

const App = () => {
  const [currentTool, setCurrentTool] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const renderTool = () => {
    switch(currentTool) {
      case 'beast-sim': return <SummonedBeastSimTool />;
      case 'beast-equip': return <SummonedBeastEquipTool />;
      case 'spirit-calc': return <SpiritAccessoryTool />;
      case 'gem-calc': return <GemPriceTool />;
      default: return <Dashboard onSelectTool={setCurrentTool} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTool('dashboard')}>
              <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 hidden sm:block">
                梦幻高级工具箱
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-1">
              {['dashboard', 'beast-sim', 'beast-equip'].map(id => (
                <button
                  key={id}
                  onClick={() => setCurrentTool(id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 
                    ${currentTool === id 
                      ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 scale-105' 
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  {id === 'dashboard' ? '首页' : (id==='beast-sim'?'模拟器':'装备计算')}
                </button>
              ))}
            </div>

            <div className="md:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-100 shadow-xl animate-in slide-in-from-top-5">
            <div className="px-4 py-4 space-y-2">
              <button onClick={() => { setCurrentTool('dashboard'); setMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                <Home className="w-5 h-5"/> 首页
              </button>
              <button onClick={() => { setCurrentTool('beast-equip'); setMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                <Activity className="w-5 h-5"/> 装备计算器
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {renderTool()}
      </main>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);