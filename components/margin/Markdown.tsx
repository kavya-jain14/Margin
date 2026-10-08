import { Fragment } from "react";
import { parseMarkdown } from "@/lib/blog/markdown";

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>);
}

/** A deliberately small, safe Markdown renderer. User content never becomes HTML. */
export default function Markdown({text}: {text: string}) {
  return <div className="prose">{parseMarkdown(text).map((block, index) => {
    if (block.type === "heading") return <h2 key={index}>{inline(block.text)}</h2>;
    if (block.type === "quote") return <blockquote key={index}>{inline(block.text)}</blockquote>;
    if (block.type === "list") return <ul key={index}>{block.items.map((item, i) => <li key={i}>{inline(item)}</li>)}</ul>;
    return <p key={index}>{inline(block.text)}</p>;
  })}</div>;
}
