import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rehypePele } from "./rehype-pele.ts";

interface Node {
	type: string;
	tagName?: string;
	name?: string;
	properties?: Record<string, unknown>;
	children?: Node[];
	value?: string;
}

function mermaidPre(source: string): Node {
	return {
		type: "element",
		tagName: "pre",
		properties: {},
		children: [
			{
				type: "element",
				tagName: "code",
				properties: { className: ["language-mermaid"] },
				children: [{ type: "text", value: source }],
			},
		],
	};
}

function render(tree: Node) {
	rehypePele()(tree as Parameters<ReturnType<typeof rehypePele>>[0]);
}

function svgText(node: Node | undefined): string {
	assert.ok(node);
	assert.equal(node.tagName, "svg");
	return JSON.stringify(node);
}

describe("rehypePele", () => {
	it("renders a mermaid block nested in an MDX JSX component", () => {
		const tree: Node = {
			type: "root",
			children: [
				{
					type: "mdxJsxFlowElement",
					name: "div",
					children: [
						{ type: "text", value: "\n" },
						mermaidPre("flowchart LR\n  A[Nested] --> B[Diagram]\n"),
					],
				},
			],
		};

		render(tree);

		const figure = tree.children?.[0]?.children?.[1];
		assert.equal(figure?.type, "element");
		assert.equal(figure?.tagName, "figure");
		assert.deepEqual(figure?.properties, { className: ["pele-diagram"] });
		const svg = svgText(figure?.children?.[0]);
		assert.match(svg, /Nested/);
		assert.match(svg, /Diagram/);
	});

	it("renders a mermaid block nested through another parent type", () => {
		const tree: Node = {
			type: "root",
			children: [
				{
					type: "mdxJsxFlowElement",
					name: "section",
					children: [
						{
							type: "wrapper",
							children: [mermaidPre("flowchart LR\n  A[Inner] --> B[Ok]")],
						},
					],
				},
			],
		};

		render(tree);

		const figure = tree.children?.[0]?.children?.[0]?.children?.[0];
		assert.equal(figure?.tagName, "figure");
		assert.match(svgText(figure?.children?.[0]), /Inner/);
	});

	it("leaves other code blocks inside JSX alone", () => {
		const code: Node = {
			type: "element",
			tagName: "pre",
			properties: {},
			children: [
				{
					type: "element",
					tagName: "code",
					properties: { className: ["language-ts"] },
					children: [{ type: "text", value: "const x = 1\n" }],
				},
			],
		};
		const tree: Node = {
			type: "root",
			children: [
				{
					type: "mdxJsxFlowElement",
					name: "div",
					children: [code],
				},
			],
		};

		render(tree);

		assert.equal(tree.children?.[0]?.children?.[0]?.tagName, "pre");
	});
});
