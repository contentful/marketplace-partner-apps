/**
 * OrganizationSwitcher - shows the signed-in user's current organization and,
 * when they belong to more than one, lets them switch. Mirrors the sidebar-app's
 * OrganizationSwitcher, restyled with Forma 36 to live inside the
 * UserProfileButton dropdown.
 *
 * The current-org label comes from `GET /account` (friendly `display_name`);
 * the switchable list and logos come from `GET /auth/organizations`. The active
 * row is matched against the JWT's `org_id` / `org_name` claims.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Spinner } from "@contentful/f36-components";
import {
  BuildingIcon,
  CaretDownIcon,
  CaretRightIcon,
  CheckIcon,
  WarningIcon,
} from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import { useAuth } from "../../../contexts/AuthContext";
import { useTranslation } from "../../../contexts/LocalizationContext";
import { useAccount } from "../../../hooks/useAccount";
import { useOrganizations, type Organization } from "../../../hooks/useOrganizations";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing2Xs};
`;

const SectionLabel = styled.div`
  font-size: 11px;
  color: ${tokens.gray500};
  margin-bottom: ${tokens.spacing2Xs};
`;

const CurrentRow = styled.button<{ $interactive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spacingXs};
  width: 100%;
  padding: ${tokens.spacingXs} ${tokens.spacingS};
  border: 1px solid ${tokens.gray200};
  border-radius: ${tokens.borderRadiusMedium};
  background: ${tokens.gray100};
  color: ${tokens.gray800};
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  text-align: left;
  cursor: ${({ $interactive }) => ($interactive ? "pointer" : "default")};

  &:hover {
    background: ${({ $interactive }) => ($interactive ? tokens.gray200 : tokens.gray100)};
  }

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }

  svg {
    color: ${tokens.gray600};
    flex-shrink: 0;
  }
`;

const RowLeft = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${tokens.spacingXs};
  min-width: 0;
`;

const OrgName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const OrgList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing2Xs};
  margin-top: ${tokens.spacing2Xs};
  padding-left: ${tokens.spacingXs};
`;

const OrgItem = styled.button<{ $current: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spacingXs};
  width: 100%;
  padding: ${tokens.spacingXs} ${tokens.spacingS};
  border: none;
  border-radius: ${tokens.borderRadiusMedium};
  background: ${({ $current }) => ($current ? tokens.blue100 : "transparent")};
  color: ${tokens.gray800};
  font-size: ${tokens.fontSizeS};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${({ $current }) => ($current ? tokens.blue100 : tokens.gray100)};
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  svg {
    flex-shrink: 0;
  }
`;

const CurrentCheck = styled(CheckIcon)`
  color: ${tokens.green600};
`;

const ErrorRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
  margin-top: ${tokens.spacing2Xs};
  padding: ${tokens.spacingXs} ${tokens.spacingS};
  border-radius: ${tokens.borderRadiusMedium};
  background: ${tokens.red100};
  color: ${tokens.red700};
  font-size: ${tokens.fontSizeS};

  svg {
    color: ${tokens.red600};
    flex-shrink: 0;
  }
`;

const OrgLogo = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid ${tokens.gray200};
  background: ${tokens.colorWhite};
  overflow: hidden;
  font-size: 9px;
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray700};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

function initialsFor(label: string): string {
  return label
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const OrganizationSwitcher: React.FC = () => {
  const { currentOrgId, currentOrgName, isSwitchingOrg, switchOrganization, isAuthenticated } =
    useAuth();
  const { t } = useTranslation();
  const { organization: currentOrg } = useAccount();
  const { organizations } = useOrganizations();

  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingOrgId, setPendingOrgId] = useState<string | null>(null);
  const [switchFailed, setSwitchFailed] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const closeMenu = useCallback(() => {
    setIsExpanded(false);
    setSwitchFailed(false);
  }, []);

  // Collapse the switch list when the user clicks outside the component.
  useEffect(() => {
    if (!isExpanded) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [isExpanded, closeMenu]);

  // Move focus into the menu when it opens so keyboard users land on a row
  // (the active org if present, otherwise the first item).
  useEffect(() => {
    if (!isExpanded) return;
    const items = itemRefs.current.filter((el): el is HTMLButtonElement => el != null);
    if (items.length === 0) return;
    const activeIndex = items.findIndex((el) => el.dataset.current === "true");
    items[Math.max(activeIndex, 0)].focus();
  }, [isExpanded]);

  const isCurrent = (org: Organization): boolean =>
    (currentOrgId != null && org.id === currentOrgId) ||
    (currentOrgName != null && org.name === currentOrgName) ||
    org.name === currentOrg?.name;

  const currentLabel =
    currentOrg?.display_name ??
    currentOrg?.name ??
    currentOrgName ??
    organizations.find(isCurrent)?.display_name ??
    null;

  // Nothing meaningful to show: not signed in, or no org info from any source.
  if (!isAuthenticated) return null;
  if (!currentLabel && organizations.length === 0) return null;

  const hasMultiple = organizations.length > 1;
  const headerLabel = currentLabel ?? t("organization");

  const openMenu = () => {
    setSwitchFailed(false);
    setIsExpanded(true);
  };

  const handleToggle = () => {
    if (isSwitchingOrg) return;
    if (isExpanded) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleSelect = async (org: Organization) => {
    if (isSwitchingOrg) return;
    if (isCurrent(org)) {
      closeMenu();
      return;
    }
    setSwitchFailed(false);
    setPendingOrgId(org.id);
    try {
      await switchOrganization(org.id);
      closeMenu();
    } catch {
      // Surface the failure inline and keep the list open so the user sees it
      // sits on the row they clicked (auth.error stays the out-of-band detail).
      setSwitchFailed(true);
    } finally {
      setPendingOrgId(null);
    }
  };

  // Roving focus: arrow keys move between menu items, Home/End jump to the
  // ends, Escape closes the menu and returns focus to the trigger.
  const moveFocus = (target: number | "first" | "last") => {
    const items = itemRefs.current.filter((el): el is HTMLButtonElement => el != null);
    if (items.length === 0) return;
    let next: number;
    if (target === "first") {
      next = 0;
    } else if (target === "last") {
      next = items.length - 1;
    } else {
      const curr = items.indexOf(document.activeElement as HTMLButtonElement);
      next = (curr + target + items.length) % items.length;
    }
    items[next].focus();
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveFocus(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus(-1);
        break;
      case "Home":
        e.preventDefault();
        moveFocus("first");
        break;
      case "End":
        e.preventDefault();
        moveFocus("last");
        break;
      case "Escape":
        e.preventDefault();
        closeMenu();
        triggerRef.current?.focus();
        break;
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!hasMultiple || isSwitchingOrg) return;
    if (e.key === "ArrowDown" && !isExpanded) {
      e.preventDefault();
      openMenu();
    }
  };

  return (
    <Wrapper ref={wrapperRef}>
      <SectionLabel>{t("organization")}</SectionLabel>
      <CurrentRow
        ref={triggerRef}
        type="button"
        $interactive={hasMultiple}
        disabled={!hasMultiple || isSwitchingOrg}
        aria-haspopup={hasMultiple ? "menu" : undefined}
        aria-expanded={hasMultiple ? isExpanded : undefined}
        onClick={hasMultiple ? handleToggle : undefined}
        onKeyDown={handleTriggerKeyDown}
      >
        <RowLeft>
          <BuildingIcon size="tiny" />
          <OrgName title={headerLabel}>{headerLabel}</OrgName>
        </RowLeft>
        {hasMultiple &&
          (isExpanded ? <CaretDownIcon size="tiny" /> : <CaretRightIcon size="tiny" />)}
      </CurrentRow>

      {hasMultiple && isExpanded && (
        <OrgList role="menu" aria-label={t("organizations")} onKeyDown={handleMenuKeyDown}>
          {organizations.map((org, index) => {
            const label = org.display_name || org.name;
            const current = isCurrent(org);
            const pending = pendingOrgId === org.id;
            return (
              <OrgItem
                key={org.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                data-current={current ? "true" : "false"}
                type="button"
                role="menuitem"
                tabIndex={-1}
                $current={current}
                disabled={isSwitchingOrg && !pending}
                aria-current={current ? "true" : undefined}
                onClick={() => {
                  void handleSelect(org);
                }}
              >
                <RowLeft>
                  <OrgLogo>
                    {org.picture ? (
                      <img src={org.picture} alt="" />
                    ) : (
                      <span>{initialsFor(label)}</span>
                    )}
                  </OrgLogo>
                  <OrgName title={label}>{label}</OrgName>
                </RowLeft>
                {pending ? <Spinner size="small" /> : current && <CurrentCheck size="tiny" />}
              </OrgItem>
            );
          })}
        </OrgList>
      )}

      {hasMultiple && isExpanded && switchFailed && (
        <ErrorRow role="alert">
          <WarningIcon size="tiny" />
          <span>{t("organization_switch_failed")}</span>
        </ErrorRow>
      )}
    </Wrapper>
  );
};

export default OrganizationSwitcher;
