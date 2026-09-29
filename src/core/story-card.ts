import { IdiomProfile } from './models';

/**
 * 成语故事卡（分享视图模型）
 * 该模型由主页面同一份 IdiomProfile 派生，不持有任何独立数据源，
 * 从结构上保证卡片内容与主页面数据同源一致。
 * 同时剔除内部 id / 时间戳等技术字段，所有文本经脱敏管道处理。
 */
export interface StoryCardData {
  idiom: string;
  pinyin: string;
  polarity: string;
  modernDefinition: string;
  syntacticRole: string;
  source: {
    book: string;
    dynasty: string;
    author: string;
    story: string;
    quote: string;
  };
  dna: {
    originalPercent: number;
    extendedPercent: number;
    metaphoricalPercent: number;
    coreSememes: string[];
  };
  /** 主页面关键字段的校验指纹，用于人工核验卡片与主页面数据一致 */
  signature: string;
}

// ---------------------------------------------------------------------------
// 脱敏（desensitization）
// ---------------------------------------------------------------------------

/** 去除不可见/控制字符、HTML 标签、压缩空白 */
function normalize(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '') // 防止用户输入中夹带标记
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '') // C0 控制字符
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '') // 零宽 / 双向控制字符 / BOM
    .replace(/[ 　\t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

/**
 * 个人敏感信息（PII）屏蔽：
 * 手机号、身份证号、长串银行卡号、邮箱、网址一律替换为 ***。
 * 古代纪年数字（如“公元前 230 年”）位数短，不受影响。
 */
function redactPii(text: string): string {
  return text
    .replace(/https?:\/\/[^\s，。、；！？]+/gi, '***')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '***')
    .replace(/(?<![0-9A-Za-z])1[3-9]\d{9}(?![0-9A-Za-z])/g, '***') // 手机号
    .replace(/(?<![0-9A-Za-z])\d{17}[\dXx](?![0-9A-Za-z])/g, '***') // 身份证
    .replace(/(?<![0-9A-Za-z])\d{15,19}(?![0-9A-Za-z])/g, '***'); // 银行卡等长数字
}

/** 统一脱敏出口：规范化 → PII 屏蔽 → 截断 */
function safe(value: unknown, maxLength: number): string {
  return redactPii(normalize(value, maxLength));
}

function clampPercent(value: unknown): number {
  const n = Math.round(Number(value) || 0);
  return Math.max(0, Math.min(100, n));
}

// ---------------------------------------------------------------------------
// 同源校验指纹（FNV-1a）
// ---------------------------------------------------------------------------

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function profileSignature(profile: IdiomProfile): string {
  return fnv1a(
    [
      profile.idiom,
      profile.pinyin,
      profile.modernDefinition,
      profile.syntacticRole,
      profile.allusion.classicBook,
      profile.allusion.dynasty,
      profile.allusion.author,
      profile.allusion.originalAncientQuote,
      profile.dna.originalPercent,
      profile.dna.extendedPercent,
      profile.dna.metaphoricalPercent,
      profile.dna.polarity,
      profile.dna.coreSememes.join(',')
    ].join('|')
  );
}

// ---------------------------------------------------------------------------
// 构建 / 导出
// ---------------------------------------------------------------------------

export function buildStoryCard(profile: IdiomProfile): StoryCardData {
  return {
    idiom: safe(profile.idiom, 8),
    pinyin: safe(profile.pinyin, 64),
    polarity: safe(profile.dna.polarity, 4),
    modernDefinition: safe(profile.modernDefinition, 140),
    syntacticRole: safe(profile.syntacticRole, 60),
    source: {
      book: safe(profile.allusion.classicBook, 40),
      dynasty: safe(profile.allusion.dynasty, 30),
      author: safe(profile.allusion.author, 30),
      story: safe(profile.allusion.historicalEvent, 240),
      quote: safe(profile.allusion.originalAncientQuote, 160)
    },
    dna: {
      originalPercent: clampPercent(profile.dna.originalPercent),
      extendedPercent: clampPercent(profile.dna.extendedPercent),
      metaphoricalPercent: clampPercent(profile.dna.metaphoricalPercent),
      coreSememes: Array.from(
        profile.dna.coreSememes.reduce((set, s) => {
          const v = safe(s, 8);
          if (v) set.add(v);
          return set;
        }, new Set<string>())
      ).slice(0, 6)
    },
    signature: profileSignature(profile).slice(0, 6)
  };
}

/** 转为可直接粘贴到聊天 / 社交平台的纯文本 */
export function storyCardToPlainText(card: StoryCardData): string {
  return [
    `【成语故事卡】${card.idiom}　${card.pinyin}`,
    '',
    `〖现代用法〗`,
    card.modernDefinition,
    `语法：${card.syntacticRole}｜感情色彩：${card.polarity}`,
    '',
    `〖典故出处〗`,
    `${card.source.book} · ${card.source.dynasty} · ${card.source.author}`,
    card.source.story,
    card.source.quote ? `原文：${card.source.quote}` : '',
    '',
    `〖语义 DNA〗`,
    `本义 ${card.dna.originalPercent}% ｜ 引申义 ${card.dna.extendedPercent}% ｜ 比喻义 ${card.dna.metaphoricalPercent}%`,
    `核心义原：${card.dna.coreSememes.join(' / ')}`,
    '',
    `——华夏成语字源与语义DNA图谱（分享版 · 已脱敏 · 同源校验 ${card.signature}）`
  ]
    .filter(line => line !== '')
    .join('\n');
}
