'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Book } from 'lucide-react';

export default function TermsAndConditionsModal({
  isOpen,
  onClose,
  showDecisionActions = false,
  onAgree,
  onDecline,
  agreeLabel = 'Agree',
  declineLabel = 'Not Agree',
  decisionLoading = false,
  decisionError = '',
  disableClose = false,
}) {
  const contentRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartScrollTopRef = useRef(0);
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHasReadToBottom(false);
      return;
    }

    const checkScrollable = () => {
      const node = contentRef.current;
      if (!node) return;

      const canScroll = node.scrollHeight > node.clientHeight + 2;
      setHasReadToBottom(!canScroll);
    };

    const frameId = window.requestAnimationFrame(checkScrollable);
    window.addEventListener('resize', checkScrollable);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', checkScrollable);
    };
  }, [isOpen]);

  const handleContentScroll = (event) => {
    const node = event.currentTarget;
    const bottomThreshold = 16;
    const reachedBottom =
      node.scrollTop + node.clientHeight >= node.scrollHeight - bottomThreshold;

    if (reachedBottom) {
      setHasReadToBottom(true);
    }
  };

  const handleMouseDown = (event) => {
    if (event.button !== 0) return;

    const node = contentRef.current;
    if (!node) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartYRef.current = event.clientY;
    dragStartScrollTopRef.current = node.scrollTop;
  };

  const handleMouseMove = (event) => {
    if (!isDraggingRef.current) return;

    const node = contentRef.current;
    if (!node) return;

    const deltaY = event.clientY - dragStartYRef.current;
    node.scrollTop = dragStartScrollTopRef.current - deltaY;
    event.preventDefault();
  };

  const endMouseDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isOpen) {
      isDraggingRef.current = false;
      setIsDragging(false);
      return;
    }

    window.addEventListener('mouseup', endMouseDrag);
    return () => {
      window.removeEventListener('mouseup', endMouseDrag);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-[420px]:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full max-w-3xl flex-col bg-white dark:bg-[#121416] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] dark:border-[#353c44] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f0f4ec] dark:bg-[#353c44]">
              <Book className="w-5 h-5 text-[#3a5a40] dark:text-[#6f9b74]" />
            </div>
            <div>
              <h3 className="text-[19px] font-bold text-[#1c2b1f] dark:text-white">Terms & Conditions</h3>
            </div>
          </div>
          {!disableClose && (
            <button onClick={onClose} className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10">
              <X className="w-5 h-5 text-[#344e41] dark:text-white/80" />
            </button>
          )}
        </div>
        
        {/* Main Content */}
        <main
          ref={contentRef}
          onScroll={handleContentScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={endMouseDrag}
          onMouseLeave={endMouseDrag}
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain no-scrollbar touch-pan-y p-5 sm:p-7 lg:p-8 space-y-8 ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          
          <div className="text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px] space-y-4">
            <p>
              This page outlines the Terms of Use ("Terms") that govern your access to and use of the KapIT website and related services (collectively, the "Platform"). By accessing or using KapIT, you ("you" or "your") agree to comply with these Terms, which define your rights and responsibilities when using the Platform.
            </p>
            <p>
              If you do not agree with any part of these Terms, you should not create an account or continue using KapIT.
            </p>
            <p>
              Each time you use our website, you agree to be bound by these Terms of Use, as they may be updated from time to time with or without prior notice. If you are entering into these Terms of Use on behalf of a company or other legal entity, you represent that you have the authority to bind such entities to these Terms. In such cases, the terms "you" or "your" shall refer to that entity. If you do not agree to these Terms, you may not use our website or Service.
            </p>
            <p>
              Please also review our Privacy Policy, which is incorporated into these Terms of Use by reference.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">1. Use of the Platform</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p><strong>1.1</strong> KapIT provides an online space where job seekers and employers can connect for employment opportunities within the IT industry. The platform allows users to create profiles, share professional information, post or apply to job listings, and use available tools that support job matching and application processes. While KapIT aims to improve the relevance and quality of job opportunities presented, it does not act as an employer, recruiter, or hiring agent.</p>
              <p><strong>1.2</strong> All services and features available on KapIT are provided on an "as available" and "as is" basis. KapIT may modify, suspend, or discontinue any part of the platform at any time without prior notice. This includes changes to features, access to services, or stored data. KapIT is not responsible for any interruptions, errors, or loss of information that may occur as a result of such changes.</p>
              <p><strong>1.3</strong> KapIT does not guarantee the accuracy, completeness, or availability of job listings, profiles, or any content shared on the platform. Employers are responsible for ensuring that the information they provide is accurate and up to date, while job seekers are responsible for reviewing and verifying opportunities before applying. KapIT is not involved in the hiring process and is not responsible for any decisions made by users.</p>
              <p><strong>1.4</strong> Any new features, tools, or improvements introduced to the platform will automatically be covered by these Terms unless otherwise stated. KapIT may also limit or restrict access to certain features, including those that may require payment, at its discretion.</p>
              <p><strong>1.5</strong> If you do not agree with any changes or updates made to the platform or these Terms, you must stop using KapIT. Continued use of the platform will be considered as your acceptance of those changes.</p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">2. User Accounts</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p><strong>2.1</strong> To access certain features of KapIT, users may be required to create an account. You agree to provide accurate, current, and complete information during registration and to update such information when necessary. Failure to do so may result in limited access to the platform or account suspension.</p>
              <p><strong>2.2</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. KapIT will not be liable for any loss or damage arising from unauthorized use of your account.</p>
              <p><strong>2.3</strong> KapIT reserves the right to suspend, restrict, or terminate accounts that are found to be in violation of these Terms or that engage in suspicious, misleading, or harmful activity.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">3. User Conduct</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p><strong>3.1</strong> Users are expected to use the platform in a lawful and respectful manner. Any use of KapIT that may harm other users or the platform itself is strictly prohibited.</p>
              <p><strong>3.2</strong> Users must not submit false, misleading, or fraudulent information, whether as a job seeker or employer. This includes misrepresentation of qualifications, identity, or job opportunities.</p>
              <p><strong>3.3</strong> Any attempt to misuse the platform, including unauthorized access, data scraping, spamming, or distributing harmful content, may result in immediate suspension or termination of access.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">4. Communication Between Users</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p><strong>4.1</strong> KapIT may provide features that allow users to communicate with each other. These interactions must remain professional, respectful, and relevant to employment purposes.</p>
              <p><strong>4.2</strong> KapIT does not control or guarantee the accuracy of user communications and is not responsible for any outcomes resulting from such interactions. However, KapIT reserves the right to review, monitor, or restrict communication where misuse is suspected.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">5. Fees and Payments</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p><strong>5.1</strong> Certain features or services on KapIT may require payment. These may include, but are not limited to, job postings, premium tools, or enhanced visibility options for employers.</p>
              <p><strong>5.2</strong> All applicable fees will be presented before purchase. By proceeding with payment, you agree to the stated charges. Payments are generally non-refundable unless otherwise specified.</p>
              <p><strong>5.3</strong> KapIT reserves the right to modify its pricing structure at any time. Continued use of paid services after changes are implemented will be considered acceptance of the updated pricing.</p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">6. Intellectual Property</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p><strong>6.1</strong> All content, design elements, and technology associated with KapIT are owned by or licensed to KapIT and are protected by applicable intellectual property laws.</p>
              <p><strong>6.2</strong> Users retain ownership of the content they submit to the platform. However, by uploading content, you grant KapIT a non-exclusive, royalty-free license to use, display, and distribute such content within the platform for its intended purpose.</p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">7. Data and Privacy</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p><strong>7.1</strong> KapIT collects and processes user information to operate and improve the platform. This may include personal and professional data provided during registration and use of the Service.</p>
              <p><strong>7.2</strong> By using KapIT, you consent to the collection and use of your information in accordance with applicable data protection laws and the platform's Privacy Policy.</p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">8. Limitation of Liability</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p><strong>8.1</strong> KapIT is not responsible for any employment decisions, hiring outcomes, or interactions between users. The platform serves only as a medium for connecting job seekers and employers.</p>
              <p><strong>8.2</strong> To the fullest extent permitted by law, KapIT shall not be liable for any direct, indirect, or incidental damages arising from the use or inability to use the platform.</p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">9. Termination</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p><strong>9.1</strong> KapIT reserves the right to suspend or terminate access to the platform at any time if a user is found to be in violation of these Terms.</p>
              <p><strong>9.2</strong> Users may stop using the platform at any time. Termination of use does not remove any obligations incurred prior to such termination.</p>
            </div>
          </section>

          {/* Section 10 */}
          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">10. Changes to the Terms</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p><strong>10.1</strong> KapIT may revise these Terms at any time. Updated versions will be posted on the platform and will take effect immediately upon publication.</p>
              <p><strong>10.2</strong> Your continued use of the platform after changes are made indicates your acceptance of the revised Terms.</p>
            </div>
          </section>

          {/* Section 11 */}
          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">11. Governing Law</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p><strong>11.1</strong> These Terms shall be governed by and interpreted in accordance with the laws of the Republic of the Philippines.</p>
            </div>
          </section>

          {/* Section 12 */}
          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">12. Contact Information</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p><strong>12.1</strong> For any questions, concerns, or inquiries regarding these Terms, you may contact KapIT through the official communication channels provided on the platform.</p>
            </div>
          </section>

          {/* Bottom spacer block */}
          <div className="h-6"></div>

        </main>
        {showDecisionActions && (
          <div className="shrink-0 border-t border-[#e5e7eb] dark:border-[#353c44] p-4 sm:p-5">
            {decisionError ? (
              <p className="mb-3 text-sm text-red-600 dark:text-red-400">{decisionError}</p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onDecline}
                disabled={decisionLoading}
                className="rounded-lg border border-[#a3b18a] dark:border-[#444d57] px-4 py-2.5 text-sm font-semibold text-[#3a5a40] dark:text-white transition-colors hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {declineLabel}
              </button>
              <button
                type="button"
                onClick={onAgree}
                disabled={decisionLoading || !hasReadToBottom}
                className="rounded-lg border border-[#588157] bg-[#3a5a40] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#6f9b74] dark:bg-[#1f6f96] dark:hover:bg-[#82ad86]"
              >
                {decisionLoading ? 'Saving...' : agreeLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
