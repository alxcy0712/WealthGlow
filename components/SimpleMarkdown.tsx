import React from 'react';

export const SimpleMarkdown = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let inTable = false;
  let tableRows: string[] = [];

  const renderTable = (rows: string[], keyPrefix: number) => {
    if (rows.length < 2) return null;
    
    // Row 0: Header, Row 1: Separator, Row 2+: Body
    const headerCols = rows[0].split('|').map(c => c.trim()).filter(c => c);
    const bodyRows = rows.slice(2).map(r => r.split('|').map(c => c.trim()).filter(c => c));

    return (
      <div key={`table-${keyPrefix}`} className="my-6 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {headerCols.map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-bold text-slate-700 uppercase tracking-wider text-xs whitespace-nowrap">
                  {parseBold(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {bodyRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                {row.map((cell, cellIdx) => (
                   <td key={cellIdx} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                     {parseBold(cell)}
                   </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for Table Lines (starts with |)
    if (line.startsWith('|')) {
      if (!inTable) inTable = true;
      tableRows.push(line);
      continue;
    } else if (inTable) {
      // Table ended
      elements.push(renderTable(tableRows, i));
      inTable = false;
      tableRows = [];
    }

    if (!line) {
      elements.push(<div key={i} className="h-2"></div>);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-md font-bold text-indigo-900 mt-6 mb-2">{line.replace('### ', '')}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg font-bold text-indigo-900 mt-8 mb-3 border-b border-indigo-100 pb-1">{line.replace('## ', '')}</h2>);
    } 
    // Lists
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const text = line.substring(2);
      elements.push(
        <div key={i} className="flex gap-2 ml-2 mb-1">
          <span className="text-indigo-500 mt-1.5 text-[8px] flex-shrink-0">●</span>
          <p className="text-slate-700 leading-relaxed text-sm">
            {parseBold(text)}
          </p>
        </div>
      );
    }
    // Paragraphs
    else {
      elements.push(<p key={i} className="text-slate-700 leading-relaxed text-sm mb-2">{parseBold(line)}</p>);
    }
  }

  // Flush remaining table if exists at end of content
  if (inTable && tableRows.length > 0) {
    elements.push(renderTable(tableRows, lines.length));
  }

  return <div className="space-y-1">{elements}</div>;
};

// Helper to parse **bold** text
const parseBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};
