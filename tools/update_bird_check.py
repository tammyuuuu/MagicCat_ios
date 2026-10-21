from pathlib import Path
p=Path('tools/preview-bird.cjs');s=p.read_text(encoding='utf-8-sig').replace('await p.click(`[data-palette=', 'await p.click("#birdThemeToggle");await p.click(`[data-palette=');s=s.replace("await p.click('[data-palette=\"rouge\"]')", "await p.click('#birdThemeToggle');await p.click('[data-palette=\"rouge\"]')");p.write_text(s,encoding='utf-8')
