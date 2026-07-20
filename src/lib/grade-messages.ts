// Copy pools for the "what you need" callout's emotional states. Picked
// randomly per class/quarter so the message doesn't feel canned when a
// student has several classes in the same state at once.

export const MISSED_TARGET_MESSAGES: string[] = [
  "This one didn't go the way you hoped.",
  "Sometimes the math just doesn't work in your favor.",
  "This quarter got away from you.",
  "Not the ending you were working toward.",
  "This one stings. It's okay to feel that.",
  "The window closed on this one.",
  "This quarter is behind you now.",
  "It didn't come together this time.",
  "Some quarters just don't go your way.",
  "This one hurt. That means you cared.",
  "You wanted more from this. That's not a bad thing.",
  "The numbers didn't land where you needed them to.",
  "This one slipped away.",
  "Not every quarter ends the way you planned.",
  "The ceiling came sooner than you deserved.",
  "This quarter ran out of room.",
  "It didn't work out this time around.",
  "You gave it what you had. It just wasn't enough this time.",
  "This one is done. Let yourself feel it.",
  "The grade you wanted isn't there anymore. That's a hard thing to see.",
];

export const ON_TRACK_MESSAGES: string[] = [
  "You're already there — even a rough stretch won't change that.",
  "Your target is locked in. Everything from here is a bonus.",
  "Whatever happens next, this one's already a win.",
  "You've done the work. The rest is just finishing strong.",
  "This quarter is yours no matter what's left on the table.",
];

export function pickRandomMessage(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? "";
}
