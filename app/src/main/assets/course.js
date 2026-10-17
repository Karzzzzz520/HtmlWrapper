/* ================================================================
   course.js —— 课程表
   ----------------------------------------------------------------
   「课程」是一张表，每门一棵树，形状完全一样：

     课程 Course
      └ 章节 Section
        └ 单元 Unit
          └ 关卡 Level        ← 地图上的一个圈
            └ 课时 Lesson     ← 一次答题（lesson.html）

   进度口径：duo.done.<课程id> = 这门课已经通过的「关卡」数。
   换一门课，进度归零，不会互相串。

   ready: true   题目已经填好，点得进去
   ready: false  只有骨架，点进去会被挡住
   ready 这个字段是那道闸：骨架课如果真的能打开，会掉到最后那条后路
   （COURSES[0]）上，打着 JavaScript 的题 —— 看起来像学了，其实什么都没学。

   章数跟着题走，不跟着排场走。
   JavaScript 只有两章，因为它只有两章的题 ——
   骨架课画满六章（6 × 3 单元 × 3 关 = 54 关），那只是目录，不是课。
   真要把它变成课，一章一章填，填到哪章哪章才算数。

   骨架课的树不手抄 —— 一门课只写章名、章说明、这几个单元，
   树由 stubTree() 长出来。十八份手抄的树，早晚有一个字不一样，
   而那种错在地图上完全看不出来。
   ================================================================ */

var COURSE_LIST = [

  /* ---------- JavaScript：目前唯一一门有题的 ---------- */
  {
    id:    'js',
    badge: 'JS',
    title: 'JavaScript',
    desc:  '网页和 App 的语言',
    ready: true,

    /* 前 11 关有题。
       目录可以先画满六章，但能打的只有这 11 关 ——
       这个数和 lesson.html 里的 COURSES 套数必须对得上。 */
    levelsReady: 47,

    sections: [
      {
        name: '基础语法',
        desc: '让电脑先学会记住东西',
        c1: '#b46cf0', c2: '#8b46d4', c3: '#65319e',
        units: [
          {
            name: '变量',
            levels: [
              { title: '第 1 关', lessons: ['认识变量'] },
              { title: '第 2 关', lessons: ['让和等于'] },
              { title: '第 3 关', lessons: ['改值'] },
              { title: '第 4 关', lessons: ['拼代码'] }
            ]
          },
          {
            name: '命名',
            levels: [
              { title: '第 5 关', lessons: ['什么名字算合法'] },
              { title: '第 6 关', lessons: ['小测'] }
            ]
          }
        ]
      },
      {
        name: '类型与常量',
        desc: '会变的和不会变的',
        c1: '#4aa8ff', c2: '#2484e0', c3: '#155ba8',
        units: [
          {
            name: '常量',
            levels: [
              { title: '第 7 关',  lessons: ['const 是什么'] },
              { title: '第 8 关',  lessons: ['什么时候用 const'] },
              { title: '第 9 关',  lessons: ['数字与文字'] },
              { title: '第 10 关', lessons: ['拼起来'] },
              { title: '第 11 关', lessons: ['单元测验'] }
            ]
          }
        ]
      },
      {
        name: '条件',
        desc: '让程序自己选路',
        c1: '#ffb74a', c2: '#e89a1c', c3: '#a86a08',
        units: [
          { name: '比较', levels: [
            { title: '第 12 关', lessons: ['大于和小于'] },
            { title: '第 13 关', lessons: ['相等和不等'] },
            { title: '第 14 关', lessons: ['比较的结果是什么'] }
          ] },
          { name: '真假', levels: [
            { title: '第 15 关', lessons: ['true 和 false'] },
            { title: '第 16 关', lessons: ['与或非'] },
            { title: '第 17 关', lessons: ['空值算真还是假'] }
          ] },
          { name: '分支', levels: [
            { title: '第 18 关', lessons: ['if'] },
            { title: '第 19 关', lessons: ['else'] },
            { title: '第 20 关', lessons: ['连成一串的判断'] }
          ] }
        ]
      },
      {
        name: '循环',
        desc: '让同一段代码跑很多遍',
        c1: '#5ad1a0', c2: '#2fa87a', c3: '#167052',
        units: [
          { name: 'for', levels: [
            { title: '第 21 关', lessons: ['跑固定次数'] },
            { title: '第 22 关', lessons: ['从 0 数上去'] },
            { title: '第 23 关', lessons: ['倒着数'] }
          ] },
          { name: 'while', levels: [
            { title: '第 24 关', lessons: ['条件还在就继续'] },
            { title: '第 25 关', lessons: ['先做再判断'] },
            { title: '第 26 关', lessons: ['死循环长什么样'] }
          ] },
          { name: '跳出', levels: [
            { title: '第 27 关', lessons: ['break'] },
            { title: '第 28 关', lessons: ['continue'] },
            { title: '第 29 关', lessons: ['小测'] }
          ] }
        ]
      },
      {
        name: '函数',
        desc: '把一段代码收起来，起个名字',
        c1: '#ff8a8a', c2: '#e05a5a', c3: '#a03030',
        units: [
          { name: '定义', levels: [
            { title: '第 30 关', lessons: ['function'] },
            { title: '第 31 关', lessons: ['调用'] },
            { title: '第 32 关', lessons: ['不调用就不会跑'] }
          ] },
          { name: '参数', levels: [
            { title: '第 33 关', lessons: ['传进去'] },
            { title: '第 34 关', lessons: ['几个参数'] },
            { title: '第 35 关', lessons: ['参数是局部的'] }
          ] },
          { name: '返回', levels: [
            { title: '第 36 关', lessons: ['return'] },
            { title: '第 37 关', lessons: ['返回之后就结束'] },
            { title: '第 38 关', lessons: ['小测'] }
          ] }
        ]
      },
      {
        name: '数组与对象',
        desc: '把一堆东西装在一起',
        c1: '#b39ddb', c2: '#8f78c0', c3: '#5e4a8a',
        units: [
          { name: '数组', levels: [
            { title: '第 39 关', lessons: ['一排格子'] },
            { title: '第 40 关', lessons: ['下标'] },
            { title: '第 41 关', lessons: ['长度'] }
          ] },
          { name: '对象', levels: [
            { title: '第 42 关', lessons: ['键和值'] },
            { title: '第 43 关', lessons: ['取和改'] },
            { title: '第 44 关', lessons: ['点号和方括号'] }
          ] },
          { name: '遍历', levels: [
            { title: '第 45 关', lessons: ['for 走一遍'] },
            { title: '第 46 关', lessons: ['forEach'] },
            { title: '第 47 关', lessons: ['综合练习'] }
          ] }
        ]
      }
    ]
  }
];


