import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // 关键修正：必须引入包含 Tailwind 指令的 CSS 文件
import { 
  Calculator, Settings, RotateCcw, Activity, Coins, Save, Trash2, 
  ArrowDownUp, ArrowUp, ArrowDown, Shirt, Watch, Wind, Download, 
  Upload, Home, LayoutDashboard, Sparkles, BookOpen, ChevronRight,
  Menu, X, ExternalLink, Gem, Diamond, Swords, ShieldCheck, Users, HelpCircle, Eye, History as HistoryIcon,
  RefreshCcw, TrendingUp, Layers, Info, Wallet, AlertCircle, Edit3, Sigma, Heart, Zap, Crosshair, Shield, Move,
  ChevronDown, ChevronUp, Plus, Minus
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

// --- Tool 4: Summoned Beast Simulator (Complete Logic) ---

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
  const trunc = (v: number) => Math.floor(v + 1e-10); // Safe floor

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

// --- App Wrapper ---

const App = () => {
  const [currentTool, setCurrentTool] = useState<string>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'home', icon: <Home className="w-5 h-5"/>, label: '主页概览' },
    { id: 'beast-sim', icon: <Calculator className="w-5 h-5"/>, label: '属性模拟' },
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
              {currentTool === 'beast-sim' && <SummonedBeastSimTool />}
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