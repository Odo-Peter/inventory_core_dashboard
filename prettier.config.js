/** @type {import('prettier').Options} */
export default {
  plugins: ['prettier-plugin-tailwindcss'],
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  arrowParens: 'always',
  endOfLine: 'lf',
  tailwindFunctions: ['cva', 'cn', 'clsx', 'tv'],
  tailwindAttributes: ['class', 'className', 'classNames'],
};
