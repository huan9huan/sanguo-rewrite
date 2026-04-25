# CP001-P01 中文 Storytime 音频 Brief

Role: Short Video Editor / Storytime Audio

Goal: 修复多 voice 对话的割裂感。改用 Storytime 思路：一个讲故事的人把观众带进去，用语气、停顿和句式变化制造亲近感。

## Source Decision

Google 文档里的 `Storytime` 示例 voice 是 `en-US-Chirp-HD-F`。当前中文 `cmn-CN` 没有对应的 `Chirp-HD-F` voice，所以本 run 使用中文 Chirp3 HD voice 做 Storytime-style delivery。

## Audio Shape

Mode: `storytime_single_narrator`

- 单一讲述者，减少 speaker 拼接。
- 整段或大段合成，避免每句独立 TTS 导致语气断裂。
- 通过“你看 / 你会发现 / 到这里”这种讲故事接头带观众。
- 不再做男女问答。

## Story Line

1. 三国不是从英雄登场开始。
2. 朝廷先坏，太监掌权。
3. 龙椅青蛇是崩坏的画面。
4. 张角聚众，黄巾口号响起。
5. 幽州招兵榜引出刘备、关羽、张飞。
