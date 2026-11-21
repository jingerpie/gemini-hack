import { Undo2 } from "lucide-react";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { manager } from "./lib/studio";
import type { Engine, Voice, VoiceHandlers, VoiceState } from "./types";
import { DebugPanel } from "./ui/DebugPanel";
import { Header } from "./ui/Hud";
import { glass, Hint } from "./ui/parts";
import { Rail, railButton } from "./ui/Rail";
import { RenderOverlay } from "./ui/RenderOverlay";
import { Sidebar } from "./ui/Sidebar";
import { LiveCaption, TalkButton } from "./ui/Voice";

// ?mock=1 → mock engine + api + voice.  ?mock=api → real 3D engine, mock api + voice.  (none) → all real.
const MOCK_MODE = new URLSearchParams(location.search).get("mock");
const MOCK = MOCK_MODE != null && MOCK_MODE !== "0";

type Factories = {
	createEngine: (el: HTMLElement) => Engine;
	createVoice: (h: VoiceHandlers) => Voice;
};

let factoriesPromise: Promise<Factories> | null = null;
function loadFactories(): Promise<Factories> {
	if (!factoriesPromise) {
		factoriesPromise =
			MOCK_MODE === "api"
				? // real 3D engine, mock server + scripted voice
					Promise.all([
						import("./scene/engine"),
						import("./lib/mockVoice"),
						import("./lib/mockApi"),
					]).then(([e, v, a]) => {
						manager.setApi(a.createMockApi());
						return {
							createEngine: e.createEngine,
							createVoice: v.createMockVoice,
						};
					})
				: MOCK
					? Promise.all([
							import("./lib/mockEngine"),
							import("./lib/mockVoice"),
							import("./lib/mockApi"),
						]).then(([e, v, a]) => {
							manager.setApi(a.createMockApi());
							return {
								createEngine: e.createMockEngine,
								createVoice: v.createMockVoice,
							};
						})
					: import("./lib/realModules").then((m) => {
							manager.setApi(m.httpApi);
							return {
								createEngine: m.createEngine,
								createVoice: m.createVoice,
							};
						});
	}
	return factoriesPromise;
}

export type ChipState = "idle" | "connecting" | "listening" | "fallback";
type Hover = {
	id: string;
	name: string;
	kind: "object" | "decal" | "surface";
} | null;
type HoverEngine = Engine & { onHover?(fn: (h: Hover) => void): () => void };

