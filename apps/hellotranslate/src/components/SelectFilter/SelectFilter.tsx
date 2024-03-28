import { Menu } from "@contentful/f36-components";
import { SelectFilterProps } from "./SelectFilter.types";
import { Filter } from "../Filter";

export const SelectFilter = <SelectFilterValue extends string>({
    name,
    options,
    selected,
    onSelect,
    isDisabled = false,
}: SelectFilterProps<SelectFilterValue>) => {
    return (
        <Menu>
            <Filter name={name} value={options[selected]} Trigger={Menu.Trigger} isDisabled={isDisabled} />
            <Menu.List>
                {Object.keys(options).map((value) => (
                    <Menu.Item key={value} onClick={() => onSelect(value as SelectFilterValue)}>
                        {options[value as SelectFilterValue]}
                    </Menu.Item>
                ))}
            </Menu.List>
        </Menu>
    );
};
