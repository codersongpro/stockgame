export function LearningShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">{children}</div>
    </main>
  );
}
