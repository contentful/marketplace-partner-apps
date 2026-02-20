/**
 * UserProfileButton - Compact user profile button for the config screen header
 * Shows sign-in button when not authenticated, user avatar with dropdown when authenticated
 */

import React, { useState, useRef, useEffect } from "react";
import { Button, Spinner } from "@contentful/f36-components";
import { UserIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import { useAuth } from "../../../contexts/AuthContext";

const ProfileWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const ProfileButton = styled.button<{ $isAuthenticated: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid
    ${({ $isAuthenticated }) => ($isAuthenticated ? tokens.green400 : tokens.gray300)};
  background: ${({ $isAuthenticated }) => ($isAuthenticated ? tokens.green100 : tokens.gray100)};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ $isAuthenticated }) =>
      $isAuthenticated ? tokens.green500 : tokens.gray400};
    background: ${({ $isAuthenticated }) => ($isAuthenticated ? tokens.green200 : tokens.gray200)};
  }

  svg {
    color: ${({ $isAuthenticated }) => ($isAuthenticated ? tokens.green600 : tokens.gray600)};
  }
`;

const Dropdown = styled.div<{ $isVisible: boolean; $position: "above" | "below" }>`
  position: absolute;
  ${({ $position }) =>
    $position === "above"
      ? `
    bottom: 100%;
    margin-bottom: 8px;
  `
      : `
    top: 100%;
    margin-top: 8px;
  `}
  right: 0;
  min-width: 220px;
  background: #fff;
  border: 1px solid ${tokens.gray200};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  display: ${({ $isVisible }) => ($isVisible ? "block" : "none")};
`;

const DropdownContent = styled.div`
  padding: 12px;
`;

const UserEmail = styled.div`
  font-size: 13px;
  color: ${tokens.gray800};
  padding: 8px 0;
  border-bottom: 1px solid ${tokens.gray200};
  margin-bottom: 8px;
  word-break: break-all;
`;

const StatusText = styled.div`
  font-size: 11px;
  color: ${tokens.gray500};
  margin-bottom: 8px;
`;

const SignInPrompt = styled.div`
  padding: 8px 0;
`;

const SignInText = styled.p`
  font-size: 12px;
  color: ${tokens.gray600};
  margin: 0 0 12px 0;
  line-height: 1.4;
`;

export interface UserProfileButtonProps {
  /** Optional callback when user signs out */
  onSignOut?: () => void;
  /** If true, hides the sign-in prompt when not authenticated (for dialog use) */
  hideSignInPrompt?: boolean;
  /** Position of the dropdown relative to the button. Defaults to "below" */
  dropdownPosition?: "above" | "below";
}

export const UserProfileButton: React.FC<UserProfileButtonProps> = ({
  onSignOut,
  hideSignInPrompt = false,
  dropdownPosition = "below",
}) => {
  const { isLoading, isAuthenticated, user, loginWithPopup, logout, error } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignIn = async () => {
    try {
      await loginWithPopup();
      setIsOpen(false);
    } catch (err) {
      console.error("[UserProfileButton] Login failed:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setIsOpen(false);
      // Call the onSignOut callback if provided
      if (onSignOut) {
        onSignOut();
      }
    } catch (err) {
      console.error("[UserProfileButton] Logout failed:", err);
    }
  };

  if (isLoading) {
    return (
      <ProfileWrapper>
        <Spinner size="small" />
      </ProfileWrapper>
    );
  }

  return (
    <ProfileWrapper ref={dropdownRef}>
      <ProfileButton
        $isAuthenticated={isAuthenticated}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        aria-label={isAuthenticated ? "User profile" : "Sign in"}
      >
        <UserIcon size="small" />
      </ProfileButton>

      <Dropdown $isVisible={isOpen} $position={dropdownPosition}>
        <DropdownContent>
          {isAuthenticated ? (
            <>
              <StatusText>Signed in as</StatusText>
              <UserEmail>{(user?.email as string) || (user?.name as string) || "User"}</UserEmail>
              <Button variant="negative" size="small" isFullWidth onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            !hideSignInPrompt && (
              <SignInPrompt>
                <SignInText>
                  Sign in to set default style guide, dialect, and tone for content types.
                </SignInText>
                <Button variant="primary" size="small" isFullWidth onClick={handleSignIn}>
                  Sign in to Markup AI
                </Button>
                {error && (
                  <StatusText style={{ color: tokens.red600, marginTop: 8 }}>{error}</StatusText>
                )}
              </SignInPrompt>
            )
          )}
        </DropdownContent>
      </Dropdown>
    </ProfileWrapper>
  );
};

export default UserProfileButton;
