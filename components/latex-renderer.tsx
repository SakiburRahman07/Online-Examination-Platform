"use client";

import { useEffect, useRef } from "react";
import katex from "katex";

interface LatexRendererProps {
  content: string;
  className?: string;
}

export function LatexRenderer({ content, className = "" }: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Process the content to render LaTeX
    let processedContent = content;

    // Replace display math ($$...$$)
    processedContent = processedContent.replace(
      /\$\$([\s\S]*?)\$\$/g,
      (_, math) => {
        try {
          return `<div class="my-4">${katex.renderToString(math.trim(), {
            displayMode: true,
            throwOnError: false,
          })}</div>`;
        } catch {
          return `<div class="text-red-500">Error rendering: ${math}</div>`;
        }
      }
    );

    // Replace inline math ($...$)
    processedContent = processedContent.replace(
      /\$([^$\n]+)\$/g,
      (_, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: false,
            throwOnError: false,
          });
        } catch {
          return `<span class="text-red-500">Error: ${math}</span>`;
        }
      }
    );

    // Replace escaped backslashes for LaTeX commands
    processedContent = processedContent.replace(/\\frac/g, "\\frac");
    processedContent = processedContent.replace(/\\sqrt/g, "\\sqrt");
    processedContent = processedContent.replace(/\\sum/g, "\\sum");
    processedContent = processedContent.replace(/\\int/g, "\\int");

    containerRef.current.innerHTML = processedContent;
  }, [content]);

  return <div ref={containerRef} className={className} />;
}

// Simpler version for just text with inline LaTeX
export function InlineLatex({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    let text = children;
    
    // Replace inline math
    text = text.replace(/\$([^$\n]+)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        return math;
      }
    });

    ref.current.innerHTML = text;
  }, [children]);

  return <span ref={ref} />;
}
