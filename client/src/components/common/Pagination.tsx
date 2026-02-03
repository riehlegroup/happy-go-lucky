/**
 * Convenient pagination buttons
 * @param curPage current page
 * @param nbPages number of pages
 * @param onChange callback to change current page
 * @returns 
 */
import { msgKey, translate } from "@/Resources/i18n";

const Pagination = ({ curPage, nbPages, onChange }: { curPage: number; nbPages: number; onChange: (p: number) => void }) => {
    const start = Math.max(Math.max(curPage - 2, 0) + Math.min(curPage + 3, nbPages) - curPage - 3, 0);
    const end = Math.min(Math.max(curPage - 2, 0) + Math.min(curPage + 3, nbPages) - curPage + 2, nbPages);

    const previous = curPage > 0 ?
        <li onClick={() => onChange(curPage - 1)} className="ms-0 flex h-8 items-center justify-center rounded-s-lg border border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            {translate(msgKey.common.actions.previous)}
        </li> :
        <li className="ms-0 flex h-8 items-center justify-center rounded-s-lg border border-gray-300 bg-gray-100 px-3 leading-tight text-gray-500 hover:text-gray-500">
            {translate(msgKey.common.actions.previous)}
        </li>;

    const next = curPage < nbPages - 1 ?
        <li onClick={() => onChange(curPage + 1)} className="flex h-8 items-center justify-center rounded-e-lg border border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            {translate(msgKey.common.actions.next)}
        </li> :
        <li className="flex h-8 items-center justify-center rounded-e-lg border border-gray-300 bg-gray-100 px-3 leading-tight text-gray-500 hover:text-gray-500">
            {translate(msgKey.common.actions.next)}
        </li>;

    const pages = [];
    for (let i = start; i < end; i++) {
        if (curPage == i) {
            pages.push(
                <li key={i} onClick={() => onChange(i)} className="flex h-8 items-center justify-center border border-gray-300 bg-blue-50 px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                    {i + 1}
                </li>
            )
        } else {
            pages.push(
                <li key={i} onClick={() => onChange(i)} className="flex h-8 items-center justify-center border border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                    {i + 1}
                </li>
            )
        }
    }

    return (
        <nav className="flex select-none flex-row flex-nowrap items-center justify-between">
            <ul className="inline-flex h-8 -space-x-px text-sm">
                {previous}
                {pages}
                {next}
            </ul>
        </nav>
    )
}

export default Pagination;