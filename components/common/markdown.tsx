import Link from 'next/link';
import React, { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './code-block';

const components: Partial<Components> = {
  // @ts-expect-error
  code: CodeBlock,
  pre: ({ children }) => <>{children}</>,
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-3 sm:ml-4 space-y-1 sm:space-y-2" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-0.5 sm:py-1 leading-relaxed text-foreground" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="list-disc list-outside ml-3 sm:ml-4 space-y-1 sm:space-y-2" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold text-foreground" {...props}>
        {children}
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-500 hover:underline break-words"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3 leading-tight text-foreground" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3 leading-tight text-foreground" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="text-base sm:text-lg md:text-xl font-semibold mt-3 sm:mt-4 md:mt-6 mb-1 sm:mb-2 leading-tight text-foreground" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-sm sm:text-base md:text-lg font-semibold mt-3 sm:mt-4 md:mt-6 mb-1 sm:mb-2 leading-tight text-foreground" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-sm sm:text-base font-semibold mt-3 sm:mt-4 md:mt-6 mb-1 sm:mb-2 leading-tight text-foreground" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-xs sm:text-sm font-semibold mt-3 sm:mt-4 md:mt-6 mb-1 sm:mb-2 leading-tight text-foreground" {...props}>
        {children}
      </h6>
    );
  },
  p: ({ node, children, ...props }) => {
    return (
      <p className="leading-relaxed mb-2 sm:mb-3 break-words text-foreground" {...props}>
        {children}
      </p>
    );
  },
  blockquote: ({ node, children, ...props }) => {
    return (
      <blockquote className="border-l-2 sm:border-l-4 border-gray-300 dark:border-gray-600 pl-3 sm:pl-4 py-1 sm:py-2 my-2 sm:my-4 italic text-gray-700 dark:text-gray-300" {...props}>
        {children}
      </blockquote>
    );
  },
  table: ({ node, children, ...props }) => {
    return (
      <div className="overflow-x-auto my-2 sm:my-4">
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm" {...props}>
          {children}
        </table>
      </div>
    );
  },
  th: ({ node, children, ...props }) => {
    return (
      <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-1 sm:py-2 bg-gray-100 dark:bg-gray-800 font-semibold text-left text-xs sm:text-sm" {...props}>
        {children}
      </th>
    );
  },
  td: ({ node, children, ...props }) => {
    return (
      <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm" {...props}>
        {children}
      </td>
    );
  },
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <div className="text-foreground max-w-none">
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
