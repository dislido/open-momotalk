declare module '*?raw' {
  const content: string;
  export default content;
}
declare module '*.css?inline' {
  const content: string;
  export default content;
}
declare module '*.html?template' {
  const content: string;
  export default content;
}
declare module '*.svg'
declare module '*.png'
declare module '*.jpg'
declare module '*.gif'
declare module '*.css'

interface Window {
  pageConstants: {
    env: 'production' | 'development';
  };
}

interface ShadowRoot {
  getSelection(): Selection;
}