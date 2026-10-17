/* ================================================================
   state.js —— 这个 App 的账本
   ----------------------------------------------------------------
   index.html（地图）和 lesson.html（答题）是两个页面，
   两边都要读写心 / 宝石 / 连胜 / 经验。

   账本只能有一本。各写一份，迟早对不上。
   所以抽到这里，两个页面都用 <script src="state.js"> 引进来。

   存下来的东西：
     duo.done     已通关到第几关（0 = 一关没通）
     duo.hearts   现在几颗心（0 ~ 5）
     duo.heartAt  上一颗心开始计时的时间戳（用来算回血）
     duo.gems     宝石
     duo.xp       总经验
     duo.streak   连胜天数
     duo.lastDay  最后一次过关是哪天
     duo.freeze   连胜冻结，还有几张
     duo.boostAt  双倍经验到期的时间戳（0 = 没有）
     duo.cleared  拿过首通奖励的关卡号，逗号分隔
   ================================================================ */

var STATE = (function(){

  /* ===== 平衡数值：全在这一个块里，调平衡只改这里 ===== */
  var HEART_MAX   = 5;      /* 心最多 5 颗 */
  var HEART_MIN   = 5;      /* 每 5 分钟回 1 颗 */
  var FREEZE_MAX  = 2;      /* 连胜冻结最多存 2 张 */

  var GEM_START   = 200;    /* 新玩家起步宝石 */
  var GEM_PASS    = 20;     /* 过关 */
  var GEM_PERFECT = 20;     /* 全对再加 */
  var GEM_FIRST   = 50;     /* 第一次通这一关，再加 */

  /* 物价对齐多邻国：补心 500 / 冻结 200 / 双倍 100 */
  var PRICE = { heart: 500, freeze: 200, boost: 100 };

  var BOOST_MIN   = 15;     /* 双倍经验持续 15 分钟 */
  var XP_PER_Q    = 10;     /* 每答对一题的经验 */
  var REVIEW_XP   = 40;     /* 快速复习一趟的定数。
                               多邻国就是这个数 —— 复习不按答对多少算，
                               否则反复刷一关会比学新课更划算。 */
  var ADV_XP      = 80;     /* 进阶练的定数。要求全对，所以给得比复习多一倍 */


  /* ===== 读写。localStorage 在某些环境下会抛异常，全包起来 ===== */
  function get(k, d){
    try {
      var v = localStorage.getItem(k);
      return (v === null || v === '') ? d : v;
    } catch(e){ return d; }
  }
  function set(k, v){
    try { localStorage.setItem(k, String(v)); } catch(e){}
  }
  function num(k, d){
    var n = parseInt(get(k, ''), 10);
    return isNaN(n) ? d : n;
  }


  /* ===== 日期 ===== */
  function dayStr(ts){
    var d = new Date(ts);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function today(){ return dayStr(Date.now()); }
  function yesterday(){ return dayStr(Date.now() - 86400000); }


  /* ===== 心 =====
     回血是「算出来的」，不是「定时器跳出来的」——
     手机后台会杀定时器，但时间不会停。所以每次读的时候现算。 */
  function hearts(){
    var h = num('duo.hearts', HEART_MAX);
    if (h >= HEART_MAX) return HEART_MAX;

    var ms = HEART_MIN * 60000;
    var at = num('duo.heartAt', 0) || Date.now();
    var gained = Math.floor((Date.now() - at) / ms);

    if (gained > 0){
      h = Math.min(HEART_MAX, h + gained);
      at = (h >= HEART_MAX) ? 0 : (at + gained * ms);
      set('duo.hearts', h);
      set('duo.heartAt', at);
    }
    return h;
  }

  /* 距下一颗心还有多久（毫秒）。满了返回 0 */
  function nextHeartIn(){
    if (hearts() >= HEART_MAX) return 0;
    var ms = HEART_MIN * 60000;
    var at = num('duo.heartAt', 0) || Date.now();
    var left = ms - (Date.now() - at);
    return left < 0 ? 0 : left;
  }

  /* 答错扣一颗，返回扣完还剩几颗 */
  function loseHeart(){
    /* 设置里开了「无限爱心」就不扣 */
    if (opt('noheart')) return hearts();
    var h = hearts();
    if (h <= 0) return 0;
    /* 从「满」掉下来的那一刻才开始计时 —— 满着的时候不算在回血 */
    if (h >= HEART_MAX) set('duo.heartAt', Date.now());
    h = h - 1;
    set('duo.hearts', h);
    return h;
  }

  function fillHearts(){
    set('duo.hearts', HEART_MAX);
    set('duo.heartAt', 0);
  }


  /* ===== 宝石 ===== */
  function gems(){ return num('duo.gems', GEM_START); }
  function addGems(n){ set('duo.gems', gems() + n); }


  /* ===== 经验 + 双倍 ===== */
  function boostLeft(){
    var t = num('duo.boostAt', 0) - Date.now();
    return t > 0 ? t : 0;
  }
  function addXp(n){
    var got = boostLeft() > 0 ? n * 2 : n;
    set('duo.xp', num('duo.xp', 0) + got);
    return got;
  }


  /* ===== 连胜 ===== */
  /* 开 App 跑一次：连胜断没断，冻结要不要烧。
     一张冻结只顶一天 —— 缺几天就得烧几张，烧不起就断。 */
  function tickStreak(){
    if (!opt('streak')) return;
    var last = get('duo.lastDay', '');
    if (!last) return;
    if (last === today() || last === yesterday()) return;

    /* 数一数缺了几天：从昨天往回走，走到 last 为止 */
    var d = Date.now() - 86400000;
    var need = 0;
    while (need < 30 && dayStr(d) !== last){
      need++;
      d -= 86400000;
    }

    if (need > 0 && need <= num('duo.freeze', 0)){
      set('duo.freeze', num('duo.freeze', 0) - need);
      /* 缺的那几天都算冻住了。把 last 挪到昨天，今天学了就能接上 */
      set('duo.lastDay', yesterday());
    } else {
      set('duo.streak', 0);
    }
  }

  /* 过关时跑一次：连胜加一 */
  function earnStreak(){
    if (!opt('streak')) return 0;
    var last = get('duo.lastDay', '');
    if (last === today()) return num('duo.streak', 0);
    var s = (last === yesterday()) ? num('duo.streak', 0) + 1 : 1;
    set('duo.streak', s);
    set('duo.lastDay', today());
    return s;
  }

  /* 今天学过没有。跟连胜无关 ——
     就算在设置里把连胜关了，学习天数照样要记 */
  function touchDay(){
    if (get('duo.dayMark', '') === today()) return;
    set('duo.dayMark', today());
    set('duo.days', num('duo.days', 0) + 1);
  }

  function streak(){ return num('duo.streak', 0); }
  function freeze(){ return num('duo.freeze', 0); }


  /* 快速复习：一关已经通过了，回来再打一遍。
     和 finishLevel 的区别只有一条 —— 不推进度。
     但它照样算「今天学过」，照样给经验，也照样帮每日任务的答对题数。
     duo.done 一个字都不碰，所以复习一百遍也不会解锁下一关。 */
  function finishReview(nodeN, pass, rightCount){
    var r = { ok: pass, gems: 0, xp: 0, ach: [], streak: 0, first: false };
    if (!pass) return r;
    /* 同上 —— 没通过的关没有「复习」这回事 */
    if (nodeN >= num(ck('duo.done'), 0)) return r;

    r.xp = addXp(REVIEW_XP);
    set('duo.right', num('duo.right', 0) + rightCount);
    touchDay();

    rollQuests();
    set('duo.q.xp',    num('duo.q.xp', 0)    + r.xp);
    set('duo.q.right', num('duo.q.right', 0) + rightCount);

    r.streak = earnStreak();
    if (r.streak > num('duo.bestStreak', 0)) set('duo.bestStreak', r.streak);
    r.ach = checkAch();
    return r;
  }


  /* ===== 进阶练 =====
     一关通过之后，这一关还有两级可以回头做：
       ① 进阶练 —— 同一批题，但要全对。
       ② 复习   —— 全对之后才开。
     顺序是死的：没拿下进阶练，就不该有「复习」这个选项 ——
     多邻国那个金色图标也是这么一层层点亮的。
     进阶练的记录单独存（duo.adv），和 duo.done 是两回事：
     进度只认 done，练得再狠也不会把地图往前推一格。 */
  function advList(){
    return get(ck('duo.adv'), '').split(',').filter(Boolean);
  }
  function isAdv(n){
    return advList().indexOf(String(n)) >= 0;
  }
  function advCount(){ return advList().length; }

  function finishAdvanced(nodeN, pass, rightCount){
    var r = { ok: pass, gems: 0, xp: 0, ach: [], streak: 0, first: false };
    if (!pass) return r;
    /* 只能练已经通过的关。不拦这一下，
       手打 ?n=99&a=1 就能凭空拿一条进阶记录 */
    if (nodeN >= num(ck('duo.done'), 0)) return r;

    var list = advList(), key = String(nodeN);
    if (list.indexOf(key) < 0){
      list.push(key);
      set(ck('duo.adv'), list.join(','));
      r.first = true;
    }

    r.xp = addXp(ADV_XP);
    set('duo.right', num('duo.right', 0) + rightCount);
    touchDay();

    rollQuests();
    set('duo.q.xp',    num('duo.q.xp', 0)    + r.xp);
    set('duo.q.right', num('duo.q.right', 0) + rightCount);

    r.streak = earnStreak();
    if (r.streak > num('duo.bestStreak', 0)) set('duo.bestStreak', r.streak);
    r.ach = checkAch();
    return r;
  }


  /* ===== 课程 =====
     进度是按课程分开记的 —— 不然切到 Python，会看到 JavaScript 的进度。
     只有一门课的时候这一层是透明的：键名多一个后缀，其余一切照旧。 */
  function courseId(){ return get('duo.course', 'js'); }
  function setCourseId(id){ set('duo.course', id); }
  /* 把键按课程分开 */
  function ck(k){ return k + '.' + courseId(); }


  /* ===== 调试口子 =====
     只给两个地方用：地图上长按火焰（进度 +1）、答题页那个 ⚡（直接结算）。
     它们不参与任何结算、不发奖励 —— 只管把进度摆到你想要的位置，
     好让你一次就走到要看的那个界面。 */
  function debugSetDone(v){
    set(ck('duo.done'), Math.max(0, v));
    return num(ck('duo.done'), 0);
  }
  function debugClearAdv(){ set(ck('duo.adv'), ''); }


  /* ===== 结算 =====
     过没过由调用方判（那边才知道答对几道）。
     这里只管钱和进度，并把「这一把赚了什么」还回去。 */
  function finishLevel(nodeN, pass, perfect, rightCount, wrongCount){
    var r = { ok: pass, gems: 0, xp: 0, ach: [], streak: 0, first: false };
    if (!pass) return r;

    /* 首通：这一关以前没拿过奖励 */
    var list = get(ck('duo.cleared'), '').split(',').filter(Boolean);
    var key = String(nodeN);
    if (list.indexOf(key) < 0){
      list.push(key);
      set(ck('duo.cleared'), list.join(','));
      r.first = true;
    }

    /* 先把各种计数器推上去 —— 成就是照这些数算的，得走在前头 */
    r.xp = addXp(rightCount * XP_PER_Q);
    set('duo.right',   num('duo.right', 0)   + rightCount);
    set('duo.wrongs',  num('duo.wrongs', 0)  + (wrongCount || 0));
    set('duo.lessons', num('duo.lessons', 0) + 1);
    if (perfect) set('duo.perfect', num('duo.perfect', 0) + 1);
    touchDay();

    /* 记进度。用 max —— 重复通同一关，进度不会虚涨 */
    if (nodeN + 1 > num(ck('duo.done'), 0)) set(ck('duo.done'), nodeN + 1);

    r.streak = earnStreak();
    if (r.streak > num('duo.bestStreak', 0)) set('duo.bestStreak', r.streak);

    /* 这一把的关卡收入。单独记一笔 ——
       成就里那条「钻石大亨」看的是这个，不是手里的余额 */
    var earn = GEM_PASS
             + (perfect ? GEM_PERFECT : 0)
             + (r.first ? GEM_FIRST : 0);
    set('duo.gemEarn', num('duo.gemEarn', 0) + earn);

    /* 每日任务进度。先 roll 一遍 —— 跨天了就在这里清零 */
    rollQuests();
    set('duo.q.xp',      num('duo.q.xp', 0)      + r.xp);
    set('duo.q.right',   num('duo.q.right', 0)   + rightCount);
    set('duo.q.lessons', num('duo.q.lessons', 0) + 1);
    if (perfect) set('duo.q.perfect', num('duo.q.perfect', 0) + 1);

    /* 最后才查成就 —— 前面几个数刚动过，现在查才是最新的 */
    r.ach = checkAch();
    r.gems = earn + r.ach.reduce(function(s, a){ return s + a.gems; }, 0);
    addGems(r.gems);

    return r;
  }


  /* ===== 商店 ===== */
  function buy(what){
    var price = PRICE[what];
    if (price === undefined) return { ok:false, msg:'没这件东西' };

    /* 买了用不上的先挡掉，别让人白花钱 */
    if (what === 'heart'  && hearts() >= HEART_MAX) return { ok:false, msg:'心是满的' };
    if (what === 'boost'  && boostLeft() > 0)       return { ok:false, msg:'双倍还在走' };
    if (what === 'freeze' && freeze() >= FREEZE_MAX) return { ok:false, msg:'最多存 2 张' };

    if (gems() < price) return { ok:false, msg:'宝石不够' };

    set('duo.gems', gems() - price);
    if (what === 'heart')  fillHearts();
    if (what === 'freeze') set('duo.freeze', freeze() + 1);
    if (what === 'boost')  set('duo.boostAt', Date.now() + BOOST_MIN * 60000);
    return { ok:true, msg:'' };
  }


  /* ===== 设置 =====
     存的是 '1' / '0'。没存过就用默认值。
     无限爱心默认关（心机制本来就是要的），其余默认开。 */
  var OPT_DEF = { noheart: false, streak: true, sfx: true, vib: true };

  function opt(k){
    var v = get('duo.opt.' + k, '');
    if (v === '') return !!OPT_DEF[k];
    return v === '1';
  }
  function setOpt(k, on){ set('duo.opt.' + k, on ? '1' : '0'); }


  /* ===== 成就 =====
     每一条是一串台阶，阈值从小到大。
     当前值是「已经跨过几级」，每跨一级给一次宝石。

     为什么要有这个：关卡一共只有 11 关，
     打完就没得赚了。成就才是长期的零钱。 */
  /* 跨级奖励：第 1 级 20，每深一级多 20。
     原来是一律 20 —— 跟跨了几级、是哪一条都没关系，
     成绩单上排出一列「+20」，看着就像六条成就的条件一模一样。 */
  function achReward(i){ return 20 * (i + 1); }

  /* unit：门槛在数什么。缺了它，成绩单上排出来就是「经验健将 +20 / 传奇学霸 +20」，
     六条长得一模一样 —— 条件其实各不相同（50 经验 / 1 关 / 1 次满分 / 1 天…） */
  var ACH = [
    { id:'xp',      name:'经验健将', ico:'star',      color:'#ffc800', unit:'经验',
      val: function(){ return num('duo.xp', 0); },
      tiers: [50, 200, 500, 1200, 2500, 5000, 10000, 20000] },

    { id:'lv',      name:'传奇学霸', ico:'crown',     color:'#ce82ff', unit:'关',
      val: function(){ return num('duo.done', 0); },
      tiers: [1, 2, 3, 5, 8, 11] },

    { id:'perfect', name:'百发百中', ico:'compass',   color:'#1cb0f6', unit:'次满分',
      val: function(){ return num('duo.perfect', 0); },
      tiers: [1, 2, 4, 8, 15] },

    { id:'streak',  name:'连胜达人', ico:'fire',      color:'#ff9600', unit:'天连胜',
      val: function(){ return num('duo.bestStreak', 0); },
      tiers: [3, 7, 14, 30, 60, 100] },

    { id:'days',    name:'勤学不辍', ico:'clock',     color:'#22e0d6', unit:'天',
      val: function(){ return num('duo.days', 0); },
      tiers: [1, 3, 7, 14, 30, 60] },

    { id:'right',   name:'答题机器', ico:'lightning', color:'#ffc800', unit:'题',
      val: function(){ return num('duo.right', 0); },
      tiers: [10, 30, 60, 120, 250, 500] },

    { id:'lessons', name:'闯关达人', ico:'chest',     color:'#ff9600', unit:'次',
      val: function(){ return num('duo.lessons', 0); },
      tiers: [1, 3, 8, 15, 30, 60] },

    { id:'forging', name:'百炼成钢', ico:'heart',     color:'#ff4b4b', unit:'次答错',
      val: function(){ return num('duo.wrongs', 0); },
      tiers: [5, 20, 50, 120, 250] },

    { id:'gems',    name:'钻石大亨', ico:'diamond',   color:'#1cb0f6', unit:'宝石',
      val: function(){ return num('duo.gemEarn', 0); },
      tiers: [100, 300, 600, 1200, 2500, 5000] }
  ];

  /* 现在跨过了几级 */
  function tierOf(a){
    var v = a.val(), t = 0;
    for (var i = 0; i < a.tiers.length; i++) if (v >= a.tiers[i]) t = i + 1;
    return t;
  }

  /* 把新跨过的级记下来，返回这一把新解锁的。
     这里不发宝石 —— 由结算统一加，好让成绩单上的数字是一个整的 */
  function checkAch(){
    var got = get('duo.ach', '').split(',').filter(Boolean);
    var seen = {};
    got.forEach(function(k){ seen[k] = 1; });

    var fresh = [];
    ACH.forEach(function(a){
      var t = tierOf(a);
      for (var i = 0; i < t; i++){
        var key = a.id + ':' + i;
        if (seen[key]) continue;
        seen[key] = 1;
        got.push(key);
        fresh.push({ name: a.name, ico: a.ico, color: a.color,
                     need: a.tiers[i], unit: a.unit, gems: achReward(i) });
      }
    });
    if (fresh.length) set('duo.ach', got.join(','));
    return fresh;
  }

  /* 给成就墙用：每一条的当前状态 */
  function achList(){
    return ACH.map(function(a){
      var t = tierOf(a);
      return {
        id: a.id, name: a.name, ico: a.ico, color: a.color, unit: a.unit,
        tier: t, total: a.tiers.length,
        next: t < a.tiers.length ? a.tiers[t] : null,
        unlocked: t > 0
      };
    });
  }

  /* 一共拿到几级 ——「我的」页那行小字用 */
  function achCount(){
    return get('duo.ach', '').split(',').filter(Boolean).length;
  }

  function achTotal(){
    var n = 0;
    ACH.forEach(function(a){ n += a.tiers.length; });
    return n;
  }


  /* ===== 每日任务 =====
     补的是经济循环缺的那一半。

     我当初抄多邻国的定价（补心 500 / 冻结 200 / 双倍 100），
     但只抄了「过关给宝石」。多邻国的宝石主要其实来自任务 ——
     少抄这一半，价格就显得离谱。

     所以这三个任务不是「额外功能」，是账本身没记全。 */
  var QUEST_REWARD = 25;   /* 单个任务 */
  var QUEST_BONUS  = 50;   /* 三个全清，额外 */

  var QUESTS = [
    { id:'xp',      name:'今日经验', goal: 200, ico:'star',
      get: function(){ return num('duo.q.xp', 0); } },
    { id:'right',   name:'今日答对', goal: 30,  ico:'lightning',
      get: function(){ return num('duo.q.right', 0); } },
    { id:'lessons', name:'今日过关', goal: 3,   ico:'chest',
      get: function(){ return num('duo.q.lessons', 0); } },
    { id:'perfect', name:'今日满分', goal: 2,   ico:'compass',
      get: function(){ return num('duo.q.perfect', 0); } }
  ];

  /* 跨天了就把今日进度清零。
     每次读任务、每次结算都先跑一遍 —— 不用定时器，
     因为定时器会被系统杀掉，日期不会。 */
  function rollQuests(){
    if (get('duo.q.day', '') === today()) return;
    set('duo.q.day', today());
    set('duo.q.xp', 0);
    set('duo.q.right', 0);
    set('duo.q.lessons', 0);
    set('duo.q.perfect', 0);
    set('duo.q.done', '');
    set('duo.q.bonus', '0');
  }

  /* 按日期选三个。同一天永远选出同一组 ——
     不然刷新一次任务就换一批，进度对不上 */
  function pickQuests(){
    /* 日期只认一个来源 —— 和 today() 用同一个。
       各写一份 new Date() 的话，打桩测试时两边会对不上 */
    var seed = parseInt(today().replace(/-/g, ''), 10) || 1;
    var pool = QUESTS.slice(), out = [];
    for (var i = 0; i < 3 && pool.length; i++){
      seed = (seed * 9301 + 49297) % 233280;
      out.push(pool.splice(seed % pool.length, 1)[0]);
    }
    return out;
  }

  /* 今天的任务清单（带进度和领取状态） */
  function questList(){
    rollQuests();
    var done = get('duo.q.done', '').split(',').filter(Boolean);
    var picked = pickQuests();

    var list = picked.map(function(q){
      var v = Math.min(q.get(), q.goal);
      return {
        id: q.id, name: q.name, ico: q.ico,
        goal: q.goal, value: v,
        full: v >= q.goal,
        done: done.indexOf(q.id) >= 0,
        reward: QUEST_REWARD
      };
    });

    var allDone = picked.every(function(q){ return done.indexOf(q.id) >= 0; });
    return {
      list: list,
      bonus: QUEST_BONUS,
      bonusReady: allDone && get('duo.q.bonus', '0') !== '1',
      bonusDone: get('duo.q.bonus', '0') === '1',
      doneCount: list.filter(function(x){ return x.done; }).length,
      /* 有几个已经做完了但还没领 —— 「我的」那个 tab 上的红点看它 */
      claimable: list.filter(function(x){ return x.full && !x.done; }).length
    };
  }

  /* 领一个任务的奖励。第三个领掉的时候，额外那份一并给 */
  function claimQuest(id){
    rollQuests();
    var done = get('duo.q.done', '').split(',').filter(Boolean);
    if (done.indexOf(id) >= 0) return { ok: false, msg: '已经领过了' };

    var q = null, picked = pickQuests();
    picked.forEach(function(x){ if (x.id === id) q = x; });
    if (!q) return { ok: false, msg: '今天没有这个任务' };
    if (q.get() < q.goal) return { ok: false, msg: '还没做完' };

    done.push(id);
    set('duo.q.done', done.join(','));
    addGems(QUEST_REWARD);

    var bonus = false;
    var all = picked.every(function(x){ return done.indexOf(x.id) >= 0; });
    if (all && get('duo.q.bonus', '0') !== '1'){
      set('duo.q.bonus', '1');
      addGems(QUEST_BONUS);
      bonus = true;
    }

    return { ok: true, gems: QUEST_REWARD + (bonus ? QUEST_BONUS : 0), bonus: bonus };
  }


  /* ===== 开 App 跑一次 ===== */
  (function init(){
    if (get('duo.gems', '') === '') set('duo.gems', GEM_START);
    if (get('duo.hearts', '') === '') fillHearts();

    /* 老账本只有一本 duo.done ——
       现在是按课程分开的，把它整个搬到 js 名下，别让人一升级进度就没了 */
    if (get('duo.done', '') !== '' && get('duo.done.js', '') === ''){
      set('duo.done.js', get('duo.done'));
      if (get('duo.adv', '')     !== '') set('duo.adv.js',     get('duo.adv'));
      if (get('duo.cleared', '') !== '') set('duo.cleared.js', get('duo.cleared'));
    }

    tickStreak();
  })();


  /* ===== 对外 ===== */
  return {
    /* 课程：进度按课程分开，这两个是那把钥匙 */
    courseId:    courseId,
    setCourseId: setCourseId,

    hearts:     hearts,
    loseHeart:  loseHeart,
    fillHearts: fillHearts,
    nextHeartIn: nextHeartIn,

    gems:     gems,
    addGems:  addGems,
    xp:       function(){ return num('duo.xp', 0); },
    boostLeft: boostLeft,

    streak: streak,
    freeze: freeze,
    done:   function(){ return num(ck('duo.done'), 0); },
    /* 别的课通了几关 —— 换课页要显示，但不能把当前课程换掉去读 */
    doneOf: function(id){ return num('duo.done.' + id, 0); },

    finishLevel: finishLevel,
    finishReview: finishReview,
    REVIEW_XP: REVIEW_XP,

    /* 进阶练 */
    finishAdvanced: finishAdvanced,
    isAdv: isAdv,
    advCount: advCount,
    ADV_XP: ADV_XP,

    /* 调试 */
    debugSetDone: debugSetDone,
    debugClearAdv: debugClearAdv,

    buy: buy,

    /* 成就 */
    achList:  achList,
    achCount: achCount,
    achTotal: achTotal,
    ACH_REWARD: 20,
    achReward: achReward,

    /* 每日任务 */
    questList:  questList,
    claimQuest: claimQuest,
    QUEST_REWARD: QUEST_REWARD,
    QUEST_BONUS:  QUEST_BONUS,

    /* 设置 */
    opt:    opt,
    setOpt: setOpt,
    OPT_DEF: OPT_DEF,

    /* 清空全部数据。
       不写死键名 —— 直接扫 localStorage，把 duo. 开头的全清掉。
       以后再加新键，这里不用改 */
    reset: function(){
      var keys = [];
      try {
        for (var i = 0; i < localStorage.length; i++){
          var k = localStorage.key(i);
          if (k && k.indexOf('duo.') === 0) keys.push(k);
        }
      } catch(e){}
      keys.forEach(function(k){ try { localStorage.removeItem(k); } catch(e){} });
    },

    /* 页面要拿来显示的常数 */
    HEART_MAX: HEART_MAX,
    HEART_MIN: HEART_MIN,
    FREEZE_MAX: FREEZE_MAX,
    PRICE:     PRICE,
    BOOST_MIN: BOOST_MIN,
    GEM_START:   GEM_START,
    GEM_PASS:    GEM_PASS,
    GEM_PERFECT: GEM_PERFECT,
    GEM_FIRST:   GEM_FIRST
  };
})();