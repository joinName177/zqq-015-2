import { IdiomProfile } from '../core/models';

/**
 * 成语故事卡生成模块
 * - 纵向分享卡片（竖版）
 * - 包含：出处、现代用法、语义 DNA
 * - 可打印（@media print）、可复制（一键复制纯文本）
 * - 数据与主页面 IdiomProfile 完全一致，不暴露内部 id（脱敏）
 */

function esc(s: string): string {
  return s.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
}

/** 语义 DNA 环形图（浅底卡片配色，与主页面数据一致） */
function buildDnaSvg(profile: IdiomProfile): string {
  const dna = profile.dna;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const origStroke = (dna.originalPercent / 100) * circumference;
  const extStroke = (dna.extendedPercent / 100) * circumference;
  const metaStroke = (dna.metaphoricalPercent / 100) * circumference;
  const extOffset = -origStroke;
  const metaOffset = -(origStroke + extStroke);

  return `
    <svg viewBox="0 0 140 140" width="140" height="140" class="sc-dna-svg">
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#e6dcc6" stroke-width="15" />
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#52b788" stroke-width="15"
              stroke-dasharray="${origStroke} ${circumference}" stroke-dashoffset="0"
              transform="rotate(-90 70 70)" />
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#d4af37" stroke-width="15"
              stroke-dasharray="${extStroke} ${circumference}" stroke-dashoffset="${extOffset}"
              transform="rotate(-90 70 70)" />
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#c93b2b" stroke-width="15"
              stroke-dasharray="${metaStroke} ${circumference}" stroke-dashoffset="${metaOffset}"
              transform="rotate(-90 70 70)" />
      <text x="70" y="66" text-anchor="middle" font-size="10" fill="#9c9285">语义核心</text>
      <text x="70" y="82" text-anchor="middle" font-size="14" font-weight="bold" fill="#2a2520">${esc(dna.polarity)}</text>
    </svg>
  `;
}

/** 生成故事卡 HTML（竖版，浅纸底，可打印） */
export function renderStoryCardHtml(profile: IdiomProfile): string {
  const dna = profile.dna;
  const allusion = profile.allusion;

  return `
    <article class="story-card" id="storyCardPrint" data-idiom="${esc(profile.idiom)}">
      <!-- 页眉 -->
      <header class="sc-header">
        <div class="sc-seal">篆</div>
        <div class="sc-brand">
          <div class="sc-brand-title">华夏文字图谱</div>
          <div class="sc-brand-sub">成语故事卡 · STORY CARD</div>
        </div>
      </header>

      <!-- 成语标题 -->
      <section class="sc-title-section">
        <h2 class="sc-idiom">${esc(profile.idiom)}</h2>
        <div class="sc-pinyin">${esc(profile.pinyin)}</div>
        <div class="sc-polarity-badge ${esc(dna.polarity)}">感情色彩 · ${esc(dna.polarity)}</div>
      </section>

      <!-- 出处 -->
      <section class="sc-section">
        <div class="sc-section-title"><span class="sc-section-icon">📜</span>出 处</div>
        <div class="sc-source-book">${esc(allusion.classicBook)}</div>
        <div class="sc-source-meta">${esc(allusion.dynasty)} · ${esc(allusion.author)}</div>
        <p class="sc-event">${esc(allusion.historicalEvent)}</p>
        <blockquote class="sc-quote">${esc(allusion.originalAncientQuote)}</blockquote>
      </section>

      <!-- 现代用法 -->
      <section class="sc-section">
        <div class="sc-section-title"><span class="sc-section-icon">💡</span>现代用法</div>
        <p class="sc-definition">${esc(profile.modernDefinition)}</p>
        <div class="sc-syntactic">【语法功能】${esc(profile.syntacticRole)}</div>
      </section>

      <!-- 语义 DNA -->
      <section class="sc-section">
        <div class="sc-section-title"><span class="sc-section-icon">🧬</span>语义 DNA</div>
        <div class="sc-dna-row">
          <div class="sc-dna-chart">${buildDnaSvg(profile)}</div>
          <div class="sc-dna-legend">
            <div class="sc-legend-item">
              <span class="sc-legend-dot" style="background:#52b788;"></span>
              <span>文字本义</span>
              <strong style="color:#52b788;">${dna.originalPercent}%</strong>
            </div>
            <div class="sc-legend-item">
              <span class="sc-legend-dot" style="background:#d4af37;"></span>
              <span>情境引申义</span>
              <strong style="color:#d4af37;">${dna.extendedPercent}%</strong>
            </div>
            <div class="sc-legend-item">
              <span class="sc-legend-dot" style="background:#c93b2b;"></span>
              <span>哲学比喻义</span>
              <strong style="color:#c93b2b;">${dna.metaphoricalPercent}%</strong>
            </div>
          </div>
        </div>
        <div class="sc-sememes">
          <div class="sc-sememes-label">核心义原：</div>
          <div class="sc-sememes-tags">
            ${dna.coreSememes.map(s => `<span class="sc-sememe-tag">${esc(s)}</span>`).join('')}
          </div>
        </div>
      </section>

      <!-- 页脚 -->
      <footer class="sc-footer">
        <div class="sc-footer-brand">华夏文字图谱 · 成语字源与语义 DNA</div>
        <div class="sc-footer-sub">数据与主页面一致 · 仅供文化传播分享</div>
      </footer>
    </article>
  `;
}

