from pathlib import Path
import re,shutil
web=Path('../web'); css=(web/'bird_themes.css').read_text(encoding='utf-8-sig')
blocks=re.findall(r'html\[data-bird-theme="(?:rouge|paper|jade|apricot)"\]\s*\{[^{}]*\}',css)
blocks=[b for b in blocks if '--' in b and 'url(' not in b]
shared='''
html[data-bird-theme] body{background:var(--bg0);color:var(--ink)}
html[data-bird-theme] .desk{background:linear-gradient(var(--cloth-wash),var(--cloth-wash)),var(--cloth) repeat;background-size:auto,440px 440px}
html[data-bird-theme] .desk::before{display:none}
html[data-bird-theme] .aux{background:transparent}
html[data-bird-theme] :is(.boshi,.yarrow,.rec-drawer){background:var(--surface);color:var(--surface-ink);border-color:var(--surface-edge)}
html[data-bird-theme] :is(.question-input,.time-fields input,.sj-btn,.mini-btn,.act-btn,.method-options label,.y-modes label,.rec-item){background:var(--surface);color:var(--surface-ink);border-color:var(--surface-edge);color-scheme:inherit}
html[data-bird-theme] :is(.question-input::placeholder,.cast-note,.y-note){color:var(--surface-muted)}
html[data-bird-theme] :is(.sj-btn.active,.cast-btn,.method-options label:has(input:checked),.y-modes label:has(input:checked)){background:var(--surface-hi);border-color:var(--surface-accent);color:var(--surface-ink)}
html[data-bird-theme] .world-switch--east{--ws-ink:var(--gold);--ws-ink-hi:var(--gold-hi);--ws-border:var(--line);--ws-border-hi:var(--bronze);background:var(--bg1)}
html[data-bird-theme] .east-nav-link{background:var(--bg1);color:var(--gold);border-color:var(--line)}
html[data-bird-theme] .yao-bar.yao-yang{background:linear-gradient(90deg,var(--bronze),var(--gold),var(--bronze))}
html[data-bird-theme] .yao-bar.yao-yin::before,html[data-bird-theme] .yao-bar.yao-yin::after{background:var(--jade)}
.bird-palette{position:fixed;top:calc(14px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:2600;display:flex;align-items:center;gap:12px;padding:8px 12px;background:var(--bg1);border:1px solid var(--line);border-radius:22px}
.bird-palette button{display:grid;place-items:center;width:24px;height:24px;padding:0;border:0;border-radius:50%;background:transparent}
.bird-palette button[aria-pressed=true]{outline:1px solid var(--gold-hi);outline-offset:2px}
.bird-palette button:focus-visible{outline:2px solid var(--gold-hi)}
.palette-swatch{width:18px;height:18px;border-radius:50%;border:1px solid #8885}
.swatch-rouge{background:#943f35}.swatch-paper{background:#fffdf6}.swatch-jade{background:#12273b}.swatch-apricot{background:#709c84}
'''
surfaces=re.findall(r'html\[data-bird-theme="(?:rouge|paper|jade|apricot)"\]\s*\{--cloth:[^{}]*\}',css)
Path('bird_themes.css').write_text('/* 配色与锦缎沿用 web，布局适配 iPhone。 */\n'+'\n'.join(blocks+surfaces)+shared,encoding='utf-8')
shutil.copyfile(web/'bird_themes.js','bird_themes.js')
art=Path('图片/已批准');art.mkdir(parents=True,exist_ok=True)
for name in ['zhuque','baihu','xuanwu','qinglong']:
 f=name+'_brocade_tile_master_v01.png';shutil.copyfile(web/'图片/已批准'/f,art/f)
p=Path('bird_ios.html');s=p.read_text(encoding='utf-8-sig');s=s.replace('</head>','<link rel="stylesheet" href="bird_themes.css">\n<script src="bird_themes.js"></script>\n</head>');p.write_text(s,encoding='utf-8')
p=Path('sw.js');s=p.read_text(encoding='utf-8-sig').replace('core-v13','core-v14').replace("  'dice_flying.js',","  'bird_themes.js', 'bird_themes.css', 'dice_flying.js',");p.write_text(s,encoding='utf-8')
p=Path('iphone15-preview.html');s=p.read_text(encoding='utf-8-sig').replace('src="/reading_ios.html"','src="/bird_ios.html"').replace('可投骰、保存、查看记录','玄鸟 · 四象配色 · 可起卦');p.write_text(s,encoding='utf-8')
