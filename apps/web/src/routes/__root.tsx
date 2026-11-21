import { TooltipProvider } from "@gemini-hack/ui/components/tooltip";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({ component: Root });

function Root() {
	return (
		<TooltipProvider delay={400}>
			<Outlet />
		</TooltipProvider>
	);
}
