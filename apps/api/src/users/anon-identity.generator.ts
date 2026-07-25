import type { AnonIdentity } from "@anontalk/shared";

const ANIMALS = [
  { name: "Fox", emoji: "🦊" },
  { name: "Owl", emoji: "🦉" },
  { name: "Panda", emoji: "🐼" },
  { name: "Wolf", emoji: "🐺" },
  { name: "Raven", emoji: "🐦‍⬛" },
  { name: "Otter", emoji: "🦦" },
  { name: "Falcon", emoji: "🦅" },
  { name: "Tiger", emoji: "🐯" },
  { name: "Koala", emoji: "🐨" },
  { name: "Lynx", emoji: "🐆" },
];

const PREFIXES = ["Anonymous", "Shadow", "Nova", "Cosmic", "Midnight", "Silent", "Electric", "Rogue"];

const GRADIENTS: [string, string][] = [
  ["#6366F1", "#8B5CF6"],
  ["#EC4899", "#F43F5E"],
  ["#10B981", "#14B8A6"],
  ["#F59E0B", "#EF4444"],
  ["#3B82F6", "#06B6D4"],
  ["#8B5CF6", "#D946EF"],
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function generateAnonIdentity(): AnonIdentity {
  const animal = pick(ANIMALS);
  const prefix = pick(PREFIXES);

  return {
    nickname: `${prefix}${animal.name}`,
    emoji: animal.emoji,
    gradient: pick(GRADIENTS),
  };
}
