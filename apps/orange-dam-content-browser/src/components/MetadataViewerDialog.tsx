import { CxSwitch } from "@orangelogic-private/design-system";
import React, { useEffect, useState } from "react";

interface MetadataViewerDialogProps {
  data: {
    imageUrl?: string | null;
    metadata?: Record<string, any> | null;
    extraFields?: Record<string, any> | null;
    [key: string]: any;
  };
}

const renderTableSection = (
  title: string,
  obj: Record<string, any> | null | undefined
) => (
  <div className="mb-6">
    <div className="font-semibold text-base mb-2 max-w-max">{title}</div>
    {obj && Object.keys(obj).length > 0 ? (
      <div className="w-full">
        <table className="w-full bg-white border border-gray-200 rounded-lg mb-2 table-fixed">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 text-left w-1/3">Property</th>
              <th className="px-4 py-2 text-left w-2/3">Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(obj).map(([key, value]) => (
              <tr key={key} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 border-gray-200">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-pre-wrap dark:text-white">
                  {key}
                </td>
                <td className="px-6 py-2 break-words align-top whitespace-pre-wrap">
                  {typeof value === "object" && value !== null
                    ? JSON.stringify(value, null, 2)
                    : String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-gray-500 italic mb-2">No data available.</div>
    )}
  </div>
);

const MetadataViewerDialog: React.FC<MetadataViewerDialogProps> = ({ data }) => {
  const [isTableView, setIsTableView] = useState(true);
  const { imageUrl = null, metadata = null, extraFields = null, ...rest } = data || {};

  const renderMainTable = () => (
    <div>
      {renderTableSection("Properties", {
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...rest,
      })}
      {renderTableSection("Metadata", metadata)}
      {renderTableSection("Extra Fields", extraFields)}
    </div>
  );

  return (
    <div className="p-6 min-h-max relative">
      <div className="flex items-center mb-4">
        <cx-button-group label="Alignment">
          <cx-button variant="default" size="medium" onClick={() => setIsTableView(true)}>
            Table View
          </cx-button>
          <cx-button variant="default" size="medium" onClick={() => setIsTableView(false)}>
            JSON View
          </cx-button>
        </cx-button-group>
      </div>

      {isTableView ? (
        renderMainTable()
      ) : (
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap break-words text-sm mb-4 w-full">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default MetadataViewerDialog;