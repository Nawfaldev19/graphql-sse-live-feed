import { ThemeToggle } from "./components/ThemeToggle";
import { Welcome } from "./components/Welcome";
import { Workspace } from "./components/Workspace";
import { useSession } from "./lib/session";

export function App() {
  const { token } = useSession();
  if (token) return <Workspace />;
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">Live Feed</span>
        <div className="topbar-end">
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="main">
        <Welcome />
      </main>
    </div>
  );
}
