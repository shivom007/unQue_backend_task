export function millisecondsToISOString(milliseconds) {
  try {
    const date = new Date(milliseconds);
    // Return ISO string
    return date.toISOString();
  } catch (error) {
    console.error("Error converting milliseconds to ISO string:", error);
    throw new Error(
      "An error occurred while converting milliseconds to ISO string."
    );
  }
}
