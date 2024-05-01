import { Checkbox, Skeleton, Table } from "@contentful/f36-components";

export type TableBodySkeletonProps = {
    hasCheckbox?: boolean;
    rows: number;
    columns: number;
};

export const TableBodySkeleton = ({ hasCheckbox = false, rows, columns }: TableBodySkeletonProps) => {
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
