import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Calculator, Settings, RotateCcw, Shield, Sword, Heart, Activity, Calculator as CalcIcon, Coins, Save, Trash2, ArrowDownUp, ArrowUp, ArrowDown, Shirt, Watch, Wind, Zap } from 'lucide-react';

// Define types for saved items
type ItemType = 'armor' | 'accessory';

interface SavedItem {
  id: number;
  timestamp: number;
  growth: number;
  speedQual: number;
  stats: {
    damage: number;
    defense: number;
    hp: number;
    speed: number;
    str: number;
    end: number;
    con: number;
    agi: number;
  };
  price: number;
  totalPoints: number;
  pricePerPoint: number;
  type: ItemType;
}

// Move StatInput outside of App to prevent re-rendering issues (losing focus)
const StatInput = ({ 
  label, 
  value,
  onChange,
  colorClass,
  placeholder
}: { 
  label: string; 
  value: number; 
  onChange: (val: string) => void;
  colorClass: string;
  placeholder: string;
}) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
      {label}
    </label>
    <div className="relative">
      <input
        type="number"
        min="0"
        value={value === 0 ? '' : value} // Show empty string if 0 for better UX, or keep 0 if preferred. Using '' allows typing freely.
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-lg border-2 outline-none transition-all font-mono text-lg ${colorClass}`}
        onWheel={(e) => e.currentTarget.blur()} // Prevent scrolling changing numbers accidentally
      />
    </div>
  </div>
);

const App = () => {
  // Only growth affects the conversion of Dmg/Def/HP to attributes
  // Default growth updated to 1.297
  const [growth, setGrowth] = useState<number>(1.297);
  const [speedQual, setSpeedQual] = useState<number>(1400); // Default speed qualification
  const [price, setPrice] = useState<number>(0);
  
  // Focused stats state
  const [stats, setStats] = useState({
    damage: 0, // Base (Yellow)
    defense: 0, // Base (Yellow)
    hp: 0,    // Base (Yellow)
    speed: 0, // Base (Yellow)
    str: 0,   // Additional (Green)
    end: 0,   // Additional (Green)
    con: 0,   // Additional (Green)
    agi: 0    // Additional (Green)
  });

  const [results, setResults] = useState({
    strFromDmg: 0,
    endFromDef: 0,
    conFromHp: 0,
    agiFromSpeed: 0,
    totalPoints: 0,
    pricePerPoint: 0
  });

  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SavedItem | null;
    direction: 'asc' | 'desc';
  }>({ key: 'totalPoints', direction: 'desc' }); // Default sort by total points

  // Tab state for comparison
  const [activeTab, setActiveTab] = useState<ItemType>('armor');

  // Tooltip state
  const [hoveredItem, setHoveredItem] = useState<SavedItem | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Load saved items from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('summoned_beast_calc_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Backfill type and new stats for old items
        const migrated = parsed.map((item: any) => ({
          ...item,
          speedQual: item.speedQual || 1400,
          stats: {
            ...item.stats,
            speed: item.stats.speed || 0,
            agi: item.stats.agi || 0
          },
          type: item.type || (item.stats.defense > 0 ? 'armor' : 'accessory')
        }));
        setSavedItems(migrated);
      } catch (e) {
        console.error('Failed to parse saved items', e);
      }
    }
  }, []);

  // Save to localStorage whenever list changes
  useEffect(() => {
    localStorage.setItem('summoned_beast_calc_items', JSON.stringify(savedItems));
  }, [savedItems]);

  // Calculation Logic
  useEffect(() => {
    // 1. Strength Conversion
    // Formula: 1 Strength * Growth = 1.333 Damage (Approx)
    // Reverse: Equivalent Str = (Damage * 4/3) / Growth
    const strFromDmg = growth > 0 ? (stats.damage * (4/3)) / growth : 0;

    // 2. Endurance Conversion
    // Formula: 1 Endurance * Growth * 1.333 = 1 Defense
    // Reverse: Equivalent End = Defense / (Growth * 4/3)
    const endFromDef = growth > 0 ? stats.defense / (growth * (4/3)) : 0;

    // 3. Constitution Conversion
    // Formula: 1 Constitution * Growth * 6 = 1 HP
    // Reverse: Equivalent Con = HP / (Growth * 6)
    const conFromHp = growth > 0 ? stats.hp / (growth * 6) : 0;

    // 4. Agility Conversion
    // Formula: Speed = Agility * (Speed_Qual / 1000)
    // Reverse: Equivalent Agi = Speed / (Speed_Qual / 1000)
    const agiFromSpeed = speedQual > 0 ? stats.speed / (speedQual / 1000) : 0;

    const totalPoints = 
      (stats.str + strFromDmg) + 
      (stats.end + endFromDef) + 
      (stats.con + conFromHp) +
      (stats.agi + agiFromSpeed);

    const pricePerPoint = (price > 0 && totalPoints > 0) ? price / totalPoints : 0;

    setResults({
      strFromDmg,
      endFromDef,
      conFromHp,
      agiFromSpeed,
      totalPoints,
      pricePerPoint
    });
  }, [growth, speedQual, stats, price]);

  // Determine current item sub-type for display
  const getSubTypeLabel = (s: typeof stats) => {
    if (s.defense > 0) return { label: '铠甲 (Armor)', icon: <Shirt className="w-3 h-3" />, color: 'blue' };
    if (s.speed > 0) return { label: '项圈 (Collar)', icon: <Wind className="w-3 h-3" />, color: 'cyan' };
    return { label: '护腕 (Bracer)', icon: <Watch className="w-3 h-3" />, color: 'orange' };
  };

  const currentSubType = getSubTypeLabel(stats);

  // Memoized sorted items
  const sortedItems = useMemo(() => {
    // Filter by active tab first
    let filteredItems = savedItems.filter(item => item.type === activeTab);
    
    if (sortConfig.key !== null) {
      filteredItems.sort((a, b) => {
        // @ts-ignore
        const aValue = a[sortConfig.key];
        // @ts-ignore
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredItems;
  }, [savedItems, sortConfig, activeTab]);

  const requestSort = (key: keyof SavedItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    // Smart defaults for first click
    if (sortConfig.key !== key) {
        if (key === 'totalPoints') direction = 'desc'; // High points is better
        if (key === 'price') direction = 'asc'; // Low price is better
        if (key === 'pricePerPoint') direction = 'asc'; // Low cost per point is better
        if (key === 'timestamp') direction = 'desc'; // Newest is better
    } else {
        // Toggle if clicking same key
        if (sortConfig.direction === 'asc') {
            direction = 'desc';
        } else {
            direction = 'asc';
        }
    }
    
    setSortConfig({ key, direction });
  };

  const handleStatChange = (key: keyof typeof stats, value: string) => {
    // Allow empty string for clearing input
    if (value === '') {
      setStats(prev => ({ ...prev, [key]: 0 }));
      return;
    }
    const num = parseFloat(value);
    // Prevent negative numbers
    if (num < 0) return;
    setStats(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  const handlePriceChange = (value: string) => {
     if (value === '') {
      setPrice(0);
      return;
    }
    const num = parseFloat(value);
    if (num < 0) return;
    setPrice(isNaN(num) ? 0 : num);
  };

  const resetAll = () => {
    // Keep growth/speedQual as settings
    setPrice(0);
    setStats({
      damage: 0, defense: 0, hp: 0, speed: 0,
      str: 0, end: 0, con: 0, agi: 0
    });
  };

  const saveCurrentItem = () => {
    if (results.totalPoints <= 0) return;

    const type = stats.defense > 0 ? 'armor' : 'accessory';

    const newItem: SavedItem = {
      id: Date.now(),
      timestamp: Date.now(),
      growth,
      speedQual,
      stats: { ...stats },
      price,
      totalPoints: results.totalPoints,
      pricePerPoint: results.pricePerPoint,
      type
    };

    setSavedItems(prev => [newItem, ...prev]);
    // Switch tab to the type of the item just saved
    setActiveTab(type);
  };

  const deleteSavedItem = (id: number) => {
    setSavedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const offset = 15; // Distance from cursor
      
      let left = e.clientX + offset;
      let top = e.clientY + offset;

      // Viewport checks to prevent clipping
      const rect = tooltip.getBoundingClientRect();
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;

      // If tooltip goes off right edge, move to left of cursor
      if (left + rect.width > winWidth) {
        left = e.clientX - rect.width - offset;
      }

      // If tooltip goes off bottom edge, move above cursor
      if (top + rect.height > winHeight) {
        top = e.clientY - rect.height - offset;
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    }
  };

  // Helper to format date
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Helper component for Sortable Header
  const SortHeader = ({ label, sortKey, alignRight = false }: { label: string, sortKey: keyof SavedItem, alignRight?: boolean }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
      <th 
        className={`px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors select-none group ${alignRight ? 'text-right' : 'text-left'}`}
        onClick={() => requestSort(sortKey)}
      >
        <div className={`flex items-center gap-1 ${alignRight ? 'justify-end' : 'justify-start'}`}>
          {label}
          <div className="flex flex-col text-gray-400">
            {isSorted ? (
               sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
            ) : (
               <ArrowDownUp className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
            )}
          </div>
        </div>
      </th>
    );
  };

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
              <p className="text-sm text-gray-500">Summoned Beast Equipment Calculator</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={saveCurrentItem}
              disabled={results.totalPoints <= 0}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${results.totalPoints > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              <Save className="w-4 h-4" />
              保存记录
            </button>
            <button 
              onClick={resetAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Global Settings & Price */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <label className="text-sm font-medium text-gray-700">
                      召唤兽成长
                    </label>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={growth}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < 0) return;
                      setGrowth(isNaN(val) ? 0 : val);
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
                <div className="col-span-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="w-4 h-4 text-gray-400" />
                    <label className="text-sm font-medium text-gray-700">
                      速度资质 (Speed Q)
                    </label>
                  </div>
                  <input
                    type="number"
                    min="100"
                    value={speedQual}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < 0) return;
                      setSpeedQual(isNaN(val) ? 0 : val);
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>
              
              <div>
                 <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">
                    装备价格 (RMB)
                  </label>
                </div>
                <input
                  type="number"
                  min="0"
                  value={price === 0 ? '' : price}
                  placeholder="0"
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono"
                />
              </div>
            </section>

            {/* Equipment Inputs */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-8 relative">
              {/* Auto-detected Type Badge */}
               <div className="absolute top-6 right-6 pointer-events-none">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm transition-all 
                  ${currentSubType.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    currentSubType.color === 'cyan' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 
                    'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                  {currentSubType.icon}
                  {currentSubType.label}
                </div>
              </div>

              {/* Base Stats (Yellow in Game) */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-yellow-500 rounded-full"></div>
                  <h3 className="font-bold text-gray-800 text-lg">基础属性 (黄字)</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StatInput 
                    label="伤害 (Damage)" 
                    value={stats.damage}
                    onChange={(val) => handleStatChange('damage', val)}
                    colorClass="bg-yellow-50/50 border-yellow-100 focus:border-yellow-400 focus:ring-yellow-200 text-yellow-800"
                    placeholder="0"
                  />
                  <StatInput 
                    label="防御 (Defense)" 
                    value={stats.defense}
                    onChange={(val) => handleStatChange('defense', val)}
                    colorClass="bg-yellow-50/50 border-yellow-100 focus:border-yellow-400 focus:ring-yellow-200 text-yellow-800"
                    placeholder="0"
                  />
                  <StatInput 
                    label="气血 (HP)" 
                    value={stats.hp}
                    onChange={(val) => handleStatChange('hp', val)}
                    colorClass="bg-yellow-50/50 border-yellow-100 focus:border-yellow-400 focus:ring-yellow-200 text-yellow-800"
                    placeholder="0"
                  />
                  <StatInput 
                    label="速度 (Speed)" 
                    value={stats.speed}
                    onChange={(val) => handleStatChange('speed', val)}
                    colorClass="bg-yellow-50/50 border-yellow-100 focus:border-yellow-400 focus:ring-yellow-200 text-yellow-800"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Additional Stats (Green in Game) */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                  <h3 className="font-bold text-gray-800 text-lg">附加属性 (绿字)</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StatInput 
                    label="力量" 
                    value={stats.str}
                    onChange={(val) => handleStatChange('str', val)}
                    colorClass="bg-green-50/50 border-green-100 focus:border-green-400 focus:ring-green-200 text-green-800"
                    placeholder="0"
                  />
                  <StatInput 
                    label="耐力" 
                    value={stats.end}
                    onChange={(val) => handleStatChange('end', val)}
                    colorClass="bg-green-50/50 border-green-100 focus:border-green-400 focus:ring-green-200 text-green-800"
                    placeholder="0"
                  />
                  <StatInput 
                    label="体质" 
                    value={stats.con}
                    onChange={(val) => handleStatChange('con', val)}
                    colorClass="bg-green-50/50 border-green-100 focus:border-green-400 focus:ring-green-200 text-green-800"
                    placeholder="0"
                  />
                   <StatInput 
                    label="敏捷" 
                    value={stats.agi}
                    onChange={(val) => handleStatChange('agi', val)}
                    colorClass="bg-green-50/50 border-green-100 focus:border-green-400 focus:ring-green-200 text-green-800"
                    placeholder="0"
                  />
                </div>
              </div>

            </section>

          </div>

          {/* Right Column: Analysis */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <h2 className="text-indigo-100 font-medium text-lg mb-1">综合属性总值</h2>
                  <p className="text-indigo-200 text-sm opacity-80">Total Attribute Points</p>
                </div>
                <div className="text-right">
                  <div className="text-indigo-200 text-sm mb-1">性价比 (单点价格)</div>
                  <div className={`font-mono font-bold text-2xl ${results.pricePerPoint > 0 ? 'text-green-300' : 'text-white/50'}`}>
                    {results.pricePerPoint > 0 ? `¥${results.pricePerPoint.toFixed(2)}` : '--'}
                    <span className="text-sm font-normal text-indigo-200 ml-1">/点</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex items-baseline gap-3 relative z-10">
                <span className="text-7xl font-bold tracking-tight">
                  {results.totalPoints.toFixed(2)}
                </span>
                <span className="text-2xl text-indigo-200 font-medium">点</span>
              </div>
              
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-6 relative z-10">
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
                <div>
                  <div className="text-indigo-200 text-xs uppercase tracking-wider mb-1">敏捷系贡献</div>
                  <div className="text-2xl font-bold">{(stats.agi + results.agiFromSpeed).toFixed(1)}</div>
                </div>
              </div>
            </div>

            {/* Formula Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                 <div className="flex items-center justify-between cursor-pointer group">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                    <Calculator className="w-4 h-4 text-gray-500" />
                    当前计算详情
                  </h3>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                
                {/* Str Breakdown */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="font-bold text-gray-700 text-sm">力量</span>
                    <span className="ml-auto font-mono font-bold text-gray-800">
                      {(stats.str + results.strFromDmg).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    基{stats.str} + 换{(results.strFromDmg).toFixed(1)}
                  </div>
                </div>

                {/* End Breakdown */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="font-bold text-gray-700 text-sm">耐力</span>
                    <span className="ml-auto font-mono font-bold text-gray-800">
                      {(stats.end + results.endFromDef).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    基{stats.end} + 换{(results.endFromDef).toFixed(1)}
                  </div>
                </div>

                {/* Con Breakdown */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="font-bold text-gray-700 text-sm">体质</span>
                    <span className="ml-auto font-mono font-bold text-gray-800">
                      {(stats.con + results.conFromHp).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    基{stats.con} + 换{(results.conFromHp).toFixed(1)}
                  </div>
                </div>

                 {/* Agi Breakdown */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    <span className="font-bold text-gray-700 text-sm">敏捷</span>
                    <span className="ml-auto font-mono font-bold text-gray-800">
                      {(stats.agi + results.agiFromSpeed).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    基{stats.agi} + 换{(results.agiFromSpeed).toFixed(1)}
                  </div>
                </div>

              </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
               {/* Table Header with Tabs */}
               <div className="border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between p-4 pb-0">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <ArrowDownUp className="w-5 h-5 text-gray-500" />
                    性价比对比
                  </h3>
                  
                  {/* Category Tabs */}
                  <div className="flex bg-gray-200/50 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab('armor')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'armor' 
                          ? 'bg-white text-indigo-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Shirt className="w-4 h-4" />
                      铠甲
                    </button>
                    <button
                      onClick={() => setActiveTab('accessory')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'accessory' 
                          ? 'bg-white text-indigo-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Watch className="w-4 h-4" />
                      护腕 / 项圈
                    </button>
                  </div>
                </div>
                
                <div className="px-6 py-2 text-xs text-gray-400 bg-gray-50/30">
                  {activeTab === 'armor' 
                    ? '显示所有包含防御属性的铠甲记录' 
                    : '显示所有护腕和项圈记录 (无防御属性)'}
                </div>
              </div>

              {sortedItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 font-medium">成长</th>
                        <SortHeader label="总属性" sortKey="totalPoints" />
                        <SortHeader label="价格" sortKey="price" />
                        <SortHeader label="单价/点" sortKey="pricePerPoint" />
                        <SortHeader label="时间" sortKey="timestamp" />
                        <th className="px-6 py-3 font-medium text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedItems.map((item) => (
                        <tr 
                          key={item.id} 
                          className="hover:bg-gray-50 transition-colors cursor-help group"
                          onMouseEnter={() => setHoveredItem(item)}
                          onMouseLeave={() => setHoveredItem(null)}
                          onMouseMove={handleMouseMove}
                        >
                          <td className="px-6 py-4 font-mono">{item.growth}</td>
                          <td className="px-6 py-4 font-bold text-indigo-700">{item.totalPoints.toFixed(2)}</td>
                          <td className="px-6 py-4 font-mono">¥{item.price}</td>
                          <td className="px-6 py-4">
                            {item.pricePerPoint > 0 ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md font-bold font-mono text-xs">
                                ¥{item.pricePerPoint.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400">--</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                            {formatDate(item.timestamp)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSavedItem(item.id);
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="bg-gray-100 p-4 rounded-full mb-3">
                    {activeTab === 'armor' ? <Shirt className="w-6 h-6" /> : <Watch className="w-6 h-6" />}
                  </div>
                  <p>暂无{activeTab === 'armor' ? '铠甲' : '护腕/项圈'}记录</p>
                  <p className="text-xs mt-1">
                    {activeTab === 'armor' ? '输入防御属性 > 0 后保存' : '输入防御属性 = 0 后保存'}
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
      
      {/* Tooltip Portal / Fixed Overlay */}
      {hoveredItem && (
        <div 
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none transition-opacity duration-200"
          style={{ 
            left: 0, 
            top: 0,
            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))'
          }}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-gray-100 p-4 w-64 text-sm shadow-xl ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                hoveredItem.type === 'armor' ? 'text-blue-600' : 
                (hoveredItem.stats.speed > 0 && hoveredItem.stats.defense === 0) ? 'text-cyan-600' : 'text-orange-600'
              }`}>
                {hoveredItem.type === 'armor' ? '铠甲' : 
                 (hoveredItem.stats.speed > 0 ? '项圈' : '护腕/项圈')}
              </span>
              <div className="text-right">
                <div className="text-xs text-gray-400 font-mono">成长: {hoveredItem.growth}</div>
                <div className="text-[10px] text-gray-300 font-mono">速资: {hoveredItem.speedQual || 1400}</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-xs text-gray-400 mb-1">基础属性 (黄字)</div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div className="bg-yellow-50 rounded p-1">
                    <div className="text-[9px] text-yellow-600/70">伤害</div>
                    <div className="font-mono font-bold text-yellow-700 text-xs">{hoveredItem.stats.damage || '-'}</div>
                  </div>
                  <div className="bg-yellow-50 rounded p-1">
                    <div className="text-[9px] text-yellow-600/70">防御</div>
                    <div className="font-mono font-bold text-yellow-700 text-xs">{hoveredItem.stats.defense || '-'}</div>
                  </div>
                  <div className="bg-yellow-50 rounded p-1">
                    <div className="text-[9px] text-yellow-600/70">气血</div>
                    <div className="font-mono font-bold text-yellow-700 text-xs">{hoveredItem.stats.hp || '-'}</div>
                  </div>
                   <div className="bg-yellow-50 rounded p-1">
                    <div className="text-[9px] text-yellow-600/70">速度</div>
                    <div className="font-mono font-bold text-yellow-700 text-xs">{hoveredItem.stats.speed || '-'}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-gray-400 mb-1">附加属性 (绿字)</div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div className="bg-green-50 rounded p-1">
                    <div className="text-[9px] text-green-600/70">力量</div>
                    <div className="font-mono font-bold text-green-700 text-xs">{hoveredItem.stats.str || '-'}</div>
                  </div>
                  <div className="bg-green-50 rounded p-1">
                    <div className="text-[9px] text-green-600/70">耐力</div>
                    <div className="font-mono font-bold text-green-700 text-xs">{hoveredItem.stats.end || '-'}</div>
                  </div>
                  <div className="bg-green-50 rounded p-1">
                    <div className="text-[9px] text-green-600/70">体质</div>
                    <div className="font-mono font-bold text-green-700 text-xs">{hoveredItem.stats.con || '-'}</div>
                  </div>
                  <div className="bg-green-50 rounded p-1">
                    <div className="text-[9px] text-green-600/70">敏捷</div>
                    <div className="font-mono font-bold text-green-700 text-xs">{hoveredItem.stats.agi || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);