export default function App() {
	const state = useSyncExternalStore(manager.subscribe, manager.getSnapshot);
	const viewportRef = useRef<HTMLDivElement>(null);
	const [engineError, setEngineError] = useState<string | null>(null);
	const [engineReady, setEngineReady] = useState(false);
	const [hover, setHover] = useState<Hover>(null);
	const [voiceState, setVoiceState] = useState<VoiceState>("idle");
	const [voiceDetail, setVoiceDetail] = useState<string>("");
	const levelRef = useRef(0);
	const voiceRef = useRef<Voice | null>(null);

	// ---- engine: created once per mount; StrictMode's mount→unmount→mount disposes the first one ----
	useEffect(() => {
		let cancelled = false;
		let engine: Engine | null = null;
		let offHover: (() => void) | undefined;
		loadFactories()
			.then((f) => {
				if (cancelled || !viewportRef.current) return;
				engine = f.createEngine(viewportRef.current);
				manager.attachEngine(engine);
				offHover = (engine as HoverEngine).onHover?.((h) =>
					setHover(h ? { ...h } : null),
				);
				setEngineReady(true);
			})
			.catch((err) => {
				console.error(err);
				if (!cancelled) setEngineError(String(err?.message ?? err));
			});
		return () => {
			cancelled = true;
			offHover?.();
			if (engine) {
				manager.attachEngine(null);
				try {
					engine.dispose();
				} catch {
					/* ignore */
				}
			}
		};
	}, []);

	// ---- voice ----
	useEffect(() => {
		return () => {
			voiceRef.current?.stop();
			voiceRef.current = null;
		};
	}, []);

	const startVoice = useCallback(async () => {
		try {
			const f = await loadFactories();
			if (!voiceRef.current) {
				voiceRef.current = f.createVoice({
					onInterim: (t) => manager.setInterim(t),
					onUtterance: (t) => manager.utterance(t),
					onState: (s, detail) => {
						setVoiceState(s);
						setVoiceDetail(detail ?? "");
						if (s === "listening") manager.startClock();
						if (s !== "listening") levelRef.current = 0;
					},
					onLevel: (rms) => {
						levelRef.current = rms;
					},
				});
			}
			manager.startClock();
			await voiceRef.current.start();
		} catch (err) {
			console.error(err);
			setVoiceState("error");
			setVoiceDetail(String((err as Error)?.message ?? err));
		}
	}, []);

	const stopVoice = useCallback(() => {
		voiceRef.current?.stop();
		setVoiceState("idle");
		levelRef.current = 0;
		manager.setInterim("");
	}, []);

	const listening = voiceState === "listening" || voiceState === "connecting";
	const toggleVoice = useCallback(() => {
		if (listening) stopVoice();
		else void startVoice();
	}, [listening, startVoice, stopVoice]);

	// ---- keyboard ----
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const el = document.activeElement as HTMLElement | null;
			const typing =
				!!el &&
				(el.tagName === "INPUT" ||
					el.tagName === "TEXTAREA" ||
					el.isContentEditable);
			if (
				(e.ctrlKey || e.metaKey) &&
				!e.shiftKey &&
				e.key.toLowerCase() === "z" &&
				!typing
			) {
				e.preventDefault();
				manager.undo();
			} else if (e.code === "Space" && !typing && !e.repeat) {
				e.preventDefault();
				toggleVoice();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [toggleVoice]);

	const closeRender = useCallback(() => manager.showRender(null), []);

	const chip: ChipState =
		voiceState === "error"
			? "fallback"
			: voiceState === "connecting"
				? "connecting"
				: voiceState === "listening"
					? "listening"
					: "idle";

	const stats = useMemo(() => {
		const ms = state.patchMs;
		const last = ms.length ? ms[ms.length - 1] : null;
		const sorted = ms.slice().sort((a, b) => a - b);
		const median = sorted.length
			? sorted[Math.floor((sorted.length - 1) / 2)]
			: null;
		const jobs = state.tasks.filter(
			(t) =>
				t.kind !== "patch" && (t.status === "running" || t.status === "queued"),
		).length;
		return { last, median, jobs };
	}, [state.patchMs, state.tasks]);

	return (
		<div className="flex min-h-screen w-full flex-wrap items-start gap-4 p-4">
			<Rail
				extra={
					<Hint label="Undo (Ctrl+Z)" side="right">
						<button
							type="button"
							aria-label="Undo"
							className={railButton}
							onClick={() => manager.undo()}
						>
							<Undo2 />
						</button>
					</Hint>
				}
			/>
			<main className="flex min-w-0 flex-[999_1_560px] flex-col gap-3">
				<Header
					chip={chip}
					chipDetail={voiceDetail}
					mock={MOCK}
					onNewRoom={() => manager.newRoom()}
					onRender={() => manager.render()}
					rendering={state.tasks.some(
						(t) => t.kind === "render" && t.status === "running",
					)}
				/>
				<section
					aria-label="Room"
					className="relative h-[clamp(360px,58vh,640px)] overflow-hidden rounded-[28px] bg-[#ece8e2] shadow-[var(--shadow-soft)]"
				>
					<div className="absolute inset-0" ref={viewportRef} />
					{!engineReady && (
						<div className="text-muted-foreground pointer-events-none absolute inset-0 grid place-content-center gap-1.5 text-center">
							{engineError ? (
								<>
									<b className="text-bad font-semibold">
										3D engine failed to load
									</b>
									<span>{engineError}</span>
								</>
							) : (
								<span className="animate-breathe">Loading room…</span>
							)}
						</div>
					)}
					{hover && engineReady && !state.render && (
						<div
							className={`${glass} animate-in fade-in pointer-events-none absolute bottom-4 left-4 inline-flex h-8 items-center gap-2 rounded-full px-3.5 text-xs duration-150`}
							aria-live="off"
						>
							<span className="text-muted-foreground">Pointing at</span>
							<span className="text-foreground max-w-65 truncate font-semibold">
								{hover.name}
							</span>
						</div>
					)}
					{!state.render && (
						<div className="absolute bottom-5 left-1/2 -translate-x-1/2">
							<TalkButton
								chip={chip}
								listening={listening}
								levelRef={levelRef}
								onToggle={toggleVoice}
							/>
						</div>
					)}
					{state.render && (
						<RenderOverlay view={state.render} onClose={closeRender} />
					)}
				</section>
				<LiveCaption
					state={state}
					chip={chip}
					listening={listening}
					levelRef={levelRef}
					onSend={(text) => manager.utterance(text)}
				/>
				<DebugPanel
					state={state}
					manager={manager}
					stats={stats}
					onSend={(text) => manager.utterance(text)}
				/>
			</main>
			<div className="flex min-w-0 flex-[1_1_340px] self-stretch lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:max-w-105">
				<Sidebar state={state} manager={manager} />
			</div>
		</div>
	);
}
