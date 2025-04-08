import {
    Checkbox,
    Heading,
    Note,
    Paragraph,
    Text,
    TextInput,
    Stack,
    Flex,
    Box
} from "@contentful/f36-components";
import tokens from "@contentful/f36-tokens";
import { css } from "@emotion/css";
import { useEffect, useState, useRef } from "react";
import { IConvoxContentTypesProps } from "../customTypes/IConvoxContentTypesProps";
import { SearchIcon, ChevronDownIcon, ChevronUpIcon, CloseIcon } from "@contentful/f36-icons";

const SELECT_ALL_CHECKBOX = 'selectAll';

const styles = {
    wrapper: css({
        marginTop: tokens.spacingM,
        marginBottom: tokens.spacingXl,
    }),
    dropdownContainer: css({
        position: 'relative',
        width: '100%',
    }),
    dropdownTrigger: css({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        border: `1px solid ${tokens.gray300}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: `${tokens.spacingM} ${tokens.spacingL}`,
        background: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minHeight: '48px',
        userSelect: 'none',
        '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${tokens.blue200}`,
            borderColor: tokens.blue500,
        },
        '&:hover': {
            borderColor: tokens.blue500,
            boxShadow: tokens.boxShadowDefault,
        },
    }),
    dropdownMenu: css({
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'white',
        border: `1px solid ${tokens.gray300}`,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: `0 4px 16px rgba(0, 0, 0, 0.1)`,
        maxHeight: '350px',
        overflowY: 'auto',
    }),
    searchContainer: css({
        padding: tokens.spacingM,
        borderBottom: `1px solid ${tokens.gray200}`,
    }),
    checkboxList: css({
        padding: `${tokens.spacingS} 0`,
    }),
    checkboxItem: css({
        padding: `${tokens.spacingS} ${tokens.spacingL}`,
        transition: 'background-color 0.2s ease',
        '&:hover': {
            backgroundColor: tokens.gray100,
        },
    }),
    selectAllItem: css({
        padding: `${tokens.spacingS} ${tokens.spacingL}`,
        borderBottom: `1px solid ${tokens.gray200}`,
        backgroundColor: tokens.gray100,
    }),
    noResults: css({
        color: tokens.gray600,
        padding: tokens.spacingM,
        textAlign: 'center',
        fontStyle: 'italic',
    }),
    selectedBadgesContainer: css({
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacingXs,
        marginTop: tokens.spacingM,
    }),
    badge: css({
        marginRight: tokens.spacingXs,
        marginBottom: tokens.spacingXs,
        backgroundColor: tokens.blue100,
        color: tokens.blue700,
        borderColor: tokens.blue200,
        padding: `${tokens.spacing2Xs} ${tokens.spacingM}`,
        borderRadius: '16px',
        fontSize: tokens.fontSizeS,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s ease',
        userSelect: 'none',
    }),
    authenticatedBadge: css({
        '&:hover': {
            backgroundColor: tokens.blue200,
        },
    }),
    placeholderText: css({
        color: tokens.gray600,
        fontSize: tokens.fontSizeM,
    }),
    selectedText: css({
        fontWeight: 500,
        color: tokens.gray800,
    }),
    badgeCloseButton: css({
        marginLeft: tokens.spacingXs,
        cursor: 'pointer',
        color: tokens.blue700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        '&:hover': {
            backgroundColor: tokens.blue300,
            color: tokens.blue900,
        },
    }),
    headingContainer: css({
        marginBottom: tokens.spacingM,
    }),
    countBadge: css({
        backgroundColor: tokens.blue700,
        color: 'white',
        borderRadius: '12px',
        padding: `0 ${tokens.spacingXs}`,
        fontSize: tokens.fontSizeS,
        fontWeight: 'bold',
        minWidth: '24px',
        height: '24px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: tokens.spacingXs,
    }),
    disabledState: css({
        opacity: 0.6,
        cursor: 'not-allowed',
        pointerEvents: 'none',
    }),
};

