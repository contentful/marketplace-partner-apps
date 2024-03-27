import { Calendar, DateTime, Popover } from "@contentful/f36-components";
import { CalendarFilterProps } from "./CalendarFilter.types";
import { Filter } from "../Filter";
import { useMemo, useState } from "react";
import { css } from "emotion";
import tokens from "@contentful/f36-tokens";

export const CalendarFilter = ({
    name,
    date,
    onDate,
    condition,
    onCondition,
    isDisabled = false,
}: CalendarFilterProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const value = useMemo(() => {
        if (!date) return "Select date";
        return date.toLocaleDateString();
    }, [date]);

    const handleSelect = (newDate?: Date) => {
        onDate(newDate ?? null);
        setIsOpen(false);
    };

    return (
        <Popover isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <Filter
                name={name}
                value={value}
                Trigger={Popover.Trigger}
                onClick={() => setIsOpen(!isOpen)}
                conditions={{
                    options: [
                        "is",
                        "is greater than",
                        "is greater than or equal to",
                        "is less than",
                        "is less than or equal to",
                    ],
                    selected: condition,
                    onSelect: onCondition,
                }}
                isDisabled={isDisabled}
            />
            <Popover.Content>
                <Calendar
                    captionLayout="dropdown-buttons"
                    className={css({ padding: tokens.spacingXs })}
                    mode="single"
                    fromDate={new Date(Date.now() - 100 * 365 * 24 * 60 * 60 * 1000)}
                    toDate={new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)}
                    selected={date ?? undefined}
                    onSelect={handleSelect}
                />
            </Popover.Content>
        </Popover>
    );
};
