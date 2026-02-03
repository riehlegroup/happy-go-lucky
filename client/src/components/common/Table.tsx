import { useState, useEffect } from 'react';
import Pagination from './Pagination';
import CheckboxSelect from './CheckboxSelect';
import { msgKey, translate } from "@/Resources/i18n";

const ReloadButton = ({ loading, onClick }: { loading: boolean, onClick: () => void }) => {
    return (
        <button onClick={onClick} type="button" className='me-2 inline-flex items-center rounded-lg bg-gray-100 p-2.5 text-center text-sm font-medium text-gray-700'>
            {loading ?
                <svg className="me-3 inline size-4 animate-spin text-gray-200" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#1C64F2" />
                </svg> :
                translate(msgKey.common.actions.reload)
            }
        </button>
    );
}

/**
 * Table component. 
 * When rowsPerPage is defined the table is automatically paginated.
 * When filterOptions is defined the table provides a CheckboxSelect component to apply a filter on a selected column
 * @param headings array of table headings
 * @param loading signals the table that the data is still loading and will display a loading spinner
 * @param loadData callback to load data. called once on page load and on reload button click
 * @param data array of rows
 * @param rowsPerPage number of rows to display per page
 * @param filterOptions.key id of filtered column
 * @param filterOptions.options array of values to filter by
 * @param children
 * @returns 
 */
const Table = ({ headings, loading, loadData, data, rowsPerPage = 0, filterOptions, children }: { headings: Array<string>, loading: boolean, loadData: () => void | undefined, rowsPerPage?: number, data: Array<Array<number | string | boolean | JSX.Element>>, filterOptions?: { key: number, options: Array<string> }, children?: React.ReactNode }) => {
    const [page, setPage] = useState<number>(0);
    const [filter, setFilter] = useState<Array<string>>(filterOptions ? filterOptions.options : []);

    const isPaginated = rowsPerPage > 0;
    const isFiltered = filterOptions !== undefined;

    if (isFiltered) {
        data = data.filter((row) => typeof(row[filterOptions.key]) == "string" ? filter.includes(row[filterOptions.key] as string) : true);
    }

    let nbPages = 0;
    if (isPaginated) {
        nbPages = Math.max(1, data.length / rowsPerPage);
        data = data.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    }

    useEffect(loadData, []);

    return (
        <div className='flex h-full flex-col gap-3'>
            <div className='flex flex-row flex-nowrap items-center justify-between space-y-0'>
                <div>
                    {
                        isFiltered &&
                        <CheckboxSelect options={filterOptions.options} active={filter} setActive={(f) => { setFilter(f); setPage(0); }}>{translate(msgKey.common.actions.filter)}</CheckboxSelect>
                    }
                    {children}
                </div>
                <div>
                    <ReloadButton loading={loading} onClick={loadData} />
                </div>
            </div>
            <table className='w-full table-fixed text-left text-sm text-gray-500'>
                <thead className='w-full bg-gray-200 text-xs uppercase text-gray-700'>
                    <tr>
                        {headings.map((heading, id) => <th key={id} className='px-6 py-3'>{heading}</th>)}
                    </tr>
                </thead>
                <tbody className='bg-gray-50'>
                    {data.length === 0 && <tr className='text-center'><td className='px-6 py-4' colSpan={headings.length}>{translate(msgKey.components.table.emptyNoUsers)}</td></tr>}
                    {data.map((row, id) =>
                        <tr key={id} className='border-b'>
                            {row.map((c, id) => <td key={id} className='px-6 py-4'>{c}</td>)}
                        </tr>
                    )}
                </tbody>
            </table>
            {isPaginated && <Pagination curPage={page} nbPages={nbPages} onChange={setPage} />}
        </div>
    );
}

export default Table;