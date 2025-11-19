import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { History } from "lucide-react"

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workout History</h1>
        <p className="text-muted-foreground">
          View and compare your past workout sessions
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            No workout sessions recorded yet
          </p>
          <p className="text-sm text-muted-foreground">
            Start your first workout to begin tracking your progress
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