/** 生成纯文本版故事卡（用于一键复制） */
export function renderStoryCardText(profile: IdiomProfile): string {
  const dna = profile.dna;
  const a = profile.allusion;
  const sememes = dna.coreSememes.join('、');

  return [
    '━━━ 成语故事卡 ━━━',
    '',
    `【${profile.idiom}】`,
    profile.pinyin,
    `感情色彩：${dna.polarity}`,
    '',
    '━━ 出处 ━━',
    a.classicBook,
    `${a.dynasty} · ${a.author}`,
    '',
    a.historicalEvent,
    '',
    `原文：${a.originalAncientQuote}`,
    '',
    '━━ 现代用法 ━━',
    profile.modernDefinition,
    `语法：${profile.syntacticRole}`,
    '',
    '━━ 语义DNA ━━',
    `本义 ${dna.originalPercent}% ｜ 引申义 ${dna.extendedPercent}% ｜ 比喻义 ${dna.metaphoricalPercent}%`,
    `核心义原：${sememes}`,
    '',
    '—— 华夏文字图谱 · 成语字源与语义DNA ——'
  ].join('\n');
}

/** 打开故事卡弹窗（含打印 / 复制按钮） */
export function openStoryCardModal(profile: IdiomProfile): void {
  // 若已存在则移除
  document.getElementById('storyCardModal')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'sc-modal-overlay';
  overlay.id = 'storyCardModal';
  overlay.innerHTML = `
    <div class="sc-modal">
      <div class="sc-modal-actions">
        <button class="sc-action-btn sc-btn-print" id="scBtnPrint" title="打印故事卡">🖨 打印卡片</button>
        <button class="sc-action-btn sc-btn-copy" id="scBtnCopy" title="复制卡片文字">📋 复制文字</button>
        <button class="sc-action-btn sc-btn-close" id="scBtnClose" title="关闭">✕</button>
      </div>
      <div class="sc-modal-body">
        ${renderStoryCardHtml(profile)}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
  };

  overlay.querySelector('#scBtnClose')?.addEventListener('click', close);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', escHandler);
    }
  });

  // 打印
  overlay.querySelector('#scBtnPrint')?.addEventListener('click', () => {
    window.print();
  });

  // 复制纯文本
  const copyBtn = overlay.querySelector('#scBtnCopy') as HTMLButtonElement;
  copyBtn?.addEventListener('click', async () => {
    const text = renderStoryCardText(profile);
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = '✓ 已复制';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = '📋 复制文字';
        copyBtn.classList.remove('copied');
      }, 2000);
    } catch {
      // 降级方案
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        copyBtn.textContent = '✓ 已复制';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = '📋 复制文字';
          copyBtn.classList.remove('copied');
        }, 2000);
      } catch {
        copyBtn.textContent = '复制失败';
      }
      document.body.removeChild(ta);
    }
  });
}
