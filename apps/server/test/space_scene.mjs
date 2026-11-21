// Furnished bench room shared by space_bench.mjs and render_scene_png.mjs.
export const obj = (id, name, size, position, rot = 0, extra = {}) => ({ id, name, shape: 'custom', size, position, rotation_y_deg: rot, color: '#888888', parent: '', description: name, status: 'ready', ...extra });
export const furnishedScene = () => ({
  room: { width: 6, depth: 5, height: 2.8 },
  surfaces: { wall_back: { id: 'wall_back', color: '#e8e4dc' }, wall_left: { id: 'wall_left', color: '#e8e4dc' }, wall_right: { id: 'wall_right', color: '#e8e4dc' },
    floor: { id: 'floor', color: '#a0703c', material: { roughness: 0.7 } }, ceiling: { id: 'ceiling', color: '#f5f5f5' } },
  objects: [
    obj('sofa1', 'grey sofa', { x: 2.1, y: 0.85, z: 0.95 }, { x: 0, y: 0, z: -1.95 }, 0, { color: '#7a7a7a' }),
    obj('table1', 'coffee table', { x: 1.1, y: 0.45, z: 0.6 }, { x: 0, y: 0, z: -0.8 }, 0, { color: '#5a3a22' }),
    obj('armchair1', 'leather armchair', { x: 0.85, y: 0.95, z: 0.85 }, { x: -2.5, y: 0, z: -2.0 }, 0, { color: '#8b5a2b' }),
    obj('lamp1', 'floor lamp', { x: 0.4, y: 1.7, z: 0.4 }, { x: 2.55, y: 0, z: 1.3 }, 0, { color: '#222222' }),
    obj('shelf1', 'bookshelf', { x: 1.2, y: 1.8, z: 0.35 }, { x: 2.775, y: 0, z: 0 }, -90, { color: '#6b4a2b' }),
    obj('plant1', 'potted plant', { x: 0.5, y: 1.2, z: 0.5 }, { x: -2.55, y: 0, z: 2.05 }, 0, { color: '#2e8b3e' }),
  ],
  decals: [{ id: 'painting1', name: 'landscape painting', surface: 'wall_back', x: -2.3, y: 1.7, width: 0.8, height: 0.6, prompt: 'a landscape painting', status: 'ready' }],
});

