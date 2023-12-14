import React from 'react';
import PropTypes from 'prop-types';
import { Button, Checkbox, Heading, Stack } from '@contentful/f36-components';

import SearchBar from './search-bar';

class ReleaseMultiSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      all: props.items,
      items: props.items,
      selected: []
    };
  }

  handleCheckboxChange = item => {
    this.setState(({ selected: prevSelected }) => {
      const itemId = item.sys.id;
      const exists = prevSelected.some(({ sys: { id } }) => id === itemId);
      const selected = exists
        ? prevSelected.filter(({ sys: { id } }) => id !== itemId)
        : prevSelected.concat(item);
      return { selected };
    });
  };

  handleChangeAll = () => {
    this.setState(({ selected: prevSelected, items }) => {
      const noOfEntries = items.filter(item => !this.isDisabled(item)).length;
      const areAllSelected = prevSelected.length === noOfEntries;
      const selected = areAllSelected
        ? []
        : items.filter(item => !this.isDisabled(item)).map(({ sys: { id } }) => id);
      return { selected };
    });
  };

  handleSearch = searchQuery => {
    this.setState(({ all }) => {
      const items = searchQuery ? all.filter(this.filterSelectableEntries(searchQuery)) : all;
      return { items };
    });
  };

  handleClearSearch = () => {
    const { all } = this.state;
    this.setState({ items: all });
  };

  render() {
    const { title, searchPlaceholder } = this.props;
    return (
      <>
        <Heading margin="0">{title}</Heading>
        {searchPlaceholder && (
          <SearchBar
            onChange={this.handleSearch}
            onClear={this.handleClearSearch}
            placeholder={searchPlaceholder}
          />
        )}
        {this.renderChoices()}
        {this.renderBtns()}
      </>
    );
  }

  filterSelectableEntries = searchQuery => ({ title }) => {
    if (!title) {
      return false;
    }

    return title.toLowerCase().includes(searchQuery);
  };

  renderChoices = () =>
    this.state.items.map(item => {
      const { title, sys } = item;
      const itemId = sys.id;
      const isSelected = this.state.selected.some(({ sys: { id } }) => id === itemId);
      return (
        <Checkbox
          key={itemId}
          className="vertical-padding"
          onChange={() => this.handleCheckboxChange(item)}
          isChecked={isSelected}>
          {title}
        </Checkbox>
      );
    });

  renderBtns = () => {
    const { selected } = this.state;
    const handleSelect = this.props.onSelect;

    return (
      <Stack justifyContent="center" fullWidth>
        <Button onClick={() => handleSelect()}>Cancel</Button>
        <Button variant="positive" onClick={() => handleSelect(selected)}>
          Select
        </Button>
      </Stack>
    );
  };
}

ReleaseMultiSelect.propTypes = {
  title: PropTypes.string.isRequired,
  searchPlaceholder: PropTypes.string,
  items: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired
};

export default ReleaseMultiSelect;
