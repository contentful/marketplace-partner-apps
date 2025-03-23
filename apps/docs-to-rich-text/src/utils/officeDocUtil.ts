export function isOffice365Html(html: string): boolean {
  if (!html) return false;

  // Check for distinctive Office 365 class names and patterns
  const hasOfficeClasses =
    html.includes('SCXW') || // Office web editor class prefix
    html.includes('BCX') || // Another Office class prefix
    html.includes('Paragraph SCXW') ||
    html.includes('TextRun SCXW') ||
    html.includes('OutlineElement Ltr SCXW') ||
    html.includes('NormalTextRun SCXW') ||
    html.includes('WACImage SCXW');

  // Check for Office 365 data attributes
  const hasOfficeAttributes =
    html.includes('data-ccp-props=') || html.includes('data-ccp-parastyle=') || (html.includes('paraeid=') && html.includes('paraid='));

  // Check for specific CSS properties that Office 365 uses
  const hasOfficeStyles =
    html.includes('-webkit-user-drag: none') &&
    html.includes('-webkit-tap-highlight-color: transparent') &&
    html.includes('font-family: &quot;Segoe UI&quot;, &quot;Segoe UI Web&quot;') &&
    html.includes('Aptos_MSFontService');

  // Combined check - if at least two of the three indicators are present
  return (hasOfficeClasses && hasOfficeAttributes) || (hasOfficeClasses && hasOfficeStyles) || (hasOfficeAttributes && hasOfficeStyles);
}
