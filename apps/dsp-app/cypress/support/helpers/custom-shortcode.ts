export const customShortcode = () => {
  const validLetters = 'ABCDEF';
  const validDigits = '0123456789';

  const getRandomChar = characters => characters[Math.floor(Math.random() * characters.length)];

  let result = '';

  // Generate up to 4 characters
  for (let i = 0; i < 4; i++) {
    // Decide whether to add a letter or a digit
    const isLetter = Math.random() < 0.5;

    // Add a random letter or digit to the result
    result += isLetter ? getRandomChar(validLetters) : getRandomChar(validDigits);
  }

  return result;
};
