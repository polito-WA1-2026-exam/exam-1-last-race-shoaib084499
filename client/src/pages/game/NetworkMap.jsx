function NetworkMap({ network, planning = false, selectedRoute = [] }) {
  const selectedKeys = new Set(selectedRoute.map((segment) => segment.key))

  return (
    <svg className="network-map" viewBox="0 0 1040 620" role="img" aria-label="Underground network map">
      {!planning &&
        network.lines.map((line) =>
          line.stations.slice(0, -1).map((station, index) => {
            const next = line.stations[index + 1]
            return (
              <line
                key={`${line.id}-${station.id}-${next.id}`}
                x1={station.x}
                y1={station.y}
                x2={next.x}
                y2={next.y}
                stroke={line.color}
                strokeWidth="12"
                strokeLinecap="round"
              />
            )
          }),
        )}
      {planning &&
        network.segments?.map((segment) => (
          <line
            key={segment.key}
            x1={segment.from.x}
            y1={segment.from.y}
            x2={segment.to.x}
            y2={segment.to.y}
            className={selectedKeys.has(segment.key) ? 'route-line' : 'ghost-line'}
          />
        ))}
      {network.stations.map((station) => (
        <g key={station.id}>
          <circle
            cx={station.x}
            cy={station.y}
            r={station.interchange ? 15 : 11}
            className={station.interchange ? 'station interchange' : 'station'}
          />
          <text x={station.x + 18} y={station.y - 14}>
            {station.name}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default NetworkMap
