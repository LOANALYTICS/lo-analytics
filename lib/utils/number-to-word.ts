export function convertNumberToWord(num: number): string {
  const words = [
    "First",
    "Second",
    "Third",
    "Fourth",
    "Fifth",
    "Sixth",
    "Seventh",
    "Eighth",
  ];

  return words[num - 1] || num.toString();
}
