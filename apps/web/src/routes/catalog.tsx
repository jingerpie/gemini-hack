// Model catalog: every product photo next to its generated build(THREE) model.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { mountCatalog } from "../catalog/mount";

export const Route = createFileRoute("/catalog")({ component: CatalogPage });

function CatalogPage() {
	const root = useRef<HTMLDivElement>(null);
	useEffect(() => {
		document.title = "Model Catalog";
		return root.current ? mountCatalog(root.current) : undefined;
	}, []);
	return (
		<div ref={root}>
			<header className="top">
				<div className="title">
					<h1>Model catalog</h1>
					<span id="count" className="count" />
				</div>
				<nav id="kinds" className="kinds" />
			</header>
			<main id="grid" className="grid" />

			<dialog id="viewer" className="viewer">
				<div className="viewer-body">
					<div id="stage" className="stage" />
					<aside className="info">
						<button
							type="button"
							id="close"
							className="close"
							aria-label="Close"
						>
							×
						</button>
						<img id="photo" className="photo" alt="" />
						<h2 id="v-name">Model</h2>
						<dl id="v-meta" className="meta" />
						<div className="nav-row">
							<button type="button" id="prev">
								← Prev
							</button>
							<button type="button" id="next">
								Next →
							</button>
						</div>
						<details className="code">
							<summary>Model code</summary>
							<pre id="v-code" />
						</details>
					</aside>
				</div>
			</dialog>
		</div>
	);
}
