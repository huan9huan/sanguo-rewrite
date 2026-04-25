# 三国双人播客式有声故事导演规范

## 1. 项目定位

本项目不是传统有声书，也不是纯聊天机器人，而是面向外国用户的「三国故事双人播客」。

核心体验是：

```text
一个懂三国的叙述者，带着一个代表外国听众的聆听者，一起进入故事。
```

用户听到的不是历史课，而像是在听一档有画面感的历史故事 podcast。

---

## 2. 核心角色

### 2.1 Narrator / 叙述者

叙述者负责推进故事。

他的职责：

- 讲剧情
- 建立历史背景
- 描述人物动作
- 制造画面感
- 控制节奏
- 在关键处点出人物性格
- 把复杂历史讲成外国人能听懂的故事

叙述者的声音感觉：

```text
calm / cinematic / wise / warm / slightly mysterious
```

中文理解：

```text
沉稳、有画面感、像纪录片主持人，但不要太官方。
```

叙述者不应该像老师讲课，也不应该像百科词条。

错误示例：

```text
Liu Bei was a descendant of the Han royal family and later became the founding emperor of Shu Han.
```

正确示例：

```text
Liu Bei had royal blood, but almost no royal life. At this moment, he was not a king. He was just a man standing before a notice, wondering if history had left him any door at all.
```

---

### 2.2 Listener / 聆听者

聆听者代表外国用户。

他的职责：

- 替用户提问
- 表达疑惑
- 把复杂信息重新说简单
- 在关键处惊讶
- 偶尔轻微吐槽
- 帮用户跟上剧情
- 不抢故事主线

聆听者的声音感觉：

```text
curious / warm / human / slightly surprised / conversational
```

中文理解：

```text
好奇、自然、像第一次听三国的朋友。
```

聆听者不是搞笑角色，也不是傻瓜。

他应该聪明，但对三国陌生。

错误示例：

```text
Wow, ancient China is so confusing! I don't understand anything!
```

正确示例：

```text
So Liu Bei was important by blood, but powerless in real life?
```

---

## 3. 双人关系

叙述者和聆听者不是问答机器人关系，而是 podcast 搭档关系。

推荐关系：

```text
Narrator = 带路人
Listener = 同行者
```

不要让聆听者每句都问问题。

节奏建议：

```text
Narrator 讲 2~4 句
Listener 插入 1 句
Narrator 接住问题继续推进
```

或者：

```text
Narrator 建立画面
Listener 发现矛盾
Narrator 点破更深一层含义
```

示例：

```text
Narrator:
The empire had not yet fallen. But the sound of collapse was already moving under the ground.

Listener:
So people could feel something was wrong, even before the war really began?

Narrator:
Exactly. Great disasters rarely begin with thunder. They begin with hunger, rumors, and officials who stop listening.
```

---

## 4. 内容风格

### 4.1 总体风格

目标风格：

```text
cinematic historical podcast for foreign listeners
```

中文理解：

```text
电影感历史播客，面向不了解三国的外国人。
```

不要写成：

- 论文
- 百科
- 解说稿
- 游戏设定集
- 官方历史简介
- 传统评书的直接翻译

应该写成：

- 有人物
- 有画面
- 有冲突
- 有悬念
- 有节奏
- 有提问
- 有情绪

---

### 4.2 每集基本结构

每集建议采用七段式：

```text
1. Cold Open：用强画面开场
2. Listener Question：聆听者提出外国用户会有的疑问
3. Background：叙述者补足背景
4. Story Push：剧情向前推进
5. Character Moment：突出人物性格
6. Meaning：点出这一幕为什么重要
7. Cliffhanger：留下下一段钩子
```

---

## 5. 语言原则

### 5.1 用短句

TTS 最适合短句。

不要写长而复杂的英文句子。

错误示例：

```text
Because the Han dynasty had been weakened by corruption, famine, and regional military leaders, the rebellion quickly expanded across the empire and created conditions that would later lead to the Three Kingdoms period.
```

正确示例：

```text
The Han dynasty was weak.
The people were hungry.
The officials were corrupt.
And across the empire, men with armies began to realize something dangerous: the center could no longer hold.
```

---

### 5.2 少用专有名词堆叠

外国用户不熟悉三国。

不要在一段里塞太多名字。

错误示例：

```text
Liu Bei, Guan Yu, Zhang Fei, Cao Cao, Sun Jian, Dong Zhuo, and Lu Zhi all appeared during the Yellow Turban Rebellion.
```

正确示例：

```text
Many names would rise from this chaos.
But for now, we follow only one man: Liu Bei.
He does not yet look like a hero.
That is why we should watch him closely.
```

---

### 5.3 先讲人，再讲历史

用户更容易记住人物，不容易记住制度。

错误顺序：

```text
先解释东汉末年政治结构，再讲刘备。
```

