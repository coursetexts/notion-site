// Public contact configuration, not a credential. Preserve the existing address
// until a deployment explicitly overrides it; no secret-store migration needed.
export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
  ['coursetexts', 'mit.edu'].join('@')
export const maintenanceEmail = process.env.NEXT_PUBLIC_MAINTENANCE_EMAIL ||
  ['admin', 'coursetexs.org'].join('@')
