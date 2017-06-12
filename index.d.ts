
declare namespace LightPivotTable {
  interface IFuncDrillDown {
    (object: any): void;
  }

  interface Triggers {
    drillDown?: IFuncDrillDown;
    drillThrough?: any;
    back?: any;
    cellDrillThrough?: any;
    responseHandler?: any;
    rowSelect?: any;
    rowClick?: any;
    contentRendered?: any;
    cellSelected?: any;
  }

  interface DataSourceConfig {
    basicMDX: string;
    MDX2JSONSource: string;
    namespace: string;
    username?: string;
    password?: string;
    sendCookies?: boolean;
    pivot?: string;
  }

  interface Options {
    /**
     * HTMLElement which will contain table
     * @required
     */
    container: any;

    /**
     * localization
     * @default "en"
     */
    locale?: string;

    /**
     * logging
     * @default false
     */
    logs?: boolean;

    /**
     *
     */
    dataSource: DataSourceConfig;

    /**
     * provide your functions here to handle certain events
     */
    triggers?: Triggers;

    /**
     * Stretch columns to fill available container space
     * @default true
     */
    stretchColumns?: boolean;

    /**
     * Maximum rows number on one page (default: 200, turn off: 0)
     * @default 200
     */
    pagination?: number;

    /**
     * hides "back" and "drillThrough" buttons
     * @default true
     */
    hideButtons?: boolean;

    /**
     * all "click" events will be replaced by this event
     * @default "click"
     */
    triggerEvent?: string;

    /**
     * if set, table basic caption will be replaced by this text
     */
    caption?: string;

    /**
     * show summary by columns
     */
    showSummary?: boolean;

    /**
     * display totals attached to table top header
     */
    attachTotals?: boolean;

    /**
     * pass false to turn off conditional formatting
     */
    conditionalFormattingOn?: boolean;

    /**
     * HTML displaying during data load
     */
    loadingMessageHTML?: string;

    /**
     * enable scrolling both for table and headers. Useful for mobile devices.
     */
    enableHeadersScrolling?: boolean;

    /**
     * default filters array
     */
    defaultFilterSpecs?: any[];

    /**
     * deepSee only - dashboard to open
     */
    drillDownTarget?: string;

    /**
     * minimal width of column in listing
     */
    listingColumnMinWidth?: number;

    /**
     * maximum width of header
     */
    maxHeaderWidth?: number;

    /**
     * make columns resizable (default: true)
     * @default true
     */
    columnResizing?: boolean;

    /**
     * animate column when resizing
     */
    columnResizeAnimation?: boolean;

    /**
     * enables search panel in listing (default: true)
     * @default true
     */
    enableSearch?: boolean;

    /**
     * show the row number in first column
     */
    showRowNumbers?: boolean;

    /**
     * enable listing selection, true by default
     * @default true
     */
    enableListingSelect?: boolean;

    /**
     * show rows number in listing and tables if paginated
     * @default true
     */
    showListingRowsNumber?: boolean;

    /**
     * number of rows to show. Use lp.setRowCount(N) to change rowCount. Manual lp.refresh() needed to apply.
     */
    rowCount?: number;

    /**
     * initial data from /MDX query (if present, in MDX2JSON format). Pivot won't request /MDX first time if initial data set. Check twice that dataSource.basicMDX is consistent with the data in this option.
     */
    initialData?: any;

    /**
     * the value of target attributes on all the links on light pivot
     */
    linksTarget?: string;

    /**
     *
     */
    formatNumbers?: string;
  }
}

declare class LightPivotTable {
  constructor(options?: LightPivotTable.Options);
}

declare module "lightpivottable" {
  export default class LightPivotTable {
    constructor(options?: any);
    LightPivotTable: LightPivotTable;
    dataSource: DataSource;
    init(): void;
    refresh(): void;
    changeBasicMDX(mdx: string): void;
    attachTrigger(triggerName: string, trigger: any): void;
    getActualMDX(): void;
    getSelectedRows(): any[];
    getRowsValues(rows: any[]): any[];
    setFilter(spec: any): void;
    clearFilters(): any;
  }

  export class DataSource {
    constructor(config: LightPivotTable.DataSourceConfig, globalConfig: LightPivotTable.Options, lpt: LightPivotTable, drillLevel?: number)
  }
}