/* ================================================================
   骨架课：一行一门
   ----------------------------------------------------------------
   顺序：[id, 标志, 名字, 一句话, 三个色, 章表]
   章表：[章名, 一句说明, 这章有哪几个单元]
   每个单元 3 关（对应多邻国「一个课时 3 个单元」）。

   单元名就是知识点本身，不写「第 1 课」这种空壳 ——
   地图上一行字是「循环」，你就知道这九关在讲循环。

   最后统一按名字的字母序排。
   ================================================================ */
var COURSE_STUBS = [

  ['c', 'C', 'C', '系统底层的语言',
   '#6b7bd6', '#4a58b8', '#2a3490', [
   ['先让程序跑起来', '变量、类型、输出', ['变量与类型', 'printf', '注释与格式']],
   ['让程序做判断', '条件、比较、真假', ['条件', '比较', '逻辑']],
   ['让它重复', '三种循环', ['for', 'while', '跳出']],
   ['一排同样的东西', '数组与字符串', ['数组', '遍历', '字符串']],
   ['把代码收起来', '函数与参数', ['函数', '参数', '返回值']],
   ['走到内存里', '指针入门', ['地址', '指针', '交换']]
  ]],

  ['csharp', 'C#', 'C#', '微软系的多面手',
   '#9b4fae', '#7a2f8c', '#4e1758', [
   ['第一段 C#', '变量、输出', ['变量', '控制台输出', '注释']],
   ['让程序做判断', '条件、比较、真假', ['条件', '比较', '逻辑']],
   ['让它重复', '循环', ['for', 'while', '跳出']],
   ['一排同样的东西', '数组与列表', ['数组', 'List', '遍历']],
   ['方法与类', '把代码收起来', ['方法', '参数', '类']],
   ['拼成一个小程序', '把前面连起来', ['组合', '输入', '小项目']]
  ]],

  ['cpp', 'C++', 'C++', '性能和抽象的交界处',
   '#3a86c8', '#00599c', '#003966', [
   ['第一段 C++', '变量、iostream', ['变量', 'iostream', '注释']],
   ['让程序做判断', '条件、比较、真假', ['条件', '比较', '逻辑']],
   ['让它重复', '循环', ['for', 'while', '跳出']],
   ['一排同样的东西', '数组与 vector', ['数组', 'vector', '遍历']],
   ['函数', '参数与返回值', ['函数', '参数', '返回值']],
   ['类与对象', '把数据和方法放一起', ['类', '成员', '构造']]
  ]],

  ['css', 'CS', 'CSS', '网页的样子',
   '#4a6df0', '#264de4', '#152f96', [
   ['把样式挂上去', '选择器与优先级', ['选择器', '类选择器', '优先级']],
   ['颜色与字', '看得清是第一件事', ['颜色', '字体', '行高']],
   ['盒模型', '每个元素都是一个盒子', ['margin', 'padding', 'border']],
   ['把页面摆开', '布局', ['flex', 'grid', '定位']],
   ['动起来', '过渡与动画', ['transition', 'transform', '关键帧']],
   ['换个屏幕也不散', '响应式', ['媒体查询', '单位', '弹性']]]],

  ['dart', 'DA', 'Dart', 'Flutter 的语言',
   '#2199d8', '#0175c2', '#01446f', [
   ['第一段 Dart', '变量与输出', ['变量', '输出', '注释']],
   ['让程序做判断', '条件、比较、真假', ['条件', '比较', '逻辑']],
   ['让它重复', '循环', ['for', 'while', '跳出']],
   ['一排同样的东西', 'List 与 Map', ['List', 'Map', '遍历']],
   ['函数', '参数与返回值', ['函数', '参数', '返回值']],
   ['类', '把数据和方法放一起', ['类', '字段', '构造']]
  ]],

  ['go', 'GO', 'Go', '并发与简洁',
   '#2fc4ee', '#00add8', '#00778f', [
   ['第一段 Go', '变量与 fmt', ['变量', 'fmt', '注释']],
   ['让程序做判断', '条件、比较、真假', ['条件', '比较', '逻辑']],
   ['让它重复', '只有 for', ['for', 'range', '跳出']],
   ['切片与映射', 'Go 的两种容器', ['切片', 'map', '遍历']],
   ['函数', '多返回值与错误', ['函数', '多返回值', '错误']],
   ['并发', 'goroutine 与 channel', ['goroutine', 'channel', '同步']]
  ]],

  ['html', 'HT', 'HTML', '网页的骨架',
   '#f06a45', '#c13c1a', '#8a2a12', [
   ['网页是用标签搭的', '标签、属性、结构', ['标签', '属性', '嵌套']],
   ['文字', '标题、段落、列表', ['标题', '段落', '列表']],
   ['让页面连起来', '链接与路径', ['链接', '锚点', '路径']],
   ['图片与表格', '看得见的东西', ['img', 'table', '替代文字']],
   ['表单', '让人把东西填进来', ['input', '标签配对', '提交']],
   ['语义化', '让机器也看得懂', ['header/footer', 'section', '无障碍']]
  ]],

  ['java', 'JV', 'Java', '企业级的老将',
   '#ffa733', '#f89820', '#b06c0c', [
   ['第一段 Java', '变量与输出', ['变量', '输出', '注释']],
   ['让程序做判断', '条件、比较、真假', ['条件', '比较', '逻辑']],
   ['让它重复', '循环', ['for', 'while', '跳出']],
   ['一排同样的东西', '数组与 List', ['数组', 'List', '遍历']],
   ['方法', '参数与返回值', ['方法', '参数', '返回值']],
   ['类', '把数据和方法放一起', ['类', '字段', '构造']]
  ]],

  ['kotlin', 'KT', 'Kotlin', 'Android 的现代选择',
   '#9a72ff', '#7f52ff', '#5230b8', [
   ['第一段 Kotlin', 'val 与 var', ['val 和 var', '输出', '注释']],
   ['让程序做判断', '条件与表达式', ['条件', '比较', 'when']],
   ['让它重复', '循环', ['for', 'while', '跳出']],
   ['集合', 'List 与 Map', ['List', 'Map', '遍历']],
   ['函数', '参数与默认值', ['函数', '参数', '默认值']],
   ['类', '数据类', ['类', '数据类', '构造']]
  ]],

  ['lua', 'LU', 'Lua', '游戏里的脚本',
   '#2a2ab0', '#000080', '#000052', [
   ['第一段 Lua', '变量与 print', ['变量', 'print', '注释']],
   ['让程序做判断', '条件、比较、真假', ['条件', '比较', '逻辑']],
   ['让它重复', '循环', ['for', 'while', '跳出']],
   ['表', 'Lua 只有一种容器', ['表', '数组', '遍历']],
   ['函数', '参数与返回值', ['函数', '参数', '返回值']],
   ['模块', '把代码分开放', ['require', '模块', '小项目']]
  ]],

  ['php', 'PH', 'PHP', '服务器端的常客',
   '#9499d6', '#777bb4', '#4f5384', [
   ['第一段 PHP', '变量与 echo', ['变量', 'echo', '注释']],
   ['让程序做判断', '条件、比较、真假', ['条件', '比较', '逻辑']],
   ['让它重复', '循环', ['for', 'foreach', '跳出']],
   ['数组', '索引与关联', ['索引数组', '关联数组', '遍历']],
   ['函数', '参数与返回值', ['函数', '参数', '返回值']],
   ['和网页说话', '表单与请求', ['表单', 'GET/POST', '小项目']]
  ]],

  ['py', 'PY', 'Python', '数据和脚本的语言',
   '#5a9cc4', '#306998', '#1f4460', [
   ['说出第一句话', 'print 和变量', ['print', '变量', '注释']],
   ['让程序自己选路', '缩进就是语法', ['条件', '缩进', '逻辑']],
   ['一遍一遍做', '循环', ['for', 'while', 'range']],
   ['一串东西', '列表与字典', ['列表', '字典', '遍历']],
   ['把代码收起来', 'def', ['def', '参数', '返回值']],
   ['用别人的', 'import', ['import', '模块', '小项目']]
  ]],

  ['ruby', 'RB', 'Ruby', '写起来像说话',
   '#e0564e', '#cc342d', '#8e1f1a', [
   ['第一段 Ruby', '变量与 puts', ['变量', 'puts', '注释']],
   ['让程序做判断', '条件、比较、真假', ['条件', '比较', '逻辑']],
   ['让它重复', 'each 与 while', ['each', 'while', '跳出']],
   ['数组与哈希', '两种容器', ['数组', '哈希', '遍历']],
   ['方法', '参数与返回值', ['方法', '参数', '返回值']],
   ['块', 'Ruby 的味道', ['block', 'yield', '小项目']]
  ]],

  ['rust', 'RS', 'Rust', '不靠 GC 的安全',
   '#e8b79b', '#dea584', '#a06b48', [
   ['第一段 Rust', 'let 与 println', ['let', 'println', '注释']],
   ['让程序做判断', '条件与 match', ['条件', 'match', '逻辑']],
   ['让它重复', '三种循环', ['for', 'while', 'loop']],
   ['所有权', 'Rust 最硬的一块', ['移动', '借用', '生命周期']],
   ['集合', 'Vec 与 HashMap', ['Vec', 'HashMap', '遍历']],
   ['结构体', '把几样东西捆一起', ['struct', 'impl', '枚举']]
  ]],

  ['sql', 'SQ', 'SQL', '和数据库说话',
   '#f0a020', '#e38c00', '#9c5f00', [
   ['从表里取东西', 'SELECT', ['SELECT', '列', '别名']],
   ['只要我要的', 'WHERE', ['WHERE', '比较', 'LIKE']],
   ['排个序', '结果也可以收拾', ['ORDER BY', 'LIMIT', '去重']],
   ['把数据算出来', '聚合', ['COUNT', 'SUM', 'GROUP BY']],
   ['把表连起来', 'JOIN', ['JOIN', '键', '多表']],
   ['改数据', '不只是读', ['INSERT', 'UPDATE', 'DELETE']]
  ]],

  ['swift', 'SW', 'Swift', '苹果系的语言',
   '#ff8f66', '#fa7343', '#b8451c', [
   ['第一段 Swift', 'let 与 var', ['let 和 var', 'print', '注释']],
   ['让程序做判断', '条件与比较', ['条件', '比较', '逻辑']],
   ['让它重复', '循环', ['for', 'while', '跳出']],
   ['集合', 'Array 与 Dictionary', ['Array', 'Dictionary', '遍历']],
   ['可选值', '“空”怎么表示', ['可选', '解包', '默认值']],
   ['结构体与函数', '把数据和方法放一起', ['struct', 'func', '参数']]
  ]],

  ['ts', 'TS', 'TypeScript', '带类型的 JavaScript',
   '#4a91d8', '#3178c6', '#1d4f8c', [
   ['给 JavaScript 加类型', '先学会写类型', ['类型标注', '推断', 'any']],
   ['接口', '把对象的形状说清楚', ['interface', '可选字段', '扩展']],
   ['联合类型', '一个值可能是几种', ['联合', '收窄', '字面量']],
   ['泛型', '类型也可以当参数', ['泛型', '约束', '常见用法']],
   ['枚举与类', '写得更严', ['enum', 'class', '修饰符']],
   ['模块', '拆开再拼起来', ['import/export', '类型导出', '小项目']]
  ]]
];


