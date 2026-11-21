export type Support = {
	y: number;
	x0: number;
	x1: number;
	z0: number;
	z1: number;
	area: number;
	fill: number;
	clear: number | null;
	mask?: { w: number; h: number; bits: string };
};
export declare function findSupports(THREE: unknown, root: unknown): Support[];
export declare function coverage(
	surf: Pick<Support, "x0" | "x1" | "z0" | "z1" | "mask">,
	cx: number,
	cz: number,
	hx: number,
	hz: number,
): number;
