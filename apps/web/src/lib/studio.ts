// The studio's one TaskManager per page load. Lives outside App so other pages (checkout) can read the room.
import { TaskManager } from "./taskManager";

export const manager = new TaskManager();
(window as unknown as { __studio: TaskManager }).__studio = manager;
