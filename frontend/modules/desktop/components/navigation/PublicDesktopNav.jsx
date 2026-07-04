import SiteTopNav from '../../../shared/components/navigation/SiteTopNav';

export default function PublicDesktopNav({
  onLogoClick,
  logoHref = '/',
  onSignIn,
  onGetStarted,
  signInHref = '/auth/login',
  getStartedHref = '/auth/register',
}) {
  return (
    <SiteTopNav
      onLogoClick={onLogoClick}
      logoHref={logoHref}
      onSignIn={onSignIn}
      onGetStarted={onGetStarted}
      signInHref={signInHref}
      getStartedHref={getStartedHref}
    />
  );
}