正确顺序：

```text
先让用户看到刘备站在榜文前，然后再解释为什么这个榜文重要。
```

示例：

```text
Liu Bei stood before the notice for a long time.
He was poor. He had no army. No official title that mattered.
But the words on that wall sounded like a door opening.
```

---

### 5.4 不要过度解释

每次只解释用户此刻需要知道的东西。

不要一次性讲完所有背景。

原则：

```text
just enough context, then back to story
```

中文理解：

```text
刚好够懂，然后立刻回到剧情。
```

---

## 6. 聆听者提问规则

聆听者的问题应该服务剧情，而不是打断剧情。

### 6.1 好问题类型

#### A. 澄清身份

```text
Wait, is Liu Bei already powerful here?
```

#### B. 澄清关系

```text
So Guan Yu and Zhang Fei are not his generals yet?
```

#### C. 澄清时代背景

```text
Why would a simple notice matter so much?
```

#### D. 复述关键信息

```text
So he has royal blood, but almost no real power.
```

#### E. 引出人物性格

```text
Is this why Zhang Fei feels so different from Liu Bei?
```

#### F. 轻注释陌生元素

当一个文化、政治、地理词会挡住外国听众理解时，让 Listener 用一句话问清楚。

不要让 Narrator 先讲一大段背景。
也不要加脚注式解释。

示例：

```text
Narrator:
It coils on the dragon throne.

Listener:
The dragon throne means the emperor's seat, right?

Narrator:
Yes. The seat of the emperor, and the symbol of the empire.
```

示例：

```text
Narrator:
The Blue Heaven is dead. The Yellow Heaven rises.

Listener:
Blue Heaven, Yellow Heaven. Is that a call for a new order?

Narrator:
Yes. The old world is dead. A new one should replace it.
```

适合被轻注释的对象：

- `dragon throne`
- `eunuchs`
- `Blue Heaven / Yellow Heaven`
- `Luoyang`
- `Youzhou`
- governor / rebel / imperial clan 等身份词

原则：

```text
只解释此刻影响理解的东西。
解释完立刻回到故事。
```

---

### 6.2 避免的问题类型

不要问太现代、太出戏的问题。

错误示例：

```text
Was Liu Bei like a startup founder?
```

除非整集明确采用现代类比，否则不要这样写。

不要问太百科的问题。

错误示例：

```text
Can you list all major warlords during this period?
```

不要问太频繁。

错误节奏：

```text
Narrator 一句，Listener 一问。
```

这样会变成客服机器人，不像故事。

---

## 7. 叙述者写法规则

### 7.1 多用动作，不要只讲结论

错误示例：

```text
Liu Bei was ambitious.
```

正确示例：

```text
Liu Bei read the notice again.
Then again.
He did not smile.
But he also did not walk away.
```

---

### 7.2 多用对比

三国非常适合用对比讲人物。

示例：

```text
Zhang Fei saw the world as something to punch through.
Liu Bei saw it as something to endure.
Guan Yu saw it as something to judge.
```

---

### 7.3 关键人物第一次登场要有记忆点

不要只说：

```text
Guan Yu entered the wine shop.
```

应该写成：

```text
Then the door darkened.
A tall man stepped in, carrying the dust of a long road and the silence of someone who did not need to announce himself.
```

---

### 7.4 不要提前剧透太多

外国用户如果不知道三国，应该让他们慢慢发现。

错误示例：

```text
This man would later become the legendary Guan Yu, worshipped as a god of loyalty.
```

更好的写法：

```text
The man was not famous yet.
But history was already preparing a place for his name.
```

---

## 8. TTS 友好写作规则

### 8.1 每句控制在 5~18 个英文单词

推荐：

```text
The empire was tired.
The people were hungry.
And the roads were filling with rumors.
```

避免：

```text
The exhausted empire, weakened by corrupt officials and repeated disasters, was slowly losing control over the roads, villages, and armies that once obeyed the capital.
```

---

### 8.2 一行只表达一个意思

错误：

```text
Liu Bei was poor but noble and also ambitious because he wanted to restore the Han.
```

正确：

```text
Liu Bei was poor.
But he carried an old name.
And old names can be dangerous when an empire begins to fall.
```

---

### 8.3 停顿靠结构，不靠复杂标点

推荐使用：

```json
"pause_after_ms": 500
```

不要大量依赖：

```text
... — ; :
```

TTS 对复杂标点的表现不一定稳定。

---

### 8.4 情绪靠文字，不靠标签硬压

不要只写：

```json
"delivery": "sad"
```

要让文本本身带情绪：

```text
He wanted to serve the empire.
But the empire had no place for him.
```

---

## 9. 音频角色设计

### 9.1 Voice Map

每种语言建议固定两个 voice。

示例：

