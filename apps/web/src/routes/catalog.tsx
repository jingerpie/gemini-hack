// Model catalog: every product photo next to its generated build(THREE) model.
import { Button } from "@gemini-hack/ui/components/button";
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
import { Rail } from "../ui/Rail";

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
		<div className="flex min-h-full flex-wrap items-start gap-4 p-4">
			<Rail />
			<div className="flex max-w-330 min-w-0 flex-[999_1_560px] flex-col gap-6">
				<header className="flex flex-col gap-4 pt-1.5">
					<div className="flex flex-wrap items-end gap-x-5 gap-y-3">
						<div className="min-w-0 flex-[1_1_320px]">
							<h1 className="text-4xl leading-[42px] font-bold tracking-[-1.5px]">
								Model catalog
							</h1>
							<p className="text-muted-foreground mt-1 text-base tracking-[-0.5px]">
								Every product photo next to its generated 3D model.
							</p>
						</div>
						<div className="bg-card flex h-11 items-center gap-2.5 rounded-full px-4 text-sm shadow-[var(--shadow-soft)]">
							<span className="bg-ok size-2 rounded-full" />
							<b className="font-semibold">
								{withModels} of {entries.length}
							</b>
							<span className="text-muted-foreground">
								products have models
							</span>
						</div>
					</div>
					<ToggleGroup
						value={[filter]}
						onValueChange={(v) => v[0] && setFilter(v[0])}
						spacing={2}
						className="flex-wrap"
						aria-label="Filter by kind"
					>
						{["all", ...kinds].map((k) => {
							const of =
								k === "all" ? entries : entries.filter((e) => e.kind === k);
							return (
								<ToggleGroupItem
									key={k}
									value={k}
									className="bg-muted hover:bg-input/70 data-pressed:bg-foreground data-pressed:text-background aria-pressed:bg-foreground aria-pressed:text-background h-9 gap-1.5 rounded-full px-3.5 text-sm font-semibold"
								>
									{k === "all"
										? "All"
										: k.charAt(0).toUpperCase() + k.slice(1).replace("-", " ")}
									<span className="text-xs font-medium opacity-60">
										{of.filter((e) => e.code).length}/{of.length}
									</span>
								</ToggleGroupItem>
							);
						})}
					</ToggleGroup>
				</header>

				<main className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
					{visible.map((it) => (
						<ProductCard
							key={it.index}
							it={it}
							thumb={thumbs[it.index]}
							onOpen={() => setOpenIdx(it.index)}
						/>
					))}
				</main>
			</div>

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
	const tag =
		"absolute bottom-2 left-2 inline-flex h-5.5 items-center rounded-full px-2 text-[10px] font-semibold text-white";
	const card = (
		<div
			className={cn(
				"bg-card flex h-full flex-col overflow-hidden rounded-[20px] shadow-[var(--shadow-soft)] transition-shadow",
				it.code
					? "group-hover/card-btn:shadow-[var(--shadow-float)]"
					: "opacity-60",
			)}
		>
			<div className="grid aspect-[2/1.25] grid-cols-2 gap-1.5 p-1.5">
				<div className="bg-muted relative overflow-hidden rounded-2xl">
					<img
						className="size-full object-cover"
						src={it.img}
						alt=""
						loading="lazy"
					/>
					<span className={cn(tag, "bg-black/60")}>Photo</span>
				</div>
				<div className="text-muted-foreground relative grid place-items-center overflow-hidden rounded-2xl bg-[#eeeef2]">
					{thumb ? (
						<img className="size-full object-contain" src={thumb} alt="" />
					) : (
						<span className="text-xs">
							{thumb === null ? (it.code ? "failed" : "pending") : ""}
						</span>
					)}
					<span className={cn(tag, "bg-primary")}>3D model</span>
				</div>
			</div>
			<div className="flex flex-col gap-0.5 px-4 pt-2 pb-4">
				<div className="flex items-baseline justify-between gap-2">
					<b className="truncate text-base font-semibold tracking-[-0.5px]">
						{it.name}
					</b>
					<span className="text-sm font-semibold">{fmtPrice(it)}</span>
				</div>
				<div className="text-muted-foreground truncate text-xs">
					{it.productType} · {it.vendor} · {meta}
				</div>
			</div>
		</div>
	);
	return it.code ? (
		<button
			type="button"
			onClick={onOpen}
			className="group/card-btn focus-visible:ring-ring block cursor-pointer rounded-[20px] text-left focus-visible:ring-3 focus-visible:outline-none"
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
			className="grid h-[86vh] w-[min(1200px,94vw)] max-w-none grid-cols-[minmax(0,1fr)_340px] gap-0 overflow-hidden rounded-[28px] p-0 sm:max-w-none"
			onKeyDown={(e) => {
				if (e.key === "ArrowLeft") onStep(-1);
				if (e.key === "ArrowRight") onStep(1);
			}}
		>
			<div
				ref={setStage}
				className="m-2 min-h-0 overflow-hidden rounded-[22px] bg-[#eeeef2]"
			/>
			<aside className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4 pt-14 pl-2">
				<img
					className="bg-muted aspect-square w-full rounded-[20px] object-cover"
					src={it.img}
					alt=""
				/>
				<DialogTitle className="text-[28px] leading-8 font-bold tracking-[-1px]">
					{it.name}
				</DialogTitle>
				<dl className="grid grid-cols-[72px_1fr] text-sm">
					{rows.map(([k, v]) => (
						<div key={k} className="contents">
							<dt className="text-muted-foreground border-border border-t py-2.5">
								{k}
							</dt>
							<dd className="border-border border-t py-2.5 font-semibold break-words">
								{v}
							</dd>
						</div>
					))}
				</dl>
				<div className="grid grid-cols-2 gap-2">
					<Button
						variant="secondary"
						className="h-10"
						onClick={() => onStep(-1)}
					>
						<ArrowLeft /> Prev
					</Button>
					<Button
						variant="secondary"
						className="h-10"
						onClick={() => onStep(1)}
					>
						Next <ArrowRight />
					</Button>
				</div>
				<Collapsible>
					<CollapsibleTrigger className="group/code flex cursor-pointer items-center gap-1 text-sm font-semibold">
						<ChevronRight className="size-3.5 transition-transform group-data-panel-open/code:rotate-90" />
						Model code
					</CollapsibleTrigger>
					<CollapsibleContent>
						<pre className="bg-muted mt-2 max-h-80 overflow-auto rounded-2xl p-3 font-mono text-[11px] leading-snug">
							{it.code}
						</pre>
					</CollapsibleContent>
				</Collapsible>
			</aside>
		</DialogContent>
	);
}
