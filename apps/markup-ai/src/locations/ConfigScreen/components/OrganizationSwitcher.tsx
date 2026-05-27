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

import React, { useState } from "react";
import { Spinner } from "@contentful/f36-components";
import { BuildingIcon, CaretDownIcon, CaretRightIcon, CheckIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import { useAuth } from "../../../contexts/AuthContext";
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
  const { organization: currentOrg } = useAccount();
  const { organizations } = useOrganizations();

  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingOrgId, setPendingOrgId] = useState<string | null>(null);

  const isCurrent = (org: Organization): boolean =>
    (currentOrgId != null && org.id === currentOrgId) ||
    (currentOrgName != null && org.name === currentOrgName) ||
    (currentOrg != null && org.name === currentOrg.name);

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
  const headerLabel = currentLabel ?? "Organization";

  const handleToggle = () => {
    if (isSwitchingOrg) return;
    setIsExpanded((prev) => !prev);
  };

  const handleSelect = async (org: Organization) => {
    if (isSwitchingOrg) return;
    if (isCurrent(org)) {
      setIsExpanded(false);
      return;
    }
    setPendingOrgId(org.id);
    try {
      await switchOrganization(org.id);
      setIsExpanded(false);
    } catch {
      // Failure (incl. user-cancelled popup) is surfaced via the auth error
      // state; just stop the spinner and stay put.
    } finally {
      setPendingOrgId(null);
    }
  };

  return (
    <Wrapper>
      <SectionLabel>Organization</SectionLabel>
      <CurrentRow
        type="button"
        $interactive={hasMultiple}
        disabled={!hasMultiple || isSwitchingOrg}
        aria-haspopup={hasMultiple ? "menu" : undefined}
        aria-expanded={hasMultiple ? isExpanded : undefined}
        onClick={hasMultiple ? handleToggle : undefined}
      >
        <RowLeft>
          <BuildingIcon size="tiny" />
          <OrgName title={headerLabel}>{headerLabel}</OrgName>
        </RowLeft>
        {hasMultiple &&
          (isExpanded ? <CaretDownIcon size="tiny" /> : <CaretRightIcon size="tiny" />)}
      </CurrentRow>

      {hasMultiple && isExpanded && (
        <OrgList role="menu" aria-label="Organizations">
          {organizations.map((org) => {
            const label = org.display_name || org.name;
            const current = isCurrent(org);
            const pending = pendingOrgId === org.id;
            return (
              <OrgItem
                key={org.id}
                type="button"
                role="menuitem"
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
    </Wrapper>
  );
};

export default OrganizationSwitcher;
