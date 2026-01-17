import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function TypewriterMarkdown({ content = "", speed = 5 }) {
  const [displayedContent, setDisplayedContent] = useState("");
  const indexRef = useRef(0);

  // Reset when the actual content prop changes (e.g. new AI response)
  useEffect(() => {
    setDisplayedContent("");
    indexRef.current = 0;
  }, [content]);

  useEffect(() => {
    // If we have displayed everything, stop.
    if (indexRef.current >= content.length) return;

    const timer = setInterval(() => {
      indexRef.current += 1;
      // Slice is safer than appending to prevent character skipping
      setDisplayedContent(content.slice(0, indexRef.current));
      
      if (indexRef.current >= content.length) {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [content, speed, displayedContent]); // Re-run effect to keep typing

  return (
    <div className="markdown-container text-sm leading-relaxed text-slate-300">
      <ReactMarkdown
        components={{
          // Style Code Blocks
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <div className="rounded-md overflow-hidden my-2 border border-slate-700">
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                  customStyle={{ margin: 0, fontSize: '0.75rem' }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-slate-800 text-blue-300 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            )
          },
          // Style Headings
          h1: ({children}) => <h1 className="text-lg font-bold text-white mt-4 mb-2">{children}</h1>,
          h2: ({children}) => <h2 className="text-base font-bold text-blue-400 mt-3 mb-1">{children}</h2>,
          h3: ({children}) => <h3 className="text-sm font-bold text-emerald-400 mt-2">{children}</h3>,
          // Style Lists
          ul: ({children}) => <ul className="list-disc list-outside ml-4 space-y-1 my-2">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal list-outside ml-4 space-y-1 my-2">{children}</ol>,
          li: ({children}) => <li className="text-slate-300">{children}</li>,
          // Style Paragraphs
          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
        }}
      >
        {displayedContent}
      </ReactMarkdown>
    </div>
  );
}