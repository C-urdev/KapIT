import { Link as RouterLink } from 'react-router-dom';

/**
 * App-wide Link component.
 * Uses react-router's <Link> for internal routes, <a> for external URLs.
 * Accepts `href` prop for compatibility with existing code.
 */
export default function Link({ href, children, target, rel, replace, scroll, ...rest }) {
  const isExternal = /^https?:\/\//i.test(String(href));
  if (isExternal) {
    return (
      <a href={href} target={target || '_self'} rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <RouterLink to={href} replace={replace} {...rest}>
      {children}
    </RouterLink>
  );
}
