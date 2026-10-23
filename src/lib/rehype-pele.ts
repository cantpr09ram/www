import { fromHtml } from "hast-util-from-html";
import { PeleError, render } from "pele";

interface HastElement {
	type: "element";
	tagName: string;
	properties?: Record<string, unknown>;
	children: HastContent[];
}

type HastContent =
	| HastElement
	| { type: "text"; value: string }
	| { type: string; children?: HastContent[] };

interface HastParent {
	children: HastContent[];
}

function isElement(node: HastContent): node is HastElement {
	return node.type === "element";
}

function classNames(node: HastElement): string[] {
	const { className } = node.properties ?? {};
	if (typeof className === "string") return className.split(/\s+/);
	if (Array.isArray(className)) return className.map(String);
	return [];
}

function textContent(node: HastElement): string {
	let value = "";
	for (const child of node.children) {
		if (child.type === "text" && "value" in child) value += child.value;
		else if (isElement(child)) value += textContent(child);
	}
	return value;
}

function renderDiagram(source: string, idPrefix: string): HastElement {
	let svg: string;
	try {
		svg = render(source, {
			idPrefix,
			fontFamily: "TASA Explorer, Iansui, sans-serif",
			fontFamilyMono: "JetBrains Mono, ui-monospace, monospace",
		}).svg;
	} catch (error) {
		if (!(error instanceof PeleError)) throw error;
		const where = error.line > 0 ? ` (${error.line}:${error.column})` : "";
		throw new Error(
			`Could not render mermaid diagram${where}: ${error.message}`,
		);
	}

	const svgNode = fromHtml(svg, { fragment: true }).children.find(
		(child) => child.type === "element",
	);
	if (!svgNode) throw new Error("Pele returned an empty diagram.");
	return svgNode as HastElement;
}

function isParent(node: HastContent): node is HastContent & HastParent {
	return "children" in node && Array.isArray(node.children);
}

function isMermaidBlock(node: HastContent): node is HastElement {
	if (
		!isElement(node) ||
		node.tagName !== "pre" ||
		node.children.length !== 1
	) {
		return false;
	}
	const code = node.children[0];
	return (
		!!code &&
		isElement(code) &&
		code.tagName === "code" &&
		classNames(code).includes("language-mermaid")
	);
}

function replaceMermaid(node: HastParent, nextId: () => string) {
	for (const child of node.children) {
		// MDX keeps JSX components as `mdxJsxFlowElement` (and other non-element
		// parents). Recurse into every parent so nested fences are still rendered.
		if (!isParent(child)) continue;
		if (isMermaidBlock(child)) {
			const code = child.children[0];
			if (!code || !isElement(code)) continue;
			child.tagName = "figure";
			child.properties = { className: ["pele-diagram"] };
			child.children = [renderDiagram(textContent(code).trim(), nextId())];
			continue;
		}
		replaceMermaid(child, nextId);
	}
}

/** Renders ```mermaid fences to themed SVG at build time. */
export function rehypePele() {
	return (tree: HastParent) => {
		let count = 0;
		replaceMermaid(tree, () => `diagram-${++count}`);
	};
}
