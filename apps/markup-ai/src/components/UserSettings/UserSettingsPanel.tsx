import React, { useState } from "react";
import { useSDK } from "@contentful/react-apps-toolkit";
import { SidebarAppSDK } from "@contentful/app-sdk";
import styled from "@emotion/styled";
import { Tooltip, IconButton, Button, Flex, Paragraph } from "@contentful/f36-components";
import { XIcon } from "@contentful/f36-icons";
import StyleSettings from "./StyleSettings";
import { useAuth } from "../../contexts/AuthContext";

const Panel = styled.div`
  width: 100%;
  box-sizing: border-box;
  padding: 5px;
`;

const TabsBar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
`;

const TabButton = styled.button<{ active?: boolean; disabled?: boolean }>`
  appearance: none;
  border: none;
  background: transparent;
  color: #3c4262;
  padding: 4px 2px;
  border-radius: 0;
  font-size: 12px;
  font-weight: ${(p) => (p.active ? 700 : 600)};
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  border-bottom: 2px solid ${(p) => (p.active ? "#ef4540" : "transparent")};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const UserInfoSection = styled.div`
  padding: 8px;
`;

type UserSettingsPanelProps = {
  isOpen: boolean;
  forceOpen?: boolean;
  onClose?: () => void;
  dialect: string | null;
  tone: string | null;
  styleGuide: string | null;
  onDialectChange: (v: string | null) => void;
  onToneChange: (v: string | null) => void;
  onStyleGuideChange: (v: string | null) => void;
};

export const UserSettingsPanel: React.FC<UserSettingsPanelProps> = ({
  isOpen,
  forceOpen = false,
  onClose,
  dialect,
  tone,
  styleGuide,
  onDialectChange,
  onToneChange,
  onStyleGuideChange,
}) => {
  useSDK<SidebarAppSDK>();
  const [showCloseTooltip, setShowCloseTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState<"style" | "user">("style");
  const isConfigComplete = !!(dialect && styleGuide);
  const { logout, token, user } = useAuth();

  if (!isOpen && !forceOpen) return null;

  return (
    <Panel>
      <Header>
        <TabsBar>
          <TabButton
            active={activeTab === "style"}
            onClick={() => {
              setActiveTab("style");
            }}
          >
            Configuration
          </TabButton>
          <TabButton
            active={activeTab === "user"}
            onClick={() => {
              setActiveTab("user");
            }}
          >
            User Info
          </TabButton>
        </TabsBar>
        {!forceOpen && onClose && (
          <Tooltip
            content="Please select Style Guide and Dialect before closing"
            isVisible={showCloseTooltip && !isConfigComplete}
          >
            <IconButton
              aria-label="Close settings"
              size="small"
              variant="transparent"
              icon={<XIcon />}
              onClick={() => {
                if (!isConfigComplete) {
                  setShowCloseTooltip(true);
                  globalThis.setTimeout(() => {
                    setShowCloseTooltip(false);
                  }, 2_000);
                  return;
                }
                onClose();
              }}
            />
          </Tooltip>
        )}
      </Header>

      {activeTab === "style" && (
        <StyleSettings
          apiKey={token || ""}
          dialect={dialect}
          tone={tone}
          styleGuide={styleGuide}
          onDialectChange={onDialectChange}
          onToneChange={onToneChange}
          onStyleGuideChange={onStyleGuideChange}
          onSaveAndClose={() => {
            if (onClose) {
              onClose();
            }
          }}
        />
      )}

      {activeTab === "user" && (
        <UserInfoSection>
          <Flex flexDirection="column" gap="spacingS">
            <Paragraph>
              <strong>Signed in as:</strong>{" "}
              {(user?.email as string) || (user?.name as string) || "User"}
            </Paragraph>
            <Button
              size="small"
              variant="negative"
              onClick={async () => {
                try {
                  await logout();
                } catch (err) {
                  console.error("[UserSettingsPanel] Logout failed:", err);
                }
              }}
            >
              Sign out
            </Button>
          </Flex>
        </UserInfoSection>
      )}
    </Panel>
  );
};

export default UserSettingsPanel;
