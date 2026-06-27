/**
 * Generates a readable 8-character invite code
 * Format: TRP-XXXX (e.g., TRP-4K9M)
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 (confusing)
  let code = 'TRP-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = { generateInviteCode };
