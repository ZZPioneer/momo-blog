// Vite 的 BASE_URL 在自托管时为 "/"，在 GitHub Pages 项目站点时形如 "/momo-blog/"。
// 这里统一换算成「不带末尾斜杠」的前缀，供路由和静态资源拼接使用。
const raw = import.meta.env.BASE_URL || "/";
export const basePath = raw === "/" ? "" : raw.replace(/\/+$/, "");
export const withBase = (path: string) => `${basePath}${path}`;
// 去掉部署前缀后的站内路径，例如 "/momo-blog/projects" → "/projects"。
export function currentPath() {
  const root = withBase("/");
  return location.pathname.startsWith(root)
    ? location.pathname.slice(root.length - 1)
    : location.pathname;
}