/* 把一个色向左调暗一点。每章比上一章暗一点，地图上分得出段 */
function shade(hex, k){
  var h = String(hex).replace('#', '');
  var out = '', i, v;
  for (i = 0; i < 3; i++){
    v = Math.round(parseInt(h.substr(i * 2, 2), 16) * k);
    v = Math.max(0, Math.min(255, v)).toString(16);
    out += (v.length < 2 ? '0' + v : v);
  }
  return '#' + out;
}

/* 章表 → 真树。
   关卡号跨章连编，不每章从 1 开始 —— 进度认的是全局序号。
   章一多，一章一色反而花；这里统一每深一章暗一成，够分段就行。 */
function stubTree(chapters, c1, c2, c3){
  var n = 0;

  return chapters.map(function(ch, si){
    var k = 1 - si * 0.09;
    return {
      name: ch[0],
      desc: ch[1],
      c1: shade(c1, k),
      c2: shade(c2, k),
      c3: shade(c3, k),
      units: ch[2].map(function(t){
        var levels = [1, 2, 3].map(function(i){
          n++;
          return { title: '第 ' + n + ' 关', lessons: [t + ' · ' + i] };
        });
        return { name: t, levels: levels };
      })
    };
  });
}

/* 哪些骨架课已经有题了。
   表里一律 ready:false，这里单独开闸 —— 比把整行改成对象省事，
   也不会漏字段（对象形式漏一个字段就是静默的 undefined）。
   以后 Python 写到第几关，把 LEVELS_READY.py 改成几。 */
