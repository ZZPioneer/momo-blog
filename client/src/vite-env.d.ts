/// <reference types="vite/client" />

declare module "*.ts?raw" {
  const src: string;
  export default src;
}
declare module "*.tsx?raw" {
  const src: string;
  export default src;
}
declare module "*.css?raw" {
  const src: string;
  export default src;
}
