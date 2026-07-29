import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

test('company onboarding collects reusable company profile details instead of job-specific hiring intake', () => {
  const source = read('frontend/modules/shared/pages/onboarding/CompanyProfileOnboardingPage.jsx');

  assert.match(source, /Work email/);
  assert.match(source, /Company logo/);
  assert.match(source, /Company type/);
  assert.match(source, /Company size/);
  assert.match(source, /Website/);
  assert.match(source, /Country/);
  assert.match(source, /About the company/);
  assert.match(source, /Save company profile/);
  assert.match(source, /Complete your company profile/);
  assert.match(source, /max-w-5xl/);
  assert.match(source, /md:grid-cols-2/);
  assert.match(source, /min-w-0 space-y-5/);
  assert.match(source, /dark:/);
  assert.match(source, /const isDark = theme === 'dark';/);
  assert.match(source, /const resolvedLocation = useMemo\(/);
  assert.match(source, /const submittedLocation = String\(form\.location \|\| resolvedLocation \|\| ''\)\.trim\(\)/);
  assert.match(source, /formatLocation\(form\.city, form\.provinceCode, locationData\.provinceLabelByCode, form\.country\)/);
  assert.match(source, /location: submittedLocation/);
  assert.match(source, /focus-within:border-\[#0f5a48\]/);
  assert.match(source, /const filledFieldClass = 'border-\[#0f5a48\] bg-\[#e8f5f0\] text-\[#0f3f34\] dark:border-\[#176c57\] dark:bg-\[#17382f\] dark:text-\[#e9fbf4\]';/);
  assert.match(source, /className=\{filledFieldShellClass\(submitAttempted && missing\.industry, Boolean\(String\(finalIndustry\)\.trim\(\)\)\)\}/);
  assert.match(source, /className=\{filledFieldShellClass\(submitAttempted && missing\.companySize, Boolean\(String\(form\.companySize\)\.trim\(\)\)\)\}/);
  assert.match(source, /showTriggerSearchIcon=\{false\}/);
  assert.match(source, /showTriggerChevron=\{false\}/);
  assert.match(source, /<div className=\{filledFieldShellClass\(false, Boolean\(String\(form\.website\)\.trim\(\)\)\)\}>/);
  assert.match(source, /<div className=\{filledFieldTextareaShellClass\(false, Boolean\(String\(form\.description\)\.trim\(\)\)\)\}>/);
  assert.doesNotMatch(source, /filledFieldShellClass\(false, true\)/);
  assert.doesNotMatch(source, /filledFieldTextareaShellClass\(false, true\)/);
  assert.match(source, /<Field label="Company logo" optional isDark=\{isDark\}>/);
  assert.match(source, /<Field label="Website" optional isDark=\{isDark\}>/);
  assert.doesNotMatch(source, /Role you're hiring for/);
  assert.doesNotMatch(source, /Which ATS do you use\?/);
  assert.doesNotMatch(source, /Anything else we should know\?/);
  assert.doesNotMatch(source, /Get 10 free profiles/);
  assert.doesNotMatch(source, /Profile context/);
  assert.doesNotMatch(source, /Your name/);
  assert.doesNotMatch(source, /Phone/);
  assert.doesNotMatch(source, /onboardingMode:\s*'hiring-intake'/);
  assert.doesNotMatch(source, /max-w-2xl/);
  assert.doesNotMatch(source, /max-w-\[790px\]/);
});

test('company post job owns the role-specific hiring workflow fields', () => {
  const source = read('frontend/modules/company/pages/CompanyPostJobPage.jsx');

  assert.match(source, /Hiring workflow/);
  assert.match(source, /ATS used \(optional\)/);
  assert.match(source, /Hiring timeline \(optional\)/);
  assert.match(source, /Must-haves \(optional\)/);
  assert.match(source, /Dealbreakers \(optional\)/);
  assert.match(source, /ats:\s*String\(form\.ats/);
  assert.match(source, /hiringTimeline:\s*String\(form\.hiringTimeline/);
  assert.match(source, /mustHaves:\s*String\(form\.mustHaves/);
  assert.match(source, /dealbreakers:\s*String\(form\.dealbreakers/);
});

test('shared searchable selects keep the filled green shell in both themes', () => {
  const source = read('frontend/modules/shared/components/forms/SearchableSelect.jsx');

  assert.match(source, /const selectedControlClass/);
  assert.match(source, /!bg-\[#e8f5f0\]/);
  assert.match(source, /dark:!bg-\[#17382f\]/);
  assert.match(source, /!border-\[#0f5a48\]/);
  assert.match(source, /dark:!border-\[#176c57\]/);
});

test('company profile page only shows the editable public profile form', () => {
  const source = read('frontend/modules/company/pages/CompanyProfilePage.jsx');

  assert.match(source, /Company profile/);
  assert.match(source, /Public company profile/);
  assert.match(source, /Company logo/);
  assert.match(source, /Company name/);
  assert.match(source, /Short description/);
  assert.match(source, /Full company description \(optional\)/);
  assert.match(source, /Related companies/);
  assert.doesNotMatch(source, /Company onboarding details/);
  assert.doesNotMatch(source, /ReadOnlyField/);
  assert.doesNotMatch(source, /onboardingDetails/);
  assert.doesNotMatch(source, /latestProject/);
  assert.doesNotMatch(source, /Services Needed/);
});

test('company job checkout owns popup-safe merchant styling and selected plan states', () => {
  const source = read('frontend/modules/company/pages/CompanyPostJobPaymentPage.jsx');
  const styles = read('frontend/modules/company/pages/CompanyPostJobPaymentPage.css');
  const postJobSource = read('frontend/modules/company/pages/CompanyPostJobPage.jsx');
  const manageJobsSource = read('frontend/modules/company/pages/CompanyManageJobsPage.jsx');
  const utilsSource = read('frontend/modules/company/features/companyUtils.ts');

  assert.match(source, /import '\.\/CompanyPostJobPaymentPage\.css';/);
  assert.match(source, /company-merchant-plan-option-selected/);
  assert.match(source, /aria-label=\{`Select \$\{plan\.label\} posting plan`\}/);
  assert.match(source, /company-merchant-stepper/);
  assert.match(source, /company-merchant-selected-summary/);
  assert.match(source, /company-merchant-success-card/);
  assert.match(source, /Completed transaction/);
  assert.match(source, /Your job post is live/);
  assert.match(source, /company-merchant-success-ledger/);
  assert.match(source, /Transaction ID/);
  assert.match(source, /Date and time/);
  assert.match(source, /company-merchant-success-total/);
  assert.match(source, /Go to company jobs/);
  assert.match(source, /const stepState = completedCheckout \? 3 : verifying \|\| loading \|\| success \? 2 : 1/);
  assert.match(source, /PAYMENT_FINISH_MESSAGE_TYPE/);
  assert.match(source, /const handleFinishSuccess = \(\) => \{/);
  assert.match(source, /notifyOpener\(PAYMENT_FINISH_MESSAGE_TYPE,\s*\{[\s\S]*navigateTo:\s*COMPANY_PATHS\.jobs/);
  assert.match(source, /window\.opener\.focus\(\)/);
  assert.match(source, /window\.close\(\)/);
  assert.match(source, /window\.opener\.postMessage\(event\.data, window\.location\.origin\)/);
  assert.match(source, /if \(type === PAYMENT_FINISH_MESSAGE_TYPE\) \{[\s\S]*window\.opener\.focus\(\);[\s\S]*window\.close\(\);[\s\S]*navigate\(event\.data\?\.navigateTo \|\| COMPANY_PATHS\.jobs\)/);
  assert.match(source, /onClick=\{completedCheckout \? handleFinishSuccess : handleCancel\}/);
  assert.match(source, /onClick=\{handleFinishSuccess\}[\s\S]*Go to company jobs/);
  assert.match(source, /<footer className="company-merchant-footer">[\s\S]*isLocalhostBypassAvailable[\s\S]*company-merchant-bypass-button[\s\S]*handlePayAndPost[\s\S]*company-merchant-primary-button[\s\S]*handleCancel/);
  assert.doesNotMatch(source, /onClick=\{handleCancel\}[\s\S]{0,160}Go to company jobs/);
  assert.doesNotMatch(source, />Job checkout</);
  assert.doesNotMatch(source, /Ready to publish/);
  assert.doesNotMatch(source, /company-merchant-receipt-grid/);
  assert.doesNotMatch(source, /Post payment information/);

  assert.match(styles, /\.company-merchant-window\s*\{/);
  assert.match(styles, /html\.dark \.company-merchant-window\s*\{/);
  assert.match(styles, /--workspace-canvas:/);
  assert.match(styles, /--workspace-primary:/);
  assert.match(styles, /\.company-merchant-shell\s*\{/);
  assert.match(styles, /width:\s*min\(100%, 700px\)/);
  assert.match(styles, /max-height:\s*none/);
  assert.match(styles, /overflow:\s*visible/);
  assert.match(styles, /\.company-merchant-body\s*\{/);
  assert.match(styles, /\.company-merchant-body\s*\{[^}]*overflow:\s*visible/s);
  assert.doesNotMatch(styles, /\.company-merchant-body\s*\{[^}]*overflow:\s*auto/s);
  assert.doesNotMatch(styles, /grid-template-rows:\s*auto minmax\(0, 1fr\) auto/);
  assert.doesNotMatch(styles, /height:\s*calc\(100dvh - 2rem\)/);
  assert.match(styles, /border-top:\s*1px solid color-mix/);
  assert.match(styles, /\.company-merchant-plan-option-selected\s*\{/);
  assert.match(styles, /\.company-merchant-footer\s*\{/);
  assert.match(styles, /\.company-merchant-success-card\s*\{/);
  assert.match(styles, /\.company-merchant-success-mark\s*\{/);
  assert.match(styles, /\.company-merchant-success-copy\s*\{/);
  assert.match(styles, /\.company-merchant-success-ledger\s*\{/);
  assert.match(styles, /\.company-merchant-success-total\s*\{/);
  assert.match(styles, /\.company-merchant-success-action\s*\{/);
  assert.match(styles, /@keyframes merchantSuccessStroke/);
  assert.match(styles, /\.company-merchant-success-card\s*\{[^}]*background:\s*transparent/s);
  assert.match(styles, /html\.dark \.company-merchant-alert\s*\{/);
  assert.doesNotMatch(styles, /\.company-merchant-success-card\s*\{[^}]*border:\s*1px/s);
  assert.doesNotMatch(styles, /\.company-merchant-success-mark\s*\{[^}]*border:/s);
  assert.doesNotMatch(styles, /\.company-merchant-success-mark\s*\{[^}]*box-shadow:/s);
  assert.match(styles, /\.company-merchant-primary-button,\r?\n\.company-merchant-secondary-button,\r?\n\.company-merchant-bypass-button\s*\{/);
  assert.match(styles, /width:\s*100%/);
  assert.match(utilsSource, /export const getCompanyPaymentPopupFeatures/);
  assert.match(utilsSource, /export const openCompanyPaymentPopup/);
  assert.match(utilsSource, /height=\$\{height\}/);
  assert.match(utilsSource, /popup\.moveTo\(left, 0\)/);
  assert.match(utilsSource, /popup\.resizeTo\(width, height\)/);
  assert.match(utilsSource, /popup\.focus\(\)/);
  assert.match(postJobSource, /openCompanyPaymentPopup\(\)/);
  assert.match(manageJobsSource, /openCompanyPaymentPopup\(\)/);
  assert.match(postJobSource, /PAYMENT_FINISH_MESSAGE_TYPE/);
  assert.match(postJobSource, /event\.data\?\.type === PAYMENT_FINISH_MESSAGE_TYPE[\s\S]*navigate\(COMPANY_PATHS\.jobs\)/);
  assert.match(manageJobsSource, /PAYMENT_FINISH_MESSAGE_TYPE/);
  assert.match(manageJobsSource, /event\.data\?\.type === PAYMENT_FINISH_MESSAGE_TYPE[\s\S]*navigate\(COMPANY_PATHS\.jobs\)/);
  assert.doesNotMatch(postJobSource, /width=760,height=860/);
  assert.doesNotMatch(manageJobsSource, /width=760,height=860/);
  assert.doesNotMatch(postJobSource, /window\.open\(COMPANY_PATHS\.postJobPayment/);
  assert.doesNotMatch(manageJobsSource, /window\.open\(COMPANY_PATHS\.postJobPayment/);
  assert.doesNotMatch(styles, /\.company-merchant-plan-option-selected::before\s*\{/);
  assert.doesNotMatch(styles, /\.company-merchant-receipt-grid\s*\{/);
  assert.doesNotMatch(styles, /\.company-merchant-success-summary\s*\{/);
  assert.doesNotMatch(styles, /\.company-merchant-receipt-meta\s*\{/);
  assert.doesNotMatch(styles, /grid-template-columns:\s*minmax\(0, 1\.28fr\)/);
  assert.doesNotMatch(styles, /transition:\s*all/);
});
