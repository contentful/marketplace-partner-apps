import React from 'react';
import { Button, Dropdown, Menu, Space } from 'antd'; // Import Dropdown, Menu, and Button from Ant Design
import parse from 'html-react-parser';
import svgIcons from '../../lib/utils/icons'; // Assuming you have svgIcons imported correctly

const App = ({
  handleMenuClick,
  selectedItem,
  items,
  theme,
}: {
  handleMenuClick: (e: any) => void; // Define the type for handleMenuClick function
  selectedItem: any;
  items: any[];
  theme: string;
}) => {
  const menu = (
    <Menu onClick={handleMenuClick} className={`date-${theme}`}>
      {items.map((item: any, index: number) => (
        <Menu.Item key={item.key} className={`date-dropdown-${index}`}>
          {index === items.length - 1 ? (
            <>
              {item.label}{' '}
              <svg className="arrowdate" width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.666 10.6937L16.5284 16.5689L10.666 22.4441L12.4708 24.2489L20.1508 16.5689L12.4708 8.88892L10.666 10.6937Z" fill="#5A657C"></path>
              </svg>
            </>
          ) : (
            item.label
          )}
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <Button className="DropDownButton">
        <Space>
          {selectedItem || 'Date Range'}
          <span className="DropDownIconCustom">{parse(svgIcons.DateDownIcon || '')}</span>
        </Space>
      </Button>
    </Dropdown>
  );
};

export default App;
