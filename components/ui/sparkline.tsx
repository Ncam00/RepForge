interface SparkLineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
}

export function SparkLine({ data, color = "#8884d8", height = 32, width = 80 }: SparkLineProps) {
  if (!data || data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  })

  return (
    <svg width={width} height={height} className="overflow-visible opacity-60">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