var READY_OVERRIDE = { py: 1 };
var LEVELS_READY   = { py: 54 };

/* 把骨架表长成真正的课程，推进同一张列表 */
COURSE_STUBS.forEach(function(r){
  COURSE_LIST.push({
    id:    r[0],
    badge: r[1],
    title: r[2],
    desc:  r[3],
    ready: !!READY_OVERRIDE[r[0]],
    levelsReady: LEVELS_READY[r[0]],
    sections: stubTree(r[7], r[4], r[5], r[6])
  });
});

/* 按名字的字母序排。
   表里怎么写都不影响显示顺序 —— 以后加一门课，插在哪行都对。 */
COURSE_LIST.sort(function(a, b){
  return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
});


/* 默认那门。找不到「上次停在哪门」的时候回到它 */
var DEFAULT_COURSE = 'js';

/* 按 id 取一门课。取不到返回 null */
function findCourse(id){
  for (var i = 0; i < COURSE_LIST.length; i++)
    if (COURSE_LIST[i].id === id) return COURSE_LIST[i];
  return null;
}

/* 当前这门。切换课程时这一个变量会被整个换掉 ——
   界面只认 COURSE，不认列表；所以页面代码一行都不用改。 */
var COURSE = findCourse(DEFAULT_COURSE) || COURSE_LIST[0];


