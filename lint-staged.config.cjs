module.exports = {
  '**/*.ts?(x)': (files = []) => {
    return [
      `npm run lint ${files.join(' ')} -- --fix --quiet`,
      'tsc -p tsconfig.json --noEmit',
      'tsc -p client/tsconfig.json --noEmit',
    ];
  },
  '*.{css}': ['stylelint --fix', 'prettier --write'],
};
