import { Checkbox, Heading, Note, Paragraph, Text } from "@contentful/f36-components";
import tokens from "@contentful/f36-tokens";
import { css } from "@emotion/css";
import { useEffect, useState } from "react";
import { IConvoxContentTypesProps } from "../customTypes/IConvoxContentTypesProps";

const SELECT_ALL_CHECKBOX = 'selectAll';
const styles = {
    selectAllCheckbox: css({
        marginBottom: tokens.spacingXs,
    }),
    checkboxLabel: css({
        fontWeight: 400,
    }),
};

export default function ConvoxContentTypes({ contentTypes, selectedContentTypes, isAuthenticated, onContentTypesChange }: IConvoxContentTypesProps) {
    const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);

    useEffect(function () {
        if (selectedContentTypes.length === contentTypes.length) {
            setIsSelectAllChecked(true);
        } else {
            setIsSelectAllChecked(false);
        }
    }, [selectedContentTypes, contentTypes.length]);

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

    return (
        <>
            <Heading>Assign to sidebars</Heading>
            <Paragraph>
                Select which content types will display Convox functionality in the sidebar.
            </Paragraph>
            {contentTypes.length === 0 ? (
                <Note variant="warning">
                    There are <strong>no content types</strong> in this environment.
                </Note>
            ) : (
                <div>
                    <Checkbox
                        id={SELECT_ALL_CHECKBOX}
                        value={SELECT_ALL_CHECKBOX}
                        isChecked={isSelectAllChecked}
                        onChange={handleSelectAllChange}
                        className={styles.selectAllCheckbox}
                        isDisabled={!isAuthenticated}
                    >
                        Select all
                    </Checkbox>

                    {contentTypes.map(contentType => (
                        <Checkbox
                            className={styles.checkboxLabel}
                            key={contentType.sys.id}
                            id={`content-type-${contentType.sys.id}`}
                            value={contentType.sys.id}
                            isChecked={selectedContentTypes.includes(contentType.sys.id)}
                            onChange={(event) => handleContentTypeChange(contentType.sys.id, event.target.checked)}
                            isDisabled={!isAuthenticated}
                        >
                            <Text>{contentType.name}</Text>
                        </Checkbox>
                    ))}
                </div>
            )}
        </>
    );
}
