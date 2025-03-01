/**
 * @file Markdown utilities
 * @AI-CONTEXT This file contains utilities for converting between Markdown and HTML
 */

import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

/**
 * Convert Markdown to HTML
 * @param markdown Markdown string
 * @returns HTML string
 */
export const markdownToHtml = (markdown: string): string => {
  return md.render(markdown);
};

/**
 * Convert HTML to Markdown
 * @param html HTML string
 * @returns Markdown string
 */
export const htmlToMarkdown = (html: string): string => {
  // 基本的なHTML→Markdown変換
  let markdown = html;
  
  // 見出し
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n');
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n');
  
  // 段落
  markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
  
  // 強調
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
  
  // リスト
  markdown = markdown.replace(/<ul>(.*?)<\/ul>/gs, (match, p1) => {
    return p1.replace(/<li>(.*?)<\/li>/g, '- $1\n');
  });
  
  markdown = markdown.replace(/<ol>(.*?)<\/ol>/gs, (match, p1) => {
    let index = 1;
    return p1.replace(/<li>(.*?)<\/li>/g, () => {
      return `${index++}. $1\n`;
    });
  });
  
  // 引用
  markdown = markdown.replace(/<blockquote>(.*?)<\/blockquote>/gs, '> $1\n\n');
  
  // コード
  markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`');
  markdown = markdown.replace(/<pre><code class="language-(.*?)">(.*?)<\/code><\/pre>/gs, 
    (_, lang, content) => `\`\`\`${lang}\n${content}\n\`\`\``);
  
  // リンク
  markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');
  
  // 画像
  markdown = markdown.replace(/<img src="(.*?)" alt="(.*?)">/g, '![$2]($1)');
  
  // 余分なスペースを削除
  markdown = markdown.replace(/\n\n\n+/g, '\n\n');
  
  return markdown.trim();
};
