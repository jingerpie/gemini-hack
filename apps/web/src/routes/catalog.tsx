// Model catalog: every product photo next to its generated build(THREE) model.
import { Button } from "@gemini-hack/ui/components/button";
import { Card } from "@gemini-hack/ui/components/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@gemini-hack/ui/components/collapsible";
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@gemini-hack/ui/components/dialog";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@gemini-hack/ui/components/toggle-group";
import { cn } from "@gemini-hack/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	entries,
	fmtPrice,
	fmtSize,
	type Item,
	kinds,
	modelRel,
} from "../catalog/data";
import { build, createThumbnailer, createViewer } from "../catalog/render";

export const Route = createFileRoute("/catalog")({ component: CatalogPage });

const withModels = entries.filter((e) => e.code).length;

function CatalogPage() {
	const [filter, setFilter] = useState("all");
	const [openIdx, setOpenIdx] = useState<number | null>(null);
	const visible = useMemo(
		() => entries.filter((e) => filter === "all" || e.kind === filter),
		[filter],
	);
	const thumbs = useThumbnails(visible);

	useEffect(() => {
		document.title = "Model Catalog";
	}, []);

	const step = (dir: number) => {
		const list = visible.filter((e) => e.code).map((e) => e.index);
		if (!list.length || openIdx == null) return;
		const pos = list.indexOf(openIdx);
		setOpenIdx(list[(pos + dir + list.length) % list.length]);
	};

	return (
		<div className="min-h-full">
			<header className="border-border bg-background/90 sticky top-0 z-10 border-b px-5 pt-3.5 pb-3 backdrop-blur-sm">
				<div className="mb-2.5 flex items-baseline gap-3">
					<h1 className="text-[17px] font-semibold tracking-tight">
						Model catalog
					</h1>
					<span className="text-muted-foreground">
						{withModels} of {entries.length} products have models
					</span>
				</div>
				<ToggleGroup
					value={[filter]}
					onValueChange={(v) => v[0] && setFilter(v[0])}
					spacing={1.5}
					className="flex-wrap"
				>
					{["all", ...kinds].map((k) => {
						const of =
							k === "all" ? entries : entries.filter((e) => e.kind === k);
						return (
							<ToggleGroupItem
								key={k}
								value={k}
								className="border-border bg-card text-text-2 data-pressed:border-asset data-pressed:bg-asset h-7 rounded-full border px-2.5 text-[13px] data-pressed:text-white"
							>
								{k}
								<span className="ml-0.5 text-[11px] opacity-70">
									{of.filter((e) => e.code).length}/{of.length}
								</span>
							</ToggleGroupItem>
						);
					})}
				</ToggleGroup>
			</header>

			<main className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3.5 p-5">
				{visible.map((it) => (
					<ProductCard
						key={it.index}
						it={it}
						thumb={thumbs[it.index]}
						onOpen={() => setOpenIdx(it.index)}
					/>
				))}
			</main>

			<Dialog
				open={openIdx != null}
				onOpenChange={(open) => !open && setOpenIdx(null)}
			>
				{openIdx != null && <Viewer it={entries[openIdx]} onStep={step} />}
			</Dialog>
		</div>
	);
}

/** Thumbnails rendered a few per frame so the page stays responsive; keyed by entry index. */
function useThumbnails(list: Item[]) {
	const [thumbs, setThumbs] = useState<Record<number, string | null>>({});
	const done = useRef(thumbs);
	done.current = thumbs;
	useEffect(() => {
		const t = createThumbnailer();
		const todo = list.filter((it) => !(it.index in done.current));
		let i = 0;
		let raf = 0;
		const tick = () => {
			const batch: Record<number, string | null> = {};
			for (const end = Math.min(i + 3, todo.length); i < end; i++)
				batch[todo[i].index] = todo[i].code ? t.thumbnail(todo[i]) : null;
			setThumbs((prev) => ({ ...prev, ...batch }));
			if (i < todo.length) raf = requestAnimationFrame(tick);
		};
		if (todo.length) raf = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(raf);
			t.dispose();
		};
	}, [list]);
	return thumbs;
}