```json
{
  "en-US": {
    "narrator": "en-US-Chirp3-HD-Charon",
    "listener": "en-US-Chirp3-HD-Kore"
  },
  "es-ES": {
    "narrator": "es-ES-Chirp3-HD-xxx",
    "listener": "es-ES-Chirp3-HD-yyy"
  }
}
```

实际 voice name 以 Google Cloud Text-to-Speech 的 voice list 为准。

---

### 9.2 声音区分原则

叙述者和聆听者必须容易区分。

建议：

```text
Narrator：更低、更稳、更成熟
Listener：更轻、更近、更口语
```

不要选择两个太相似的声音。

---

## 10. 输出 JSON 协议

每一集最终应该输出为结构化 JSON，而不是一整段文本。

### 10.1 Episode Schema

```json
{
  "episode_id": "p01",
  "title": "The World Begins to Crack",
  "language": "en-US",
  "target_audience": "foreign beginners who know little about Three Kingdoms",
  "tone": "cinematic historical podcast",
  "voices": {
    "narrator": "en-US-Chirp3-HD-Charon",
    "listener": "en-US-Chirp3-HD-Kore"
  },
  "lines": [
    {
      "id": "p01_l001",
      "frame_id": "frame_1",
      "speaker": "narrator",
      "text": "The empire had not yet fallen.",
      "delivery": "low, calm, ominous",
      "pause_after_ms": 400
    },
    {
      "id": "p01_l002",
      "frame_id": "frame_1",
      "speaker": "narrator",
      "text": "But everyone could feel the ground shaking.",
      "delivery": "cinematic, slow",
      "pause_after_ms": 600
    },
    {
      "id": "p01_l003",
      "frame_id": "frame_1",
      "speaker": "listener",
      "text": "So this is where the Three Kingdoms begins?",
      "delivery": "curious, slightly surprised",
      "pause_after_ms": 300
    }
  ]
}
```

---

### 10.2 字段说明

| 字段 | 说明 |
|---|---|
| episode_id | 剧集 ID |
| title | 当前剧集标题 |
| language | 语言代码 |
| voices | 每个角色绑定的 TTS voice |
| lines | 所有台词行 |
| id | 单句唯一 ID |
| frame_id | 对应漫画 frame |
| speaker | narrator 或 listener |
| text | 真正送给 TTS 的文本 |
| delivery | 给导演、人审、未来模型使用的语气描述 |
| pause_after_ms | 该句之后停顿时间 |

---

## 11. 漫画同步规则

如果有漫画 frame，每一句必须绑定 frame_id。

一个 frame 可以有多句台词。

示例：

```json
{
  "id": "p03_l008",
  "frame_id": "frame_3",
  "speaker": "narrator",
  "text": "The peach blossoms moved in the wind, but the three men did not move.",
  "pause_after_ms": 500
}
```

前端可以根据当前播放 line_id 切换或高亮漫画 frame。

推荐体验：

```text
音频播放到 p03_l008
  ↓
前端高亮 frame_3
  ↓
字幕显示当前句
```

---

## 12. 每集时长建议

### 12.1 MVP 版本

每集建议：

```text
1.5 ~ 3 分钟
```

原因：

- 外国用户不熟悉人物
- 移动端更适合短内容
- 方便多语言重生成
- 方便 A/B 测试声音和脚本

### 12.2 单集台词数量

建议：

```text
20 ~ 45 lines
```

其中：

```text
Narrator：70%
Listener：30%
```

不要让 Listener 占比过高。

---

## 13. 每集质量检查清单

生成脚本后，必须检查：

```text
[ ] 外国人不懂三国也能听懂吗？
[ ] 第一段有没有画面感？
[ ] 是否每 2~4 句就有一次节奏变化？
[ ] Listener 的问题是否真实、有用？
[ ] 是否避免了名字堆叠？
[ ] 是否避免了百科式解释？
[ ] 是否每句足够短？
[ ] 是否适合 TTS 朗读？
[ ] 是否有结尾钩子？
[ ] 每句是否绑定了 frame_id？
```

---

## 14. 生成 Prompt 模板

### 14.1 输入

```text
You are writing a cinematic two-host audio story for foreign beginners.
The story is based on Romance of the Three Kingdoms.

Roles:
- Narrator: cinematic, calm, wise, story-driven.
- Listener: curious, warm, represents a foreign beginner.

Task:
Rewrite the given scene into a two-person audio script.

Rules:
- Do not write like a textbook.
- Do not overload names.
- Use short TTS-friendly sentences.
- Each line should be easy to speak aloud.
- Listener should ask useful beginner questions.
- Narrator should push the story forward.
- Avoid major spoilers.
- Output valid JSON only.

Output schema:
{
  "episode_id": string,
  "title": string,
  "language": "en-US",
  "tone": "cinematic historical podcast",
  "lines": [
    {
      "id": string,
      "frame_id": string,
      "speaker": "narrator" | "listener",
      "text": string,
      "delivery": string,
      "pause_after_ms": number
    }
  ]
}

Scene source:
{{SCENE_SOURCE}}

Frame outline:
{{FRAME_OUTLINE}}
```

