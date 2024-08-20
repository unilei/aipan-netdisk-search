export default defineNuxtRouteMiddleware((to, from) => {
  const token = useCookie("token", {
    maxAge: 60 * 60 * 24,
  });
  if (!token.value) {
    return navigateTo("/login");
  }
});