function ProductCard({
	it,
	thumb,
	onOpen,
}: {
	it: Item;
	thumb: string | null | undefined;
	onOpen(): void;
}) {
	const b = it.code ? build(it) : null;
	const meta =
		b && !("error" in b)
			? `${fmtSize(b.size)} · ${b.meshes} meshes`
			: b && "error" in b
				? `error: ${b.error}`
				: "not generated yet";
	const card = (
		<Card
			className={cn(
				"ring-border h-full gap-0 rounded-xl py-0 transition-shadow",
				it.code ? "group-hover/card-btn:ring-input" : "opacity-60",
			)}
		>
			<div className="grid aspect-[2/1.25] grid-cols-2">
				<img
					className="size-full object-cover"
					src={it.img}
					alt=""
					loading="lazy"
				/>
				<div className="text-muted-foreground grid place-items-center bg-[#1a1c21]">
					{thumb ? (
						<img className="size-full object-contain" src={thumb} alt="" />
					) : (
						<span className="text-xs">
							{thumb === null ? (it.code ? "failed" : "pending") : ""}
						</span>
					)}
				</div>
			</div>
			<div className="px-3 py-2.5">
				<div className="flex items-baseline justify-between gap-2">
					<b className="truncate font-semibold">{it.name}</b>
					<span className="text-muted-foreground">{it.kind}</span>
				</div>
				<div className="text-muted-foreground">{meta}</div>
			</div>
		</Card>
	);
	return it.code ? (
		<button
			type="button"
			onClick={onOpen}
			className="group/card-btn focus-visible:ring-ring block cursor-pointer rounded-xl text-left focus-visible:ring-2 focus-visible:outline-none"
		>
			{card}
		</button>
	) : (
		card
	);
}

function Viewer({ it, onStep }: { it: Item; onStep(dir: number): void }) {
	const [stage, setStage] = useState<HTMLDivElement | null>(null);
	const viewer = useRef<ReturnType<typeof createViewer> | null>(null);
	useEffect(() => {
		if (!stage) return;
		viewer.current = createViewer(stage);
		return () => {
			viewer.current?.dispose();
			viewer.current = null;
		};
	}, [stage]);
	useEffect(() => {
		if (stage) viewer.current?.show(it);
	}, [it, stage]);

	const b = build(it);
	const rows: [string, string][] = [
		["Kind", it.kind],
		["Type", it.productType],
		["Vendor", it.vendor],
		["Price", fmtPrice(it)],
		...("error" in b
			? []
			: ([
					["Size", fmtSize(b.size)],
					["Meshes", String(b.meshes)],
				] as [string, string][])),
		["File", modelRel(it)],
	];
	return (
		<DialogContent
			className="grid h-[86vh] w-[min(1200px,94vw)] max-w-none grid-cols-[minmax(0,1fr)_320px] gap-0 overflow-hidden rounded-xl p-0 sm:max-w-none"
			onKeyDown={(e) => {
				if (e.key === "ArrowLeft") onStep(-1);
				if (e.key === "ArrowRight") onStep(1);
			}}
		>
			<div ref={setStage} className="min-h-0 bg-[#1a1c21]" />
			<aside className="border-border flex min-h-0 flex-col gap-3 overflow-y-auto border-l p-4 pt-11">
				<img
					className="aspect-square w-full rounded-lg bg-white object-contain"
					src={it.img}
					alt=""
				/>
				<DialogTitle className="text-[15px] font-semibold">
					{it.name}
				</DialogTitle>
				<dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
					{rows.map(([k, v]) => (
						<div key={k} className="contents">
							<dt className="text-muted-foreground">{k}</dt>
							<dd className="break-words">{v}</dd>
						</div>
					))}
				</dl>
				<div className="grid grid-cols-2 gap-2">
					<Button
						variant="outline"
						className="rounded-md"
						onClick={() => onStep(-1)}
					>
						<ArrowLeft /> Prev
					</Button>
					<Button
						variant="outline"
						className="rounded-md"
						onClick={() => onStep(1)}
					>
						Next <ArrowRight />
					</Button>
				</div>
				<Collapsible>
					<CollapsibleTrigger className="group/code flex cursor-pointer items-center gap-1 text-[13px]">
						<ChevronRight className="size-3.5 transition-transform group-data-panel-open/code:rotate-90" />
						Model code
					</CollapsibleTrigger>
					<CollapsibleContent>
						<pre className="bg-muted mt-2 max-h-80 overflow-auto rounded-md p-2 font-mono text-[11px] leading-snug">
							{it.code}
						</pre>
					</CollapsibleContent>
				</Collapsible>
			</aside>
		</DialogContent>
	);
}
