// Colour themes: each id has a palette in src/styles/themes/<id>.css.
// THEME is the one a first visit gets; the header gear lets a visitor switch
// live, and their choice is kept in localStorage under THEME_KEY.
export const THEMES = [
  { id: 'default', label: 'Orange' },
  { id: 'blue', label: 'Blue' },
];
export const THEME = 'default';
export const THEME_KEY = 'theme';
