import styled from "@emotion/styled";

export const ConfigScreenWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 0 24px 40px 24px;
  background: #f7f9fc;
`;

export const TopCover = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 260px;
  background: linear-gradient(180deg, #5e1b2c 0%, #f9b5ac 100%);
  z-index: 0;
`;

export const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 920px;
  height: auto;
  flex: 0 0 auto;
  background: #fff;
  border: 1px solid #e1e7ef;
  border-radius: 10px;
  box-shadow:
    0 12px 28px rgba(17, 27, 43, 0.12),
    0 2px 8px rgba(17, 27, 43, 0.06);
  padding: 40px 32px 40px 32px;
  margin-top: 80px;
  z-index: 1;
`;

export const TabNavWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  height: 48px;
  border-bottom: 1px solid #cfd9e0;
  margin-bottom: 32px;
`;

export const TabButton = styled.button<{ isActive: boolean }>`
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  font-family: "Geist", sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.154px;
  text-align: center;
  padding: 8px 16px;
  width: 228px;
  height: 48px;
  color: ${({ isActive }) => (isActive ? "#0059C8" : "#5A657C")};
  border-bottom: ${({ isActive }) => (isActive ? "2px solid #0059C8" : "none")};
  background: transparent;
  transition:
    color 0.2s,
    border-bottom 0.2s;
`;

export const StyleGuideTabWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: transparent;
  color: #111b2b;
`;

export const StyleGuideRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 32px;
  width: 100%;
  max-width: 500px;
`;

export const StyleGuideLabel = styled.label`
  font-family: "Geist", sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #111b2b;
  margin-bottom: 8px;
`;

export const AppConfigHeader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 0px;
  gap: 5px;
  width: 100%;
  margin-bottom: 16px;
`;

export const AppConfigTitle = styled.h2`
  width: 100%;
  font-family: "Geist", sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 20px;
  line-height: 32px;
  letter-spacing: 0.38px;
  color: #000000;
  margin: 0;
`;

export const AppConfigDescription = styled.p`
  width: 100%;
  font-family: "Geist", sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.154px;
  color: #5a657c;
  margin: 0;
`;

export const FooterLogo = styled.a`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  align-self: center;
  margin-top: auto;
  text-decoration: none;
`;

export const FooterLogoImage = styled.img`
  margin-top: 24px;
  height: 100px;
  width: auto;
  opacity: 0.9;
`;

export const ContentTypeSection = styled.div`
  width: 100%;
  margin-top: 24px;
`;

export const SectionTitle = styled.h3`
  font-family: "Geist", sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: #111b2b;
  margin: 0 0 8px 0;
`;

export const SectionDescription = styled.p`
  font-family: "Geist", sans-serif;
  font-size: 14px;
  line-height: 20px;
  color: #5a657c;
  margin: 0 0 16px 0;
`;

export const ContentTypeGroup = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background: #f7f9fc;
  border-radius: 8px;
  border: 1px solid #e1e7ef;
`;

export const ContentTypeName = styled.h4`
  font-family: "Geist", sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #111b2b;
  margin: 0 0 12px 0;
`;

export const FieldCheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
`;

export const FieldLabel = styled.span`
  font-family: "Geist", sans-serif;
  font-size: 14px;
  line-height: 20px;
  color: #5a657c;
`;

export const FieldType = styled.span`
  font-family: "Geist", sans-serif;
  font-size: 12px;
  line-height: 16px;
  color: #8091a5;
  background: #e1e7ef;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 4px;
`;

// Auth section styles
export const AuthSection = styled.div`
  width: 100%;
  margin-bottom: 24px;
  padding: 20px;
  background: #f7f9fc;
  border-radius: 8px;
  border: 1px solid #e1e7ef;
`;

export const AuthSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

export const AuthSectionTitle = styled.h4`
  font-family: "Geist", sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #111b2b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const AuthSectionDescription = styled.p`
  font-family: "Geist", sans-serif;
  font-size: 13px;
  line-height: 18px;
  color: #5a657c;
  margin: 0 0 16px 0;
`;

export const AuthStatusBadge = styled.span<{ $isAuthenticated: boolean }>`
  font-family: "Geist", sans-serif;
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${({ $isAuthenticated }) => ($isAuthenticated ? "#e6f4ea" : "#fff3e0")};
  color: ${({ $isAuthenticated }) => ($isAuthenticated ? "#137333" : "#e65100")};
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e1e7ef;
`;

export const UserEmail = styled.span`
  font-family: "Geist", sans-serif;
  font-size: 13px;
  color: #111b2b;
`;

// Content type settings styles
export const ContentTypeSettingsSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e1e7ef;
`;

export const ContentTypeSettingsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 8px 0;
`;

export const ContentTypeSettingsTitle = styled.span`
  font-family: "Geist", sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: #5a657c;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const ContentTypeSettingsPanel = styled.div<{ $isExpanded: boolean }>`
  display: ${({ $isExpanded }) => ($isExpanded ? "block" : "none")};
  padding: 12px;
  margin-top: 8px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e1e7ef;
`;

export const SettingsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

export const SettingsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const SettingsLabel = styled.label`
  font-family: "Geist", sans-serif;
  font-size: 12px;
  color: #5a657c;
  white-space: nowrap;
`;

export const OptionalBadge = styled.span`
  font-family: "Geist", sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #8091a5;
  background: #f0f3f7;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
`;