---

## 15. 示例：乱世序幕

```json
{
  "episode_id": "p01",
  "title": "The World Begins to Crack",
  "language": "en-US",
  "tone": "cinematic historical podcast",
  "lines": [
    {
      "id": "p01_l001",
      "frame_id": "frame_1",
      "speaker": "narrator",
      "text": "At first, the empire did not look dead.",
      "delivery": "quiet, ominous",
      "pause_after_ms": 500
    },
    {
      "id": "p01_l002",
      "frame_id": "frame_1",
      "speaker": "narrator",
      "text": "The palaces still stood. The officials still bowed. The banners still moved in the wind.",
      "delivery": "cinematic, slow",
      "pause_after_ms": 600
    },
    {
      "id": "p01_l003",
      "frame_id": "frame_1",
      "speaker": "listener",
      "text": "Then why does it feel like something is already wrong?",
      "delivery": "curious, cautious",
      "pause_after_ms": 300
    },
    {
      "id": "p01_l004",
      "frame_id": "frame_1",
      "speaker": "narrator",
      "text": "Because collapse rarely begins with noise.",
      "delivery": "low, controlled",
      "pause_after_ms": 400
    },
    {
      "id": "p01_l005",
      "frame_id": "frame_2",
      "speaker": "narrator",
      "text": "It begins when farmers go hungry, roads grow unsafe, and officials stop listening.",
      "delivery": "grave, clear",
      "pause_after_ms": 600
    },
    {
      "id": "p01_l006",
      "frame_id": "frame_2",
      "speaker": "listener",
      "text": "So the rebellion was not just about one angry leader?",
      "delivery": "realizing",
      "pause_after_ms": 300
    },
    {
      "id": "p01_l007",
      "frame_id": "frame_2",
      "speaker": "narrator",
      "text": "No. Zhang Jue was the spark. But the dry grass was already everywhere.",
      "delivery": "cinematic, explanatory",
      "pause_after_ms": 700
    },
    {
      "id": "p01_l008",
      "frame_id": "frame_3",
      "speaker": "narrator",
      "text": "Soon, yellow scarves appeared on heads across the land.",
      "delivery": "widening, visual",
      "pause_after_ms": 400
    },
    {
      "id": "p01_l009",
      "frame_id": "frame_3",
      "speaker": "narrator",
      "text": "Villages turned into armies. Rumors turned into orders. Fear turned into motion.",
      "delivery": "faster, rising tension",
      "pause_after_ms": 700
    },
    {
      "id": "p01_l010",
      "frame_id": "frame_4",
      "speaker": "listener",
      "text": "And this is when the heroes appear?",
      "delivery": "anticipating",
      "pause_after_ms": 300
    },
    {
      "id": "p01_l011",
      "frame_id": "frame_4",
      "speaker": "narrator",
      "text": "Not heroes. Not yet.",
      "delivery": "firm, mysterious",
      "pause_after_ms": 400
    },
    {
      "id": "p01_l012",
      "frame_id": "frame_4",
      "speaker": "narrator",
      "text": "Only a notice on a wall, and a poor man who could not stop staring at it.",
      "delivery": "quiet cliffhanger",
      "pause_after_ms": 900
    }
  ]
}
```

---

## 16. 推荐制作流程

```text
1. 写中文剧情梗概
2. 拆成漫画 frame outline
3. 用导演 prompt 生成英文双人脚本 JSON
4. 人工检查节奏、术语、TTS 友好度
5. 每一句调用 Chirp 3 TTS 生成音频
6. 按 pause_after_ms 拼接
7. 生成 timeline.json
8. 前端播放音频，同步字幕和漫画 frame
9. 用户点击 Explain this 时，再进入实时 LLM + TTS
```

---

## 17. 最小可用版本

MVP 不要做太复杂。

第一版只需要：

```text
英文双人脚本
每句一个 mp3
一个 episode mp3
字幕 JSON
漫画 frame 同步
```

暂时不要做：

```text
实时语音聊天
复杂情绪控制
背景音乐自动混音
多角色全配音
用户自由问答
```

这些可以放到第二阶段。

---

## 18. 产品判断

这个产品的独特价值不是 TTS，也不是三国资料本身。

真正的价值是：

```text
把陌生的中国古典故事，变成外国人能听进去的双人故事体验。
```

核心壁垒是：

```text
故事改写能力
角色口吻稳定
外国用户理解路径
漫画与音频同步
多语言规模化生产
```

Chirp 3 负责把它说出来。

导演规范负责让它值得被听完。
