export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold tracking-tight">
            Rep<span className="text-primary">Forge</span>
          </h1>
          <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
            A modern fitness tracker built to forge progress, one rep at a time.
          </p>
          <div className="flex gap-4 justify-center pt-8">
            <a
              href="/dashboard"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Get Started
            </a>
            <a
              href="/about"
              className="px-8 py-3 border border-border rounded-lg font-semibold hover:bg-accent transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="text-xl font-semibold mb-3">Weight Tracking</h3>
            <p className="text-muted-foreground">
              Log daily weight, visualize trends, and compare changes across custom date ranges.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="text-xl font-semibold mb-3">Training Splits</h3>
            <p className="text-muted-foreground">
              Create custom splits, assign workouts, and reuse templates for maximum efficiency.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="text-xl font-semibold mb-3">Exercise Library</h3>
            <p className="text-muted-foreground">
              Access demonstration videos, targeted muscle groups, and form tips for every exercise.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
