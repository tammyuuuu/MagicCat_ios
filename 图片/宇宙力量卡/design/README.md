# 宇宙力量卡 · 浅色竖版

140 张正面、1 张牌背，1024 × 1536，WebP。地 20、水 19、火 21、风 23、音 18、光 17、虹 22；编号与旧牌一一对应。

七种元素分别使用独立生成的底图，统一奶白、浅紫雾蓝水彩与细金线。中文位于画面中心，短句尽量单行，长句按标点和长度平衡换行，英文位于金线下方。图案用于点缀。

原始文字保存在 `reading-data/cosmic-source.txt`，整理后的 140 条数据位于 `reading-data/cosmic.json`。原文缺失的 9 条英文已补齐；中文统一简体，修正“完全全地”为“完完全全地”，英文仅修正明显的拼写问题。

本目录内 7 张元素底图和牌背由 imagegen 生成。文字单独排版以保证整套一致、不产生生图错字。重建步骤（Windows，安装 Playwright / Edge）：

1. `python tools/build_cosmic_catalog.py`
2. `node tools/render_cosmic_cards.cjs`（生成到 `output/cosmic-redesign/cards`，检查后再安装）
3. `python tools/install_cosmic_cards.py`（校验尺寸并原子替换 140 张正面和牌背）。
4. `python tools/build_offline_library.py`
5. `python tools/build_pwa_release.py`

旧版牌面备份已按用户要求删除。
