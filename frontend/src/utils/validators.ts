export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isValidPhone(phone: string): boolean {
  // Supports Nepal numbers (e.g. 98XXXXXXXX, 97XXXXXXXX, or with +977)
  const cleaned = phone.replace(/[\s-]/g, '')
  return /^(\+?977)?[9][678]\d{8}$/.test(cleaned) || /^\d{7,15}$/.test(cleaned)
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8
}

