export type MarkdownBlock = {type: "paragraph" | "heading" | "quote"; text: string} | {type: "list"; items: string[]};

export function parseMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let previousLineType: "list" | "quote" | undefined;
  const flush = () => {if (paragraph.length) {blocks.push({type: "paragraph", text: paragraph.join("\n")}); paragraph = [];}};
  for (const line of source.replace(/\r\n?/g, "\n").split("\n")) {
    if (!line.trim()) {flush(); previousLineType = undefined; continue;}
    const heading = line.match(/^#{1,2}\s+(.+)$/);
    if (heading) {flush(); blocks.push({type: "heading", text: heading[1]}); previousLineType = undefined; continue;}
    if (/^-\s+/.test(line)) {
      flush();
      const previous = blocks[blocks.length - 1];
      const item = line.replace(/^-\s+/, "");
      if (previousLineType === "list" && previous?.type === "list") previous.items.push(item);
      else blocks.push({type: "list", items: [item]});
      previousLineType = "list";
      continue;
    }
    if (/^>\s?/.test(line)) {
      flush();
      const previous = blocks[blocks.length - 1];
      const text = line.replace(/^>\s?/, "");
      if (previousLineType === "quote" && previous?.type === "quote") previous.text += `\n${text}`;
      else blocks.push({type: "quote", text});
      previousLineType = "quote";
      continue;
    }
    previousLineType = undefined;
    paragraph.push(line);
  }
  flush();
  return blocks;
}
