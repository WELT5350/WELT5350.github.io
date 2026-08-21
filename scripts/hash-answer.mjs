// 生成梦境谜题答案的 SHA-256 哈希。
// 用法：node scripts/hash-answer.mjs "答案文本"
// 归一化规则与客户端 answer-gate.ts 保持一致：trim、小写、全角转半角、压缩空白。
import { createHash } from 'node:crypto';

const raw = process.argv[2] ?? 'welt';
const normalized = raw
  .trim()
  .toLowerCase()
  .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
  .replace(/\u3000/g, ' ')
  .replace(/\s+/g, ' ');

console.log(`归一化答案：${normalized}`);
console.log(`SHA-256：${createHash('sha256').update(normalized, 'utf8').digest('hex')}`);
