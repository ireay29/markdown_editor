import React, { useMemo, useEffect, useState } from 'react';
import { marked } from 'marked';
import { useEditorStore } from '../../store/editorStore';

// カスタムレンダラーの設定
const renderer = new marked.Renderer();

// コードブロックのカスタムレンダリング
renderer.code = (code: string, language?: string) => {
  const validLanguage = language && language.match(/^[a-zA-Z0-9_+-]*$/);
  return `<pre class="bg-secondary-100 dark:bg-secondary-800 rounded p-4 overflow-x-auto"><code class="language-${validLanguage ? language : ''}">${marked.parse(code, { breaks: false })}</code></pre>`;
};

// インラインコードのカスタムレンダリング
renderer.codespan = (text: string) => {
  return `<code class="bg-secondary-100 dark:bg-secondary-800 px-1 py-0.5 rounded text-sm">${text}</code>`;
};

// リンクのカスタムレンダリング（セキュリティ対応）
renderer.link = (href: string | null, title: string | null, text: string) => {
  const cleanHref = href?.replace(/[<>"]/g, '') || '#';
  const cleanTitle = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';
  return `<a href="${cleanHref}" class="text-primary-600 dark:text-primary-400 hover:underline" target="_blank" rel="noopener noreferrer"${cleanTitle}>${text}</a>`;
};

// テーブルのカスタムレンダリング
renderer.table = (header: string, body: string) => {
  return `<div class="overflow-x-auto my-4">
    <table class="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
      <thead class="bg-secondary-50 dark:bg-secondary-800">
        ${header}
      </thead>
      <tbody class="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
        ${body}
      </tbody>
    </table>
  </div>`;
};

// Markedの設定
marked.setOptions({
  renderer: renderer,
  highlight: null,
  langPrefix: 'language-',
  pedantic: false,
  gfm: true,
  breaks: true,
  sanitize: false,
  smartypants: false,
  xhtml: false,
});

export const MarkdownRenderer: React.FC = () => {
  const { content } = useEditorStore();
  const [renderedHtml, setRenderedHtml] = useState('');

  useEffect(() => {
    const renderMarkdown = async () => {
      try {
        const html = await marked.parse(content || '');
        setRenderedHtml(html);
      } catch (error) {
        console.error('Markdown rendering error:', error);
        setRenderedHtml('<div class="text-red-500 p-4 border border-red-300 rounded bg-red-50 dark:bg-red-900/20 dark:border-red-700">Markdownの表示でエラーが発生しました</div>');
      }
    };

    renderMarkdown();
  }, [content]);

  return (
    <div className="markdown-preview">
      {/* プレビューヘッダー */}
      <div className="border-b border-secondary-200 dark:border-secondary-700 pb-2 mb-4">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          プレビュー
        </h3>
      </div>

      {/* レンダリング結果 */}
      <div 
        className="prose prose-sm dark:prose-invert max-w-none
          prose-headings:text-secondary-900 dark:prose-headings:text-secondary-100
          prose-p:text-secondary-700 dark:prose-p:text-secondary-300
          prose-a:text-primary-600 dark:prose-a:text-primary-400
          prose-strong:text-secondary-900 dark:prose-strong:text-secondary-100
          prose-code:text-secondary-900 dark:prose-code:text-secondary-100
          prose-pre:bg-secondary-100 dark:prose-pre:bg-secondary-800
          prose-blockquote:border-l-primary-500 dark:prose-blockquote:border-l-primary-400
          prose-hr:border-secondary-300 dark:prose-hr:border-secondary-600"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
};