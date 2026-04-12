export function getLevelLabel(xp: number): string {
  if (xp <= 200) return 'Početnik'
  if (xp <= 500) return 'Učenik'
  if (xp <= 1000) return 'Saradnik'
  if (xp <= 2000) return 'Profesionalac'
  return 'Majstor'
}