/* 把树摊平成一串关卡。
   地图、进度、?n= 都只认这一串 ——
   别的地方要遍历课程，都从这里走，不要在界面上现拆。 */
function allLevels(){
  var out = [];
  COURSE.sections.forEach(function(sec){
    sec.units.forEach(function(u){
      u.levels.forEach(function(lv){
        out.push({
          sec:     sec.name,
          unit:    u.name,
          title:   lv.title,
          lessons: lv.lessons || []
        });
      });
    });
  });
  return out;
}

/* 某一关在第几个（从 0 开始）。找不到返回 -1 */
function levelIndex(secName, unitName, title){
  var all = allLevels();
  for (var i = 0; i < all.length; i++){
    var x = all[i];
    if (x.sec === secName && x.unit === unitName && x.title === title) return i;
  }
  return -1;
}


/* 这一关有没有题。
   ready 是全课的总闸，levelsReady 是「前 N 关才有题」——
   目录可以先画满，但能点的只有那几关。
   不分开这两个的话，JS 加了章节之后，
   后面那些关点进去会掉到第 1 关的题上，打着打着还以为自己学完了。 */
function levelReady(c, idx){
  if (!c.ready) return false;
  if (c.levelsReady === undefined) return true;
  return idx < c.levelsReady;
}

/* 一门课「能学」的关卡数。进度条的分母用它，不是总关数 ——
   47 个圈只通了 7 个，分母写 47 会让人以为还差四十关。 */
function readyCount(c){
  if (!c.ready) return 0;
  var n = 0;
  c.sections.forEach(function(s){
    s.units.forEach(function(u){ n += u.levels.length; });
  });
  if (c.levelsReady !== undefined) return Math.min(n, c.levelsReady);
  return n;
}