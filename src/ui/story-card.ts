import { IdiomProfile } from '../core/models';
import { buildStoryCard, storyCardToPlainText, StoryCardData } from '../core/story-card';

const esc = (s: string) =>
  s.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));

/** 纵向故事卡本体（屏幕预览与打印共用同一份渲染，保证所见即所印） */
export function renderStoryCard(card: StoryCardData): string {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const origStroke = (card.dna.originalPercent / 100) * circumference;
  const extStroke = (card.dna.extendedPercent / 100) * circumference;
  const metaStroke = (card.dna.metaphoricalPercent / 100) * circumference;

  const donut = `
    <svg viewBox="0 0 120 120" class="sc-donut" aria-label="语义DNA占比环形图">
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#e8dcc6" stroke-width="14" />
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#3f7d5b" stroke-width="14"
              stroke-dasharray="${origStroke} ${circumference}" stroke-dashoffset="0"
              transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#b08a2e" stroke-width="14"
              stroke-dasharray="${extStroke} ${circumference}" stroke-dashoffset="${-origStroke}"
              transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#b3352a" stroke-width="14"
              stroke-dasharray="${metaStroke} ${circumference}" stroke-dashoffset="${-(origStroke + extStroke)}"
              transform="rotate(-90 60 60)" />
      <text x="60" y="57" text-anchor="middle" font-size="9" fill="#8a7d68">感情色彩</text>
      <text x="60" y="72" text-anchor="middle" font-size="13" font-weight="bold" fill="#2c261f">${esc(card.polarity)}</text>
    </svg>
  `;

  return `
  <article class="story-card" aria-label="${esc(card.idiom)}成语故事卡">
    <div class="sc-topline">
      <span class="sc-seal">篆</span>
      <span class="sc-brand">华夏成语字源 · 语义DNA故事卡</span>
      <span class="sc-polarity">${esc(card.polarity)}</span>
    </div>

    <header class="sc-hero">
      <h3 class="sc-idiom">${esc(card.idiom)}</h3>
      <div class="sc-pinyin">${esc(card.pinyin)}</div>
    </header>

    <section class="sc-block sc-modern">
      <h4 class="sc-label">✦ 现代用法</h4>
      <p class="sc-definition">${esc(card.modernDefinition)}</p>
      <p class="sc-syntax">语法角色：${esc(card.syntacticRole)}</p>
    </section>

    <section class="sc-block sc-source">
      <h4 class="sc-label">✦ 典故出处</h4>
      <div class="sc-source-meta">${esc(card.source.book)} · ${esc(card.source.dynasty)} · ${esc(card.source.author)}</div>
      <p class="sc-story">${esc(card.source.story)}</p>
      <blockquote class="sc-quote">${esc(card.source.quote)}</blockquote>
    </section>

    <section class="sc-block sc-dna">
      <h4 class="sc-label">✦ 语义 DNA</h4>
      <div class="sc-dna-body">
        <div class="sc-donut-wrap">${donut}</div>
        <ul class="sc-dna-legend">
          <li><i class="dot dot-orig"></i>本义 <b>${card.dna.originalPercent}%</b></li>
          <li><i class="dot dot-ext"></i>引申义 <b>${card.dna.extendedPercent}%</b></li>
          <li><i class="dot dot-meta"></i>比喻义 <b>${card.dna.metaphoricalPercent}%</b></li>
        </ul>
      </div>
      <div class="sc-bar">
        <span class="bar-orig" style="width:${card.dna.originalPercent}%"></span><span class="bar-ext" style="width:${card.dna.extendedPercent}%"></span><span class="bar-meta" style="width:${card.dna.metaphoricalPercent}%"></span>
      </div>
      <div class="sc-sememes">
        ${card.dna.coreSememes.map(s => `<span class="sc-sememe">${esc(s)}</span>`).join('')}
      </div>
    </section>

    <footer class="sc-footer">
      <span>分享版 · 已脱敏</span>
      <span>与主页面同源 · 校验码 ${card.signature}</span>
    </footer>
  </article>`;
}

/** 故事卡分区（标题 + 操作按钮 + 纵向卡片） */
export function renderStoryCardSection(profile: IdiomProfile): string {
  const card = buildStoryCard(profile);
  return `
  <div class="section-title">
    <span>🖨️ 成语故事卡 · 纵向分享版（可复制 / 可打印）</span>
  </div>
  <div class="story-card-zone">
    <div class="story-card-toolbar">
      <button class="btn-sc" id="btnCopyStoryCard" type="button">📋 复制卡片文字</button>
      <button class="btn-sc" id="btnPrintStoryCard" type="button">🖨️ 打印 / 存为 PDF</button>
    </div>
    ${renderStoryCard(card)}
  </div>`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 降级到 execCommand */
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

function printCard(card: StoryCardData) {
  const holder = document.createElement('div');
  holder.id = 'story-card-print';
  holder.innerHTML = renderStoryCard(card);
  document.body.appendChild(holder);

  const cleanup = () => {
    holder.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  window.print();
  // 部分浏览器不触发 afterprint，延时兜底清理
  window.setTimeout(cleanup, 1000);
}

/** 绑定故事卡的复制 / 打印事件（数据取自当前主页面 profile，非二次录入） */
export function bindStoryCard(container: HTMLElement, profile: IdiomProfile) {
  const card = buildStoryCard(profile);

  container.querySelector('#btnCopyStoryCard')?.addEventListener('click', async () => {
    const btn = container.querySelector('#btnCopyStoryCard') as HTMLButtonElement | null;
    const ok = await copyText(storyCardToPlainText(card));
    if (btn) {
      const original = btn.textContent;
      btn.textContent = ok ? '✓ 已复制，可直接粘贴分享' : '复制失败，请长按选择卡片文字';
      btn.classList.toggle('copy-ok', ok);
      window.setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('copy-ok');
      }, 2000);
    }
  });

  container.querySelector('#btnPrintStoryCard')?.addEventListener('click', () => printCard(card));
}
