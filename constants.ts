export const RACE_FACTORS = {
  human: { strToDmg: 0.67, agiToSpd: 0.7, endToDef: 1.5, label: '人族' },
  demon: { strToDmg: 0.77, agiToSpd: 0.7, endToDef: 1.4, label: '魔族' },
  immortal: { strToDmg: 0.57, agiToSpd: 0.7, endToDef: 1.6, label: '仙族' }
};

export const MAIN_ATTR_LABELS: Record<string, string> = {
  'damage': '伤害',
  'defense': '防御',
  'm-dmg': '法术伤害',
  'm-def': '法术防御'
};

// Extra requirements for Normal Gems (12-20)
export const NORMAL_EXTRAS: Record<number, number[]> = {
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
export const STARSHINE_EXTRAS: Record<number, number[]> = {
  9: [5],
  10: [6, 7],
  11: [9]
};

// Extra requirements for Soul Spirit Stones (8-10)
export const SOUL_EXTRAS: Record<number, number[]> = {
  8: [3],
  9: [6],
  10: [8]
};
