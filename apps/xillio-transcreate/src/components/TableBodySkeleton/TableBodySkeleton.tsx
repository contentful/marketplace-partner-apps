import { Checkbox, Skeleton, Table } from "@contentful/f36-components";
import { TableBodySkeletonProps } from "./TableBodySkeleton.types";

export const TableBodySkeleton = ({ hasCheckbox = false, rows, columns }: TableBodySkeletonProps) => {
    if (rows <= 0 || columns <= 0) {
        return null;
    }

    return (
        <>
            {new Array(rows).fill(null).map((_, index) => (
                <Table.Row key={index}>
                    {hasCheckbox && (
                        <Table.Cell>
                            <Checkbox isDisabled />
                        </Table.Cell>
                    )}
                    {new Array(columns).fill(null).map((_, index) => (
                        <Table.Cell key={index}>
                            <Skeleton.Container svgHeight="1rem">
                                <Skeleton.Text numberOfLines={1} />
                            </Skeleton.Container>
                        </Table.Cell>
                    ))}
                </Table.Row>
            ))}
        </>
    );
};
