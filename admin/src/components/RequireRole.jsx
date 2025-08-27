export default function RequireRole({ user, allow = [], children }) {
  if(!user || !allow.includes(user.role)) return null;
  return children;
}