export default function ConvoxContentTypes({
    contentTypes,
    selectedContentTypes,
    isAuthenticated,
    onContentTypesChange
}: IConvoxContentTypesProps) {
    const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const contentTypeMap = contentTypes.reduce((acc, contentType) => {
        acc[contentType.sys.id] = contentType.name;
        return acc;
    }, {} as Record<string, string>);

    useEffect(function () {
        if (selectedContentTypes.length === contentTypes.length && contentTypes.length > 0) {
            setIsSelectAllChecked(true);
        } else {
            setIsSelectAllChecked(false);
        }
    }, [selectedContentTypes, contentTypes.length]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    function handleSelectAllChange(event: React.ChangeEvent<HTMLInputElement>) {
        const isChecked = event.target.checked;
        if (isChecked) {
            onContentTypesChange(contentTypes.map(contentType => contentType.sys.id));
        } else {
            onContentTypesChange([]);
        }
    }

    function handleContentTypeChange(contentTypeId: string, isChecked: boolean) {
        let updatedSelectedContentTypes;
        if (isChecked) {
            updatedSelectedContentTypes = [...selectedContentTypes, contentTypeId];
        } else {
            updatedSelectedContentTypes = selectedContentTypes.filter(id => id !== contentTypeId);
        }
        onContentTypesChange(updatedSelectedContentTypes);
    }

    function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
        setSearchTerm(event.target.value);
    }

    function toggleDropdown() {
        if (isAuthenticated) {
            setIsDropdownOpen(!isDropdownOpen);
            if (!isDropdownOpen) {
                setSearchTerm("");
            }
        }
    }

    function removeBadge(contentTypeId: string, event: React.MouseEvent) {
        event.stopPropagation();
        handleContentTypeChange(contentTypeId, false);
    }

    const filteredContentTypes = contentTypes.filter(contentType =>
        contentType.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedBadgesData = selectedContentTypes
        .map(id => ({
            id,
            name: contentTypeMap[id] || id
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className={styles.wrapper}>
            <div className={styles.headingContainer}>
                <Heading>Assign to sidebars</Heading>
                <Paragraph>
                    Select which content types will display Convox functionality in the sidebar.
                </Paragraph>
            </div>

            {contentTypes.length === 0 ? (
                <Note variant="warning">
                    There are <strong>no content types</strong> in this environment.
                </Note>
            ) : (
                <Stack flexDirection="column" spacing="spacingXs">
                    <div
                        className={css(
                            styles.dropdownContainer,
                            !isAuthenticated && styles.disabledState
                        )}
                        ref={dropdownRef}
                    >
                        <div
                            className={css(
                                styles.dropdownTrigger,
                                !isAuthenticated && styles.disabledState
                            )}
                            onClick={toggleDropdown}
                            tabIndex={isAuthenticated ? 0 : -1}
                            role="button"
                            aria-haspopup="listbox"
                            aria-expanded={isDropdownOpen}
                        >
                            <Flex alignItems="center">
                                {selectedContentTypes.length > 0 ? (
                                    <Flex alignItems="center">
                                        <span className={styles.selectedText}>
                                            Content types selected
                                        </span>
                                        <span className={styles.countBadge}>
                                            {selectedContentTypes.length}
                                        </span>
                                    </Flex>
                                ) : (
                                    <span className={styles.placeholderText}>Select content types...</span>
                                )}
                            </Flex>
                            {isDropdownOpen ? <ChevronUpIcon variant="muted" /> : <ChevronDownIcon variant="muted" />}
                        </div>

                        {isDropdownOpen && (
                            <div className={styles.dropdownMenu}>
                                <div className={styles.searchContainer}>
                                    <TextInput
                                        placeholder="Search content types..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        icon={<SearchIcon variant="muted" />}
                                        autoFocus
                                        size="small"
                                    />
                                </div>

                                <div className={styles.selectAllItem}>
                                    <Checkbox
                                        id={SELECT_ALL_CHECKBOX}
                                        value={SELECT_ALL_CHECKBOX}
                                        isChecked={isSelectAllChecked}
                                        onChange={handleSelectAllChange}
                                    >
                                        <Text fontWeight="fontWeightMedium">Select all content types</Text>
                                    </Checkbox>
                                </div>

                                <div className={styles.checkboxList}>
                                    {filteredContentTypes.length > 0 ? (
                                        filteredContentTypes.map(contentType => (
                                            <div className={styles.checkboxItem} key={contentType.sys.id}>
                                                <Checkbox
                                                    id={`content-type-${contentType.sys.id}`}
                                                    value={contentType.sys.id}
                                                    isChecked={selectedContentTypes.includes(contentType.sys.id)}
                                                    onChange={(event) => handleContentTypeChange(contentType.sys.id, event.target.checked)}
                                                >
                                                    <Text>{contentType.name}</Text>
                                                </Checkbox>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.noResults}>No matching content types found</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedContentTypes.length > 0 && (
                        <div className={styles.selectedBadgesContainer}>
                            {sortedBadgesData.map(({ id, name }) => (
                                <Box
                                    key={id}
                                    className={css(
                                        styles.badge,
                                        isAuthenticated && styles.authenticatedBadge
                                    )}
                                >
                                    {name}
                                    {isAuthenticated && (
                                        <span
                                            className={styles.badgeCloseButton}
                                            onClick={(e) => removeBadge(id, e)}
                                            role="button"
                                            aria-label={`Remove ${name}`}
                                        >
                                            <CloseIcon size="tiny" />
                                        </span>
                                    )}
                                </Box>
                            ))}
                        </div>
                    )}
                </Stack>
            )}
        </div>
    );
}
