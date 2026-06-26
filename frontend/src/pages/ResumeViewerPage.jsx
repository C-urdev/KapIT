import useViewportMode from './useViewportMode';
import DesktopResumeViewerPage from './desktop/public/ResumeViewerPage';
import MobileResumeViewerPage from './mobile/public/ResumeViewerPage';

export default function ResumeViewerPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopResumeViewerPage : MobileResumeViewerPage;
  return <Page />;
}
