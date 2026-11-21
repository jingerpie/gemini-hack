// Studio: the voice-driven room editor.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import App from "../App";

export const Route = createFileRoute("/")({ component: StudioPage });

function StudioPage() {
	useEffect(() => {
		document.title = "Studio";
	}, []);
	return <App />;
}
