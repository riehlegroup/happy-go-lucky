import { useState } from "react";
import { msgKey, translate } from "@/Resources/i18n";

/**
 * CheckboxSelect component provides a dropdown select menu. Using the checkboxes multiple selections are possible.
 * @param options available options in selection dropdown
 * @param active array of currently active selections
 * @param setActive callback to modify active selection
 * @param children Button text
 * @returns 
 */
const CheckboxSelect = ({ options, active, setActive, children }: { options: Array<string>; active: Array<string>; setActive: (s: Array<string>) => void, children: string }) => {
    const [show, setShow] = useState<boolean>(false);
    return (
        <div>
            <button className="inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800" type="button" onClick={() => setShow(!show)}>
                {children}
                <svg className="ms-3 size-2.5" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" /></svg>
            </button>
            {show &&
                <div className="absolute z-10 w-48 divide-y divide-gray-100 rounded-lg bg-white shadow">
                    <ul className="space-y-3 p-3 text-sm text-gray-700">
                        <li className="flex items-center">
                            <input type="checkbox" checked={active.length == options.length} onChange={e => e.target.checked ? setActive(options) : setActive([])} className="size-4 rounded border-gray-300 bg-gray-100 text-blue-600" />
                            <label className="ms-2 text-sm font-medium text-gray-900">{translate(msgKey.common.actions.all)}</label>
                        </li>
                    </ul>
                    <ul className="space-y-3 p-3 text-sm text-gray-700">
                        {options.map((option, id) => {
                            return (
                                <li key={id} className="flex items-center">
                                    <input type="checkbox" checked={active.includes(option)} onChange={e => e.target.checked ? setActive(active.concat(option)) : setActive(active.filter(a => a != option))} className="size-4 rounded border-gray-300 bg-gray-100 text-blue-600" />
                                    <label className="ms-2 text-sm font-medium text-gray-900">{option}</label>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            }
        </div>
    );
}

export default CheckboxSelect;