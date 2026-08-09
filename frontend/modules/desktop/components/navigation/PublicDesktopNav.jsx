import SiteTopNav from '../../../shared/components/navigation/SiteTopNav';

export default function PublicDesktopNav({
  onLogoClick,
  logoHref = '/',
  onSignIn,
  onGetStarted,
  signInHref = '/?login=1',
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
