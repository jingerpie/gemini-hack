import type { Scene, SceneObject } from "../../apps/web/src/types";
export declare const WALLS: readonly ["wall_back", "wall_left", "wall_right"];
export declare const MOUNTS: readonly [
	"wall_back",
	"wall_left",
	"wall_right",
	"ceiling",
];
export declare function resolveMount(
	o: SceneObject,
	room: Scene["room"],
): SceneObject;
export declare function inferMount(
	kind: string,
	o: SceneObject,
	room: Scene["room"],
): SceneObject["mount"] | undefined;
export type Explicit = Set<string> | { pos: Set<string>; rot: Set<string> };
export declare function followParents(
	prev: Scene,
	next: Scene,
	explicitIds?: Explicit,
): Scene;
export declare const STRETCH_MAX: number;
export declare function fitScale(
	raw: { x: number; y: number; z: number },
	size: { x: number; y: number; z: number },
): { x: number; y: number; z: number };
