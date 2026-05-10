import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
import {
  Table as AntTable,
  type TableProps,
  Card,
  Space,
  Button,
  Input,
  type CardProps,
} from "antd";
import { type ReactNode } from "react";

import { cn } from "../../lib/utils";
import { cleanObject } from "../../utils/clean-object";

type AdditionalProps = {
  className?: string;
  cardTitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  showFilter?: boolean;
  /**
   * if true, the table will not be wrapped in a card, no filter and search will be shown
   * useful if you want to customize the table and add your own filter and search components
   */
  isPlainTable?: boolean;
  onSearch?: (value: string) => void;
  /**
   * Callback when filter button is clicked
   * Pages can use this to show their own filter UI (dropdown, modal, drawer, etc.)
   */
  onFilter?: () => void;
  /**
   * Custom filter button element to replace the default filter button
   * Use this when you want to wrap the button with a Dropdown or custom UI
   */
  filterButton?: ReactNode;
  /**
   * Custom filter tags to display between search and filter button
   * This allows pages to render selected filters as tags
   */
  filterTags?: ReactNode;
  cardClassName?: string;
  cardProps?: CardProps & {
    borderRadius?: number;
  };
};

export function Table<RecordType = Record<string, unknown>>(
  props: TableProps<RecordType> & AdditionalProps,
) {
  const {
    pagination,
    isPlainTable = false,
    cardTitle,
    onSearch,
    onFilter,
    searchValue,
    searchPlaceholder = "Quick Search",
    showSearch = false,
    showFilter = false,
    filterButton,
    filterTags,
    cardClassName,
    cardProps,
    ...restProps
  } = props;

  // hide pagination if there is only one page
  const enhancedPagination =
    typeof pagination === "object" && pagination !== null
      ? {
          ...pagination,
          rootClassName: "!px-4",
          responsive:
            pagination.responsive !== undefined ? pagination.responsive : true,
          hideOnSinglePage:
            pagination.hideOnSinglePage !== undefined
              ? pagination.hideOnSinglePage
              : true,
        }
      : pagination === undefined
        ? { hideOnSinglePage: true, responsive: true }
        : pagination;

  const enhancedRowClassName: TableProps<RecordType>["rowClassName"] = (
    record,
    index,
    indent,
  ) => {
    const baseClass =
      index % 2 !== 0 ? "bg-secondary/[0.03] dark:bg-primary/[0.02]" : "";
    if (restProps.rowClassName) {
      if (typeof restProps.rowClassName === "function") {
        return cn(baseClass, restProps.rowClassName(record, index, indent));
      }
      return cn(baseClass, restProps.rowClassName);
    }
    return baseClass;
  };

  const extra =
    showSearch || showFilter || filterTags ? (
      <Space wrap>
        {showSearch && (
          <Input
            placeholder={searchPlaceholder}
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => {
              onSearch?.(e.target.value);
            }}
            style={{ width: 250 }}
            allowClear
          />
        )}
        {filterTags}
        {showFilter &&
          (filterButton || (
            <Button icon={<FilterOutlined />} onClick={onFilter} type="primary">
              Filter
            </Button>
          ))}
      </Space>
    ) : null;

  if (!isPlainTable) {
    const { styles: cardStyles, style, ...restCardProps } = cardProps || {};
    return (
      <Card
        title={cardTitle}
        extra={extra}
        styles={{
          body: cleanObject({
            padding: 0,
            borderRadius: cardProps?.borderRadius,
          }),
          header: cleanObject({
            paddingInline: 12,
            paddingBlock: 16,
            borderRadius: cardProps?.borderRadius,
          }),
          ...cardStyles,
        }}
        style={cleanObject({
          ...style,
          borderRadius: cardProps?.borderRadius,
        })}
        className={cn("w-full overflow-hidden", cardClassName)}
        {...restCardProps}
      >
        <AntTable<RecordType>
          size="middle"
          scroll={{ x: "max-content" }}
          pagination={enhancedPagination}
          rowClassName={enhancedRowClassName}
          className="bnr-table"
          {...restProps}
        />
      </Card>
    );
  }
  return (
    <AntTable<RecordType>
      size="middle"
      scroll={{ x: "max-content" }}
      pagination={enhancedPagination}
      rowClassName={enhancedRowClassName}
      className="bnr-table"
      {...restProps}
    />
  );
}
