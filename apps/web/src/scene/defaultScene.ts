import type { Scene } from "../types";

// Starter living room: 6 m wide x 5 m deep x 2.8 m high, light warm walls, oak floor,
// and only three small primitive pieces so there is plenty of room to add things by voice.
export const DEFAULT_SCENE: Scene = {
	room: { width: 6, depth: 5, height: 2.8 },
	surfaces: {
		wall_back: {
			id: "wall_back",
			color: "#e8e2d8",
			material: { roughness: 0.92, metalness: 0 },
		},
		wall_left: {
			id: "wall_left",
			color: "#e4ddd2",
			material: { roughness: 0.92, metalness: 0 },
		},
		wall_right: {
			id: "wall_right",
			color: "#e4ddd2",
			material: { roughness: 0.92, metalness: 0 },
		},
		floor: {
			id: "floor",
			color: "#a27b58",
			material: { roughness: 0.55, metalness: 0 },
		},
		ceiling: {
			id: "ceiling",
			color: "#f3f1ec",
			material: { roughness: 0.95, metalness: 0 },
		},
	},
	objects: [
		{
			id: "rug",
			name: "rug",
			shape: "box",
			size: { x: 2.8, y: 0.012, z: 1.9 },
			position: { x: 0, y: 0, z: -0.2 },
			rotation_y_deg: 0,
			color: "#cfc3b0",
			material: { roughness: 1, metalness: 0 },
			parent: "",
		},
		{
			id: "side_table",
			name: "side table",
			shape: "cylinder",
			size: { x: 0.5, y: 0.55, z: 0.5 },
			position: { x: 2.35, y: 0, z: -1.95 },
			rotation_y_deg: 0,
			color: "#3d3631",
			material: { roughness: 0.45, metalness: 0.05 },
			parent: "",
		},
		{
			id: "vase",
			name: "vase",
			shape: "sphere",
			size: { x: 0.22, y: 0.26, z: 0.22 },
			position: { x: 2.35, y: 0.55, z: -1.95 },
			rotation_y_deg: 0,
			color: "#d9cbb5",
			material: { roughness: 0.3, metalness: 0 },
			parent: "side_table",
		},
	],
	decals: [],
};
