// Navegación: cada pantalla se registra con un nombre y se abre con go(nombre, ...args).
// Así los módulos no se importan entre sí en círculo.
export const routes = {};
export const register = (name, fn) => { routes[name] = fn; };
export const go = (name, ...args) => routes[name](...args);
