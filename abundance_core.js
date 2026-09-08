(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AbundanceCore = api;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null), function () {
  'use strict';

  var CONFIG = {
    version: 1,
    modeId: 'steady',
    modes: {
      steady: {
        name: '循序丰盛',
        stages: ['foundation', 'opening', 'expansion', 'creation', 'freedom']
      }
    },
    stages: [
      { id: 'foundation', name: '初识选择', from: 1, to: 30, amount: 1000 },
      { id: 'opening', name: '打开可能', from: 31, to: 60, amount: 3000 },
      { id: 'expansion', name: '扩展生活', from: 61, to: 90, amount: 5000 },
      { id: 'creation', name: '支持创造', from: 91, to: 120, amount: 10000 },
      { id: 'freedom', name: '丰盛自由', from: 121, to: null, amount: 20000 }
    ]
  };

  function localDateKey(date) {
    var d = date || new Date();
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function stageForSequence(sequence, config) {
    var stages = (config || CONFIG).stages;
    return stages.find(function (stage) {
      return sequence >= stage.from && (stage.to == null || sequence <= stage.to);
    }) || stages[stages.length - 1];
  }

  function spentForPractice(practice) {
    return (practice && practice.items || []).reduce(function (sum, item) {
      return sum + Number(item.amount || 0);
    }, 0);
  }

  function canSeal(practice) {
    return !!practice && !practice.sealedAt && practice.items.length > 0 && spentForPractice(practice) === practice.amount;
  }

  function canUnlockNextPractice(state, today) {
    if (!state.current) return true;
    if (!state.current.sealedAt) return false;
    return state.current.unlockedDate < today;
  }

  function nextPractice(state, today, now) {
    if (!canUnlockNextPractice(state, today)) return state.current;
    var sequence = state.history.length + 1;
    var stage = stageForSequence(sequence);
    return {
      id: 'abundance_practice_' + now,
      sequence: sequence,
      modeId: state.modeId || CONFIG.modeId,
      stageId: stage.id,
      amount: stage.amount,
      unlockedDate: today,
      startedAt: now,
      items: [],
      sealedAt: null,
      sealedDate: null,
      closingLine: null
    };
  }

  return {
    CONFIG: CONFIG,
    localDateKey: localDateKey,
    stageForSequence: stageForSequence,
    spentForPractice: spentForPractice,
    canSeal: canSeal,
    canUnlockNextPractice: canUnlockNextPractice,
    nextPractice: nextPractice
  };
});
