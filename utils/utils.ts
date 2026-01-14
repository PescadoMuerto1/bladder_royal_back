export function randomColor(): string {
  // Material Design colors compatible with Flutter
  const colors = [
    '#F44336', // red
    '#2196F3', // blue
    '#FFEB3B', // yellow
    '#4CAF50', // green
    '#FF9800', // orange
    '#009688', // teal
    '#03A9F4', // light blue
    '#E91E63', // pink
    '#9C27B0'  // purple
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
