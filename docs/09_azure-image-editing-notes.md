# Azure Image Editing Notes

这份说明专门记录 `gpt-image-1.5` 在当前仓库里的 Azure 图片编辑经验，避免下次重复踩坑。

## 结论

对当前这个 Azure deployment：

- 文生图可用 `images/generations`
- 带参考图的小改要用 `images/edits`
- `images/edits` 在这里实际可用的版本是 `2025-04-01-preview`
- 如果继续用 `2024-02-01` 去打 edit，实测会返回 `404 Resource not found`

## 当前可用做法

### 1. 生成整图

可用 endpoint 形态：

```text
https://<resource>.cognitiveservices.azure.com/openai/deployments/<deployment>/images/generations?api-version=2024-02-01
```

### 2. 参考图小改

可用 endpoint 形态：

```text
https://<resource>.cognitiveservices.azure.com/openai/deployments/<deployment>/images/edits?api-version=2025-04-01-preview
```

## 鉴权

当前验证通过的是：

```text
Authorization: Bearer $AZURE_API_KEY
```

不要默认假设 Azure 这里一定走 `api-key` header。

## 最稳的工作流

当目标是“保留原 page 结构，只改局部”时，优先使用：

1. 上一版整页图作为 `reference image`
2. 只开放局部区域的 `mask`
3. prompt 里明确写“保留整体结构，不要整页重画”

这样比重新文生图更容易保住：

- 四格结构
- 镜头节奏
- 人物站位
- 阅读顺序

## 经验要点

### 不要整页重画

如果只是修某一格的人物手、武器显著性、气质偏差，直接重新文生图很容易把其他已经成立的部分一起漂掉。

### mask 要尽量小

如果只想修最后一格，就只开放最后一格。
如果只想修最后一格里的人物主体，下一轮还可以进一步缩小 mask。

### prompt 要写“保留不变”

编辑 prompt 里要明确写：

- 保持四格结构不变
- 保持阅读顺序不变
- 保持前 3 格尽量不变
- 不要推翻重画

## 脚本

仓库里的脚本：

- [openai_text_to_image.py](/Users/huanghuan/sanguo-rewrite/tools/openai_text_to_image.py)

现在已经支持：

- `--endpoint`
- `--image`
- `--mask`
- Azure edit 自动把 `2024-02-01` 切到 `2025-04-01-preview`
- Azure 请求走 Bearer 鉴权

## 参考命令

```bash
export AZURE_API_KEY="..."

python3 /Users/huanghuan/sanguo-rewrite/tools/openai_text_to_image.py \
  --endpoint "https://xcodeaiprovider.cognitiveservices.azure.com/openai/deployments/wallpaper-gpt-image-1.5/images/generations?api-version=2024-02-01" \
  --image /Users/huanghuan/sanguo-rewrite/story/cp001-p03/comic/run003/image.png \
  --mask /Users/huanghuan/sanguo-rewrite/story/cp001-p03/comic/run004/mask.png \
  --prompt-file /Users/huanghuan/sanguo-rewrite/story/cp001-p03/comic/run004/page_prompt.txt \
  --input-fidelity high \
  --output /Users/huanghuan/sanguo-rewrite/story/cp001-p03/comic/run004/image.png \
  --metadata \
  --size 1024x1536 \
  --quality high \
  --format png
```

注意：

- 命令里传的仍然是 `images/generations` endpoint
- 脚本在 edit 模式下会自动切换到 `images/edits`
- 对 Azure edit，会自动把 API 版本切到 preview
