import { Button } from '@/components/ui/button';

function App() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-medium tracking-tight">Inventory Dashboard</h1>
      <div className="flex items-center gap-3">
        <Button>Get started</Button>
        <Button variant="outline">Secondary action</Button>
      </div>
    </main>
  );
}

export default App;
